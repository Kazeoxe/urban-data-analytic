import {
  CircleLayerSpecification,
  HeatmapLayerSpecification,
  LineLayerSpecification,
} from "mapbox-gl";

import { EarthquakeType } from "@/utils/earthquakeType";
import { boundariesData } from "./../utils/PB2002_boundaries";

type MapboxLayer =
  | CircleLayerSpecification
  | HeatmapLayerSpecification
  | LineLayerSpecification;

type CustomMapboxSource = {
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  minzoom?: number;
  maxzoom?: number;
};

export const useLayerAndSource = (earthquakes: EarthquakeType[]) => {
  const sources = new Map<string, CustomMapboxSource>();

  // Convertir EarthquakeType en GeoJSON FeatureCollection sans filtrage
  const baseFeatures = earthquakes
    .map((earthquake) => {
      const coordinates = earthquake.coordinates.split(",").map(Number);

      if (coordinates.length !== 3 || coordinates.some(isNaN)) {
        console.error(
          `Invalid coordinates for earthquake ${earthquake.id}: ${earthquake.coordinates}`
        );
        return null; // Ignore invalid data
      }

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates,
        },
        properties: {
          mag: earthquake.magnitude,
          place: earthquake.place,
          time: earthquake.time,
          updated: earthquake.updated,
          detailUrl: earthquake.detailUrl,
        },
      };
    })
    .filter(Boolean) as GeoJSON.Feature[];

  const earthquakeGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: baseFeatures,
    bbox: [-179.9495, -62.134, -3.49, 179.877, 81.9293, 625.963],
  };

  sources.set("earthquake", {
    type: "geojson",
    data: earthquakeGeoJSON,
  });

  sources.set("tectonic-plates", {
    type: "geojson",
    data: boundariesData,
  });

  const layers: MapboxLayer[] = [
    // circle layer for points
    {
      id: "earthquake-points",
      type: "circle",
      source: "earthquake",
      minzoom: 7,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          ["interpolate", ["linear"], ["get", "mag"], 1, 1, 6, 4],
          16,
          ["interpolate", ["linear"], ["get", "mag"], 1, 5, 6, 50],
        ],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          1,
          "rgba(33,102,172,0)",
          2,
          "rgb(103,169,207)",
          3,
          "rgb(209,229,240)",
          4,
          "rgb(253,219,199)",
          5,
          "rgb(239,138,98)",
          6,
          "rgb(178,24,43)",
        ],
        "circle-stroke-color": "white",
        "circle-stroke-width": 1,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
      },
    },

    // Add heatmap layer

    {
      id: "earthquake-heat",
      type: "heatmap",
      source: "earthquake",
      maxzoom: 9,
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          0,
          0,
          6,
          1,
        ],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(33,102,172,0)",
          0.2,
          "rgb(103,169,207)",
          0.4,
          "rgb(209,229,240)",
          0.6,
          "rgb(253,219,199)",
          0.8,
          "rgb(239,138,98)",
          1,
          "rgb(178,24,43)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
      },
    },
    {
      id: "tectonic-lines",
      type: "line",
      source: "tectonic-plates",
      paint: {
        "line-color": "#FF8C00",
        "line-width": 2,
        "line-opacity": 0.7,
      },
    },
  ];

  return {
    earthquakeGeoJSON,
    sources,
    layers,
  };
};
