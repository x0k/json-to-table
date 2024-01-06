import { Cell, Cells, Rows } from "./core";

export function shiftNumbers(columns: number[], offset: number): void {
  for (let i = 0; i < columns.length; i++) {
    columns[i] += offset;
  }
}

export function prependCell<V>(
  { cells, columns }: Cells<V>,
  cell: Cell<V>
): void {
  cells.unshift(cell);
  shiftNumbers(columns, cell.width);
  columns.unshift(0);
}

export function shiftRows<V>({ rows }: Rows<V>, offset: number): void {
  for (let i = 0; i < rows.length; i++) {
    shiftNumbers(rows[i].columns, offset);
  }
}

export function appendCells<V>(a: Cells<V>, aWidth: number, b: Cells<V>): void {
  shiftNumbers(b.columns, aWidth);
  a.cells.push(...b.cells);
  a.columns.push(...b.columns);
}

export function scaleRowsVertically<V>(
  { rows, indexes }: Rows<V>,
  multiplier: number
): void {
  for (let i = 0; i < rows.length; i++) {
    indexes[i] = indexes[i] * multiplier;
    const cells = rows[i].cells;
    for (let j = 0; j < cells.length; j++) {
      cells[j].height = cells[j].height * multiplier;
    }
  }
}

export function scaleRowsHorizontally<V>(
  { rows }: Rows<V>,
  multiplier: number
): void {
  for (let i = 0; i < rows.length; i++) {
    const { cells, columns } = rows[i];
    for (let j = 0; j < cells.length; j++) {
      cells[j].width = cells[j].width * multiplier;
      columns[j] = columns[j] * multiplier;
    }
  }
}
