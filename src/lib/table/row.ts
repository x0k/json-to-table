import { Cell, Row } from "./core";

export function rebaseColumns(columns: number[], offset: number) {
  return columns.map((column) => column + offset);
}

export function prependCell<V>(row: Row<V>, cell: Cell<V>) {
  return {
    cells: [cell].concat(row.cells),
    columns: [0].concat(rebaseColumns(row.columns, cell.width)),
  };
}

export function shiftRows<V>(rows: Row<V>[], offset: number) {
  return rows.map((row) => ({
    cells: row.cells,
    columns: rebaseColumns(row.columns, offset),
  }));
}

export function mergeRows<V>(a: Row<V>, aWidth: number, b: Row<V>): Row<V> {
  return {
    cells: a.cells.concat(b.cells),
    columns: a.columns.concat(rebaseColumns(b.columns, aWidth)),
  };
}
