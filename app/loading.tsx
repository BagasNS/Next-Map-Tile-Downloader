import { Flex, Spinner } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Flex
      flex={1}
      bg={'gray.700'}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <Spinner
        size={'lg'}
        thickness={'6px'}
        speed={'0.65s'}
        emptyColor={'gray.200'}
        color={'blue.500'}
      />
    </Flex>
  )
}