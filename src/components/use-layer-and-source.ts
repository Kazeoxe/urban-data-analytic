import { CircleLayer, FillLayer, LineLayer, SymbolLayer } from "mapbox-gl";

import { EarthquakeType } from "@/utils/earthquakeType";
import { useEffect } from "react";

type MapboxLayer = CircleLayer | FillLayer | LineLayer | SymbolLayer;

type CustomMapboxSource = {
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  minzoom?: number;
  maxzoom?: number;
};

export const useLayerAndSource = (
  earthquakes: EarthquakeType[],
  startDate: string,
  endDate: string,
  applyFilters: boolean
) => {
  const sources = new Map<string, CustomMapboxSource>();

  console.log("startDate", startDate, "endDate", endDate);

  // Convert EarthquakeType to GeoJSON FeatureCollection
  const earthquakeGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: earthquakes
      .filter((earthquake) => {
        if (!applyFilters) return true;

        const earthquakeTime = new Date(earthquake.time).getTime();
        const startTime = startDate ? new Date(startDate).getTime() : null;
        const endTime = endDate ? new Date(endDate).getTime() : null;

        // Check if earthquakeTime is within the range
        return (
          (!startTime || earthquakeTime >= startTime) &&
          (!endTime || earthquakeTime <= endTime)
        );
      })
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
      .filter(Boolean) as GeoJSON.Feature[], // Exclude invalid features
    bbox: [-179.9495, -62.134, -3.49, 179.877, 81.9293, 625.963],
  };

  useEffect(() => {
    sources.set("earthquake", {
      type: "geojson",
      data: earthquakeGeoJSON,
    });
  }, [earthquakes, startDate, endDate, applyFilters]);

  const layers: MapboxLayer[] = [
    {
      id: "earthquake-points",
      type: "circle",
      source: "earthquake",
      paint: {
        "circle-radius": 6,
        "circle-color": "#ff5722",
      },
    },
  ];

  return {
    earthquakeGeoJSON,
    sources,
    layers,
  };
};
