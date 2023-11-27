import { JSONPrimitiveOrNull } from "@/lib/json";

export interface Height {
  height: number;
}

export interface Width {
  width: number;
}

export interface Sized extends Height, Width {}

export interface Cell<V = JSONPrimitiveOrNull> extends Sized {
  value: V;
}

export interface Row<V = JSONPrimitiveOrNull> {
  cells: Cell<V>[];
  /** Absolute position in row for each cell */
  columns: number[];
}

export interface Block<V = JSONPrimitiveOrNull> extends Sized {
  rows: Row<V>[];
}

export interface Table<V = JSONPrimitiveOrNull> {
  head?: Block<V>;
  body: Block<V>;
  indexes?: Block<V>;
}

export function makeTable<V>(value: V): Table<V> {
  return {
    body: {
      height: 1,
      width: 1,
      rows: [
        {
          cells: [{ height: 1, width: 1, value }],
          columns: [0],
        },
      ],
    },
  };
}

export function getHeight<V>(table: Table<V>) {
  return table.body.height + (table.head?.height || 0);
}

export function getWidth<V>(table: Table<V>) {
  return table.body.width + (table.indexes?.width || 0);
}
