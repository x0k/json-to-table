
import { Block, Cell, CellType } from "@/lib/table";
import { array } from "@/lib/array";
import { matrix } from "@/lib/matrix";
import { createMatrix } from '@/lib/block-matrix';

function getMaxLineLength(rows: string[]) {
  let max = 0;
  for (let i = 0; i < rows.length; i++) {
    max = Math.max(max, rows[i].length);
  }
  return max;
}

function padCellRow(row: string, w: number, cell: Cell, rows: string[]) {
  switch (cell.type) {
    case CellType.Header:
    case CellType.Index: {
      const p = Math.floor((w - row.length) / 2);
      return (p > 0 ? row.padStart(p + row.length) : row).padEnd(w);
    }
    default: {
      if (rows.length === 1 && !isNaN(Number(row))) {
        return row.padStart(w);
      }
      return row.padEnd(w);
    }
  }
}

// TODO: get rid of matrix thing since heres is a column property
export function blockToASCIITable(block: Block) {
  const xShift = array(block.width + 1, () => 0);
  const yShift = array(block.height + 1, () => 0);
  const inputMatrix = createMatrix(block, (cell, rowIndex, collIndex) => {
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
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      const cell = inputMatrix[i][j];
      if (cell.collIndex === j) {
        xShift[j + 1] = Math.max(
          xShift[j + 1],
          Math.max(cell.maxRowLength - cell.cell.width, 0) + 1
        );
      }
      if (cell.rowIndex === i) {
        yShift[i + 1] = Math.max(
          yShift[i + 1],
          Math.max(cell.rows.length - cell.cell.height, 0) + 1
        );
      }
    }
  }
  // Accumulate
  for (let i = 1; i <= block.width; i++) {
    xShift[i] += xShift[i - 1];
  }
  for (let i = 1; i <= block.height; i++) {
    yShift[i] += yShift[i - 1];
  }
  const height = block.height + yShift[block.height];
  const width = block.width + xShift[block.width];
  const outMatrix = matrix<string | null>(height, width, () => null);
  const placed = new Set<Cell>();
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      const { cell, rows } = inputMatrix[i][j];
      if (placed.has(cell)) {
        continue;
      }
      placed.add(cell);
      const rowIndex = i + yShift[i];
      const colIndex = j + xShift[j];
      const h = cell.height + yShift[i + cell.height] - yShift[i] - 1;
      const w = cell.width + xShift[j + cell.width] - xShift[j] - 1;
      const startRow = Math.floor((h - rows.length) / 2);
      const endRow = startRow + rows.length;
      for (let y = 0; y < h; y++) {
        const c = y + rowIndex;
        if (y >= startRow && y < endRow) {
          const row = padCellRow(rows[y - startRow], w, cell, rows);
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
    }
  }
  return outMatrix.map((row) => row.join("")).join("\n");
}
