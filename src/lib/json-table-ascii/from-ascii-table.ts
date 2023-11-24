import { generate } from "@/lib/array";
import { fromMatrix, CellType } from "@/lib/json-table";

import {
  getContentOfRawCell,
  getMaxLineLength,
  omitEmptyLines,
  RawCell,
  SeparatorType,
} from "./core";

export function fromASCIITable(
  ascii: string,
  getSeparatorType: (
    char: string,
    colIndex: number,
    row: string,
    rowIndex: number,
    rows: string[]
  ) => SeparatorType
) {
  const rows = ascii.split("\n");
  omitEmptyLines(rows);
  const originalHeight = rows.length;
  const originalWidth = getMaxLineLength(rows);
  const regions = generate(originalHeight + 1, () =>
    generate<RawCell>(originalWidth + 1, () => null)
  );
  const xShift = generate(originalWidth + 1, () => 0);
  const yShift = generate(originalHeight + 1, () => 0);
  for (let i = 0; i < originalHeight; i++) {
    const row = rows[i];
    for (let j = 0; j < originalWidth; j++) {
      const char = row[j];
      const separatorType = getSeparatorType(char, j, row, i, rows);
      xShift[j + 1] = Math.max(xShift[j + 1], xShift[j] + (separatorType & 1));
      yShift[i + 1] = Math.max(
        yShift[i + 1],
        yShift[i] + ((separatorType & 2) >> 1)
      );
      if (separatorType > 0) {
        continue;
      }
      const region = regions[i + 1][j] ||
        regions[i][j + 1] || {
          x1: j,
          y1: i,
          x2: j,
          y2: i,
        };
      region.x2 = j;
      region.y2 = i;
      regions[i + 1][j + 1] = region;
    }
  }
  const width = originalWidth - xShift[originalWidth];
  const height = originalHeight - yShift[originalHeight];
  const cleanMatrix = generate(height, () =>
    generate<RawCell>(width, () => null)
  );
  for (let i = 1; i <= originalHeight; i++) {
    for (let j = 1; j <= originalWidth; j++) {
      const region = regions[i][j];
      if (region === null) {
        continue;
      }
      cleanMatrix[i - yShift[i] - 1][j - xShift[j] - 1] = region;
    }
  }
  return fromMatrix(
    cleanMatrix,
    () => CellType.Value,
    (cell) => {
      if (cell === null) {
        throw new Error("Invalid table");
      }
      return getContentOfRawCell(rows, cell);
    }
  )
}
