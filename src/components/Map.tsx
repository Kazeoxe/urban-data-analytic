"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { Point } from "mapbox-gl";
import { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { MapboxAccessToken, theme } from "../components/const";
import dynamic from "next/dynamic";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";
import { useLayerAndSource } from "./use-layer-and-source";
import DrawerComponent from "./DrawerComponent";
import { DateRangeFilter, PlacesFilter } from "./filters";
import "./../app/globals.css";

// Import dynamique du SearchBox avec typage explicite
const SearchBox = dynamic(
  () =>
    import("@mapbox/search-js-react").then(
      (mod) => mod.SearchBox as React.ComponentType<SearchBoxProps>
    ),
  { ssr: false }
);

const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedAddressPoint, setSelectedAddressPoint] = useState<Point>();
  const [filters, setFilters] = useState({
    startYear: 2000,
    endYear: 2024,
    place: "",
  });

  const { sources, layers } = useLayerAndSource();

  useEffect(() => {
    if (mapContainer.current) {
      mapboxgl.accessToken = MapboxAccessToken;
      const map = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-74.006, 40.7128],
        zoom: 12,
      });

      mapRef.current = map;

      return () => map.remove();
    }
  }, []);

  useEffect(() => {
    mapRef.current?.on("load", () => {
      if (mapRef.current && sources.get("earthquake")) {
        mapRef.current.addSource("earthquake", sources.get("earthquake")!);
        mapRef.current.addLayer(layers[0]);
      }
    });
  }, [sources, layers, selectedAddressPoint]);

  const handleAddressSelect = useCallback(
    (event: SearchBoxRetrieveResponse) => {
      if (event?.features?.length > 0) {
        const [lng, lat] = event.features[0].geometry.coordinates;

        setSelectedAddressPoint(new Point(lng, lat));

        mapRef.current?.flyTo({
          center: [lng, lat],
          essential: true,
          zoom: 14,
        });
      }
    },
    []
  );

  const applyFilters = () => {
    console.log("Applying filters:", filters);
  };

  return (
    <div className="h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute top-5 left-5 z-50">
        <DrawerComponent>
          <>
            <SearchBox
              accessToken={MapboxAccessToken}
              placeholder="Rechercher un lieu..."
              theme={theme}
              onRetrieve={handleAddressSelect}
            />
            <h2 className="mt-8 text-lg text-gray-700 font-bold text-center">
              Filter
            </h2>
            <PlacesFilter setFilters={setFilters} />
            <DateRangeFilter setFilters={setFilters} />
            <button
              className="absolute bottom-16 right-5 p-2 bg-gray-900 text-white font-semibold rounded-md focus:ring-2 focus:ring-blue-300"
              onClick={applyFilters}
            >
              Valider les filtres
            </button>
          </>
        </DrawerComponent>
      </div>
    </div>
  );
};

export default Map;
