# WGW flood extent preprocessing

This repeatable Python workflow converts Matt Henderson's AQ water surface elevation (WSE) polygon deliverables into depth rasters and lower-complexity flood extents for visual evaluation in Nextspace.

## Inputs and known metadata

The unpacked source files are in `../../data/Max Water_Elevation_shp_9-10-2026/`. Matt's ZIP contains **four scenario types**:

1. Hurricane Sandy (`sandy_water_level_meters_10_29_2200.shp`)
2. 100-year storm (`naccs_100_year_storm_water_level_meters_07_15_0200.shp`)
3. 100-year storm + 2050 sea-level rise (`naccs_100_year_storm_2050_slr_water_level_meters_07_15_0200.shp`)
4. 100-year storm + 2070 sea-level rise (`naccs_100_year_storm_2070_slr_water_level_meters_07_15_0200.shp`)

Each Shapefile must stay with its `.dbf`, `.shx`, and `.prj` sidecars. Inspection of the supplied files found 200,361 polygon features per scenario, a `Val_1` attribute, and WGS 84 / UTM zone 18N (EPSG:32618). The feature count, field, and CRS should be rechecked if source files are replaced.

The terrain input currently available is:

`/Users/anthonygould/Documents/flood_sim/data/processed/terrain/expanded_coastal/wgw_expanded_coastal_usgs_1m_dtm.tif`

Its raster metadata identifies NAD83 / UTM zone 18N (EPSG:26918), 1 m pixels, and NoData `-9999`. The script reprojects WSE geometries to the configured projected meter CRS and warps the terrain to that grid. Pass `--dtm` explicitly if the terrain file moves. Use the delivered `.tif`; the adjacent VRT references source tile paths under a Downloads directory.

## Scientific assumptions and limits

- AQ confirmed `Val_1` is water surface elevation in meters.
- AQ has **not** confirmed whether WSE uses NAVD88 or MSL. The config retains NAVD88 as a provisional R4 working assumption to match the terrain workflow. It is not a verified source fact; depth and wet/dry results may change if the datum is different.
- Depth is calculated as `WSE_m - DTM_elevation_m`. Pixels are wet when depth is greater than the configured 0.01 m threshold.
- Small wet polygons, small dry holes, and boundary detail are modified by the documented config values. They are processing choices, not hydrologic truth. QC records raw/final areas, holes, vertices, and counts.
- This workflow builds an extent from the named WSE snapshot files; it does not create the 30-minute animation or interpolate between times.

Confirm datum, units, and any scenario interpretation with AQ before treating outputs as analytical or decision-grade results.

## Install

Use Python 3.10 or newer in a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/wgw_flood_pipeline/requirements.txt
```

## Run the Sandy pilot

From the demo-shell repository root:

```bash
python scripts/wgw_flood_pipeline/build_flood_extent.py \
  --wse-shp 'data/Max Water_Elevation_shp_9-10-2026/sandy_water_level_meters_10_29_2200.shp' \
  --dtm '/Users/anthonygould/Documents/flood_sim/data/processed/terrain/expanded_coastal/wgw_expanded_coastal_usgs_1m_dtm.tif' \
  --scenario-id SCN-SANDY \
  --scenario-name 'Hurricane Sandy' \
  --output-dir 'output/sandy'
```

The run writes a depth GeoTIFF, wet-mask GeoTIFF, a combined GeoJSON, Nextspace-oriented split GeoJSON, and a QC JSON under the output directory. Outputs are not written into `data/`.

## Run the other scenarios

After reviewing the Sandy pilot, run the same command with the corresponding source and a unique ID/output directory:

| Scenario | Shapefile | Suggested ID |
|---|---|---|
| 100-year storm | `naccs_100_year_storm_water_level_meters_07_15_0200.shp` | `SCN-100YR` |
| 100-year + 2050 SLR | `naccs_100_year_storm_2050_slr_water_level_meters_07_15_0200.shp` | `SCN-100YR-2050SLR` |
| 100-year + 2070 SLR | `naccs_100_year_storm_2070_slr_water_level_meters_07_15_0200.shp` | `SCN-100YR-2070SLR` |

Example:

```bash
python scripts/wgw_flood_pipeline/build_flood_extent.py \
  --wse-shp 'data/Max Water_Elevation_shp_9-10-2026/naccs_100_year_storm_water_level_meters_07_15_0200.shp' \
  --dtm '/Users/anthonygould/Documents/flood_sim/data/processed/terrain/expanded_coastal/wgw_expanded_coastal_usgs_1m_dtm.tif' \
  --scenario-id SCN-100YR --scenario-name '100-year storm' \
  --output-dir 'output/100yr'
```

## Inspect the workflow in Jupyter

Install the optional notebook dependency and open `scripts/wgw_flood_pipeline/flood_extent_walkthrough.ipynb`:

```bash
python -m pip install jupyterlab
jupyter lab scripts/wgw_flood_pipeline/flood_extent_walkthrough.ipynb
```

The notebook reads input metadata, displays the config and processing equations, runs one selected scenario through the same Python script, then reads and summarizes the QC output. Edit its input paths and scenario variables to repeat the process.

## Output files

- `*_depth_m.tif`: computed depth at the configured processing resolution.
- `*_wet_mask.tif`: `1` wet, `0` dry, `255` NoData.
- `*_extent_combined.geojson`: cleaned, topology-preserving wet extent.
- `*_extent_parts.geojson`: extent split on the configured metric grid for rendering trials.
- `*_qc.json`: source and processing CRS, assumptions, counts, areas, holes, vertices, maximum computed depth, geometry-validity QA, and datum warning.

## Create a separate Nextspace display derivative

Keep `*_extent_parts.geojson` as the source/reference output. To repair any invalid polygons and create a topology-preserving 0.5 m display copy:

```bash
python scripts/wgw_flood_pipeline/create_display_derivative.py \
  --input output/sandy/scn-sandy_extent_parts.geojson \
  --output output/sandy/scn-sandy_extent_parts_display_0p5m.geojson \
  --qa output/sandy/scn-sandy_extent_parts_display_0p5m_qa.json \
  --tolerance-m 0.5 --processing-crs EPSG:26918 --output-crs EPSG:4326
```

The utility repairs invalid geometries in the copy, simplifies each feature in projected meters while preserving topology, and writes QA with repair counts, output validity, area change, and symmetric-difference area. Load the display copy into Nextspace alongside the unchanged source for comparison. A display derivative is for visualization; keep scientific analysis tied to the original rasters and extent.

## Geometry QA

The main processing script now checks the combined and split outputs for invalid polygons after reprojection and again after writing and reopening the GeoJSON. Invalid polygonal features are repaired with `make_valid`; non-polygon remnants are excluded. If any invalid geometries remain, processing stops with an error instead of reporting a successful QA result. The QC JSON records counts before repair, repaired counts, and post-write validity counts.

Test the split GeoJSON in Nextspace first. Use QGIS or another GIS to compare it against the original WSE and terrain and inspect the QC record. A successful render does not validate the scientific datum or model interpretation.
