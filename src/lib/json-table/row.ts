import { array } from "@/lib/array";

import { Cell, Row } from "./core";

export function shiftColumns(columns: number[], offset: number) {
  return columns.map((column) => column + offset);
}

export function rowPrepend<V>(row: Row<V>, cell: Cell<V>) {
  return {
    cells: [cell].concat(row.cells),
    columns: [0].concat(shiftColumns(row.columns, cell.width)),
  };
}

export function shiftRows<V>(rows: Row<V>[], offset: number) {
  return rows.map((row) => ({
    cells: row.cells,
    columns: shiftColumns(row.columns, offset),
  }));
}

export function concatRows<V>(a: Row<V>, aWidth: number, b: Row<V>): Row<V> {
  return {
    cells: a.cells.concat(b.cells),
    columns: a.columns.concat(shiftColumns(b.columns, aWidth)),
  };
}

export function scaleRowsVertically<V>(
  rows: Row<V>[],
  multiplier: number,
  finalHeight: number,
) {
  const newRows = array(
    finalHeight,
    (): Row<V> => ({
      cells: [],
      columns: [],
    })
  );
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const newRow = newRows[i * multiplier];
    newRow.columns = row.columns;
    for (let j = 0; j < row.cells.length; j++) {
      const cell = row.cells[j];
      newRow.cells.push({
        ...cell,
        height: cell.height * multiplier,
      });
    }
  }
  return newRows;
}

export function scaleRowsHorizontally<V>(rows: Row<V>[], multiplier: number) {
  return rows.map((row) => ({
    cells: row.cells.map((cell) => ({
      ...cell,
      width: cell.width * multiplier,
    })),
    columns: row.columns.map((column) => column * multiplier),
  }));
}
