import React, { useCallback, useState } from "react";
import { Stack, Textarea, Button, Heading } from "@chakra-ui/react";
import { Form } from "@rjsf/chakra-ui";
import validator from "@rjsf/validator-ajv8";

import { makeTableTransformer, Table } from "@/lib/json-table";
import { isJsonPrimitiveOrNull, JSONValue } from "@/lib/json";
import { JSONParseStatus, jsonTryParse } from "@/lib/json-parser";
import { Entry, transformValue } from "@/lib/entry";
import { createPage, renderPage } from "@/lib/browser";
import { makeHTMLPageContent, HTML_TABLE_STYLES } from "@/lib/json-table-html";
import { makeWorkBook } from "@/lib/json-table-xlsx";
import { max, sum } from "@/lib/math";
import {
  createFileURL,
  createXLSBlob,
  makeDownloadFileByUrl,
} from "@/lib/file";
import { toASCIITable } from "@/lib/json-table-ascii/to-ascii-table";

import {
  resolvePreset,
  TransformConfig,
  TRANSFORMED_UI_SCHEMA,
  TransformFormat,
  TransformPreset,
  TRANSFORM_SCHEMA,
} from "./model";

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
          const tableTransformer = makeTableTransformer(
            resolvePreset(formData)
          );
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
          const pagesTables = pagesData.map(transformValue(tableTransformer));
          switch (formData.format as TransformFormat) {
            case TransformFormat.HTML: {
              return createPage(
                renderPage(
                  "Table",
                  makeHTMLPageContent(pagesTables),
                  HTML_TABLE_STYLES
                )
              );
            }
            case TransformFormat.ASCII: {
              const renderTable = (t: Table) =>
                `<pre><code>${toASCIITable(t)}</code></pre>`;
              return createPage(
                renderPage(
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
            case TransformFormat.XLSX:
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
              throw new Error(`Unexpected transform format`);
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
