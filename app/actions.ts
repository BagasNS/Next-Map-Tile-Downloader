"use server";

import { cpus } from "os";
import { generateGridTilesMultiThread } from "@/helpers/server/spatial";
import { featureCollection } from "@turf/helpers";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";

export async function countGrid(region: FeatureCollection<Polygon | MultiPolygon>, zoom: number) {
  const tiles = await generateGridTilesMultiThread(cpus().length, region, zoom);
  return tiles.length;
}

export async function previewGrid(region: FeatureCollection<Polygon | MultiPolygon>, zoom: number): Promise<FeatureCollection<Polygon>> {
  const tiles = await generateGridTilesMultiThread(cpus().length, region, zoom);
  return featureCollection(tiles.map(tile => tile.rect));
}
