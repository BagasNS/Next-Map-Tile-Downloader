"use client"

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Skeleton,
  Text,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import React, { useCallback, useState } from "react";
import { isValidGeoJSON, joinIntersectingPolygons } from "@/helpers/spatial.helper";
import { bbox } from "@turf/bbox";

import { useBaseMapsStore, useDrawingToolsStore, useMapsStore, useRegionStore } from "@/stores/maps.store";
import MapSource from '@/maps-source.json';
import { FeatureCollection } from "geojson";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { countGrid, previewGrid } from "@/app/actions";
import { addPreviewLayer, addRegionLayer, removePreviewLayer, removeRegionLayer } from "@/helpers/maps.helper";

export default function SidebarContainer() {
  return (
    <>
      <RegionSection/>
      <ConfigSection/>
    </>
  )
}

function RegionSection() {
  const toast = useToast();
  const map = useMapsStore(state => state.mapRef);
  const isMapsLoaded = useMapsStore(state => state.isMapsLoaded);
  const setRegion = useRegionStore(state => state.setRegion);
  const setIsDrawing = useDrawingToolsStore(state => state.setIsDrawing);
  const isDrawing = useDrawingToolsStore(state => state.isDrawing);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!map) return;
    if (!isMapsLoaded) return;

    // Do something with the files
    acceptedFiles.forEach((file: File) => {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        try {
          const jsonString = event?.target?.result as string;
          const jsonObject = JSON.parse(jsonString);

          // Check Are JSON Object are valid geojson with type polygon / multi-polygon
          if (!isValidGeoJSON(jsonObject, ['MultiPolygon', 'Polygon'])) {
            return toast({
              title: 'Invalid GeoJSON Data',
              description: 'Make sure geometry type only Polygon and/or MultiPolygon',
              status: 'error',
              position: 'top',
              isClosable: true
            })
          }

          let geojsonData;
          try {
            geojsonData = joinIntersectingPolygons(jsonObject.features);
            if (geojsonData.features.length !== jsonObject.features.length) {
              toast({
                title: 'Info',
                description: 'We have performed a union operation on the intersecting polygons. As a result, some of the polygons may have been merged into larger, contiguous shapes. This means that polygons which were previously separate and overlapping have been combined into a single polygon where they intersected.',
                status: 'info',
                position: 'top',
                isClosable: true,
                duration: null
              })
            }
          } catch (e) {
            geojsonData = jsonObject
          }

          setRegion(geojsonData);
          removeRegionLayer(map);
          addRegionLayer(map, geojsonData);

          const [minX, minY, maxX, maxY] = bbox(geojsonData);
          map.fitBounds([minX, minY, maxX, maxY], { padding: 50 });
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };

      // Start reading the File
      fileReader.readAsText(file);
    });
  }, [toast, map, isMapsLoaded, setRegion])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.geojson', '.json']
    }
  })

  return (
    <Skeleton
      isLoaded={isMapsLoaded && map !== undefined}
      rounded={'xl'}
      startColor={'gray.600'}
      endColor={'gray.700'}
    >
      <Box rounded={'xl'} p={4} w={'100%'} bg={'gray.700'}>
        <Text fontSize={'xl'} fontWeight={'bold'} mb={2}>1. Select Region</Text>
        <FormControl as={Flex} justifyContent={'center'}>
          <Button
            onClick={() => {
              setIsDrawing(!isDrawing);
            }}
            colorScheme={!isDrawing ? 'orange' : 'green'}
            size={'md'}
            w={'100%'}
          >
            {isDrawing ? 'Apply Region' : 'Draw Region'}
          </Button>
        </FormControl>

        {!isDrawing && (
          <>
            <Text color={'white'} textAlign={'center'} my={2}>OR</Text>

            <FormControl color={'white'}>
              <Box
                borderWidth={1}
                borderColor={'orange.500'}
                rounded={'md'}
                borderStyle={'dashed'}
                p={4}
                color={'orange.500'}
                textAlign={'center'}
                fontWeight={'semibold'}
              >
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Text fontSize={'md'} my={5}>
                    Select Geojson file
                  </Text>
                  <Text fontSize={'sm'} color={'red.500'}>
                    extension must be .geojson or .json
                  </Text>
                  <Text fontSize={'md'} color={'red.500'}>
                    Only Support Polygon or Multi-Polygon
                  </Text>
                </div>
              </Box>
            </FormControl>
          </>
        )}
      </Box>
    </Skeleton>
  )
}

function ConfigSection() {
  const map = useMapsStore(state => state.mapRef);
  const isMapsLoaded = useMapsStore(state => state.isMapsLoaded);
  const baseMaps = useBaseMapsStore(state => state.baseMaps);
  const region = useRegionStore(state => state.region);
  const setActiveBaseMaps = useBaseMapsStore(state => state.setActiveBaseMaps);

  const [fromZoom, setFromZoom] = useState(10);
  const [mapSource, setMapSource] = useState("");
  const [toZoom, setToZoom] = useState(10);
  const [totalTileLength, setTotalTileLength] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const maxZoom = MapSource.find(source => Object.values(source.options).some(option => mapSource.includes(option)))?.limits.max || 20;

  const handleSourceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === '') {
      return;
    }

    const baseMap = baseMaps.find(baseMap => baseMap.tiles === event.target.value);
    if (baseMap) {
      setActiveBaseMaps(baseMap);
    }

    setMapSource(event.target.value)
  }, [baseMaps, setActiveBaseMaps])

  const previewHandler = useCallback(async () => {
    if (!map) return;
    removePreviewLayer(map);

    if (!region) {
      const modalConfirm = withReactContent(Swal)
      await modalConfirm.fire({
        title: 'No Region Selected',
        text: 'Please select region first',
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#DD6B20'
      });
      return
    }

    // map.querySourceFeatures returns features from all the tiles of the source.
    // In tiled map layers, features can appear in multiple tiles, leading to duplicates in the results.
    // so we get features from store not from map

    setTotalTileLength(0);
    setIsLoading(true);

    // get tile count
    let resultCount: number;
    try {
      resultCount = await countGrid(region, Math.max(fromZoom, toZoom))
    } catch (e: any) {
      setIsLoading(false)
      const modalError = withReactContent(Swal)
      return modalError.fire({
        title: 'Error Counting Tiles',
        text: e.message,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#DD6B20'
      });
    }

    setTotalTileLength(resultCount);

    if (resultCount > 30000) {
      const modalConfirm = withReactContent(Swal)
      const { isConfirmed } = await modalConfirm.fire({
        title: 'Large Data Detected',
        text: 'Load data possibly crashing tab browser, do you want to continue?',
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#DD6B20'
      })

      if (!isConfirmed) {
        setIsLoading(false)
        return false;
      }
    }

    // get tile preview
    let previewFC: FeatureCollection;
    try {
      previewFC = await previewGrid(region, Math.max(fromZoom, toZoom))
    } catch (e: any) {
      setIsLoading(false)
      const modalError = withReactContent(Swal)
      return modalError.fire({
        title: 'Error Preview Tiles',
        text: e.message,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#DD6B20'
      });
    }
    setIsLoading(false);
    addPreviewLayer(map, previewFC);
  }, [map, region, fromZoom, toZoom])


  return (
    <Skeleton
      isLoaded={isMapsLoaded && map !== undefined}
      rounded={'xl'}
      startColor={'gray.600'}
      endColor={'gray.700'}
    >
      <Box bg={'gray.700'} rounded={'xl'} p={4} w={'100%'}>
        <Text fontSize={'xl'} fontWeight={'bold'} mb={2}>2. Configure</Text>
        <VStack gap={4}>
          <FormControl>
            <FormLabel>Map Tile Source</FormLabel>
            <Select
              bg={'gray.700'}
              color={'white'}
              sx={{
                '> optgroup > option, > optgroup': {
                  background: 'gray.700',
                  color: 'white',
                },
              }}
              defaultValue={mapSource}
              onChange={handleSourceChange}
            >
              {MapSource.map(({ name, options }) => {
                return (
                  <optgroup label={name} key={`source-name-${name}`}>
                    {Object.entries(options).map(option => (
                      <option
                        key={`source-option-${option[0]}`}
                        value={option[1]}
                      >
                        {option[0]}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </Select>
          </FormControl>


          <HStack>
            <FormControl>
              <FormLabel>Zoom From</FormLabel>
              <NumberInput
                min={1}
                max={maxZoom}
                value={Number(fromZoom)}
                onChange={(valueString) => setFromZoom(Number(valueString))}
              >
                <NumberInputField/>
                <NumberInputStepper>
                  <NumberIncrementStepper color={'white'}/>
                  <NumberDecrementStepper color={'white'}/>
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Zoom To</FormLabel>
              <NumberInput
                min={1}
                max={maxZoom}
                value={Number(toZoom)}
                onChange={(valueString) => setToZoom(Number(valueString))}
              >
                <NumberInputField/>
                <NumberInputStepper>
                  <NumberIncrementStepper color={'white'}/>
                  <NumberDecrementStepper color={'white'}/>
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </HStack>
          <Text textAlign={'right'} w={'100%'}>Max Zoom : {maxZoom}</Text>

          {totalTileLength && (
            <Text fontWeight={'bold'}>Total Tiles: {totalTileLength.toLocaleString('id-ID')}</Text>
          )}

          <Button
            mt={2}
            colorScheme={'orange'}
            onClick={previewHandler}
            isLoading={isLoading}
            loadingText={'Processing'}
          >
            Preview Grid
          </Button>
        </VStack>
      </Box>
    </Skeleton>
  )
}