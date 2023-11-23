import { Cell, Table, createMatrix } from "@/lib/json-table";
import { generate } from "@/lib/array";

import { getMaxLineLength } from "./core";

export function toASCIITable(table: Table) {
  const xShift = generate(table.width + 1, () => 0);
  const yShift = generate(table.height + 1, () => 0);
  const inputMatrix = createMatrix(table, (cell, rowIndex, collIndex) => {
    const content =
      typeof cell.value === "string"
        ? cell.value
        : JSON.stringify(cell.value, null, 2);
    const rows = content.split("\n").map((r) => ` ${r.trim()} `);
    return {
      cell,
      rowIndex,
      collIndex,
      rows,
      maxRowLength: getMaxLineLength(rows),
    };
  });
  for (let i = 0; i < table.height; i++) {
    for (let j = 0; j < table.width; j++) {
      const cell = inputMatrix[i][j];
      if (cell.collIndex === j) {
        xShift[j + 1] = Math.max(
          xShift[j + 1],
          xShift[j] + cell.maxRowLength + 1
        );
      } else {
        xShift[j + 1] = Math.max(xShift[j + 1], xShift[j]) 
      }
      if (cell.rowIndex === i) {
        yShift[i + 1] = Math.max(
          yShift[i + 1],
          yShift[i] + cell.rows.length + 1
        );
      } else {
        yShift[i + 1] = Math.max(yShift[i + 1], yShift[i])
      }
    }
  }
  xShift[0] = yShift[0] = 1;
  const height = table.height + yShift[table.height];
  const width = table.width + xShift[table.width];
  const outMatrix = generate(height, () =>
    generate<string | null>(width, () => null)
  );
  const placed = new Set<Cell>();
  for (let i = 0; i < table.height; i++) {
    for (let j = 0; j < table.width; j++) {
      const { cell, rows, maxRowLength } = inputMatrix[i][j];
      if (placed.has(cell)) {
        continue;
      }
      placed.add(cell);
      const rowIndex = i + yShift[i];
      const colIndex = j + xShift[j];
      for (let y = 0; y < rows.length; y++) {
        // TODO: Pad depending on type of cell and content
        const row = rows[y].padEnd(maxRowLength, " ");
        for (let x = 0; x < maxRowLength; x++) {
          outMatrix[y + rowIndex][x + colIndex] = row[x];
        }
      }
    }
  }
  // Draw border
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const cell = outMatrix[i][j];
      if (cell !== null) {
        continue;
      }
      const isBottomEdge = i === height - 1;
      const isRightEdge = j === width - 1;
      const isRightNull = !isRightEdge && outMatrix[i][j + 1] === null;
      const isBottomNull = !isBottomEdge && outMatrix[i + 1][j] === null;
      if (
        (isBottomEdge && isRightEdge) ||
        (isRightEdge && outMatrix[i][j - 1] === "-") ||
        (isBottomEdge && outMatrix[i - 1][j] === "|") ||
        (isRightNull && isBottomNull)
      ) {
        outMatrix[i][j] = "+";
        continue;
      }
      if (isRightNull) {
        outMatrix[i][j] = "-";
        continue;
      }
      if (isBottomNull) {
        outMatrix[i][j] = "|";
        continue;
      }
    }
  }
  return outMatrix.map((row) => row.join("")).join("\n");
}
