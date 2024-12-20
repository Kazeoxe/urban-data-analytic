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
import { findEarthquakesNearPlates } from "../utils/earthquakeAnalysis";
import { Feature, GeoJSON } from "geojson";
import DistanceChart from "./DistanceChart";
import { DistanceStats } from "../utils/earthquakeAnalysis";

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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [distanceStats, setDistanceStats] = useState<DistanceStats[]>([]);

  const { sources, layers, earthquakeGeoJSON } = useLayerAndSource(earthquakes);

  useEffect(() => {
    if (!isMapLoaded || !earthquakes.length || !tectonicData.features.length)
      return;

    const earthquakesGeoJSON = {
      type: "FeatureCollection",
      features: earthquakes.map((eq) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: eq.coordinates.split(",").map(Number),
        },
        properties: {
          place: eq.place,
          mag: eq.magnitude,
        },
      })),
    } as GeoJSON;
    const stats = findEarthquakesNearPlates(
      earthquakesGeoJSON,
      tectonicData as GeoJSON
    );
    setDistanceStats(stats);
  }, [isMapLoaded, earthquakes]);

  // Initialisation de la carte
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

    initializeMap.on("load", () => {
      setIsMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Ajout des sources et des couches
  useEffect(() => {
    if (!isMapLoaded) return;

    const map = mapRef.current;

    if (!map) return;

    const sourceId = "earthquake";

    if (!map.getSource(sourceId)) {
      sources.forEach((source, id) => {
        if (!map.getSource(id)) {
          map.addSource(id, source);
        }
      });

      layers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer);
        }
      });
    }
  }, [isMapLoaded, sources, layers]);
  

  // Filtre

  

const handleApplyFilters = useCallback(() => {

  const map = mapRef.current;

  if (!map) return;

  const source = map.getSource('earthquake');
  if (source && source.type === "geojson") {

    const featureFilter = earthquakeGeoJSON.features.filter((feature) => {
      const earthquakeTime = feature.properties?.time.split("T")[0];

        return (
          (!filters.startDate || earthquakeTime >= filters.startDate) &&
          (!filters.endDate || earthquakeTime <= filters.endDate)
        );
      })

      const filteredData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: featureFilter,
        bbox: [-179.9495, -62.134, -3.49, 179.877, 81.9293, 625.963],
      };


    source.setData(filteredData);
    
  } else {
    console.log('La source des données est introuvable ou ne supporte pas setData.');
  }
}, [earthquakeGeoJSON, filters.endDate, filters.startDate])


  // Gestion des événements de clic pour afficher le popup
  useEffect(() => {
    if (!isMapLoaded) return;

    const map = mapRef.current;

    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["earthquake-points"],
      });

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
      <div className="absolute  top-5 left-5 z-50">
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
              className=" bottom-16 right-5 p-2 bg-gray-900 text-white font-semibold rounded-md focus:ring-2 focus:ring-blue-300"
              onClick={handleApplyFilters}
            >
              Valider les filtres
            </button>
            <div className="bottom-4 right-4  w-full">
              <DistanceChart data={distanceStats} />
            </div>
            
          </>
        </DrawerComponent>
      </div>
    </div>
  );
};

export default Map;
