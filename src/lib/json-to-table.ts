import { JSONArray, JSONRecord, JSONValue, isJsonPrimitiveOrNull } from "@/lib/json";
import { Table, makeTable } from '@/lib/table';
import { isRecord } from '@/lib/guards';
import { array } from '@/lib/array';

export interface TableFactoryOptions {
  joinPrimitiveArrayValues?: boolean;
  /** combine arrays of objects into a single object */
  combineArraysOfObjects?: boolean;
}

export function makeTableFactory({
  combineArraysOfObjects,
  joinPrimitiveArrayValues
}: TableFactoryOptions) {
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
