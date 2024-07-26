import { parentPort, workerData } from 'worker_threads';
import { bbox } from '@turf/bbox';
import { featureCollection, point, polygon } from '@turf/helpers';
import { bboxPolygon } from '@turf/bbox-polygon';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { tile2lat, tile2long } from "../helpers/spatial.helper";

// Import Statement Not Working In CommonJS
// Since we are using CommonJS, we need to import the modules using the default property
const booleanIntersects = require('@turf/boolean-intersects').default;
const geojsonRbush = require('@turf/geojson-rbush').default;

function createRTreeIndex(selectedRegion: Feature<Polygon | MultiPolygon>[]) {
  const tree = geojsonRbush();

  selectedRegion.forEach((feature) => {
    if (feature.geometry.type === 'Polygon') {
      tree.insert(feature);
    } else if (feature.geometry.type === 'MultiPolygon') {
      const polygons = splitMultiPolygon(feature as Feature<MultiPolygon>);
      polygons.forEach((polygon) => {
        tree.insert(polygon);
      });
    }
  });
  return tree;
}

function getTileRect(x: number, y: number, zoom: number) {
  const c1 = point([tile2long(x, zoom), tile2lat(y, zoom)]);
  const c2 = point([tile2long(x + 1, zoom), tile2lat(y + 1, zoom)]);
  return bboxPolygon(bbox(featureCollection([c1, c2])));
}

function generateGridTilesWorker(selectedRegion: FeatureCollection<Polygon | MultiPolygon>, zoomLevel: number, tileRange: {
  startX: number,
  startY: number,
  endX: number,
  endY: number
}) {
  const gridTiles = [];
  const tree = createRTreeIndex(selectedRegion.features);

  for (let y = tileRange.startY; y <= tileRange.endY; y++) {
    for (let x = tileRange.startX; x <= tileRange.endX; x++) {

      // Generate grid tile and check for intersection
      const tileRect = getTileRect(x, y, zoomLevel);
      const tileRectBbox = tileRect.bbox || bbox(tileRect);
      const potentialMatches = tree.search(tileRectBbox);

      for (const match of potentialMatches.features) {
        if (booleanIntersects(match, tileRect)) {
          gridTiles.push({ x, y, z: zoomLevel, rect: tileRect });
          break;
        }
      }
    }
  }

  return gridTiles;
}

function splitMultiPolygon(multiPolygon: Feature<MultiPolygon>): Feature<Polygon>[] {
  // Initialize an array to hold the individual polygons
  const polygons: Feature<Polygon>[] = [];

  // Iterate through each polygon in the multiPolygon
  multiPolygon.geometry.coordinates.forEach((coords) => {
    // Create a Polygon from the coordinates
    const singlePolygon = polygon(coords);

    // Push the polygon to the array
    polygons.push(singlePolygon);
  });

  return polygons;
}


parentPort?.once('message', () => {
  const { selectedRegion, zoomLevel, tileRange } = workerData;
  const result = generateGridTilesWorker(selectedRegion, zoomLevel, tileRange);
  parentPort?.postMessage(result);
});
