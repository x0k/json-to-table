import { Rows } from "./core";

export function shiftNumbers(columns: number[], offset: number): void {
  for (let i = 0; i < columns.length; i++) {
    columns[i] += offset;
  }
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
