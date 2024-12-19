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
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const createPulsingDot = useCallback((map: mapboxgl.Map) => {
    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    canvasRef.current = canvas;
    ctxRef.current = ctx;

    // Ajouter l'image initiale
    map.addImage('pulsing-dot', { width: size, height: size, data: new Uint8Array(size * size * 4) }, { pixelRatio: 2 });
  }, []);

  const drawPulsingDot = useCallback((timestamp: number) => {
    if (!ctxRef.current || !mapRef.current || !canvasRef.current) return;

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const size = canvas.width;

    // Calculer l'animation
    const t = (timestamp % 1500) / 1500;  // Ralentir l'animation à 1.5 secondes

    ctx.clearRect(0, 0, size, size);

    const radius = size / 4;
    const maxRadius = size / 2.5;
    const currentRadius = radius + (maxRadius - radius) * t;

    // Cercle extérieur pulsant
    ctx.beginPath();
    ctx.arc(size/2, size/2, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 0, ${Math.max(0, 0.8 - t)})`;
    ctx.fill();

    // Cercle central
    ctx.beginPath();
    ctx.arc(size/2, size/2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 0, 0, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mettre à jour l'image sur la carte
    try {
      const imageData = ctx.getImageData(0, 0, size, size);
      if (mapRef.current.hasImage('pulsing-dot')) {
        mapRef.current.updateImage('pulsing-dot', imageData);
      }
    } catch (error) {
      console.error('Error updating pulsing dot:', error);
    }

    // Continuer l'animation
    animationRef.current = requestAnimationFrame(drawPulsingDot);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MapboxAccessToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [28.834527, 45.340983],
      zoom: 1,
      bearing: 7,
      antialias: true
    });
    console.log(sources.get("earthquake")?.data.features);
    mapRef.current = map;

    map.on('load', () => {
      console.log("Map loaded");
      
      // Créer le point pulsant
      createPulsingDot(map);

      // Ajouter la source des tremblements de terre
      if (sources.get("earthquake")) {
        map.addSource("earthquake", sources.get("earthquake")!);
        
        map.addLayer({
          id: "earthquake-points",
          type: "symbol",
          source: "earthquake",
          layout: {
            'icon-image': 'pulsing-dot',
            'icon-allow-overlap': true,
            'icon-size': 0.5
          }
        });

        // Démarrer l'animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        console.log("Starting animation");
        animationRef.current = requestAnimationFrame(drawPulsingDot);
      }
    });

    // Assurer que l'animation continue pendant les mouvements
    map.on('render', () => {
      if (!animationRef.current) {
        console.log("Restarting animation on render");
        animationRef.current = requestAnimationFrame(drawPulsingDot);
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.remove();
    };
  }, [sources, layers, createPulsingDot, drawPulsingDot]);

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