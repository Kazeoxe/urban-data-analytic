import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import { MapboxAccessToken, theme } from "../components/const";
import dynamic from "next/dynamic";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";
import { useLayerAndSource } from "./use-layer-and-source";
import DrawerComponent from "./DrawerComponent";

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
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (mapContainer.current) {
      mapboxgl.accessToken = MapboxAccessToken;
      const map = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: "mapbox://styles/mapbox/light-v11",
        center: [28.834527, 45.340983],
        zoom: 14,
        bearing: 7,
        antialias: true
      });

      mapRef.current = map;

      const size = 200;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      let start: number;

      const animate = (timestamp: number) => {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;
        const t = (elapsed % 1000) / 1000; // Animation cycle d'une seconde

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Outer pulsing circle
        const radius = size / 4;
        const maxRadius = size / 2.5;
        const currentRadius = radius + (maxRadius - radius) * t;

        ctx.beginPath();
        ctx.arc(size/2, size/2, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.8 - t})`; // Rouge qui s'estompe
        ctx.fill();

        // Center circle
        ctx.beginPath();
        ctx.arc(size/2, size/2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update image data
        const newImageData = ctx.getImageData(0, 0, size, size);
        map.updateImage('pulsing-dot', newImageData);

        animationRef.current = requestAnimationFrame(animate);
      };

      map.on('load', () => {
        console.log("Map loaded");

        // Create initial empty image
        map.addImage('pulsing-dot', { width: size, height: size, data: new Uint8Array(size * size * 4) });

        map.addSource('pulse-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [28.834527, 45.340983]
                },
                properties: {}
              }
            ]
          }
        });

        map.addLayer({
          id: 'pulse',
          type: 'symbol',
          source: 'pulse-points',
          layout: {
            'icon-image': 'pulsing-dot',
            'icon-allow-overlap': true
          }
        });

        // Add earthquake points
        if (sources.get("earthquake")) {
          map.addSource("earthquake", sources.get("earthquake")!);
          map.addLayer(layers[0]);
        }

        // Start animation
        animationRef.current = requestAnimationFrame(animate);
      });

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        map.remove();
      };
    }
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