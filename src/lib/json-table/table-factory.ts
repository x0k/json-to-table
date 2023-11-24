import {
  JSONArray,
  JSONRecord,
  JSONValue,
  isJsonPrimitiveOrNull,
} from "@/lib/json";
import { isNumber, isRecord } from "@/lib/guards";
import { array } from "@/lib/array";
import { lcm, max, sum } from "@/lib/math";

import {
  CellType,
  Row,
  Table,
  TableFactory,
  ViewType,
  getHeight,
  getWidth,
} from "./model";
import { makeOneCellTable } from "./one-cell-table";
import { makeRowStructureBuilder } from "./row";
import {
  makeIntervalsDeduplicator,
  makeLevelDeduplicator,
  makeSplitIntoColumnsByHeaders,
  makeTableHeadersDeduplicatorByIntervals,
  makeTableHeadersDeduplicatorByLevel,
} from "./deduplication";

export interface TableFactoryOptions {
  joinPrimitiveArrayValues?: boolean;
  /** combine arrays of objects into a single object */
  combineArraysOfObjects?: boolean;
  arrayViewType?: ViewType;
  recordViewType?: ViewType;
  omitHeaders?: boolean;
  collapseHeaders?: boolean;
  omitIndexes?: boolean;
  collapseIndexes?: boolean;
  deduplicateHeaders?: boolean;
  supportForHeadersGrouping?: boolean;
  /** proportional size adjustment threshold */
  proportionalSizeAdjustmentThreshold?: number;
}

function isIndexedTable(table: Table) {
  let p = 0;
  while (p < table.height) {
    if (table.rows[p][0].type !== CellType.Index) {
      return false;
    }
    p += table.rows[p][0].height;
  }
  return true;
}

function collapseCellIndex(rows: Row[], p: number, titles: string) {
  rows[p] = [
    {
      ...rows[p][0],
      value: `${titles}.${rows[p][0].value}`,
    },
    ...rows[p].slice(1),
  ];
  return rows[p][0].height;
}

export function makeTableFactory({
  joinPrimitiveArrayValues,
  combineArraysOfObjects,
  omitHeaders,
  collapseHeaders,
  omitIndexes,
  collapseIndexes,
  arrayViewType = ViewType.Indexes,
  recordViewType = ViewType.Headers,
  proportionalSizeAdjustmentThreshold = 1,
  deduplicateHeaders = true,
  supportForHeadersGrouping,
}: TableFactoryOptions): TableFactory {
  const buildRowStructure = makeRowStructureBuilder(!omitIndexes);
  const getDeduplicateLevel = makeLevelDeduplicator(buildRowStructure);
  const getDeduplicationIntervals =
    makeIntervalsDeduplicator(buildRowStructure);

  const splitIntoColumnsByHeaders = makeSplitIntoColumnsByHeaders(
    stackTablesHorizontally
  );
  const deduplicateTableHeadersByLevel = makeTableHeadersDeduplicatorByLevel(
    splitIntoColumnsByHeaders
  );
  const deduplicateTableHeadersByIntervals =
    makeTableHeadersDeduplicatorByIntervals(splitIntoColumnsByHeaders);

  function addIndex(table: Table, index: string) {
    if (!collapseIndexes || !isIndexedTable(table)) {
      return {
        height: table.height,
        width: table.width + 1,
        rows: [
          [
            {
              type: CellType.Index,
              height: table.height,
              width: 1,
              value: index,
            },
            ...table.rows[0],
          ],
          ...table.rows.slice(1),
        ],
      };
    }
    const newRows = table.rows.slice();
    let p = 0;
    while (p < table.height) {
      p += collapseCellIndex(newRows, p, index);
    }
    return { ...table, rows: newRows };
  }

  function addHeaders(
    { height, width, rows }: Table,
    titles: string[],
    originalTables: Table[]
  ) {
    const headersRow: Row = [];
    if (
      collapseHeaders &&
      rows[0].every((cell) => cell.type === CellType.Header)
    ) {
      for (let i = 0; i < originalTables.length; i++) {
        for (let j = 0; j < originalTables[i].rows[0].length; j++) {
          const cell = originalTables[i].rows[0][j];
          headersRow.push({
            ...cell,
            value: `${titles[i]}.${cell.value}`,
          });
        }
      }
      return {
        width,
        height,
        rows: [headersRow, ...rows.slice(1)],
      };
    }
    for (let i = 0; i < originalTables.length; i++) {
      headersRow.push({
        type: CellType.Header,
        width: originalTables[i].width,
        value: titles[i],
        height: 1,
      });
    }
    return {
      width,
      height: height + 1,
      rows: [headersRow, ...rows],
    };
  }
  function stackTablesHorizontally(tables: Table[]): Table {
    const width = tables.map(getWidth).reduce(sum);
    const heights = tables.map(getHeight);
    const lcmHeight = heights.reduce(lcm);
    const maxHeight = heights.reduce(max);
    const isProportionalResize =
      (lcmHeight - maxHeight) / maxHeight <=
      proportionalSizeAdjustmentThreshold;
    const height = isProportionalResize ? lcmHeight : maxHeight;
    const rows = array(height, (): Row => []);
    for (let i = 0; i < tables.length; i++) {
      const {
        rows: tableRows,
        width: tableWidth,
        height: tableHeight,
      } = tables[i];
      const multiplier = Math.floor(height / tableHeight);
      const plugHeight =
        isProportionalResize && height - tableHeight * multiplier;
      for (let j = 0; j < tableRows.length; j++) {
        const tableRow = tableRows[j];
        for (let k = 0; k < height; k++) {
          const row = rows[k];
          if (k === multiplier * j) {
            for (let l = 0; l < tableRow.length; l++) {
              const cell = tableRow[l];
              row.push({
                ...cell,
                height: cell.height * multiplier,
              });
            }
            continue;
          }
          if (j === 0 && height - k === plugHeight) {
            row.push({
              value: "",
              height: plugHeight,
              width: tableWidth,
              type: CellType.Plug,
            });
          }
        }
      }
    }
    return {
      width,
      height,
      rows,
    };
  }
  function makeTableWidthScaler(tables: Table[]) {
    const widths = tables.map(getWidth);
    const lcmWidth = widths.reduce(lcm);
    const maxWidth = widths.reduce(max);
    const isProportionalResize =
      (lcmWidth - maxWidth) / maxWidth <= proportionalSizeAdjustmentThreshold;
    const width = isProportionalResize ? lcmWidth : maxWidth;
    function scaleTableRows({
      rows: tableRows,
      width: tableWidth,
      height: tableHeight,
    }: Table) {
      const rows: Row[] = [];
      const multiplier = Math.floor(width / tableWidth);
      const plugWidth =
        !isProportionalResize && width - tableWidth * multiplier;
      for (let j = 0; j < tableRows.length; j++) {
        const newRow: Row = [];
        const tableRow = tableRows[j];
        for (let k = 0; k < tableRow.length; k++) {
          const cell = tableRow[k];
          newRow.push({
            ...cell,
            width: cell.width * multiplier,
          });
        }
        if (plugWidth && j === 0) {
          newRow.push({
            value: "",
            height: tableHeight,
            width: plugWidth,
            type: CellType.Plug,
          });
        }
        rows.push(newRow);
      }
      return rows;
    }
    return {
      scaleTableRows,
      isProportionalResize,
      width,
    };
  }
  function stackTablesVertically(tables: Table[]): Table {
    const { scaleTableRows, isProportionalResize, width } =
      makeTableWidthScaler(tables);
    const deduplicateLevel =
      isProportionalResize &&
      !omitHeaders &&
      deduplicateHeaders &&
      tables.length > 1 &&
      (supportForHeadersGrouping
        ? getDeduplicationIntervals
        : getDeduplicateLevel)(tables, width);
    const finalTables = deduplicateLevel
      ? isNumber(deduplicateLevel)
        ? deduplicateTableHeadersByLevel(tables, deduplicateLevel)
        : deduplicateTableHeadersByIntervals(tables, deduplicateLevel)
      : tables;
    const height = finalTables.map(getHeight).reduce(sum);
    const rows = finalTables.flatMap(scaleTableRows);
    return {
      width,
      height,
      rows,
    };
  }
  function mergeTables(
    viewType: ViewType,
    titles: string[],
    tables: Table[]
  ): Table {
    switch (viewType) {
      case ViewType.Indexes: {
        if (omitIndexes) {
          return stackTablesVertically(tables);
        }
        const { scaleTableRows, width } = makeTableWidthScaler(tables);
        return stackTablesVertically(
          tables.map(scaleTableRows).map((rows, i) =>
            addIndex(
              {
                width,
                rows,
                height: rows.length,
              },
              titles[i]
            )
          )
        );
      }
      case ViewType.Headers: {
        const stacked = stackTablesHorizontally(tables);
        return omitHeaders ? stacked : addHeaders(stacked, titles, tables);
      }
      default:
        throw new Error(`Unknown view type: ${viewType}`);
    }
  }
  function transformArray(value: JSONArray): Table {
    const titles = array(value.length, (i) => String(i + 1));
    const tables = value.map(transformValue);
    return mergeTables(arrayViewType, titles, tables);
  }
  function transformRecord(value: JSONRecord): Table {
    const titles = Object.keys(value);
    const tables = titles.map((key) => transformValue(value[key]));
    return mergeTables(recordViewType, titles, tables);
  }
  function transformValue(value: JSONValue): Table {
    if (isJsonPrimitiveOrNull(value)) {
      return makeOneCellTable(value);
    }
    if (Object.keys(value).length === 0) {
      return makeOneCellTable("");
    }
    const isArray = Array.isArray(value);
    if (isArray && joinPrimitiveArrayValues) {
      return makeOneCellTable(value.join(", "));
    }
    if (isArray && combineArraysOfObjects && value.every(isRecord)) {
      // Can be an empty object
      return transformValue(Object.assign({}, ...value));
    }
    if (isArray) {
      return transformArray(value);
    }
    return transformRecord(value);
  }
  return transformValue;
}
