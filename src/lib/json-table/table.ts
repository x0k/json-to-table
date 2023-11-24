import { array } from "@/lib/array";
import {
  horizontalMirror,
  transpose,
  verticalMirror,
} from "@/lib/matrix";
import { isNumber, isRecord, isArray } from "@/lib/guards";
import {
  isJsonPrimitiveOrNull,
  JSONArray,
  JSONRecord,
  JSONValue,
} from "@/lib/json";
import { lcm, max, sum } from "@/lib/math";

import {
  CellType,
  getHeight,
  getWidth,
  MergeTablesOptions,
  Row,
  SidesResizeLimits,
  Table,
  TableFactory,
  TransformOptions,
  ViewType,
} from "./model";
import {
  makeIntervalsDeduplicator,
  makeLevelDeduplicator,
  makeTableHeadersDeduplicatorByIntervals,
  makeTableHeadersDeduplicatorByLevel,
  makeSplitIntoColumnsByHeaders,
} from "./deduplication";
import { makeHeadersSetter, makeIndexesSetter } from "./titles";
import { makeRowStructureBuilder } from "./row";
import { makeCell } from "./cell";
import { createMatrix, fromMatrix } from "./matrix";

export function makeTableTransformer({
  arrayViewType,
  collapseHeaders,
  collapseIndexes,
  concatPrimitiveValues,
  mergeRecordValues,
  headers,
  indexes,
  proportionalResizeLimit,
  recordViewType,
  sortHeaders,
  deduplicateHeaders,
  supportForHeadersGrouping,
  horizontalReflect,
  verticalReflect,
  transpose: useTranspose,
}: TransformOptions): TableFactory {
  const { forHeight, forWidth }: SidesResizeLimits =
    typeof proportionalResizeLimit === "object"
      ? proportionalResizeLimit
      : {
          forWidth: proportionalResizeLimit,
          forHeight: proportionalResizeLimit,
        };
  const proportionalResizeLimitPercentForWidth = forWidth / 100;
  const proportionalResizeLimitPercentForHeight = forHeight / 100;

  const buildRowStructure = makeRowStructureBuilder(indexes);
  const addHeaders = makeHeadersSetter(collapseHeaders);
  const addIndexes = makeIndexesSetter(collapseIndexes);

  const getDeduplicateLevel = makeLevelDeduplicator(buildRowStructure);
  const getDeduplicationIntervals =
    makeIntervalsDeduplicator(buildRowStructure);

  const splitIntoColumnsByHeaders = makeSplitIntoColumnsByHeaders(makeColumns);
  const deduplicateTableHeadersByLevel = makeTableHeadersDeduplicatorByLevel(
    splitIntoColumnsByHeaders
  );
  const deduplicateTableHeadersByIntervals =
    makeTableHeadersDeduplicatorByIntervals(splitIntoColumnsByHeaders);

  function makeRows(tables: Table[]): Table {
    const widths = tables.map(getWidth);
    const lcmWidth = widths.reduce(lcm);
    const maxWidth = widths.reduce(max);
    const isProportionalResize =
      (lcmWidth - maxWidth) / maxWidth <=
      proportionalResizeLimitPercentForWidth;
    const width = isProportionalResize ? lcmWidth : maxWidth;
    const deduplicateLevel =
      isProportionalResize &&
      headers &&
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
    return {
      height,
      width,
      rows: finalTables.flatMap(
        ({ rows, height: tableHeight, width: tableWidth }) => {
          const multiplier = Math.floor(width / tableWidth);
          const plugWidth =
            !isProportionalResize && width - tableWidth * multiplier;
          return rows.map(
            (row, j): Row => [
              ...row.map((cell) => ({
                ...cell,
                width: cell.width * multiplier,
              })),
              ...(plugWidth && j === 0
                ? [
                    {
                      value: "",
                      height: tableHeight,
                      type: CellType.Plug,
                      width: plugWidth,
                    },
                  ]
                : []),
            ]
          );
        }
      ),
    };
  }

  function makeColumns(tables: Table[]): Table {
    const width = tables.map(getWidth).reduce(sum);
    const heights = tables.map(getHeight);
    const lcmHeight = heights.reduce(lcm);
    const maxHeight = heights.reduce(max);
    const isProportionalResize =
      (lcmHeight - maxHeight) / maxHeight <=
      proportionalResizeLimitPercentForHeight;
    const height = isProportionalResize ? lcmHeight : maxHeight;
    return {
      width,
      height,
      rows: tables.reduce(
        (generatedRows, { rows, width: tableWidth, height: tableHeight }) => {
          const multiplier = Math.floor(height / tableHeight);
          const plugHeight =
            !isProportionalResize && height - tableHeight * multiplier;
          return rows.reduce(
            (acc, originalRow, i) =>
              acc.map((generatedRow, j) =>
                j === multiplier * i
                  ? generatedRow.concat(
                      originalRow.map((cell) => ({
                        ...cell,
                        height: cell.height * multiplier,
                      }))
                    )
                  : i === 0 && height - j === plugHeight
                  ? generatedRow.concat({
                      value: "",
                      height: plugHeight,
                      width: tableWidth,
                      type: CellType.Plug,
                    })
                  : generatedRow
              ),
            generatedRows
          );
        },
        array(height, (): Row => [])
      ),
    };
  }

  function mergeTables({ titles, tables, viewType }: MergeTablesOptions) {
    return viewType === ViewType.Rows
      ? makeRows(indexes ? addIndexes(titles, tables) : tables)
      : headers
      ? addHeaders(makeColumns(tables), titles, tables)
      : makeColumns(tables);
  }

  function transformArrayData(value: JSONArray): MergeTablesOptions {
    const titles = array(value.length, (i) => String(i + 1));
    const tables = value.map(transformData);
    return { titles, tables, viewType: arrayViewType };
  }

  function transformRecordData(value: JSONRecord): MergeTablesOptions {
    const keys = Object.keys(value);
    const titles = sortHeaders ? keys.sort() : keys;
    const tables = titles.map((key) => transformData(value[key]));
    return { titles, tables, viewType: recordViewType };
  }

  function transformData(value: JSONValue): Table {
    const isArr = isArray(value);
    return isJsonPrimitiveOrNull(value)
      ? makeCell(value)
      : Object.keys(value).length === 0
      ? makeCell("")
      : isArr && concatPrimitiveValues && value.every(isJsonPrimitiveOrNull)
      ? makeCell(value.join(", "))
      : mergeTables(
          isArr &&
            mergeRecordValues &&
            value.every(isRecord) &&
            !value.some(isArray)
            ? transformRecordData(Object.assign({}, ...value))
            : (isArr ? transformArrayData : transformRecordData)(
                value as JSONArray & JSONRecord
              )
        );
  }

  return (value: JSONValue): Table => {
    const table = transformData(value);
    if (useTranspose || horizontalReflect || verticalReflect) {
      let matrix = createMatrix(table, ({ type, value }) => ({ type, value }));
      if (horizontalReflect) {
        matrix = horizontalMirror(matrix);
      }
      if (verticalReflect) {
        matrix = verticalMirror(matrix);
      }
      if (useTranspose) {
        matrix = transpose(matrix);
      }
      return fromMatrix(
        matrix,
        ({ type }) => type,
        ({ value }) => value
      );
    }
    return table;
  };
}
