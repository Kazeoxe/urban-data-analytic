"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { Point } from "mapbox-gl";
import { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { MapboxAccessToken, theme } from "../components/const";
import dynamic from "next/dynamic";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";
import { useLayerAndSource } from "./use-layer-and-source";
import DrawerComponent from "./DrawerComponent";
import Popup from "./Popup";

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
  const [popupData, setPopupData] = useState<{
    title: string;
    magnitude: number;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);

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
    const map = mapRef.current;

    if (!map) return;

    map?.on("load", () => {
      if (map && sources.get("earthquake")) {
        map.addSource("earthquake", sources.get("earthquake")!);
        map.addLayer(layers[0]);
      }

      map.on("click", "earthquake-points", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["earthquake-points"],
        });

        if (features.length > 0) {
          const feature = features[0];
          const title = feature.properties?.title;
          const magnitude = feature.properties?.mag;
          const point = map.project(
            feature.geometry.coordinates.slice(0, 2) as [number, number]
          );
          const x = point.x;
          const y = point.y;

          setPopupData({
            title,
            magnitude: magnitude,
            x,
            y,
            visible: true,
          });
        }
      });

      // Changer le curseur de la souris sur hover
      map.on("mouseenter", "earthquake-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "earthquake-points", () => {
        map.getCanvas().style.cursor = "";
      });
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

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      {popupData && popupData.visible && (
        <Popup
          title={popupData.title}
          magnitude={popupData.magnitude}
          x={popupData.x}
          y={popupData.y}
          onClose={() => setPopupData(null)}
        />
      )}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }}>
        <DrawerComponent>
          <SearchBox
            accessToken={MapboxAccessToken}
            placeholder="Rechercher un lieu..."
            theme={theme}
            onRetrieve={handleAddressSelect}
          />
        </DrawerComponent>
      </div>
    </div>
  );
};

export default Map;
