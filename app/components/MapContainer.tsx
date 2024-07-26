"use client"
import { useEffect, useRef } from "react";
import Map, { useMap } from 'react-map-gl/maplibre';
import { useBaseMapsStore, useMapsStore } from "@/stores/maps.store";
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css';

import { DrawingTools } from "@/app/components/DrawingTools";

export default function MapContainer() {
  const setIsMapsLoaded = useMapsStore(state => state.setIsMapsLoaded);

  return (
    <Map
      reuseMaps
      initialViewState={{
        latitude: 0.4174767746707514,
        longitude: 116.98037278187925,
        zoom: 5
      }}
      onLoad={() => setIsMapsLoaded(true)}
    >
      <MapStore/>
      <BaseMap/>
      <DrawingTools/>
    </Map>
  )
}

function MapStore() {
  const setMapRef = useMapsStore(state => state.setMapRef);
  const { current: mapRef } = useMap();

  useEffect(() => {
    if (!mapRef) return;
    setMapRef(mapRef.getMap());
  }, [mapRef, setMapRef]);

  return null;
}

function BaseMap() {
  const isMapsLoaded = useMapsStore(state => state.isMapsLoaded);
  const activeBaseMaps = useBaseMapsStore(state => state.activeBaseMaps);
  const { current: mapRef } = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isMapsLoaded) return;
    if (!mapRef?.getMap) return;

    const map = mapRef.getMap();
    const sourceId = `source-basemap`;
    const layerId = `layer-basemap`;

    if (!isFirstRender.current) {
      if (map.getSource(sourceId)) {
        map.removeLayer(layerId);
        map.removeSource(sourceId);
      }
    }

    isFirstRender.current = false;

    // Add the new source and layer
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [activeBaseMaps.tiles],
      attribution: activeBaseMaps.attribution,
      maxzoom: activeBaseMaps.maxZoom,
      tileSize: 256,
    });

    map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
      },
      map.getStyle().layers[0]?.id
    );

  }, [isMapsLoaded, activeBaseMaps, mapRef]);

  return null;
}
