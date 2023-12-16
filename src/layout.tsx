import { PropsWithChildren } from "react";
import { Heading, Stack } from "@chakra-ui/react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <Stack p={8} maxW="6xl" mx="auto" gap={4}>
      <Heading variant={"h1"} flexGrow={1}>
        JSON to Table
      </Heading>
      {children}
    </Stack>
  );
}
