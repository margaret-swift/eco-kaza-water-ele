# cleanGeographicData.R
# Created 26 Sept 2023
# Margaret Swift <margaret.swift@cornell.edu>
# 
# Purpose: To clean up fence, water, and AOI data into a usable format

# ******************************************************************************
#                             DATA & LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/02_elephant_analysis/00_cleanGeographicData.R')

path_water <- here('01_data', 'surfacewater')
path_lc <- here('01_data', 'landcover')

# ******************************************************************************
#   BOUNDARIES
# ******************************************************************************

# FENCES
fences <- st_read(here('01_data', 'fences', 'raw', 'fences.shp'))
fences_utm <- fences %>% st_transform(crs=CRS_utm)
save(fences_utm, file=here('01_data', 'fences', 'processed', 'fences_utm.rdata'))

# AOI BOUNDARY
aoi <- st_read(here('01_data', 'aoi', 'raw', 'AOI.shp'))
aoi_utm <- aoi %>% st_transform(crs=CRS_utm)
save(aoi_utm, file=here('01_data', 'aoi', 'processed', 'aoi_utm.rdata'))


# ******************************************************************************
#   PREPROCESSING - TRANSFORM KAZA LANDCOVER TO WATER IN AOI
# ******************************************************************************

# LANDCOVER KAZA 2005
# Data from: https://panda.maps.arcgis.com/home/item.html?id=b82b036653df4ef8abf184f1c4c656ec#overview
# (Dataset is too large for GitHub - 5GB)
lc_05 = terra::rast(here(path_lc, 'raw', 'landcover_2005_fixed.tif'))
aoi_lc05 = st_transform(aoi_utm, crs(lc_05))
lc05_crp = terra::crop(lc_05, aoi_lc05)
rcl05 = data.frame(from=c(0, 1, 4), 
                 to=c(1, 3, 50), 
                 becomes = c(0, 1, 0))
lc05_water = terra::classify(lc05_crp, rcl05) |> terra::project(CRS_utm)
names(lc05_water) <- "recurrence"
terra::writeRaster(lc05_water, 
                   here(path_water, 'processed', 'AOI_KAZA05_utm.tif'), 
                   overwrite=TRUE)

# LANDCOVER KAZA 2021
# Data from: https://panda.maps.arcgis.com/home/item.html?id=0bd9f1902e4c4b9389d8c1f473c76d04
# (Dataset is too large for GitHub - 300MB)
lc_21 = terra::rast(here(path_lc, 'raw', 'eoss4wwf_kaza_tfca_landcover_2020.tif'))
aoi_lc21 = st_transform(aoi_utm, crs(lc_21))
lc21_crp = terra::crop(lc_21, aoi_lc21)
rcl21 = data.frame(from=c(0, 79, 82), 
                 to=c(79, 81, 240), 
                 becomes = c(0, 1, 0))
lc21_water = terra::classify(lc21_crp, rcl21) |> terra::project(CRS_utm)
names(lc21_water) <- "recurrence"
terra::writeRaster(lc21_water, 
                   here(path_water, 'raw', 'AOI_KAZA21_utm.tif'), 
                   overwrite=TRUE)


# ******************************************************************************
#   PROCESSING - TRANSFORM WATER RASTERS TO DATAFRAMES
# ******************************************************************************

processFile = function(slug, bname=NULL) {
  fname = paste0('AOI_', slug, '.tif')
  r <- terra::rast(here(path_water, 'raw', 'AOI_rasters', fname))
  r_utm = terra::project(r, CRS_utm)
  
  # make points
  df = r_utm %>% 
    as.data.frame(xy = TRUE) %>%
    na.omit() %>%
    st_as_sf(coords=c('x', 'y'), crs=CRS_utm, remove=FALSE) %>% 
    rename(recurrence=bname) %>%
    filter(recurrence > 0)
  return(df)
}

# ESW
esw.utm.df = processFile('ESW', 'isWater')

# GSW
gsw.utm.df = processFile('GSW', 'recurrence')

# NDWI2 - Miura et al 2025
ndwi2.utm.df = processFile('NDWI2', "AOI_NDWI2")

# WI2015 - Miura et al 2025
wi2015.utm.df = processFile('WI2015', 'AOI_WI2015')

# MNDWI - Miura et al 2025
mndwi.utm.df = processFile('MNDWI', "AOI_MNDWI")

# KAZA 2005
lc05.utm.df = processFile('KAZA05_utm', 'recurrence')

# KAZA 2021
lc05.utm.df = processFile('KAZA21_utm', 'recurrence')

##### SAVE ALL! ##########
save(esw.utm.df, gsw.utm.df, 
     ndwi2.utm.df, wi2015.utm.df, mndwi.utm.df, 
     lc05.utm.df, lc21.utm.df,
     file=here(path_water, 'processed', 'all_water_utm.rdata'))

## EOF
