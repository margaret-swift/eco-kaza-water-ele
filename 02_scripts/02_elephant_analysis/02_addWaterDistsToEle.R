# addWaterDistsToEle.R
# Created 24 Aug 2025
# Margaret Swift <margaret.swift@cornell.edu>
# 
#  Combines the water and elephant datasets

# ******************************************************************************
#                                LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/02_elephant_analysis/02_addWaterDistsToEle.R')
pacman::p_load(nngeo) # nngeo for nearest-neighbor analyses

# load datasets
load(here('01_data', 'elephant', 'processed', 'elephant_utm.rdata'))
load(here('01_data', 'fences', 'processed', 'fences_utm.rdata'))
load(here('01_data', 'aoi', 'processed', 'aoi_utm.rdata'))
load(here('01_data', 'surfacewater', 'processed', 'all_water_utm.rdata'))

# ******************************************************************************
#   SPLITTING AOI ON EITHER SIDE OF THE FENCE
# ******************************************************************************

# We need to create a buffer around the AOI to catch water just outside
aoi <- st_bbox(esw.utm.df) %>% st_as_sfc() %>% st_as_sf()
aoi.buff = aoi %>% st_buffer(1000)

#  Let's split the AOI in two along the fence
aoi.split <- lwgeom::st_split(aoi.buff, fences_utm) %>% 
  st_collection_extract(c("POLYGON"))
fences.aoi <- fences_utm %>% st_crop(aoi.buff)

# new data frame
ele.dat = ele.sf

# ******************************************************************************
#   CREATING RANDOM SURFACE WATER POINTS
# ******************************************************************************

# create random data frames for points inside our buffer zone
rsw_1800_1 = st_sample(aoi.buff, size=1800)
rsw_1800_2 = st_sample(aoi.buff, size=1800)
rsw_1800_3 = st_sample(aoi.buff, size=1800)
rsw_2500_1 = st_sample(aoi.buff, size=2500)
rsw_2500_2 = st_sample(aoi.buff, size=2500)
rsw_2500_3 = st_sample(aoi.buff, size=2500)
rsw_5000_1 = st_sample(aoi.buff, size=5000)
rsw_5000_2 = st_sample(aoi.buff, size=5000)
rsw_5000_3 = st_sample(aoi.buff, size=5000)

# ******************************************************************************
#   PREPPING NEAREST-NEIGHBOR DATA MATRIX
# ******************************************************************************

# now run dist to water on both sides of the fence
rsw_names <- c('RSW_1800_1_NN_DIST', 'RSW_1800_2_NN_DIST', 'RSW_1800_3_NN_DIST',
               'RSW_2500_1_NN_DIST', 'RSW_2500_2_NN_DIST', 'RSW_2500_3_NN_DIST',
               'RSW_5000_1_NN_DIST', 'RSW_5000_2_NN_DIST', 'RSW_5000_3_NN_DIST')
esw_names = c('ESW_NN_ID', 'ESW_NN_DIST', 'ESW_NN_RECUR')
eswp_names5 = c('ESWP5_NN_ID', 'ESWP5_NN_DIST', 'ESWP5_NN_RECUR')
eswp_names10 = c('ESWP10_NN_ID', 'ESWP10_NN_DIST', 'ESWP10_NN_RECUR')
eswp_names15 = c('ESWP15_NN_ID', 'ESWP15_NN_DIST', 'ESWP15_NN_RECUR')
gsw_names = c('GSW_NN_ID', 'GSW_NN_DIST', 'GSW_NN_RECUR')
ndwi2_names = c('NDWI2_NN_ID', 'NDWI2_NN_DIST', 'NDWI2_NN_RECUR')
mndwi_names = c('MNDWI_NN_ID', 'MNDWI_NN_DIST', 'MNDWI_NN_RECUR')
wi2015_names = c('WI2015_NN_ID', 'WI2015_NN_DIST', 'WI2015_NN_RECUR')
lc05_names = c('LC05_NN_ID', 'LC05_NN_DIST', 'LC05_NN_RECUR')
lc21_names = c('LC21_NN_ID', 'LC21_NN_DIST', 'LC21_NN_RECUR')
freq_names = c("MFREQ")

colnames = c(esw_names, gsw_names,
             eswp_names5, eswp_names10, eswp_names15,
             ndwi2_names, mndwi_names, wi2015_names,
             rsw_names,
             freq_names)
nn.dat = matrix(NA, nrow=nrow(ele.dat), ncol=length(colnames)) %>% as.data.frame()
names(nn.dat) = colnames

# ******************************************************************************
#   ASSIGN DISTANCE-FROM-WATER
# ******************************************************************************
# assign distance from water for all water indices (including random surface
#   water "rsw"), for both sides of the fence (aoi.split)
for (i in 1:nrow(aoi.split)) {
  message('ROI ', i)
  roi <- aoi.split[i,]
  
  # crop ele data to AOI
  nn.roi <- st_intersection(ele.dat, roi)
  inx = nn.roi$INX
  
  # function to find nearest neighbors
  # nnVectors <- function(wpts) {
  #   wpts = wpts |> st_crop(roi)
  #   nn = st_nn(nn.roi, wpts, returnDist=TRUE)
  #   ids = unlist(nn$nn)
  #   freq = wpts$recurrence[ids]
  #   dist = unlist(nn$dist)
  #   return(data.frame(NN_ID = ids, NN_DIST = dist, NN_FREQ = freq))
  # }
  
  # ESW
  nn.dat[inx,esw_names] <- nnVectors(esw.utm.df)
  # ESW - just the permanent water
  nn.dat[inx,eswp_names5]  <- nnVectors(esw.utm.df %>% filter(recurrence > 5))
  nn.dat[inx,eswp_names10] <- nnVectors(esw.utm.df %>% filter(recurrence > 10))
  nn.dat[inx,eswp_names15] <- nnVectors(esw.utm.df %>% filter(recurrence > 15))
  # GSW
  nn.dat[inx, gsw_names] <- nnVectors(gsw.utm.df)
  # MNDWI
  nn.dat[inx, mndwi_names] <- nnVectors(mndwi.utm.df)
  # NDWI2
  nn.dat[inx, ndwi2_names] <- nnVectors(ndwi2.utm.df)
  # WI2015
  nn.dat[inx, wi2015_names] <- nnVectors(wi2015.utm.df)
  # KAZA LC 2005
  nn.dat[inx, lc05_names] <- nnVectors(lc05.utm.df)
  # KAZA LC 2021
  nn.dat[inx, lc21_names] <- nnVectors(lc21.utm.df)

  # RSW - random surface water generated points
  # function for nearest neighbor random points
  nnRand = function(rsw_rand) {
    rsw_roi = rsw_rand %>% st_crop(roi)
    nn_rsw = st_nn(nn.roi, rsw_roi, returnDist=TRUE)
    return(nn_rsw$dist %>% unlist())
  }
  nn_rsw = cbind( nnRand(rsw_1800_1),  nnRand(rsw_1800_2),  nnRand(rsw_1800_3),
                  nnRand(rsw_2500_1),  nnRand(rsw_2500_2),  nnRand(rsw_2500_3),
                  nnRand(rsw_5000_1),  nnRand(rsw_5000_2),  nnRand(rsw_5000_3))
  nn.dat[inx,rsw_names] <- nn_rsw
  
  # freqs
  w.roi = esw.utm.df |> st_crop(roi)
  nn = st_nn(nn.roi, w.roi, k=10, returnDist=TRUE)
  nn_mfreq = unlist(lapply(nn$nn, function(e) mean(w.roi$recurrence[e], na.rm=TRUE)))
  nn.dat[inx, frq_names] <- nn_mfreq
}

# Add NN data to elephant dataset
ele.dat <- cbind(ele.dat, nn.dat)

# ******************************************************************************
# combine ele data from inside and outside the fence, then 
# remove bursts with too little data or edge cases.
to.rm <- c(7212:7242, 8246, 480059)
b.df <- ele.dat %>% st_drop_geometry() %>%
  group_by(BURST) %>% summarize(n=n()) %>%
  filter(n > 10, !(BURST %in% to.rm))
bursts <- b.df$BURST

# remove bursts and make sure data is in the right format
ele.dat = ele.dat %>%
  filter(BURST %in% bursts) %>%
  mutate(ID=factor(ID),
         ANIMAL_ID = factor(ANIMAL_ID),
         DATE = date(DATE.TIME),
         YEAR = year(DATE.TIME),
         SEASON = factor(SEASON))

# save
save(ele.dat, file=here('01_data', 'elephant', 'processed', 'elephant_with_dists.rdata'))
