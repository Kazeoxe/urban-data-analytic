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
import { DateRangeFilter, PlacesFilter } from "./filters";
import "./../app/globals.css";
import { EarthquakeType } from "@/utils/earthquakeType";

// Import dynamique du SearchBox avec typage explicite
const SearchBox = dynamic(
  () =>
    import("@mapbox/search-js-react").then(
      (mod) => mod.SearchBox as React.ComponentType<SearchBoxProps>
    ),
  { ssr: false }
);

type MapProps = {
  earthquakes: EarthquakeType[];
};

const Map = ({ earthquakes }: MapProps) => {
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
  const [filters, setFilters] = useState({
    startYear: 2000,
    endYear: 2024,
    place: "",
  });

  const { sources, layers } = useLayerAndSource(earthquakes);

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
    if (mapRef.current) {
      const onLoad = () => {
        if (!mapRef.current?.getSource("earthquake")) {
          // Ajouter la source si elle n'existe pas encore
          mapRef.current?.addSource("earthquake", sources.get("earthquake")!);
        } else {
          // Mettre à jour les données de la source existante
          const source = mapRef.current.getSource(
            "earthquake"
          ) as mapboxgl.GeoJSONSource;
          source.setData(sources.get("earthquake")!.data);
        }

        // Ajouter la couche seulement si elle n'existe pas
        if (!mapRef.current?.getLayer(layers[0].id)) {
          mapRef.current?.addLayer(layers[0]);
        }
      };

      if (mapRef.current.isStyleLoaded()) {
        onLoad(); // Exécute directement si le style est chargé
      } else {
        mapRef.current.on("load", onLoad); // Sinon, attends que la carte soit chargée
      }

      const map = mapRef.current;

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

      map.on("mouseenter", "earthquake-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "earthquake-points", () => {
        map.getCanvas().style.cursor = "";
      });

      return () => {
        mapRef.current?.off("load", onLoad);
      };
    }
  }, [sources, layers]);

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
    </div>
  );
};

export default Map;
