#!/usr/bin/env python3
"""Build a Nextspace-friendly flood extent from AQ WSE polygons and a USGS DTM.

Core equation:
    flood_depth_m = WSE_m - DTM_elevation_m

R4 assumption:
    WSE vertical datum is treated as NAVD88 unless/until AQ confirms otherwise.

Outputs:
  *_depth_m.tif               aligned flood-depth raster
  *_wet_mask.tif              1=wet, 0=dry, 255=nodata
  *_extent_combined.geojson   generalized scientific extent
  *_extent_parts.geojson      grid-split Nextspace rendering extent
  *_qc.json                   processing assumptions and QA metrics

QGIS is not required. Use it only for visual QA if desired.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Iterable

import geopandas as gpd
import pyogrio
import numpy as np
import rasterio
from rasterio.features import rasterize, shapes
from rasterio.transform import array_bounds
from rasterio.vrt import WarpedVRT
from rasterio.windows import Window, from_bounds
from shapely import make_valid
from shapely.geometry import Polygon, MultiPolygon, box, shape
from shapely.ops import unary_union


def load_config(path: Path) -> dict:
    return json.loads(path.read_text())


def iter_windows(width: int, height: int, tile: int) -> Iterable[Window]:
    for row in range(0, height, tile):
        h = min(tile, height - row)
        for col in range(0, width, tile):
            w = min(tile, width - col)
            yield Window(col, row, w, h)


def polygon_count(geom) -> int:
    if geom.is_empty:
        return 0
    if geom.geom_type == "Polygon":
        return 1
    if geom.geom_type == "MultiPolygon":
        return len(geom.geoms)
    return sum(1 for g in getattr(geom, "geoms", []) if g.geom_type in ("Polygon", "MultiPolygon"))


def ring_count(geom) -> int:
    if geom.is_empty:
        return 0
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms) if geom.geom_type == "MultiPolygon" else []
    return sum(len(p.interiors) for p in polys)


def vertex_count(geom) -> int:
    if geom.is_empty:
        return 0
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms) if geom.geom_type == "MultiPolygon" else []
    return sum(len(p.exterior.coords) + sum(len(r.coords) for r in p.interiors) for p in polys)



def polygonal_only(geom):
    """Keep polygonal parts from a repaired geometry, discarding line remnants."""
    if geom is None or geom.is_empty:
        return Polygon()
    if geom.geom_type == "Polygon":
        return geom
    if geom.geom_type == "MultiPolygon":
        return geom
    polygons = []
    for child in getattr(geom, "geoms", []):
        part = polygonal_only(child)
        if part.is_empty:
            continue
        if part.geom_type == "Polygon":
            polygons.append(part)
        elif part.geom_type == "MultiPolygon":
            polygons.extend(part.geoms)
    return unary_union(polygons) if polygons else Polygon()


def repair_geodataframe(gdf, label):
    """Repair invalid polygons and fail if the result is not valid."""
    invalid_before = int((~gdf.geometry.is_valid).sum())
    repaired_count = 0
    geometries = []
    for geom in gdf.geometry:
        if geom is not None and not geom.is_empty and not geom.is_valid:
            geom = polygonal_only(make_valid(geom))
            repaired_count += 1
        geometries.append(geom)
    result = gdf.copy()
    result.set_geometry(gpd.GeoSeries(geometries, index=gdf.index, crs=gdf.crs), inplace=True)
    invalid_after = int((~result.geometry.is_valid).sum())
    if invalid_after:
        raise ValueError(f"{label}: geometry QA failed; {invalid_after} invalid features remain after repair")
    return result, invalid_before, repaired_count, invalid_after


def serialized_invalid_count(path: Path) -> int:
    """Read the written deliverable back and count invalid geometries."""
    # Combined extents can be one large GeoJSON feature. Disable GDAL's
    # per-object size cap for this QA read; this does not change the file.
    pyogrio.set_gdal_config_options({"OGR_GEOJSON_MAX_OBJ_SIZE": "0"})
    check = gpd.read_file(path)
    invalid = int((~check.geometry.is_valid).sum())
    if invalid:
        raise ValueError(f"Serialized geometry QA failed for {path}: {invalid} invalid features")
    return invalid


def filter_small_polygons(geom, min_area: float):
    if geom.is_empty:
        return geom
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms) if geom.geom_type == "MultiPolygon" else []
    kept = [p for p in polys if p.area >= min_area]
    if not kept:
        return MultiPolygon([])
    return unary_union(kept)


def fill_small_holes(geom, min_hole_area: float):
    if geom.is_empty:
        return geom
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms) if geom.geom_type == "MultiPolygon" else []
    rebuilt = []
    for p in polys:
        holes = []
        for ring in p.interiors:
            hole = Polygon(ring)
            if hole.area >= min_hole_area:
                holes.append(ring.coords[:])
        rebuilt.append(Polygon(p.exterior.coords[:], holes))
    return unary_union(rebuilt)


def split_for_nextspace(geom, grid_m: float):
    if geom.is_empty:
        return []
    minx, miny, maxx, maxy = geom.bounds
    x0 = math.floor(minx / grid_m) * grid_m
    y0 = math.floor(miny / grid_m) * grid_m
    parts = []
    y = y0
    while y < maxy:
        x = x0
        while x < maxx:
            cell = box(x, y, x + grid_m, y + grid_m)
            if geom.intersects(cell):
                clipped = geom.intersection(cell)
                if not clipped.is_empty:
                    if clipped.geom_type == "Polygon":
                        parts.append(clipped)
                    elif clipped.geom_type == "MultiPolygon":
                        parts.extend([p for p in clipped.geoms if not p.is_empty])
            x += grid_m
        y += grid_m
    return parts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wse-shp", required=True, type=Path)
    ap.add_argument("--dtm", required=True, type=Path, help="Projected terrain GeoTIFF (or VRT)")
    ap.add_argument("--scenario-id", required=True)
    ap.add_argument("--scenario-name", required=True)
    ap.add_argument("--output-dir", required=True, type=Path)
    ap.add_argument("--config", default=Path(__file__).with_name("flood_extent_config.json"), type=Path)
    args = ap.parse_args()

    cfg = load_config(args.config)
    for input_path, label in ((args.wse_shp, "WSE Shapefile"), (args.dtm, "DTM"), (args.config, "config")):
        if not input_path.exists():
            raise FileNotFoundError(f"{label} not found: {input_path}")
    out_dir = args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = args.scenario_id.lower().replace(" ", "_")

    print(f"Reading WSE polygons: {args.wse_shp}")
    gdf = gpd.read_file(args.wse_shp)
    if gdf.crs is None:
        raise ValueError("WSE shapefile has no CRS")
    wse_field = cfg["wse_field"]
    if wse_field not in gdf.columns:
        raise ValueError(f"Missing WSE field {wse_field!r}")
    source_crs = gdf.crs
    # All configured distances and areas are metric. Reproject the WSE polygons
    # to the DTM's projected CRS before rasterization and geometry operations.
    processing_crs = cfg.get("processing_crs") or "EPSG:26918"
    gdf = gdf[[wse_field, "geometry"]].copy()
    gdf[wse_field] = gdf[wse_field].astype("float32")
    gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
    gdf = gdf.to_crs(processing_crs)
    if not gdf.crs.is_projected:
        raise ValueError(f"Processing CRS must be projected, got {gdf.crs}")
    axis_units = {axis.unit_name.lower() for axis in gdf.crs.axis_info[:2]}
    if not axis_units.issubset({"metre", "meter", "metres", "meters"}):
        raise ValueError(f"Processing CRS must use meters, got units {axis_units}")
    if gdf.empty:
        raise ValueError("No valid WSE geometries remain after input filtering")
    sindex = gdf.sindex

    res = float(cfg["processing_resolution_m"])
    tile = int(cfg["tile_size_pixels"])
    wet_threshold = float(cfg["wet_depth_threshold_m"])
    bounds = tuple(gdf.total_bounds)

    depth_path = out_dir / f"{stem}_depth_m.tif"
    wet_path = out_dir / f"{stem}_wet_mask.tif"

    with rasterio.open(args.dtm) as dtm_src:
        if dtm_src.crs is None:
            raise ValueError("DTM has no CRS")
        dtm_source_crs = str(dtm_src.crs)
        # The delivered DTM is a native 1 m grid in EPSG:26918. Reproject it
        # only if a future WSE source uses another projected CRS; this keeps
        # the source pixel size as the virtual-grid resolution.
        with WarpedVRT(dtm_src, crs=gdf.crs, resampling=rasterio.enums.Resampling.bilinear) as dtm:
            pixel_x, pixel_y = abs(dtm.transform.a), abs(dtm.transform.e)
            if not (math.isclose(pixel_x, res, rel_tol=0.0, abs_tol=0.05) and math.isclose(pixel_y, res, rel_tol=0.0, abs_tol=0.05)):
                raise ValueError(f"DTM grid is {pixel_x:g} x {pixel_y:g} m, but config requests {res:g} m. Resample terrain explicitly or update the config.")
            raw_window = from_bounds(*bounds, transform=dtm.transform)
            raw_window = raw_window.round_offsets().round_lengths()
            # Clamp to raster dimensions.
            col0 = max(0, int(raw_window.col_off))
            row0 = max(0, int(raw_window.row_off))
            col1 = min(dtm.width, int(raw_window.col_off + raw_window.width))
            row1 = min(dtm.height, int(raw_window.row_off + raw_window.height))
            if col1 <= col0 or row1 <= row0:
                raise ValueError("WSE bounds do not overlap the DTM")
            base_window = Window(col0, row0, col1-col0, row1-row0)
            out_transform = rasterio.windows.transform(base_window, dtm.transform)
            width = int(base_window.width)
            height = int(base_window.height)

            depth_profile = dtm.profile.copy()
            depth_profile.update(
                driver="GTiff", width=width, height=height, count=1,
                dtype="float32", nodata=-9999.0, transform=out_transform,
                compress="deflate", tiled=True, BIGTIFF="YES"
            )
            wet_profile = depth_profile.copy()
            wet_profile.update(dtype="uint8", nodata=255)

            wet_pixels = 0
            valid_pixels = 0
            max_depth = -np.inf

            with rasterio.open(depth_path, "w", **depth_profile) as depth_dst, rasterio.open(wet_path, "w", **wet_profile) as wet_dst:
                for ow in iter_windows(width, height, tile):
                    # Translate output-relative window into VRT coordinates.
                    rw = Window(base_window.col_off + ow.col_off, base_window.row_off + ow.row_off, ow.width, ow.height)
                    terrain = dtm.read(1, window=rw, masked=True).astype("float32")
                    win_transform = rasterio.windows.transform(rw, dtm.transform)
                    left, bottom, right, top = array_bounds(int(ow.height), int(ow.width), win_transform)
                    idx = list(sindex.intersection((left, bottom, right, top)))

                    depth = np.full((int(ow.height), int(ow.width)), -9999.0, dtype="float32")
                    wet = np.full((int(ow.height), int(ow.width)), 255, dtype="uint8")
                    if idx:
                        subset = gdf.iloc[idx]
                        burn = rasterize(
                            ((geom, float(val)) for geom, val in zip(subset.geometry, subset[wse_field])),
                            out_shape=(int(ow.height), int(ow.width)),
                            transform=win_transform,
                            fill=np.nan,
                            dtype="float32",
                            all_touched=bool(cfg["all_touched"])
                        )
                        terrain_data = terrain.filled(np.nan)
                        valid = np.isfinite(burn) & np.isfinite(terrain_data)
                        calc = burn - terrain_data
                        depth[valid] = calc[valid]
                        wet[valid] = (calc[valid] > wet_threshold).astype("uint8")
                        if np.any(valid):
                            valid_pixels += int(valid.sum())
                            wet_pixels += int(np.sum(wet[valid] == 1))
                            max_depth = max(max_depth, float(np.nanmax(calc[valid])))

                    depth_dst.write(depth, 1, window=ow)
                    wet_dst.write(wet, 1, window=ow)

    print("Vectorizing wet extent tile-by-tile...")
    tile_geoms = []
    with rasterio.open(wet_path) as src:
        for w in iter_windows(src.width, src.height, tile):
            arr = src.read(1, window=w)
            mask = arr == 1
            if not np.any(mask):
                continue
            t = rasterio.windows.transform(w, src.transform)
            geoms = [shape(g) for g, value in shapes(arr, mask=mask, transform=t) if int(value) == 1]
            if geoms:
                tile_geoms.append(unary_union(geoms))

    if not tile_geoms:
        raise RuntimeError("No wet area was produced. Check datum assumption, WSE values, DTM overlap, and threshold.")

    raw_geom = unary_union(tile_geoms)
    raw_area = raw_geom.area
    raw_holes = ring_count(raw_geom)
    raw_vertices = vertex_count(raw_geom)

    cleaned = filter_small_polygons(raw_geom, float(cfg["minimum_wet_region_area_m2"]))
    cleaned = fill_small_holes(cleaned, float(cfg["minimum_dry_hole_area_m2"]))
    cleaned = cleaned.simplify(float(cfg["simplify_tolerance_m"]), preserve_topology=True)
    cleaned_invalid_before_repair = 0 if cleaned.is_valid else 1
    cleaned_repaired_count = 0
    if cleaned_invalid_before_repair:
        cleaned = polygonal_only(make_valid(cleaned))
        cleaned_repaired_count = 1
    if not cleaned.is_valid:
        raise ValueError("Combined extent geometry is invalid after repair")

    final_area = cleaned.area
    final_holes = ring_count(cleaned)
    final_vertices = vertex_count(cleaned)

    common = {
        "scenario_id": args.scenario_id,
        "scenario_name": args.scenario_name,
        "wse_field": wse_field,
        "wse_units": cfg["wse_units"],
        "depth_method": "WSE_m - DTM_elevation_m",
        "vertical_datum": cfg["working_vertical_datum"],
        "datum_status": cfg["vertical_datum_status"],
        "wet_threshold_m": wet_threshold,
        "source_file": args.wse_shp.name,
    }

    combined_gdf = gpd.GeoDataFrame([common], geometry=[cleaned], crs=gdf.crs).to_crs(cfg["output_crs"])
    combined_gdf, combined_invalid_before_repair, combined_repaired_count, combined_invalid_after_repair = repair_geodataframe(combined_gdf, "Combined output")
    combined_path = out_dir / f"{stem}_extent_combined.geojson"
    combined_gdf.to_file(combined_path, driver="GeoJSON")
    combined_serialized_invalid_count = serialized_invalid_count(combined_path)

    parts = split_for_nextspace(cleaned, float(cfg["nextspace_part_grid_m"]))
    part_rows = []
    for i, p in enumerate(parts, 1):
        row = dict(common)
        row.update({"part_id": f"{args.scenario_id}-P{i:04d}", "area_m2": float(p.area)})
        part_rows.append(row)
    parts_metric_gdf = gpd.GeoDataFrame(part_rows, geometry=parts, crs=gdf.crs)
    parts_metric_gdf, parts_metric_invalid_before_repair, parts_metric_repaired_count, parts_metric_invalid_after_repair = repair_geodataframe(parts_metric_gdf, "Metric split parts")
    parts_gdf = parts_metric_gdf.to_crs(cfg["output_crs"])
    parts_gdf, parts_output_invalid_before_repair, parts_output_repaired_count, parts_output_invalid_after_repair = repair_geodataframe(parts_gdf, "Reprojected split parts")
    parts_path = out_dir / f"{stem}_extent_parts.geojson"
    parts_gdf.to_file(parts_path, driver="GeoJSON")
    parts_serialized_invalid_count = serialized_invalid_count(parts_path)

    qc = {
        **common,
        "source_crs": str(source_crs),
        "processing_crs": str(gdf.crs),
        "dtm_source_crs": dtm_source_crs,
        "output_crs": cfg["output_crs"],
        "source_feature_count": int(len(gdf)),
        "processing_resolution_m": res,
        "simplify_tolerance_m": float(cfg["simplify_tolerance_m"]),
        "raw_inundation_area_m2": float(raw_area),
        "final_inundation_area_m2": float(final_area),
        "area_change_pct": float((final_area - raw_area) / raw_area * 100.0) if raw_area else None,
        "raw_hole_count": int(raw_holes),
        "final_hole_count": int(final_holes),
        "raw_vertex_count": int(raw_vertices),
        "final_vertex_count": int(final_vertices),
        "nextspace_part_count": int(len(parts)),
        "geometry_qa": {
            "combined_invalid_before_repair": combined_invalid_before_repair,
            "combined_repaired_count": combined_repaired_count,
            "combined_invalid_after_repair": combined_invalid_after_repair,
            "combined_serialized_invalid_count": combined_serialized_invalid_count,
            "metric_parts_invalid_before_repair": parts_metric_invalid_before_repair,
            "metric_parts_repaired_count": parts_metric_repaired_count,
            "metric_parts_invalid_after_repair": parts_metric_invalid_after_repair,
            "output_parts_invalid_before_repair": parts_output_invalid_before_repair,
            "output_parts_repaired_count": parts_output_repaired_count,
            "output_parts_invalid_after_repair": parts_output_invalid_after_repair,
            "serialized_parts_invalid_count": parts_serialized_invalid_count,
            "pre_export_cleaned_geometry_invalid_before_repair": cleaned_invalid_before_repair,
            "pre_export_cleaned_geometry_repaired_count": cleaned_repaired_count,
            "status": "PASS"
        },
        "wet_pixel_count": int(wet_pixels),
        "valid_pixel_count": int(valid_pixels),
        "maximum_computed_depth_m": None if not np.isfinite(max_depth) else float(max_depth),
        "assumption_warning": "AQ confirmed Val_1 is WSE meters. AQ did not confirm NAVD88 vs MSL. R4 processing assumes NAVD88; a datum mismatch may shift computed depths/extents and must be revisited if evidence shows misalignment."
    }
    qc_path = out_dir / f"{stem}_qc.json"
    qc_path.write_text(json.dumps(qc, indent=2))

    print(json.dumps({
        "depth": str(depth_path),
        "wet_mask": str(wet_path),
        "extent_combined": str(combined_path),
        "extent_parts": str(parts_path),
        "qc": str(qc_path)
    }, indent=2))

if __name__ == "__main__":
    main()
