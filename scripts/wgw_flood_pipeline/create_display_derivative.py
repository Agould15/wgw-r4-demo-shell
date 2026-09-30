#!/usr/bin/env python3
"""Create a measured, topology-repaired display copy of a GeoJSON layer."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import geopandas as gpd
import shapely
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon
from shapely.ops import unary_union


def polygonal_only(geom):
    """Keep polygonal components returned by make_valid; discard line remnants."""
    if geom is None or geom.is_empty:
        return Polygon()
    if isinstance(geom, (Polygon, MultiPolygon)):
        return geom
    parts = []
    for child in getattr(geom, "geoms", []):
        polygonal = polygonal_only(child)
        if not polygonal.is_empty:
            if isinstance(polygonal, Polygon):
                parts.append(polygonal)
            else:
                parts.extend(polygonal.geoms)
    if not parts:
        return Polygon()
    return unary_union(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, type=Path)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--qa", required=True, type=Path)
    ap.add_argument("--tolerance-m", type=float, default=0.5)
    ap.add_argument("--processing-crs", default="EPSG:26918")
    ap.add_argument("--output-crs", default="EPSG:4326")
    args = ap.parse_args()

    if args.tolerance_m < 0:
        raise ValueError("Simplification tolerance must be non-negative")
    if not args.input.exists():
        raise FileNotFoundError(args.input)

    source = gpd.read_file(args.input)
    if source.crs is None:
        raise ValueError("Input GeoJSON has no CRS")
    feature_count = len(source)
    input_invalid_count = int((~source.geometry.is_valid).sum())
    source_area_m2 = float(source.to_crs(args.processing_crs).geometry.area.sum())

    work = source.to_crs(args.processing_crs)
    repaired_geometries = []
    repaired_count = 0
    for geom in work.geometry:
        if geom is None or geom.is_empty:
            repaired_geometries.append(Polygon())
            continue
        if not geom.is_valid:
            geom = polygonal_only(shapely.make_valid(geom))
            repaired_count += 1
        repaired_geometries.append(geom)

    repaired = work.copy()
    repaired.set_geometry(gpd.GeoSeries(repaired_geometries, index=work.index, crs=work.crs), inplace=True)
    repaired_invalid_count = int((~repaired.geometry.is_valid).sum())
    if repaired_invalid_count:
        raise RuntimeError(f"Geometry repair left {repaired_invalid_count} invalid projected features")

    repaired_area_m2 = float(repaired.geometry.area.sum())
    simplified = repaired.copy()
    simplified_geometries = [g.simplify(args.tolerance_m, preserve_topology=True) for g in repaired.geometry]
    simplified.set_geometry(gpd.GeoSeries(simplified_geometries, index=repaired.index, crs=repaired.crs), inplace=True)

    # Measure the simplification against the repaired, unsimplified reference,
    # feature by feature. The source master remains untouched.
    symdiff_area_m2 = sum(float(a.symmetric_difference(b).area) for a, b in zip(repaired.geometry, simplified.geometry))
    simplified_area_m2 = float(simplified.geometry.area.sum())

    output = simplified.to_crs(args.output_crs)
    reproject_invalid_count = int((~output.geometry.is_valid).sum())
    output_repair_count = 0
    if reproject_invalid_count:
        fixed = []
        for geom in output.geometry:
            if geom is not None and not geom.is_empty and not geom.is_valid:
                geom = polygonal_only(shapely.make_valid(geom))
                output_repair_count += 1
            fixed.append(geom)
        output.set_geometry(gpd.GeoSeries(fixed, index=output.index, crs=output.crs), inplace=True)
    final_invalid_count = int((~output.geometry.is_valid).sum())
    if final_invalid_count:
        raise RuntimeError(f"Output still has {final_invalid_count} invalid features")

    # If output-CRS repair was needed, reproject those repaired geometries back
    # into metric CRS and refresh final area/difference metrics.
    final_metric = output.to_crs(args.processing_crs).geometry
    final_area_m2 = float(final_metric.area.sum())
    if output_repair_count:
        symdiff_area_m2 = sum(float(a.symmetric_difference(b).area) for a, b in zip(repaired.geometry, final_metric))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.qa.parent.mkdir(parents=True, exist_ok=True)
    output.to_file(args.output, driver="GeoJSON")

    # Re-open the serialized output so QA validates the deliverable, not only
    # the in-memory geometries used to write it.
    written = gpd.read_file(args.output)
    written_invalid_count = int((~written.geometry.is_valid).sum())
    if len(written) != feature_count or written_invalid_count:
        raise RuntimeError(f"Serialized QA failed: features={len(written)}/{feature_count}, invalid={written_invalid_count}")

    qa = {
        "input": str(args.input),
        "output": str(args.output),
        "operation": "repair invalid polygon geometries, then topology-preserving simplify",
        "tolerance_m": args.tolerance_m,
        "processing_crs": args.processing_crs,
        "output_crs": args.output_crs,
        "feature_count_input": feature_count,
        "feature_count_output": len(written),
        "invalid_features_before_repair": input_invalid_count,
        "features_repaired_in_processing_crs": repaired_count,
        "invalid_features_after_processing_repair": repaired_invalid_count,
        "invalid_features_after_reprojection_before_repair": reproject_invalid_count,
        "features_repaired_after_reprojection": output_repair_count,
        "invalid_features_after_serialization": written_invalid_count,
        "source_area_m2_before_repair": source_area_m2,
        "repaired_reference_area_m2": repaired_area_m2,
        "repair_area_delta_m2": repaired_area_m2 - source_area_m2,
        "simplified_area_m2": final_area_m2,
        "simplification_area_delta_m2": final_area_m2 - repaired_area_m2,
        "simplification_area_delta_pct": ((final_area_m2 - repaired_area_m2) / repaired_area_m2 * 100.0) if repaired_area_m2 else None,
        "simplification_symmetric_difference_area_m2": symdiff_area_m2,
        "vertices_before_simplification": int(sum(len(g.exterior.coords) + sum(len(r.coords) for r in g.interiors) if isinstance(g, Polygon) else sum(len(p.exterior.coords) + sum(len(r.coords) for r in p.interiors) for p in getattr(g, "geoms", [])) for g in repaired.geometry)),
        "vertices_after_simplification": int(sum(len(g.exterior.coords) + sum(len(r.coords) for r in g.interiors) if isinstance(g, Polygon) else sum(len(p.exterior.coords) + sum(len(r.coords) for r in p.interiors) for p in getattr(g, "geoms", [])) for g in simplified.geometry)),
        "verification": "PASS"
    }
    args.qa.write_text(json.dumps(qa, indent=2) + "\n")
    print(json.dumps(qa, indent=2))


if __name__ == "__main__":
    main()
