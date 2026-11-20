# eco-kaza-water-ele [![DOI](https://zenodo.org/badge/1438838513.svg)](https://doi.org/10.5281/zenodo.23814427)

This repository contains metadata, data, scripts, and output files for the Swift et al 2026 Ecosphere analysis: "Mapping small-scale ephemeral surface water to inform transfrontier conservation planning in southern Africa". 

## 00_metadata
All metadata for data files and analysis outputs:

### Data files:
- elephant_metadata.xlsx : All metadata for elephant GPS data. Data are protected and therefore not included in analysis, but a description of the data are available.
- rainfall_metadata.xlsx : Metadata for mean annual rainfall data used in seasonal surface water analysis
- surfacewater_metadata.xlsx : Metadata for surface water layeres used in analysis

### Outputs:
- elephant_analysis_metadata.xlsx : All metadata for Elephant water use analysis (Sec. 3.4 Results)
- water_analysis_metadata.xlsx : All metadata for Seasonal surface water analysis (Sec. 3.3 Results)

## 01_data
Data files used in analysis.
- aoi: Area of interest for this study (hand-drawn in GEE)
- fences: veterinary fences in the AOI (provided from https://besjournals.onlinelibrary.wiley.com/doi/full/10.1111/1365-2664.14746)
- rainfall: mean annual rainfall for each region within KAZA (from CHIRPS) https://developers.google.com/earth-engine/datasets/catalog/UCSB-CHG_CHIRPS_DAILY
- surfacewater: surface water data and statistics outputted from Google Earth Engine
- elephant: NOT AVAILABLE (elephant GPS data are protected)
- landcover: NOT AVAILABLE (data are too large for GitHub).
- -- KAZA 2005 data source: https://panda.maps.arcgis.com/home/item.html?id=b82b036653df4ef8abf184f1c4c656ec#overview
- -- KAZA 2021 data source: https://panda.maps.arcgis.com/home/item.html?id=0bd9f1902e4c4b9389d8c1f473c76d04

## 02_scripts

### 00_google_earth_engine
Scripts for Google Earth Engine code to create Ephemeral Surface Water (ESW) and Maximum Water Fill (MWF) datasets, as well as validation. Functions used across code snippets are found in 00_Functions.js. Validation code is found in 30_Validate_Accuracy.js (permalink: https://code.earthengine.google.com/7c1aed33d09b5c382d6db73357e0b3f4)

####  Hydroshed workflow 
- 11_Create_MWF_Hydrosheds.js
  - creates the MWF positive mask for each hydroshed by aggregating water layers for the three wettest years
  - permalink: https://code.earthengine.google.com/c51a6488b6315caa956570beb8074de4
  - permalink 2: https://code.earthengine.google.com/293edaeda9272150b0dfeecfd62abcd0
- 12_Create_ESW_Hydrosheds.js
  - creates the ESW layer for each hydroshed for each of 35 time steps from 2019-2025
  - permalink: https://code.earthengine.google.com/54b75b5b929e98ee2e0d788dd6e1a0a8
  - creation by Hydroshed ID permalink: https://code.earthengine.google.com/c0b889606ea573622e8e3c8efc74834b
- 13_Create_ESWr_Hydrosheds.js
  - aggregates ESW layer for each hydroshed into a dry season, wet season, and total recurrence raster.
  - permalink: https://code.earthengine.google.com/315e0758be5c833c73957ff6eb595510

#### Seasonal Inundation Zone workflow
The workflow for Seasonal Inundation Zones (SIZ) does not include MWF creation.
- 22_Create_ESW_SIZ.js
  - creates the ESW layer for each SIZ for each of >50 time steps from 2019-2025
  - permalink: https://code.earthengine.google.com/0e0c31baaa401fcb607ff02993e0e818
- 23_Create_ESWr_SIZ.js
  - aggregates ESW layer for each SIZ into a dry season, wet season, and total recurrence raster.
  - permalink: https://code.earthengine.google.com/a14458a93192bc6f8b62670e821a979e

### 01_water_analysis
Analysis scripts for Seasonal surface water analysis (Sec. 3.3 results) 
- 00_validation.R - clean up validation data exported from GEE
- 01_createESWStats.R - gather statistical data from ESW maps (SIZ and Hydrosheds)
- 02_createPlots.R - creates Figures 4 and 5 from the text.
- 03_runWaterModels.R - runs GLMMs for Sec. 3.3 Results

### 02_elephant_analysis
Analysis scripts for Elephant water use analysis (Sec. 3.4 results). 
- 00_cleanGeographicData.R - restrict surface water data to AOI; process KAZA landcover maps; transform all into UTM
- 01_cleanEle.R - cleans elephant data
- 02_addWaterDistsToEle.R - adds distance-to-water (using 'nngeo') for each water index and elephant GPS point.
- 03_runEleCaseStudies.R - runs elephant case studies for Sec. 3.4 Results.
  
## 03_output
Output data from analyses (plots, tables) as well as data used in analyses.
