# eco-kaza-water-ele
Repo. for Swift et al 2026 Ecosphere analysis: "Mapping small-scale ephemeral surface water to inform transfrontier conservation planning in southern Africa"

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
- aoi: Area of interest for this study
- fences: veterinary fences in the AOI
- rainfall: mean annual rainfall for each region within KAZA (from CHIRPS)
- surfacewater: surface water data and statistics outputted from Google Earth Engine
- elephant: NOT AVAILABLE (elephant GPS data are protected)
- landcover: NOT AVAILABLE (data are too large for GitHub).
- -- KAZA 2005 data source: https://panda.maps.arcgis.com/home/item.html?id=b82b036653df4ef8abf184f1c4c656ec#overview
- -- KAZA 2021 data source: https://panda.maps.arcgis.com/home/item.html?id=0bd9f1902e4c4b9389d8c1f473c76d04

## 02_scripts

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
