"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { Point } from "mapbox-gl";
import { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { MapboxAccessToken, theme } from "../components/const";
import dynamic from "next/dynamic";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";

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
  }, [selectedAddressPoint]);

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

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}>
        <SearchBox
          accessToken={MapboxAccessToken}
          placeholder="Rechercher un lieu..."
          theme={theme}
          onRetrieve={handleAddressSelect}
        />
      </div>
    </div>
  );
};

export default Map;