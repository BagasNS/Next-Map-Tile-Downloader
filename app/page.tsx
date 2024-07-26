import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Metadata } from "next";
import Loading from "@/app/loading";
import dynamic from "next/dynamic";
import SidebarContainer from "@/app/components/SidebarContainer";

export const metadata: Metadata = {
  title: 'Map Tiles Downloader',
  description: 'Map Tiles Downloader'
}

const MapContainer = dynamic(() => import('@/app/components/MapContainer'), {
  ssr: false,
  loading: () => <Loading/>
});

export default function Page() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <LayoutIndicator/>
      )}

      <Flex
        h={'100vh'}
        w={'100vw'}
        bg={'gray.800'}
        color={'white'}
      >
        <Flex
          flex={0.8}
          bg={'gray.700'}
          borderRightRadius={'xl'}
          overflowY={'hidden'}
        >
          <MapContainer/>
        </Flex>
        <Flex
          flex={0.2}
          py={4}
          px={2}
          flexDirection={'column'}
        >
          <Heading w={'100%'} textAlign={'center'} size={{ base: 'sm', xl: 'lg' }} mb={4}>
            Map Tiles Downloader
          </Heading>

          <Stack spacing={4}>
            <SidebarContainer/>
          </Stack>
        </Flex>
      </Flex>
    </>
  )
}

function LayoutIndicator() {
  return (
    <Box
      position="fixed"
      top={10}
      left={10}
      color="white"
      bg="gray.700"
      borderRadius="xl"
      p={2}
    >
      <Text color={'gray.50'} display={{ base: 'block', sm: 'none' }}>XS</Text>
      <Text color={'gray.50'} display={{ base: 'none', sm: 'block', md: 'none' }}>SM</Text>
      <Text color={'gray.50'} display={{ base: 'none', md: 'block', lg: 'none' }}>MD</Text>
      <Text color={'gray.50'} display={{ base: 'none', lg: 'block', xl: 'none' }}>LG</Text>
      <Text color={'gray.50'} display={{ base: 'none', xl: 'block', '2xl': 'none' }}>XL</Text>
      <Text color={'gray.50'} display={{ base: 'none', '2xl': 'block' }}>2XL</Text>
    </Box>
  )
}
