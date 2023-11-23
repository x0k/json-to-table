import { generate, Matrix } from "@/lib/array";
import { fromMatrix, CellType } from "@/lib/json-table";

import {
  getContentOfRawCell,
  prepareRows,
  RawCell,
  SeparatorType,
} from "./core";

export function fromASCIITableWithBottomRightShift(
  ascii: string,
  getSeparatorType: (
    char: string,
    colIndex: number,
    row: string,
    rowIndex: number,
    rows: string[]
  ) => SeparatorType
) {
  const {
    rows,
    originalHeight,
    originalWidth,
    xShiftMatrix,
    yShiftMatrix,
    regions,
  } = prepareRows(ascii);
  let regionId = 1;
  for (let i = originalHeight - 1; i >= 0; i--) {
    const row = rows[i];
    for (let j = originalWidth - 1; j >= 0; j--) {
      const char = row[j];
      const type = getSeparatorType(char, j, row, i, rows);
      xShiftMatrix[i][j] = xShiftMatrix[i][j + 1] + (type & 1);
      yShiftMatrix[i][j] = yShiftMatrix[i + 1][j] + ((type & 2) >> 1);
      if (type > 0) {
        continue;
      }
      const region = regions[i][j + 1] ||
        regions[i + 1][j] || {
          id: regionId++,
          x1: j,
          y1: i,
          x2: j,
          y2: i,
        };
      region.x1 = j;
      region.y1 = i;
      regions[i][j] = region;
    }
  }
  let width = 0;
  // Loop over rows
  for (let i = 0; i < originalHeight; i++) {
    const lastRegionIndex = regions[i].findIndex((r) => r !== null);
    if (lastRegionIndex === -1) {
      continue;
    }
    width = Math.max(
      width,
      originalWidth - lastRegionIndex - xShiftMatrix[i][lastRegionIndex]
    );
  }
  let height = 0;
  // Loop over columns
  for (let i = 0; i < originalWidth; i++) {
    let lastRegionIndex = 0;
    while (lastRegionIndex < originalHeight) {
      if (regions[lastRegionIndex][i] !== null) {
        break;
      }
      lastRegionIndex++;
    }
    height = Math.max(
      height,
      originalHeight - lastRegionIndex - yShiftMatrix[lastRegionIndex][i]
    );
  }
  const cleanMatrix = generate(height, () =>
    generate<RawCell>(width, () => null)
  );
  const hd = originalHeight - height;
  const wd = originalWidth - width;
  for (let i = originalHeight - 1; i >= 0; i--) {
    for (let j = originalWidth - 1; j >= 0; j--) {
      const region = regions[i][j];
      if (region === null) {
        continue;
      }
      cleanMatrix[i + yShiftMatrix[i][j] - hd][j + xShiftMatrix[i][j] - wd] =
        region;
    }
  }
  // Fill left empty cells
  let i = height - 1;
  let lastNonNullColumnIndex = 1;
  while (cleanMatrix[i][0] === null) {
    while (cleanMatrix[i][lastNonNullColumnIndex] === null) {
      lastNonNullColumnIndex++;
    }
    for (let j = lastNonNullColumnIndex - 1; j >= 0; j--) {
      if (cleanMatrix[i][j] === null) {
        cleanMatrix[i][j] = cleanMatrix[i][j + 1];
      }
    }
    i--;
  }
  // Fill top empty cells
  i = 0;
  let lastNonNullRowIndex = 1;
  while (cleanMatrix[0][i] === null) {
    while (cleanMatrix[lastNonNullRowIndex][i] === null) {
      lastNonNullRowIndex++;
    }
    for (let j = lastNonNullRowIndex - 1; j >= 0; j--) {
      if (cleanMatrix[j][i] === null) {
        cleanMatrix[j][i] = cleanMatrix[j + 1][i];
      }
    }
    i++;
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
  );
}

export function fromASCIITableWithLeftTopShift(
  ascii: string,
  getSeparatorType: (
    char: string,
    colIndex: number,
    row: string,
    rowIndex: number,
    rows: string[]
  ) => SeparatorType
) {
  const {
    rows,
    originalHeight,
    originalWidth,
    xShiftMatrix,
    yShiftMatrix,
    regions,
  } = prepareRows(ascii);
  let regionId = 1;
  for (let i = 0; i < originalHeight; i++) {
    const row = rows[i];
    for (let j = 0; j < originalWidth; j++) {
      const char = row[j];
      const separatorType = getSeparatorType(char, j, row, i, rows);
      xShiftMatrix[i][j + 1] = xShiftMatrix[i][j] + (separatorType & 1);
      yShiftMatrix[i + 1][j] = yShiftMatrix[i][j] + ((separatorType & 2) >> 1);
      if (separatorType > 0) {
        continue;
      }
      const region = regions[i + 1][j] ||
        regions[i][j + 1] || {
          id: regionId++,
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
  let width = 0;
  for (let i = 1; i <= originalHeight; i++) {
    const lastRegionIndex = regions[i].findLastIndex((r) => r !== null);
    if (lastRegionIndex === -1) {
      continue;
    }
    width = Math.max(
      width,
      lastRegionIndex - xShiftMatrix[i - 1][lastRegionIndex]
    );
  }
  let height = 0;
  // Loop over columns
  for (let i = 1; i <= originalWidth; i++) {
    let lastRegionIndex = originalHeight;
    // First row is empty so strict greater than is ok
    while (lastRegionIndex > 0) {
      if (regions[lastRegionIndex][i] !== null) {
        break;
      }
      lastRegionIndex--;
    }
    height = Math.max(
      height,
      lastRegionIndex - yShiftMatrix[lastRegionIndex][i - 1]
    );
  }
  const cleanMatrix = generate(height, () =>
    generate<RawCell>(width, () => null)
  );
  for (let i = 1; i <= originalHeight; i++) {
    for (let j = 1; j <= originalWidth; j++) {
      const region = regions[i][j];
      if (region === null) {
        continue;
      }
      cleanMatrix[i - yShiftMatrix[i][j - 1] - 1][
        j - xShiftMatrix[i - 1][j] - 1
      ] = region;
    }
  }
  // Fill bottom empty cells
  let i = 0;
  let lastNonNullRowIndex = height - 2;
  while (cleanMatrix[height - 1][i] === null) {
    while (cleanMatrix[lastNonNullRowIndex][i] === null) {
      lastNonNullRowIndex--;
    }
    for (let j = lastNonNullRowIndex + 1; j < height; j++) {
      if (cleanMatrix[j][i] === null) {
        cleanMatrix[j][i] = cleanMatrix[j - 1][i];
      }
    }
    i++;
  }
  // Fill right empty cells
  i = height - 1;
  let lastNonNullColumnIndex = width - 2;
  while (cleanMatrix[i][width - 1] === null) {
    while (cleanMatrix[i][lastNonNullColumnIndex] === null) {
      lastNonNullColumnIndex--;
    }
    for (let j = lastNonNullColumnIndex + 1; j < width; j++) {
      if (cleanMatrix[i][j] === null) {
        cleanMatrix[i][j] = cleanMatrix[i][j - 1];
      }
    }
    i--;
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
  );
}
