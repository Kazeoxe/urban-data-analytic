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
import tectonicData from "../utils/PB2002_boundaries.json";
import { findEarthquakesNearPlates } from '../utils/earthquakeAnalysis';
import { Feature, GeoJSON } from "geojson";

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
  const [filters, setFilters] = useState<{
    startDate: string;
    endDate: string;
    place: string;
  }>({ startDate: "", endDate: "", place: "" });
  const [applyFilters, setApplyFilters] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { sources, layers } = useLayerAndSource(
    earthquakes,
    filters.startDate,
    filters.endDate,
    applyFilters
  );

  useEffect(() => {
    if (!isMapLoaded || !earthquakes.length || !tectonicData.features.length) return;
    
    const earthquakesGeoJSON = {
      type: 'FeatureCollection',
      features: earthquakes.map(eq => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: eq.coordinates.split(',').map(Number)  
        },
        properties: {
          place: eq.place,
          mag: eq.magnitude
        }
      }))
    } as GeoJSON;
    console.log(earthquakes);
    findEarthquakesNearPlates(earthquakesGeoJSON, tectonicData as GeoJSON);
  }, [isMapLoaded, earthquakes]);

  // initialize map

  useEffect(() => {
    if (mapRef.current) return;

    mapboxgl.accessToken = MapboxAccessToken;

    if (!mapContainer.current) return;

    const initializeMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [28.834527, 45.340983],
      zoom: 2,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = initializeMap;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add source and layers

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = mapRef.current;

    // Check if the map is ready
    const updateMapSource = () => {
      if (!map) return;

      map.on("load", () => {
        const sourceId = "earthquake";

        if (map.getSource(sourceId)) {
          const source = map.getSource(sourceId);

          // Update the source with the new filtered data
          if (source && source.type === "geojson") {
            (source as mapboxgl.GeoJSONSource).setData(
              sources.get(sourceId)!.data
            );
          }
        } else {
          map.addSource(sourceId, sources.get(sourceId)!);

          layers.forEach((layer) => {
            if (!map.getLayer(layer.id)) {
              map.addLayer(layer);
            }
          });
        }

        if (!map.getSource("tectonic-plates")) {
          map.addSource("tectonic-plates", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: tectonicData.features as Feature[],
            } as GeoJSON,
          });

          // Ajouter la couche des plaques tectoniques
          map.addLayer({
            id: "tectonic-lines",
            type: "line",
            source: "tectonic-plates",
            paint: {
              "line-color": "#FF8C00",
              "line-width": 2,
              "line-opacity": 0.7,
            },
          });
        }
      });
    };

    updateMapSource();

    setIsMapLoaded(true);
  }, [sources, layers]);

  useEffect(() => {
    if (!isMapLoaded) return;

    const map = mapRef.current;

    if (!map) return;

    // display popup when user clicks on a point

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = e.features;

      if (features && features.length > 0) {
        const feature = features[0];
        const title = feature.properties?.place;
        const magnitude = feature.properties?.mag;
        if (feature.geometry.type === "Point") {
          const pointCoordinates = feature.geometry.coordinates as [
            number,
            number
          ];
          const point = map.project(pointCoordinates);

          setPopupData({
            title,
            magnitude,
            x: point.x,
            y: point.y,
            visible: true,
          });
        }
      }
    };

    map.on("click", "earthquake-points", handleClick);

    map.on("mouseenter", "earthquake-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "earthquake-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.off("click", handleClick);
    };
  }, [isMapLoaded]);

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

  const handleApplyFilters = () => {
    setApplyFilters(true);
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
              onClick={handleApplyFilters}
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
