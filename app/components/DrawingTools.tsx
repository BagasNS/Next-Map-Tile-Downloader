import { useDrawingToolsStore, useMapsStore, useRegionStore } from "@/stores/maps.store";
import { useEffect } from "react";
import MapLibreGlDraw from "maplibre-gl-draw";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { joinIntersectingPolygons, removeInvalidFeatures } from "@/helpers/spatial.helper";
import { addRegionLayer, removePreviewLayer, removeRegionLayer } from "@/helpers/maps.helper";
import { Box, ListItem, Text, UnorderedList } from "@chakra-ui/react";

export function DrawingTools() {
  const map = useMapsStore(state => state.mapRef);
  const isMapsLoaded = useMapsStore(state => state.isMapsLoaded);
  const selectedRegion = useRegionStore(state => state.region);
  const setSelectedRegion = useRegionStore(state => state.setRegion);
  const isDrawing = useDrawingToolsStore(state => state.isDrawing);

  useEffect(() => {
    if (!isDrawing) return;
    if (!map) return;
    if (!isMapsLoaded) return;

    removePreviewLayer(map);
    removeRegionLayer(map);

    const draw = new MapLibreGlDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
    });

    // @ts-ignore
    map.addControl(draw, 'top-right');

    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    async function updateArea() {
      const data = draw.getAll() as FeatureCollection<Polygon | MultiPolygon>;
      const joinedSelectedRegion = joinIntersectingPolygons(data.features);
      draw.deleteAll();
      draw.add(joinedSelectedRegion);
    }

    if (selectedRegion) {
      const joinedSelectedRegion = joinIntersectingPolygons(selectedRegion.features);
      draw.add(joinedSelectedRegion);
    }

    return () => {
      const featureDrawn = draw.getAll() as FeatureCollection<Polygon | MultiPolygon>;
      const validatedFeatures = removeInvalidFeatures(featureDrawn.features);
      if (validatedFeatures.features.length > 0) {
        setSelectedRegion(validatedFeatures as FeatureCollection<Polygon | MultiPolygon>);
        addRegionLayer(map, validatedFeatures);
      } else {
        setSelectedRegion(undefined);
      }

      map.off('draw.create', updateArea);
      map.off('draw.delete', updateArea);
      map.off('draw.update', updateArea);

      // @ts-ignore
      map.removeControl(draw);
    }
  }, [map, isMapsLoaded, selectedRegion, setSelectedRegion, isDrawing])

  if (isDrawing) {
    return (
      <Box
        position="absolute"
        top={4}
        left="50%"
        transform="translateX(-50%)"
        bg="orange.500"
        zIndex={10}
        p={2}
        px={4}
        rounded={'xl'}
        shadow={'xl'}
        maxW={'50%'}
      >
        <Text
          fontWeight={'bold'}
          fontSize={'md'}
        >
          Drawing Mode Enabled
        </Text>

        <Text
          fontSize={'md'}
          fontWeight={'normal'}
        >
          <UnorderedList spacing={.5} mt={2}>
            <ListItem>
              Use the drawing tools located at the top-right corner of the map to create shapes.
            </ListItem>
            <ListItem>
              To add multiple polygons, click the polygon icon and continue drawing on the map.
            </ListItem>
            <ListItem>
              Once you’re done, click the "Apply Region" button in the right sidebar to save your changes.
            </ListItem>
          </UnorderedList>
        </Text>
      </Box>
    )
  }

  return null;
}