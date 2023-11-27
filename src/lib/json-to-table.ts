import {
  JSONArray,
  JSONRecord,
  JSONValue,
  isJsonPrimitiveOrNull,
} from "@/lib/json";
import { Table, Row, Block, makeTable, getWidth, getHeight } from "@/lib/table";
import { isRecord } from "@/lib/guards";
import { array } from "@/lib/array";
import { lcm, max, sum } from "@/lib/math";

export interface TableFactoryOptions {
  joinPrimitiveArrayValues?: boolean;
  /** combine arrays of objects into a single object */
  combineArraysOfObjects?: boolean;
  /** proportional size adjustment threshold */
  proportionalSizeAdjustmentThreshold?: number;
}

export function makeTableFactory({
  combineArraysOfObjects,
  joinPrimitiveArrayValues,
  proportionalSizeAdjustmentThreshold = 1,
}: TableFactoryOptions) {
  function stackTablesVertically(tables: Table[]): Table {
    const widths = tables.map(getWidth);
    const lcmWidth = widths.reduce(lcm);
    const maxWidth = widths.reduce(max);
    const isProportionalResize =
      (lcmWidth - maxWidth) / maxWidth <= proportionalSizeAdjustmentThreshold;
    const width = isProportionalResize ? lcmWidth : maxWidth;
    const height = finalTables.map(getHeight).reduce(sum);
    const rows: Row[] = [];
    for (let i = 0; i < finalTables.length; i++) {
      const {
        rows: tableRows,
        width: tableWidth,
        height: tableHeight,
      } = finalTables[i];
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
    }
    return {
      width,
      height,
      rows,
      tables: finalTables,
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
      tables,
    };
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
      return makeTable(value);
    }
    if (Object.keys(value).length === 0) {
      return makeTable("");
    }
    const isArray = Array.isArray(value);
    if (isArray && joinPrimitiveArrayValues) {
      return makeTable(value.join(", "));
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
