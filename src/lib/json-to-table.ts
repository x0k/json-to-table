import {
  JSONPrimitiveOrNull,
  JSONRecord,
  JSONValue,
  isJsonPrimitiveOrNull,
} from "@/lib/json";
import {
  Table,
  Cells,
  makeTableFromValue,
  makeProportionalResizeGuard,
  ComposedTable,
  CellType,
  shiftPositionsInPlace,
  makeTableInPlaceStacker,
} from "@/lib/json-table";
import { isRecord } from "@/lib/guards";
import { array } from "@/lib/array";
import { makeObjectPropertiesStabilizer } from "@/lib/object";

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

const EMPTY = makeTableFromValue("");

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
  const verticalTableInPlaceStacker = makeTableInPlaceStacker({
    deduplicationComponent: "head",
    isProportionalResize,
    cornerCellValue,
  });
  const horizontalTableInPlaceStacker = makeTableInPlaceStacker({
    deduplicationComponent: "indexes",
    isProportionalResize,
    cornerCellValue,
  });

  function addIndexesInPlace(
    { baked, body, head, indexes }: ComposedTable,
    titles: string[]
  ): Table {
    const hasIndexes = indexes !== null;
    const collapse = hasIndexes && collapseIndexes;
    const rawRows = hasIndexes
      ? indexes.data.rows
      : array(body.height, () => ({
          cells: [],
          columns: [],
        }));
    const idx = new Array<number>(body.height);
    let index = 0;
    for (let i = 0; i < baked.length; i++) {
      const { data, height } = baked[i];
      if (collapse) {
        for (let j = 0; j < data.rows.length; j++) {
          const row = rawRows[index + j];
          row.cells[0].value = `${titles[i]}.${row.cells[0].value}`;
          idx.push(index + data.indexes[j]);
        }
      } else {
        const rawRow = rawRows[index];
        rawRow.cells.unshift({
          height,
          width: 1,
          value: titles[i],
          type: CellType.Index,
        });
        shiftPositionsInPlace(rawRow.columns, 1);
        rawRow.columns.unshift(0);
        idx.push(index);
        for (let j = 1; j < data.rows.length; j++) {
          idx.push(index + data.indexes[j]);
          if (hasIndexes) {
            shiftPositionsInPlace(rawRows[index + j].columns, 1);
          }
        }
      }
      index += data.rows.length;
    }
    return {
      head,
      body,
      indexes: {
        height: body.height,
        width: hasIndexes ? indexes.width + Number(!collapseIndexes) : 1,
        data: {
          rows: rawRows,
          indexes: idx,
        },
      },
    };
  }

  function addHeaders(
    { baked, body, head, indexes }: ComposedTable,
    titles: string[]
  ): Table {
    const hasHeaders = head !== null;
    const newHead: Cells = {
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
    if (hasHeaders) {
      head.data.rows.unshift(newHead);
      shiftPositionsInPlace(head.data.indexes, 1);
      head.data.indexes.unshift(0);
    }
    return {
      head: {
        data: hasHeaders
          ? head.data
          : { rows: [newHead], indexes: [0] },
        width: w,
        height: hasHeaders ? head.height + 1 : 1,
      },
      body,
      indexes,
    };
  }

  function stackTablesVertical(titles: string[], tables: Table[]): Table {
    const stacked = verticalTableInPlaceStacker(tables);
    return addIndexesInPlace(stacked, titles);
  }
  function stackTablesHorizontal(titles: string[], tables: Table[]): Table {
    const stacked = horizontalTableInPlaceStacker(tables);
    return addHeaders(stacked, titles);
  }
  function transformRecord(record: Record<string, JSONValue>): Table {
    const keys = Object.keys(record);
    if (keys.length === 0) {
      return EMPTY;
    }
    return stackTablesHorizontal(
      keys,
      keys.map((key) => transformValue(record[key]))
    );
  }
  function transformArray<V extends JSONValue>(
    value: V[],
    transformValue: (value: V) => Table
  ): Table {
    const titles = new Array<string>(value.length);
    const tables = new Array<Table>(value.length);
    for (let i = 0; i < value.length; i++) {
      titles[i] = String(i + 1);
      tables[i] = transformValue(value[i]);
    }
    return stackTablesVertical(titles, tables);
  }
  function transformValue(value: JSONValue): Table {
    if (isJsonPrimitiveOrNull(value)) {
      return makeTableFromValue(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return EMPTY;
      }
      let isPrimitives = true;
      let isRecords = true;
      let i = 0;
      while (i < value.length && (isPrimitives || isRecord)) {
        isPrimitives = isPrimitives && isJsonPrimitiveOrNull(value[i]);
        isRecords = isRecords && isRecord(value[i]);
        i++;
      }
      if (joinPrimitiveArrayValues && isPrimitives) {
        return makeTableFromValue(value.join(", "));
      }
      if (combineArraysOfObjects && isRecords) {
        return transformRecord(Object.assign({}, ...value));
      }
      if (stabilizeOrderOfPropertiesInArraysOfObjects && isRecords) {
        const stabilize = makeObjectPropertiesStabilizer();
        return transformArray(value as JSONRecord[], (value) => {
          const [keys, values] = stabilize(value);
          return stackTablesHorizontal(keys, values.map(transformValue));
        });
      }
      return transformArray(value, transformValue);
    }
    return transformRecord(value);
  }
  return transformValue;
}
