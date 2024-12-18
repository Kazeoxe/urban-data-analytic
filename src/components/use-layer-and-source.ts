import { earthquakeData } from "@/utils/earthquake-data";
import {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "mapbox-gl";

type MapboxLayer =
  | CircleLayerSpecification
  | LineLayerSpecification
  | FillLayerSpecification
  | SymbolLayerSpecification;

type CustumMapboxSource = GeoJSONSource;

type GeoJSONSource = {
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  minzoom?: number;
  maxzoom?: number;
};

export const useLayerAndSource = () => {
  const sources = new Map<string, CustumMapboxSource>();

  sources.set("earthquake", {
    type: "geojson",
    data: earthquakeData,
  });

  const layers: MapboxLayer[] = [
    {
      id: "earthquake-points",
      type: "circle",
      source: "earthquake",
      paint: {
        "circle-radius": 6,
        "circle-color": "green",
      },
    },
  ];

  return {
    sources,
    layers,
  };
};
