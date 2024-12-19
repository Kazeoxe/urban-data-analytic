import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { MapboxAccessToken, theme } from "../utils/const";
import dynamic from "next/dynamic";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";
import { useLayerAndSource } from "./hooks/use-layer-and-source";
import DrawerComponent from "./ui/DrawerComponent";

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
  const { sources, layers } = useLayerAndSource();

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

    map.on('load', () => {
      if (sources.get("earthquake")) {
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
                0,
                0,
                6,
                1
              ],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                9,
                3
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)'
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                9,
                20
              ],
              'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                9,
                0
              ]
            }
          },
          'waterway-label'
        );

        // Add circle layer for high zoom levels
        map.addLayer(
          {
            id: 'earthquake-point',
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
                1,
                'rgba(33,102,172,0)',
                2,
                'rgb(103,169,207)',
                3,
                'rgb(209,229,240)',
                4,
                'rgb(253,219,199)',
                5,
                'rgb(239,138,98)',
                6,
                'rgb(178,24,43)'
              ],
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1,
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                0,
                8,
                1
              ]
            }
          },
          'waterway-label'
        );
      }
    });

    return () => {
      map.remove();
    };
  }, [sources, layers]);

  const handleAddressSelect = useCallback(
    (event: SearchBoxRetrieveResponse) => {
      if (event?.features?.length > 0) {
        const [lng, lat] = event.features[0].geometry.coordinates;
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