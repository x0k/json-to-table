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
  makeProportionalResizeGuard,
  ComposedTable,
  CellType,
  rebaseColumns,
  makeTableStacker,
} from "@/lib/json-table";
import { isRecord } from "@/lib/guards";
import { array } from "@/lib/array";

export interface TableFactoryOptions<V> {
  joinPrimitiveArrayValues?: boolean;
  /** combine arrays of objects into a single object */
  combineArraysOfObjects?: boolean;
  /** proportional size adjustment threshold */
  proportionalSizeAdjustmentThreshold?: number;
  collapseIndexes?: boolean;
  cornerCellValue: V;
  stabilizeOrderOfPropertiesInArraysOfObjects?: boolean;
}

export function makeTableFactory({
  combineArraysOfObjects,
  joinPrimitiveArrayValues,
  proportionalSizeAdjustmentThreshold = 1,
  stabilizeOrderOfPropertiesInArraysOfObjects = true,
  cornerCellValue,
  collapseIndexes,
}: TableFactoryOptions<JSONPrimitiveOrNull>) {
  const isProportionalResize = makeProportionalResizeGuard(
    proportionalSizeAdjustmentThreshold
  );
  const verticalTableStacker = makeTableStacker({
    deduplicationComponent: "head",
    isProportionalResize,
    cornerCellValue,
  });
  const horizontalTableStacker = makeTableStacker({
    deduplicationComponent: "indexes",
    isProportionalResize,
    cornerCellValue,
  });

  function addIndexes(
    { baked, body, head, indexes }: ComposedTable,
    titles: string[]
  ): Table {
    const hasIndexes = indexes !== null;
    const collapse = hasIndexes && collapseIndexes;
    const indexesRows = hasIndexes
      ? indexes.rows.slice()
      : array(body.height, () => ({
          cells: [],
          columns: [],
        }));
    let h = 0;
    for (let i = 0; i < baked.length; i++) {
      const height = baked[i].height;
      if (collapse) {
        let y = 0;
        while (y < height) {
          const hy = h + y;
          const cells = indexesRows[hy].cells;
          indexesRows[hy] = {
            cells: [
              {
                ...cells[0],
                value: `${titles[i]}.${cells[0].value}`,
              },
              ...cells.slice(1),
            ],
            columns: indexesRows[hy].columns,
          };
          y += cells[0].height;
        }
      } else {
        indexesRows[h] = {
          cells: [
            {
              height,
              width: 1,
              value: titles[i],
              type: CellType.Index,
            },
            ...indexesRows[h].cells,
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
      }
      h += height;
    }
    return {
      head,
      body,
      indexes: {
        rows: indexesRows,
        width: hasIndexes ? indexes.width + Number(!collapseIndexes) : 1,
        height: h,
      },
    };
  }

  function addHeaders(
    { baked, body, head, indexes }: ComposedTable,
    titles: string[]
  ): Table {
    const hasHeaders = head !== null;
    const newHead: Row = {
      cells: [],
      columns: [],
    };
    let w = 0;
    for (let i = 0; i < baked.length; i++) {
      const { width } = baked[i];
      newHead.cells.push({
        height: 1,
        width,
        value: titles[i],
        type: CellType.Header,
      });
      newHead.columns.push(w);
      w += width;
    }
    return {
      head: {
        rows: hasHeaders ? [newHead, ...head.rows] : [newHead],
        width: w,
        height: hasHeaders ? head.height + 1 : 1,
      },
      body,
      indexes,
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
    const stacked = horizontalTableStacker(tables);
    return addHeaders(stacked, titles);
  }
  function transformValue(value: JSONValue): Table {
    if (isJsonPrimitiveOrNull(value)) {
      return makeTableFromValue(value);
    }
    if (Object.keys(value).length === 0) {
      return makeTableFromValue("");
    }
    if (Array.isArray(value)) {
      if (joinPrimitiveArrayValues && value.every(isJsonPrimitiveOrNull)) {
        return makeTableFromValue(value.join(", "));
      }
      if (combineArraysOfObjects && value.every(isRecord)) {
        // Can be an empty object
        return transformValue(Object.assign({}, ...value));
      }
      if (
        stabilizeOrderOfPropertiesInArraysOfObjects &&
        value.every(isRecord)
      ) {
        let count = 0;
        const order: Record<string, number> = {};
        const array: JSONRecord[] = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
          const obj = value[i] as JSONRecord;
          const keys = Object.keys(obj);
          const entries = new Array<[string, JSONValue]>(keys.length);
          for (const key of keys) {
            entries[(order[key] ??= count++)] = [key, obj[key]];
          }
          array[i] = Object.fromEntries(entries);
        }
        return transformArray(array);
      }
      return transformArray(value);
    }
    return transformRecord(value);
  }
  return transformValue;
}
