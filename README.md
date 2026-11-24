# eco-kaza-water-ele [![DOI](https://zenodo.org/badge/1438838513.svg)](https://doi.org/10.5281/zenodo.23814427)

This repository contains metadata, data, scripts, and output files for the Swift et al 2026 Ecosphere analysis: "Mapping small-scale ephemeral surface water to inform transfrontier conservation planning in southern Africa". 

Folder names are **bolded**. File names are _italicized_. 

## /01_data
Data files used in analysis. All data inputs follow the folder structure:
- **/raw** : raw input data files
- **/processed** : processed data files created as part of the analysis
  
For brevity, file names in **/01_data** are assumed to be in the **/raw** folder unless specified as belonging in the **/processed** folder.

**/aoi**: Area of interest for this study (hand-drawn in GEE). 
- _/AOI.cpg, AOI.dbf, AOI.fix, AOI.prj, AOI.shp, AOI.shx_: AOI boundary
- _/AOI_readme.csv_: metadata for AOI
- /**processed**/_aoi_utm.rdata_: AOI in UTM format

**/kaza**: KAZA shapefile and hydroshed/SIZ region shapefiles for GEE scripts.
- _/KAZA_boundary.shp, KAZA_boundary.cpg, KAZA_boundary.dbf, KAZA_boundary.fix, KAZA_boundary.prj, KAZA_boundary.shx_: KAZA boundary
- _/hydrosheds_siz.cpg, hydrosheds_siz.dbf, hydrosheds_siz.fix, hydrosheds_siz.prj, hydrosheds_siz.shp, hydrosheds_siz.shx_: hydrosheds and SIZ boundary
- _/kaza_readme.csv:_ metadata for hydrosheds and SIZ boundaries

**/fences**: veterinary fences in the AOI (provided from https://besjournals.onlinelibrary.wiley.com/doi/full/10.1111/1365-2664.14746)
- _/fences.shp, fences.cpg, fences.dbf, fences.fix, fences.prj, fences.shx_: veterinary fence shapefile
- _/fences_readme.csv_: metadata for _fences.shp_
- /**processed**/_fences_utm.rdata_: fence shapefile in UTM format

**/rainfall**: mean annual rainfall for each region within KAZA (from CHIRPS) https://developers.google.com/earth-engine/datasets/catalog/UCSB-CHG_CHIRPS_DAILY
- _/SIZ_Catchments_MAR.csv_: Mean annual ranfall for all seasonal inundation zones in KAZA.
- _/SIZ_Catchments_MAR_readme.csv_: metadata for _SIZ_Catchments_MAR.csv_
- _/Hydroshed_MAR.csv_: Mean annual ranfall for all hydrosheds in KAZA.
- _/Hydroshed_MAR_readme.csv_: metadata for _Hydroshed_MAR.csv_

**/landcover**: Landcover classes for KAZA. Raw data NOT AVAILABLE (data are too large for GitHub).
- _/landcover_2005_fixed.tif_: KAZA 2005 data source https://panda.maps.arcgis.com/home/item.html?id=b82b036653df4ef8abf184f1c4c656ec#overview
- _/landcover_2005_fixed_readme_: readme for KAZA 2005 data file
- _/eoss4wwf_kaza_tfca_landcover_2020.tif_: KAZA 2021 data source: https://panda.maps.arcgis.com/home/item.html?id=0bd9f1902e4c4b9389d8c1f473c76d04
- _/eoss4wwf_kaza_tfca_landcover_2020_readme.csv_: metadata for KAZA 2021 file
  
**/surfacewater**: surface water data and statistics outputted from Google Earth Engine
- **/ESW_sizes_SIZ**: Holds all csv data for quasimonthly fill levels of ESW for each SIZ. All files (7) are named in the format "ESW_[SIZ_ID]_sizes.csv"
- **/ESW_sizes_HY**: Holds all csv data for quasimonthly fill levels of ESW for each hydroshed. All files (55) are named in the format _"ESW_[hydroshedID]_sizes.csv"_
- **MWF_sizes_HY/**_MWF_sizes_all.csv_: Holds data for all MWF sizes by hydroshed
- **/AOI_rasters**: Holds raster data for all GEE-output water indices tested in our water analysis.
  - _AOI_ESW.tif, AOI_GSW.tif, AOI_KAZA05_utm.tif, AOI_KAZA21_utm.tif, AOI_MNDWI.tif, AOI_NDWI2.tif, AOI_WI2015.tif_
- **/Validation_Data**: Holds validation results data from GEE output. Validation reports are generated for each of seven validation regions and each of the AOI rasters given above. In addition, validation data are given for ESW for the wet season, dry season, and for ESW generated without use of MWF maximum wetness masks:
  - _/Validation_Data_MNDWI.csv, Validation_Data_WI2015.csv, Validation_Data_GSW.csv, Validation_Data_NDWI2.csv_
  - _Validation_Data_ESW_WET.csv, /Validation_Data_ESW_DRY.csv,	Validation_Data_ESWNoMWF.csv_: ESW wet season, dry season, and no MWF version
 
- _/ESW_sizes_SIZ_readme_: Metadata for ESW_sizes_SIZ.
- _/ESW_sizes_HY_readme_: Metadata for ESW_sizes_HY.
- _/MWF_sizes_HY_readme.csv_: Metadata for MWF_sizes_HY.
- _/AOI_rasters_readme.csv_: Metadata for AOI rasters.
- _/Validation_Data_readme.csv_: Metadata for files in the /Validation_Data subfolder.
- /**processed**/_all_water_utm.rdata_: all water data in UTM format

**/elephant/**: Elephant GPS collar data. These data are NOT AVAILABLE (elephant GPS data are protected)

## /02_scripts

### /00_google_earth_engine
Scripts for Google Earth Engine code to create Ephemeral Surface Water (ESW) and Maximum Water Fill (MWF) datasets, as well as validation. Functions used across code snippets are found in 00_Functions.js. Validation code is found in 30_Validate_Accuracy.js (permalink: https://code.earthengine.google.com/7c1aed33d09b5c382d6db73357e0b3f4)

####  /Hydroshed workflow 
- _/11_Create_MWF_Hydrosheds.js_
  - creates the MWF positive mask for each hydroshed by aggregating water layers for the three wettest years
  - permalink: https://code.earthengine.google.com/c51a6488b6315caa956570beb8074de4
  - permalink 2: https://code.earthengine.google.com/293edaeda9272150b0dfeecfd62abcd0
- _/12_Create_ESW_Hydrosheds.js_
  - creates the ESW layer for each hydroshed for each of 35 time steps from 2019-2025
  - permalink: https://code.earthengine.google.com/54b75b5b929e98ee2e0d788dd6e1a0a8
  - creation by Hydroshed ID permalink: https://code.earthengine.google.com/c0b889606ea573622e8e3c8efc74834b
- _/13_Create_ESWr_Hydrosheds.js_
  - aggregates ESW layer for each hydroshed into a dry season, wet season, and total recurrence raster.
  - permalink: https://code.earthengine.google.com/315e0758be5c833c73957ff6eb595510

#### Seasonal Inundation Zone workflow
The workflow for Seasonal Inundation Zones (SIZ) does not include MWF creation.
- _/22_Create_ESW_SIZ.js_
  - creates the ESW layer for each SIZ for each of >50 time steps from 2019-2025
  - permalink: https://code.earthengine.google.com/0e0c31baaa401fcb607ff02993e0e818
- _/23_Create_ESWr_SIZ.js_
  - aggregates ESW layer for each SIZ into a dry season, wet season, and total recurrence raster.
  - permalink: https://code.earthengine.google.com/a14458a93192bc6f8b62670e821a979e

### /01_water_analysis
Analysis scripts for Seasonal surface water analysis (Sec. 3.3 results) 
- _/00_validation.R_ - clean up validation data exported from GEE
- _/01_createESWStats.R_ - gather statistical data from ESW maps (SIZ and Hydrosheds)
- _/02_createPlots.R_ - creates Figures 4 and 5 from the text.
- _/03_runWaterModels.R_ - runs GLMMs for Sec. 3.3 Results

### /02_elephant_analysis
Analysis scripts for Elephant water use analysis (Sec. 3.4 results). 
- _/00_cleanGeographicData.R_ - restrict surface water data to AOI; process KAZA landcover maps; transform all into UTM
- _/01_cleanEle.R_ - cleans elephant data
- _/02_addWaterDistsToEle.R_ - adds distance-to-water (using 'nngeo') for each water index and elephant GPS point.
- _/03_runEleCaseStudies.R_ - runs elephant case studies for Sec. 3.4 Results.
  
## /03_output
Output data from analyses (plots, tables) as well as data used in analyses.

### /01_water_analysis
Output for Seasonal surface water analysis (Sec. 3.3 results) 
- _/water_analysis.rdata_: output data from water analysis
- **/plots**: Fig. 4a, b, c; Fig. 5a, b.
- **/metadata**: Metadata for outputs in _water_analysis.rdata_: _createESWStats.R_, _validation.R_
- **/tables**: Table 1 and Table S4.

### /02_elephant_analysis
Output for Elephant water use analysis (Sec. 3.4 results). 
- _/elephant_analysis.rdata_: output data from elephant analysis
- **/plots**: Fig6b, d; Fig. 7.
- **/metadata**: Metadata for outputs in _elephant_analysis.rdata_: _cleanEle.R, cleanGeographic.R,_ and _addWaterDistsToEle.R_

