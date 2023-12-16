import React, { useCallback, useState } from "react";
import {
  Stack,
  Textarea,
  Button,
  Link,
  useToast,
} from "@chakra-ui/react";
import { Form } from "@rjsf/chakra-ui";
import validator from "@rjsf/validator-ajv8";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { makeDownloadFileByUrl } from "@/lib/file";
import { createPage } from "@/lib/browser";

import {
  TransformConfig,
  TRANSFORMED_UI_SCHEMA,
  TRANSFORM_SCHEMA,
  OutputFormat,
} from "./core";
import { compressor } from "./init";
import { createTable } from "./create-table";
import { Layout } from "./layout";

function useChangeHandler(handler: (value: string) => void) {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handler(e.target.value),
    [handler]
  );
}

function sample(name: string, setData: (data: string) => void) {
  return fetch(`${name}.json`)
    .then((r) => r.text())
    .then(setData);
}

const stringifyData = (data: string) => data && compressor.compress(data);
const stringifyOptions = (options: TransformConfig) =>
  compressor.compress(JSON.stringify(options))

export interface AppProps {
  initialData: string;
  initialOptions: TransformConfig;
}

export function App({ initialData, initialOptions }: AppProps) {
  const [data, setData] = useState(initialData);
  const [transformData, setTransformData] = useState(initialOptions);
  const handleDataChange = useChangeHandler(setData);
  const toast = useToast({ isClosable: true });
  return (
    <Layout>
      <Stack direction="row" gap={2} alignItems="center">
        <Button onClick={() => sample("test", setData)}>Test</Button>
        <Button onClick={() => sample("deduplication", setData)}>
          Deduplication
        </Button>
        <Button onClick={() => sample("company", setData)}>Company</Button>
        <Button onClick={() => sample("large", setData)}>Large</Button>
        <Button
          ml="auto"
          variant="outline"
          colorScheme="teal"
          as={Link}
          href="https://github.com/x0k/json-to-table"
          target="_blank"
        >
          GitHub
        </Button>
        <Button
          colorScheme="teal"
          onClick={async () => {
            const url = `${window.location.href}?createOnOpen=${
              transformData.createOnOpen
            }&data=${stringifyData(data)}&options=${stringifyOptions(
              transformData
            )}`;
            copyTextToClipboard(url)
              .then(() => {
                if (url.length > 2000) {
                  toast({
                    title: "URL is too long",
                    description:
                      "URL is copied to clipboard, but it's too long for a browsers",
                    status: "warning",
                  });
                } else {
                  toast({
                    title: "URL copied to clipboard",
                    status: "success",
                  });
                }
              })
              .catch((err): void => {
                toast({
                  title: "Failed to copy URL to clipboard",
                  status: "error",
                  description: String(err),
                });
              });
          }}
        >
          Share
        </Button>
      </Stack>
      <Textarea
        placeholder="Paste JSON here"
        autoFocus
        value={data}
        onChange={handleDataChange}
        rows={10}
      />
      <Form
        validator={validator}
        schema={TRANSFORM_SCHEMA}
        uiSchema={TRANSFORMED_UI_SCHEMA}
        showErrorList={false}
        formData={transformData}
        onChange={({ formData }) => setTransformData(formData)}
        onSubmit={({ formData }) =>
          createTable(data, formData).then((content) => {
            switch (formData.format) {
              case OutputFormat.XLSX:
                makeDownloadFileByUrl("table.xlsx")(content);
                return;
              default:
                createPage(content);
            }
          })
        }
      >
        <Button w="100%" type="submit" colorScheme="teal">
          Create Table
        </Button>
      </Form>
    </Layout>
  );
}
