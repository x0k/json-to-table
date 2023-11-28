import React, { useCallback, useState } from "react";
import { Stack, Textarea, Button, Heading } from "@chakra-ui/react";
import { Form } from "@rjsf/chakra-ui";
import validator from "@rjsf/validator-ajv8";

import { Block, makeTableBaker } from "@/lib/json-table";
import {
  isJsonPrimitiveOrNull,
  JSONPrimitiveOrNull,
  JSONValue,
} from "@/lib/json";
import { JSONParseStatus, jsonTryParse } from "@/lib/json-parser";
import { Entry, transformValue } from "@/lib/entry";
import { createPage } from "@/lib/browser";
import { escapeHtml, renderHTMLPage } from "@/lib/html";
import { makeHTMLPageContent, HTML_TABLE_STYLES } from "@/lib/block-to-html";
import { makeWorkBook } from "@/lib/block-to-xlsx";
import { max, sum } from "@/lib/math";
import {
  createFileURL,
  createXLSBlob,
  makeDownloadFileByUrl,
} from "@/lib/file";
import { blockToASCII } from "@/lib/block-to-ascii";
import { makeTableFactory } from "@/lib/json-to-table";

import {
  extractTableFactoryOptions,
  TransformConfig,
  TRANSFORMED_UI_SCHEMA,
  OutputFormat,
  TransformPreset,
  TRANSFORM_SCHEMA,
  makeTransformApplicator,
} from "./core";

function useChangeHandler(handler: (value: string) => void) {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handler(e.target.value),
    [handler]
  );
}

function makeTableData(data: string): JSONValue {
  const dataParseResult = jsonTryParse<JSONValue>(data);
  return dataParseResult.status === JSONParseStatus.Ok
    ? dataParseResult.data
    : {
        Error: `An error occurred while trying to recognize the data:\n"${dataParseResult.error}"`,
      };
}

export function App() {
  const [data, setData] = useState("");
  const [transformData, setTransformData] = useState<TransformConfig>({
    preset: TransformPreset.Optimal,
    transform: false,
    format: OutputFormat.HTML,
    paginate: false,
  });
  const handleDataChange = useChangeHandler(setData);
  return (
    <Stack p={8} maxW="6xl" mx="auto" gap={4}>
      <Heading>JSON to Table</Heading>
      <Textarea autoFocus value={data} onChange={handleDataChange} rows={10} />
      <Form
        validator={validator}
        schema={TRANSFORM_SCHEMA}
        uiSchema={TRANSFORMED_UI_SCHEMA}
        showErrorList={false}
        formData={transformData}
        onChange={({ formData }) => setTransformData(formData)}
        onSubmit={({ formData }) => {
          const options = extractTableFactoryOptions(formData);
          const tableTransformer = makeTableFactory(options);
          const transformApplicator = makeTransformApplicator(formData);
          const bake = makeTableBaker<JSONPrimitiveOrNull>({
            cornerCellValue: options.cornerCellValue,
            bakeHead: true,
            bakeIndexes: true,
          });
          const tableData = makeTableData(data);
          const pagesData: Entry<JSONValue>[] =
            isJsonPrimitiveOrNull(tableData) || !formData.paginate
              ? [["Report", tableData] as Entry<JSONValue>]
              : Array.isArray(tableData)
              ? tableData.map(
                  (item, i) => [String(i + 1), item] as Entry<JSONValue>
                )
              : Object.keys(tableData).map(
                  (key) => [key, tableData[key]] as Entry<JSONValue>
                );
          const pagesTables = pagesData
            .map(transformValue(tableTransformer))
            .map(transformValue(bake))
            .map(transformValue(transformApplicator));
          switch (formData.format as OutputFormat) {
            case OutputFormat.HTML: {
              return createPage(
                renderHTMLPage(
                  "Table",
                  makeHTMLPageContent(pagesTables),
                  HTML_TABLE_STYLES
                )
              );
            }
            case OutputFormat.ASCII: {
              const renderTable = (t: Block) =>
                `<pre><code>${escapeHtml(blockToASCII(t))}</code></pre>`;
              return createPage(
                renderHTMLPage(
                  "Table",
                  pagesTables.length > 1
                    ? pagesTables
                        .map(
                          ([title, table]) =>
                            `<h2>${title}</h2>${renderTable(table)}`
                        )
                        .join("<br />")
                    : renderTable(pagesTables[0][1])
                )
              );
            }
            case OutputFormat.XLSX:
              return makeWorkBook(pagesTables, {
                columnWidth: (column, i, m, table) => {
                  const counts = column.map((cell) => cell.count);
                  return Math.max(
                    Math.ceil(
                      (counts.reduce(sum) / table.height +
                        (counts.reduce(max) * column.length) / table.height) /
                        2
                    ),
                    10
                  );
                },
              })
                .xlsx.writeBuffer()
                .then(createXLSBlob)
                .then(createFileURL)
                .then(makeDownloadFileByUrl("table.xlsx"));
            default:
              throw new Error(`Unexpected output format`);
          }
        }}
      >
        <Button w="100%" type="submit" colorScheme="teal">
          Create Table
        </Button>
      </Form>
    </Stack>
  );
}
