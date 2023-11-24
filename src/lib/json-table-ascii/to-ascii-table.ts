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
  xShift[0] = yShift[0] = 1;
  for (let i = 0; i < table.height; i++) {
    for (let j = 0; j < table.width; j++) {
      const cell = inputMatrix[i][j];
      if (cell.collIndex === j) {
        xShift[j + 1] = Math.max(
          xShift[j + 1],
          xShift[j] + Math.max(cell.maxRowLength - cell.cell.width, 0) + 1
        );
      } else {
        xShift[j + 1] = Math.max(xShift[j + 1], xShift[j]);
      }
      if (cell.rowIndex === i) {
        yShift[i + 1] = Math.max(
          yShift[i + 1],
          yShift[i] + Math.max(cell.rows.length - cell.cell.height, 0) + 1
        );
      } else {
        yShift[i + 1] = Math.max(yShift[i + 1], yShift[i]);
      }
    }
  }
  const height = table.height + yShift[table.height];
  const width = table.width + xShift[table.width];
  const outMatrix = generate(height, () =>
    generate<string | null>(width, () => null)
  );
  const placed = new Set<Cell>();
  for (let i = 0; i < table.height; i++) {
    for (let j = 0; j < table.width; j++) {
      const { cell, rows } = inputMatrix[i][j];
      if (placed.has(cell)) {
        continue;
      }
      placed.add(cell);
      const rowIndex = i + yShift[i];
      const colIndex = j + xShift[j];
      const h = cell.height + yShift[i + cell.height] - yShift[i] - 1;
      const w = cell.width + xShift[j + cell.width] - xShift[j] - 1;
      for (let y = 0; y < h; y++) {
        // TODO: Pad depending on type of cell and content
        const c = y + rowIndex;
        if (y < rows.length) {
          const row = rows[y].padEnd(w, " ");
          for (let x = 0; x < w; x++) {
            outMatrix[c][x + colIndex] = row[x];
          }
        } else {
          for (let x = 0; x < w; x++) {
            outMatrix[c][x + colIndex] = " ";
          }
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
      const isLeftEdge = j === 0;
      const isTopEdge = i === 0;
      const isRightEdge = j === width - 1;
      const isBottomEdge = i === height - 1;
      const previous = !isLeftEdge && outMatrix[i][j - 1];
      const next = !isRightEdge && outMatrix[i][j + 1];
      const beneath = !isBottomEdge && outMatrix[i + 1][j];
      const above = !isTopEdge && outMatrix[i - 1][j];
      if (
        ((isLeftEdge || isRightEdge) && (isTopEdge || isBottomEdge)) ||
        (previous === "-" && beneath === null) ||
        (above === "|" && next === null) ||
        (previous === "-" && above === "|")
      ) {
        outMatrix[i][j] = "+";
        continue;
      }
      if (previous === "+" || previous === "-") {
        outMatrix[i][j] = "-";
        continue;
      }
      if (above === "+" || above === "|") {
        outMatrix[i][j] = "|";
        continue;
      }
      outMatrix[i][j] = "n";
      continue;
    }
  }
  return outMatrix.map((row) => row.join("")).join("\n");
}
