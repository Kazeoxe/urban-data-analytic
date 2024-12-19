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
  const [filters, setFilters] = useState<{ startDate: string; endDate: string; place: string }>({ startDate: "", endDate: "", place: "" });
  const [applyFilters, setApplyFilters] = useState(false);
  
  const { sources, layers } = useLayerAndSource(earthquakes, filters.startDate, filters.endDate, applyFilters);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MapboxAccessToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [28.834527, 45.340983],
      zoom: 2,
      bearing: 0,
      antialias: true
    });
    
    mapRef.current = map;

    const initializeLayers = () => {
      if (sources.get("earthquake")) {
        // Remove existing source and layers if they exist
        if (map.getSource("earthquake")) {
          if (map.getLayer("earthquake-heat")) map.removeLayer("earthquake-heat");
          if (map.getLayer("earthquake-points")) map.removeLayer("earthquake-points");
          map.removeSource("earthquake");
        }

        // Add source
        map.addSource("earthquake", sources.get("earthquake")!);
        
        // Add heatmap layer
        map.addLayer(
          {
            id: 'earthquake-heat',
            type: 'heatmap',
            source: 'earthquake',
            maxzoom: 9,
            paint: {
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0, 0,
                6, 1
              ],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                9, 20
              ],
              'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 1,
                9, 0
              ]
            }
          },
          'waterway-label'
        );

        // Add circle layer for points
        map.addLayer(
          {
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquake',
            minzoom: 7,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
                16,
                ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                1, 'rgba(33,102,172,0)',
                2, 'rgb(103,169,207)',
                3, 'rgb(209,229,240)',
                4, 'rgb(253,219,199)',
                5, 'rgb(239,138,98)',
                6, 'rgb(178,24,43)'
              ],
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1,
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 0,
                8, 1
              ]
            }
          },
          'waterway-label'
        );

        // Set up event handlers
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

            setPopupData({
              title,
              magnitude,
              x: point.x,
              y: point.y,
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
      }
    };

    if (map.isStyleLoaded()) {
      initializeLayers();
    } else {
      map.on('load', initializeLayers);
    }

    return () => {
      map.remove();
    };
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

  const handleApplyFilters = () => {
    setApplyFilters(true);
  };

  useEffect(() => {
    if (applyFilters) {
      // Logique pour appliquer les filtres
      console.log("Applying filters:", filters);
      setApplyFilters(false); // Remettre à false après l'application des filtres
    }
  }, [applyFilters, filters]);

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