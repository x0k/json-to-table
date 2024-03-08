import React, { useCallback, useRef, useState } from "react";
import {
  Stack,
  Textarea,
  Button,
  Link,
  useToast,
  RadioGroup,
  Radio,
  Input,
  Text,
} from "@chakra-ui/react";
import Form from "@rjsf/core";
import { Form as ChakraForm } from "@rjsf/chakra-ui";
import validator from "@rjsf/validator-ajv8";
import { fileOpen } from "browser-fs-access";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { makeDownloadFileByUrl } from "@/lib/file";
import { createPage } from "@/lib/browser";
import { isValidUrl } from "@/lib/url";

import {
  Source,
  SourceType,
  TRANSFORMED_UI_SCHEMA,
  TRANSFORM_SCHEMA,
  fetchAsText,
  makeSource,
  resolveSource,
} from "./core";
import { Layout } from "./layout";
import { TransformConfig, OutputFormat } from "./app-worker";
import { appWorker, compressor } from "./init";

async function sample(name: string, setData: (source: Source) => void) {
  const data = await fetchAsText(`${name}.json`);
  setData({ type: SourceType.Text, data });
}

const stringifyData = (data: string) => data && compressor.compress(data);
const stringifyOptions = (options: TransformConfig) =>
  compressor.compress(JSON.stringify(options));

export interface AppProps {
  initialData: string;
  initialOptions: TransformConfig;
}

export function App({ initialData, initialOptions }: AppProps) {
  const [source, setSource] = useState<Source>(() => ({
    type: isValidUrl(initialData) ? SourceType.URL : SourceType.Text,
    data: initialData,
  }));
  const [transformData, setTransformData] = useState(initialOptions);
  const handleSourceTypeChange = useCallback(
    (value: string) => setSource(makeSource(value as SourceType)),
    [setSource]
  );
  const handleSourceDataChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSource((s) => ({ ...s, data: e.target.value })),
    [setSource]
  );
  const toast = useToast({ isClosable: true });
  const formRef = useRef<Form>(null);
  return (
    <Layout>
      <RadioGroup onChange={handleSourceTypeChange} value={source.type}>
        <Stack direction="row" gap={2} alignItems="center">
          <Text>Source type:</Text>
          <Radio value={SourceType.Text}>Text</Radio>
          <Radio value={SourceType.File}>File</Radio>
          <Radio value={SourceType.URL}>Url</Radio>
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
              }&data=${stringifyData(source.data)}&options=${stringifyOptions(
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
            Share your table
          </Button>
        </Stack>
      </RadioGroup>
      {source.type === SourceType.Text && (
        <>
          <Textarea
            placeholder="Paste JSON here"
            autoFocus
            value={source.data}
            onChange={handleSourceDataChange}
            rows={20}
          />
          <Stack direction="row" gap={2} alignItems="center">
            <Text>Examples:</Text>
            <Button onClick={() => sample("test", setSource)}>Basic</Button>
            <Button onClick={() => sample("deduplication", setSource)}>
              Deduplication
            </Button>
            <Button onClick={() => sample("company", setSource)}>
              Company
            </Button>
            <Button onClick={() => sample("large", setSource)}>Large</Button>
          </Stack>
        </>
      )}
      {source.type === SourceType.File && (
        <Button
          onClick={async () => {
            const file = await fileOpen();
            const data = await file.text();
            setSource({ type: SourceType.File, data, fileName: file.name });
          }}
        >
          {source.data ? source.fileName : "Select File"}
        </Button>
      )}
      {source.type === SourceType.URL && (
        <Input
          placeholder="File URL"
          value={source.data}
          onChange={handleSourceDataChange}
        />
      )}
      <Button
        onClick={() => {
          formRef.current?.submit();
        }}
        w="100%"
        type="submit"
        colorScheme="teal"
      >
        Create Table
      </Button>
      <ChakraForm
        ref={formRef}
        validator={validator}
        schema={TRANSFORM_SCHEMA}
        uiSchema={TRANSFORMED_UI_SCHEMA}
        showErrorList={false}
        formData={transformData}
        onChange={({ formData }) => setTransformData(formData)}
        onSubmit={({ formData }) =>
          resolveSource(source)
            .then((data) => appWorker.createTable(data, formData))
            .then((content) => {
              switch (formData.format) {
                case OutputFormat.XLSX:
                  makeDownloadFileByUrl("table.xlsx")(content);
                  return;
                default:
                  createPage(content);
              }
            })
            .catch((e) => {
              toast({
                title: "Error",
                description: e,
                status: "error",
              });
            })
        }
      >
        <span />
      </ChakraForm>
    </Layout>
  );
}
