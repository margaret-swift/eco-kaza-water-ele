# cleanEle.R
# Created 26 Sept 2023
# Margaret Swift <margaret.swift@cornell.edu>
# 
# Purpose: To clean up elephant GPS data into a usable format

# ******************************************************************************
#                             DATA & LIBRARY LOADING
# ******************************************************************************
source(here::here('02_scripts/utilities.R'))
i_am('02_scripts/02_elephant_analysis/01_cleanEle.R')

# elephant data
rawdatadir <- here('01_data', 'elephant', 'raw')
procdatadir<- here('01_data', 'elephant', 'processed')
ele.nam <- read.csv(here(rawdatadir, 'nam.eles.fences.csv'))
ele.bots <- read.csv(here(rawdatadir, 'ecoexist.border.fence.pts.csv'))
load(here('01_data', 'aoi', 'processed', 'aoi_utm.rdata'))

# set CRS parameters
CRS_data <- 32734

# ******************************************************************************
#                       Pull together initial data cleaning
# ******************************************************************************
message('  initial data cleaning ...')
ele <- rbind(ele.nam, ele.bots)
ele.sf <- ele %>% 
  st_as_sf(coords=c('x', 'y'), crs=CRS_data) %>% 
  st_transform(crs=CRS_utm)
# st_intersects is faster than st_intersection
inx_keep_ls = sapply(st_intersects(ele.sf, aoi_utm), 
                     function(e) length(e)) == 1
ele_aoi = ele.sf[inx_keep_ls,]

# plot to make sure
# ggplot() +
#   geom_sf(data=sample_n(ele.sf[!inx_keep_ls,], 100), color='red') +
#   geom_sf(data=sample_n(ele.sf[inx_keep_ls,], 100), color='blue') +
#   geom_sf(data=aoi_utm, fill=NA)

ele <- ele_aoi %>% 
  rename_all(toupper) %>% 
  arrange(ID, DATE.TIME) %>% 
  mutate( 
    # add index to rows
    INX =  1:nrow(.),
    
    # Date-time coordination
    DATE.TIME = as.POSIXlt(DATE.TIME, tz="UTC"),
    DATE = date(DATE.TIME),
    MONTH = month(DATE.TIME),
    YEAR = year(DATE.TIME),
    DTS.TRUE = DATE.TIME - lag(DATE.TIME),
    DTS.TRUE = ifelse(ID != lag(ID), NA, DTS.TRUE),
    DTS = DT, 
    DTM = DTS / 60,
    MPS = DIST / DTS,
    YEAR = year(DATE.TIME), 
    SEASON = ifelse(MONTH %in% 5:10, 'DRY', 'WET'),
    
    # reassigning IDs and fixing sex data
    ANIMAL_ID = ID,
    SEX = toupper(SEX)
  ) %>%   
  dplyr::select(INX, ID, ANIMAL_ID, SEX, 
                DATE.TIME, SEASON, 
                DTS.TRUE, DTS, DIST, DTM, REL.ANGLE, SPEED, 
                COUNTRY, PROVIDER)

# anonymize IDs
ele$ID <- match(ele$ANIMAL_ID, unique(ele$ID))

# Assign bursts to data. Change burst whenever ID changes or if there is 
# a 400min or larger gap in the data
ele <- ele %>% 
  mutate(
    START.COUNT = ifelse(is.na(DTS.TRUE), TRUE, DTS.TRUE > 400),
    BURST = ID*1000 + cumsum(START.COUNT)) %>% 
  relocate(BURST, START.COUNT, .after="ID")

# add latlon
latlon <- st_coordinates(ele); colnames(latlon) <- c('LON', "LAT")
ele.sf <- cbind(ele, latlon) %>% relocate(LON, LAT, .after=BURST)
ele.df <- cbind(ele |> st_drop_geometry(), latlon) %>% relocate(LON, LAT, .after=BURST)

# ******************************************************************************
#                                       STS
# ******************************************************************************

message('  saving rdata file ...')
save(ele.df, ele.sf, file=here(procdatadir, 'elephant_utm.rdata'))
message("FINISHED cleanEle.R")
