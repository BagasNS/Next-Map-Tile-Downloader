import type { Map as MapLibreMap } from "maplibre-gl";
import { FeatureCollection } from "geojson";

export function removePreviewLayer(map: MapLibreMap) {
  if (map.getSource(`preview-source`)) {
    map.removeLayer(`preview-layer-fill`);
    map.removeLayer(`preview-layer-outline`);
    map.removeSource(`preview-source`);
  }
}

export function removeRegionLayer(map: MapLibreMap) {
  if (map.getSource(`region-source`)) {
    map.removeLayer(`region-layer-fill`);
    map.removeLayer(`region-layer-outline`);
    map.removeSource(`region-source`);
  }
}

export function addRegionLayer(map: MapLibreMap, featureCollection: FeatureCollection) {
  if (map.getSource(`region-source`)) {
    removeRegionLayer(map);
  }

  map.addSource(`region-source`, {
    type: 'geojson',
    data: featureCollection
  });

  // Layer Fill
  map.addLayer({
    id: `region-layer-fill`,
    type: 'fill',
    source: `region-source`,
    paint: {
      'fill-color': '#3182CE',
      'fill-opacity': 0.2,
    }
  });

  // Layer Outline
  map.addLayer({
    id: `region-layer-outline`,
    type: 'line',
    source: `region-source`,
    paint: {
      'line-color': '#3182CE',
      'line-width': 3,
    }
  });
}

export function addPreviewLayer(map: MapLibreMap, featureCollection: FeatureCollection) {
  if (map.getSource(`preview-source`)) {
    removePreviewLayer(map);
  }

  map.addSource(`preview-source`, {
    type: 'geojson',
    data: featureCollection
  });

  // Layer Fill
  map.addLayer({
    id: `preview-layer-fill`,
    type: 'fill',
    source: `preview-source`,
    paint: {
      'fill-color': '#DD6B20',
      'fill-opacity': 0.2,
    }
  });

  // Layer Outline
  map.addLayer({
    id: `preview-layer-outline`,
    type: 'line',
    source: `preview-source`,
    paint: {
      'line-color': '#DD6B20',
      'line-width': 3,
    }
  });
}