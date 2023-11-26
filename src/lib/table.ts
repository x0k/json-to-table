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

export type Cells<V = JSONPrimitiveOrNull> = Cell<V>[];

export interface Block<V = JSONPrimitiveOrNull> extends Sized {
  rows: Cells<V>[];
}

export interface Table<V = JSONPrimitiveOrNull> {
  header?: Block<V>;
  body: Block<V>;
  indexes?: Block<V>;
}

export function makeTable<V = JSONPrimitiveOrNull>(value: V): Table<V> {
  return {
    body: {
      height: 1,
      width: 1,
      rows: [[{ height: 1, width: 1, value }]],
    },
  };
}
