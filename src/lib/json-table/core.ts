import { JSONPrimitiveOrNull } from "@/lib/json";

export interface Height {
  height: number;
}

export interface Width {
  width: number;
}

export interface Sized extends Height, Width {}

export enum CellType {
  Header = "header",
  Index = "index",
  Value = "value",
  Corner = "corner",
}

export interface Cell<V = JSONPrimitiveOrNull> extends Sized {
  value: V;
  type: CellType;
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
  head: Block<V> | null;
  indexes: Block<V> | null;
  body: Block<V>;
}

export type ProportionalResizeGuard = (
  lcmValue: number,
  maxValue: number
) => boolean;

export type BlockTransform<V> = (block: Block<V>) => Block<V>;

export type BlockCompositor<V> = (blocks: Block<V>[]) => Block<V>;

export interface ComposedTable<V = JSONPrimitiveOrNull> extends Table<V> {
  baked: Block<V>[];
}

export type TableCompositor<V> = (tables: Table<V>[]) => ComposedTable<V>;

export type TableComponent = "head" | "indexes";
export type BlockSizeAspect = "height" | "width";

export const TABLE_COMPONENT_SIZE_ASPECTS: Record<
  TableComponent,
  BlockSizeAspect
> = {
  head: "height",
  indexes: "width",
};

export const TABLE_COMPONENT_OPPOSITES: Record<TableComponent, TableComponent> =
  {
    head: "indexes",
    indexes: "head",
  };

export function makeTableFromValue<V>(value: V): Table<V> {
  return {
    head: null,
    indexes: null,
    body: {
      height: 1,
      width: 1,
      rows: [
        {
          cells: [{ height: 1, width: 1, value, type: CellType.Value }],
          columns: [0],
        },
      ],
    },
  };
}

export function makeProportionalResizeGuard(
  threshold: number
): ProportionalResizeGuard {
  return (lcmValue: number, maxValue: number) =>
    (lcmValue - maxValue) / maxValue <= threshold;
}
