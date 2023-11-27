import {
  JSONArray,
  JSONPrimitiveOrNull,
  JSONRecord,
  JSONValue,
  isJsonPrimitiveOrNull,
} from "@/lib/json";
import {
  Table,
  Row,
  makeTableFromValue,
  getWidth,
  getHeight,
  makeProportionalResizeGuard,
  makeVerticalBlockStacker,
  makeVerticalTableStacker,
  ComposedTable,
  CellType,
  rebaseColumns,
} from "@/lib/table";
import { isRecord } from "@/lib/guards";
import { array } from "@/lib/array";
import { lcm, max, sum } from "@/lib/math";

export interface TableFactoryOptions<V> {
  joinPrimitiveArrayValues?: boolean;
  /** combine arrays of objects into a single object */
  combineArraysOfObjects?: boolean;
  /** proportional size adjustment threshold */
  proportionalSizeAdjustmentThreshold?: number;
  cornerCellValue: V;
}

export function makeTableFactory({
  combineArraysOfObjects,
  joinPrimitiveArrayValues,
  proportionalSizeAdjustmentThreshold = 1,
  cornerCellValue,
}: TableFactoryOptions<JSONPrimitiveOrNull>) {
  const isProportionalResize = makeProportionalResizeGuard(
    proportionalSizeAdjustmentThreshold
  );
  const verticalBlockStacker =
    makeVerticalBlockStacker<JSONPrimitiveOrNull>(isProportionalResize);
  const verticalTableStacker = makeVerticalTableStacker({
    verticalBlockStacker,
    isProportionalResize,
    cornerCellValue,
  });

  function addIndexes(
    { baked, body, head, indexes }: ComposedTable,
    titles: string[]
  ): Table {
    const hasIndexes = indexes !== null;
    const indexesRows = hasIndexes
      ? indexes.rows.slice()
      : array(body.height, () => ({
          cells: [],
          columns: [],
        }));
    let h = 0;
    for (let i = 0; i < baked.length; i++) {
      const height = baked[i].height;
      indexesRows[h] = {
        cells: [
          {
            height,
            width: 1,
            value: titles[i],
            type: CellType.Index,
          },
        ],
        columns: [0, ...rebaseColumns(indexesRows[h].columns, 1)],
      };
      if (hasIndexes) {
        for (let j = 1; j < height; j++) {
          const hj = h + j;
          indexesRows[hj] = {
            cells: indexesRows[hj].cells,
            columns: rebaseColumns(indexesRows[hj].columns, 1),
          };
        }
      }
      h += height;
    }
    return {
      head,
      body,
      indexes: {
        rows: indexesRows,
        width: hasIndexes ? indexes.width + 1 : 1,
        height: h,
      },
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
    const stacked = verticalTableStacker(tables);
    return addIndexes(stacked, titles);
  }
  function transformRecord(value: JSONRecord): Table {
    const titles = Object.keys(value);
    const tables = titles.map((key) => transformValue(value[key]));
    const stacked = stackTablesHorizontally(tables);
    return addHeaders(stacked, titles);
  }
  function transformValue(value: JSONValue): Table {
    if (isJsonPrimitiveOrNull(value)) {
      return makeTableFromValue(value);
    }
    if (Object.keys(value).length === 0) {
      return makeTableFromValue("");
    }
    const isArray = Array.isArray(value);
    if (isArray && joinPrimitiveArrayValues) {
      return makeTableFromValue(value.join(", "));
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
