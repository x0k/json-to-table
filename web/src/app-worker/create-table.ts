import { blockToASCII } from "@/lib/block-to-ascii";
import { HTML_TABLE_STYLES, makeHTMLPageContent } from "@/lib/block-to-html";
import { makeWorkBook } from "@/lib/block-to-xlsx";
import { type Entry, transformValue } from "@/lib/entry";
import { createFileURL, createXLSBlob } from "@/lib/file";
import { escapeHtml, renderHTMLPage } from "@/lib/html";
import {
  type JSONPrimitiveOrNull,
  type JSONValue,
  isJsonPrimitiveOrNull,
} from "@/lib/json";
import { JSONParseStatus, jsonTryParse } from "@/lib/json-parser";
import { type Block, makeTableInPlaceBaker } from "@/lib/json-table";
import { makeTableFactory } from "@/lib/json-to-table";
import { max, sum } from "@/lib/math";

import {
  OutputFormat,
  type TransformConfig,
  extractTableFactoryOptions,
  makeTransformApplicator,
} from "./core";

function parseTableData(data: string): JSONValue {
  const dataParseResult = jsonTryParse<JSONValue>(data);
  return dataParseResult.status === JSONParseStatus.Ok
    ? dataParseResult.data
    : {
        Error: `An error occurred while trying to recognize the data:\n"${dataParseResult.error}"`,
      };
}

export async function createTable(
  data: string,
  transformConfig: TransformConfig
) {
  const options = extractTableFactoryOptions(transformConfig);
  const tableTransformer = makeTableFactory(options);
  const transformApplicator = makeTransformApplicator(transformConfig);
  const bakeTable = makeTableInPlaceBaker<JSONPrimitiveOrNull>({
    cornerCellValue: options.cornerCellValue,
    head: true,
    indexes: true,
  });
  const tableData = parseTableData(data);
  const pagesData: Entry<JSONValue>[] =
    isJsonPrimitiveOrNull(tableData) || !transformConfig.paginate
      ? [["Report", tableData] as Entry<JSONValue>]
      : Array.isArray(tableData)
      ? tableData.map((item, i) => [String(i + 1), item] as Entry<JSONValue>)
      : Object.keys(tableData).map(
          (key) => [key, tableData[key]] as Entry<JSONValue>
        );
  const pagesTables = pagesData
    .map(transformValue(tableTransformer))
    .map(transformValue(bakeTable))
    .map(transformValue(transformApplicator));
  switch (transformConfig.format) {
    case OutputFormat.HTML: {
      return renderHTMLPage(
        "Table",
        makeHTMLPageContent(pagesTables),
        HTML_TABLE_STYLES
      );
    }
    case OutputFormat.ASCII: {
      const renderTable = (t: Block) =>
        `<pre><code>${escapeHtml(
          blockToASCII(t, { format: transformConfig.asciiFormat })
        )}</code></pre>`;
      return renderHTMLPage(
        "Table",
        pagesTables.length > 1
          ? pagesTables
              .map(([title, table]) => `<h2>${title}</h2>${renderTable(table)}`)
              .join("<br />")
          : renderTable(pagesTables[0][1])
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
        .then(createFileURL);
    default:
      throw new Error(`Unexpected output format`);
  }
}
