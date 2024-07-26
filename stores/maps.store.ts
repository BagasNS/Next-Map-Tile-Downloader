import { create } from 'zustand';
import MAPS_SOURCES from '../maps-source.json';
import type { Map as MapLibreMap } from "maplibre-gl";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";

// Define the state and actions types
interface IMapsStore {
  isMapsLoaded: boolean
  setIsMapsLoaded: (value: boolean) => void,
  mapRef: MapLibreMap | undefined,
  setMapRef: (mapRef: MapLibreMap) => void
}

// Create the Zustand store
export const useMapsStore = create<IMapsStore>()((set) => ({
  isMapsLoaded: false,
  setIsMapsLoaded: (value: boolean) => set({ isMapsLoaded: value }),
  mapRef: undefined,
  setMapRef: (mapRef: MapLibreMap) => set({ mapRef }),
}));

interface IBaseMap {
  name: string;
  tiles: string;
  attribution?: string;
  maxZoom: number;
}

interface IBaseMapsStore {
  baseMaps: IBaseMap[];
  activeBaseMaps: IBaseMap;
  setActiveBaseMaps: (value: IBaseMap) => void;
}

const baseMapsSources = MAPS_SOURCES.flatMap((source) =>
  Object.entries(source.options).map(([key, value]) => ({
    name: `${source.name} - ${key}`,
    tiles: value,
    attribution: source.attribution,
    maxZoom: source.limits.max,
  }))
);

export const useBaseMapsStore = create<IBaseMapsStore>()((set) => ({
  baseMaps: baseMapsSources,
  activeBaseMaps: baseMapsSources[0],
  setActiveBaseMaps: (value) => set({ activeBaseMaps: value }),
}))


interface IRegionStore {
  region: FeatureCollection<Polygon | MultiPolygon> | undefined;
  setRegion: (value: FeatureCollection<Polygon | MultiPolygon> | undefined) => void;
}

export const useRegionStore = create<IRegionStore>()((set) => ({
  region: undefined,
  setRegion: (value: FeatureCollection<Polygon | MultiPolygon> | undefined) => set({ region: value })
}))

interface IDrawingToolsStore {
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
}

export const useDrawingToolsStore = create<IDrawingToolsStore>()((set) => ({
  isDrawing: false,
  setIsDrawing: (isDrawing: boolean) => set({ isDrawing }),
}))