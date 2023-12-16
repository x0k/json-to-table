import { Button, Stack, useToast } from "@chakra-ui/react";

import { makeDownloadFileByUrl } from "@/lib/file";

import { Layout } from "./layout";

export interface DownloadPageProps {
  title: string;
  content: Promise<string>;
}

export function DownloadTablePage({ title, content }: DownloadPageProps) {
  const toast = useToast();
  return (
    <Layout>
      <Stack gap={2}>
        <Button
          colorScheme="teal"
          onClick={() => {
            content
              .then((table) => makeDownloadFileByUrl(title)(table))
              .catch((e) => {
                toast({
                  title: "Error",
                  description: String(e),
                  status: "error",
                });
              });
          }}
        >
          Download table
        </Button>
        <Button
          onClick={() => {
            const searchParams = new URLSearchParams(location.search);
            searchParams.set("createOnOpen", "false");
            location.search = searchParams.toString();
          }}
        >
          Create another table
        </Button>
      </Stack>
    </Layout>
  );
}
