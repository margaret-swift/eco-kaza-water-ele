# utilities.R
# Holds utility data and functions for use across analyses.

# ******************************************************************************
#   PACKAGES
# ******************************************************************************

pacman::p_load(here, tidyverse, reshape2, sf, terra, patchwork)


# ******************************************************************************
#   GLOBAL PARAMETERS
# ******************************************************************************

CRS_utm <- '+init=EPSG:20935'


# ******************************************************************************
#   GENERAL FUNCTIONS
# ******************************************************************************

# finding anomaly from the mean
myAnomaly = function(dat) {
  mu = mean(dat, na.rm=TRUE)
  chg = (dat-mu) / mu
  return(chg)
}


# ******************************************************************************
#   PLOTTING FUNCTIONS
# ******************************************************************************

# pretty Tukey plot
GGTukey <- function(m.tuk){
  tuk.df <- as.data.frame(m.tuk[1])
  colnames(tuk.df)[2:3]<-c("min", "max")
  tuk.df<-data.frame(id=row.names(tuk.df),
                     min=tuk.df$min,
                     max=tuk.df$max)
  tuk.plt <- tuk.df %>%
    ggplot(aes(id))+
    geom_errorbar(aes(ymin=min,
                      ymax=max),
                  width = 0.2)+
    geom_hline(yintercept=0,
               color="red")+
    labs(x=NULL)+
    coord_flip()+
    theme(title=element_text(color="black",size=15),
          axis.text = element_text(color="black",size=10),
          axis.title = element_text(color="black",size=10),
          panel.grid=element_line(color="grey75"),
          axis.line=element_blank(),
          plot.background=element_rect(fill="white",color="white"),
          panel.background=element_rect(fill="white"),
          panel.border = element_rect(colour = "black", fill = NA,size=0.59),
          legend.key= element_rect(color="white",fill="white")
    )
  return(tuk.plt)
}
