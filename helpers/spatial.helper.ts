import { featureCollection, polygon } from "@turf/helpers";
import union from "@turf/union";
import { Feature, FeatureCollection, GeoJsonGeometryTypes, MultiPolygon, Polygon } from "geojson";
import booleanValid from "@turf/boolean-valid";


export function long2tile(lon: number, zoom: number) {
  return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

export function lat2tile(lat: number, zoom: number) {
  return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

export function tile2long(x: number, z: number) {
  return (x / Math.pow(2, z) * 360 - 180);
}

export function tile2lat(y: number, z: number) {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

export function joinIntersectingPolygons(features: Feature<Polygon | MultiPolygon>[]) {
  if (features.length <= 1) {
    return featureCollection(features);
  }

  const merged = union(featureCollection(features))
  if (!merged) {
    return featureCollection(features);
  }

  if (merged.geometry.type === 'MultiPolygon') {
    // split MultiPolygon into Polygon
    // const polygons = merged.geometry.coordinates.map(coords => polygon(coords));
    const polygons: Feature<Polygon>[] = [];
    for (const coords of merged.geometry.coordinates) {
      try {
        const poly = polygon(coords);
        polygons.push(poly);
      } catch (error) {
        // silent error
      }
    }

    return featureCollection(polygons);
  }

  return featureCollection([merged]);
}

export function removeInvalidFeatures(features: Feature<Polygon | MultiPolygon>[]): FeatureCollection {
  return featureCollection(features.filter(feature => booleanValid(feature)));
}

export function isValidGeoJSON(json: JSON | string, geometryType?: GeoJsonGeometryTypes | Array<GeoJsonGeometryTypes>) {
  try {
    // Try to parse the JSON string
    let obj;
    if (typeof json === 'string') {
      obj = JSON.parse(json as string);
    } else {
      obj = json
    }

    // Check for GeoJSON properties and structure
    if (
      obj &&
      obj.type &&
      typeof obj.type === 'string' &&
      obj.features &&
      Array.isArray(obj.features)
    ) {
      for (const feature of obj.features) {
        if (!feature.geometry || typeof feature.geometry !== 'object') {
          return false;
        }

        if (geometryType) {
          if (Array.isArray(geometryType)) {
            if (!geometryType.includes(feature.geometry.type)) {
              return false;
            }
          } else {
            if (feature.geometry.type !== geometryType) {
              return false;
            }
          }
        }
      }

      // If all checks pass, it's a valid GeoJSON
      return true;
    }

    // If any of the checks fail, it's not a valid GeoJSON
    return false;
  } catch (error) {
    // JSON parsing error
    return false;
  }
}
