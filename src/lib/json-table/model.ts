import { JSONArray, JSONPrimitiveOrNull, JSONValue } from "@/lib/json";

export enum ViewType {
  Indexes = "indexes",
  Headers = "headers",
}

export const VIEW_TYPES = Object.values(ViewType);

export interface SidesResizeLimits {
  forWidth: number;
  forHeight: number;
}

export interface TransformOptions {
  headers: boolean;
  indexes: boolean;
  collapseHeaders: boolean;
  collapseIndexes: boolean;
  concatPrimitiveValues: boolean;
  mergeRecordValues: boolean;
  sortHeaders: boolean;
  deduplicateHeaders: boolean;
  supportForHeadersGrouping: boolean;
  recordViewType: ViewType;
  arrayViewType: ViewType;
  proportionalResizeLimit: number | SidesResizeLimits;
  transpose: boolean;
  horizontalReflect: boolean;
  verticalReflect: boolean;
}

export interface MergeTablesOptions {
  viewType: ViewType;
  titles: string[];
  tables: Table[];
}

export interface Height {
  height: number;
}

export interface Width {
  width: number;
}

export interface Block extends Height, Width {}

export enum CellType {
  Header = "header",
  Index = "index",
  Value = "value",
  Plug = "plug",
  Corner = "corner",
}

export const HEADER_CELL_TYPES = [
  CellType.Header,
  // TODO: Remove this type after table factory will be completed
  CellType.Index,
  CellType.Corner,
];

export interface Cell<V = JSONPrimitiveOrNull> extends Block {
  type: CellType;
  value: V;
}

export type Row<V = JSONPrimitiveOrNull> = Cell<V>[];

export interface Table<V = JSONPrimitiveOrNull> extends Block {
  rows: Row<V>[];
}

export const getHeight = ({ height }: Height): number => height;
export const getWidth = ({ width }: Width): number => width;

export type DeduplicationInterval = [number, number];

export type BuildRowStructure = (row: Row, multiplier: number) => JSONArray;

export type ComposeTables = (tables: Table[]) => Table;

export type TableFactory = (value: JSONValue) => Table;

export type SplitIntoColumnsByHeaders = (
  Table: Table,
  deduplicateLevel: number,
  currentLevel: number
) => Table;

export interface TableMeta {
  indexOfLastRowWithLegitHeader: number;
  multiplier: number;
  structures: JSONValue[][];
}

export interface DeduplicationIntervalsCandidate {
  intervals: DeduplicationInterval[];
  minDeduplicationHeight: number;
}

export interface Interval<T> {
  start: T;
  end: T;
  heightShift: number;
}

export function isHeaderOrIndexCellType(cellType: CellType) {
  return cellType === CellType.Header || cellType === CellType.Index;
}
