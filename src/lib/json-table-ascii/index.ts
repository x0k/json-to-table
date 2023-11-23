import { generate, Matrix } from "@/lib/array";
import {
  Table,
  createMatrix,
  fromMatrix,
  isHeaderOrIndexCellType,
  Cell,
  CellType,
} from "@/lib/json-table";

export enum SeparatorType {
  None = 0,
  Horizontal = 1,
  Vertical = 2,
  Both = 3,
}

/** Does not escape for separators */
export function getSimpleMySqlASCIITableSeparatorType(
  char: string,
  colIndex: number,
  row: string
) {
  switch (char) {
    case "+":
      return SeparatorType.Both;
    case "|":
      return SeparatorType.Horizontal;
    // TODO: Check that line ends is a `both` separators
    case "-": {
      if (row.length < 2) {
        return SeparatorType.Vertical;
      }
      const prevOrNextInRowToken =
        colIndex > 0 ? row[colIndex - 1] : row[colIndex + 1];
      return prevOrNextInRowToken === "-" || prevOrNextInRowToken === "+"
        ? SeparatorType.Vertical
        : SeparatorType.None;
    }
    default:
      return SeparatorType.None;
  }
}

type RawCell = { x: number; y: number; lastY: number; lastX: number } | null;

function getContentOfRawCell(
  rows: string[],
  { x, y, lastX, lastY }: NonNullable<RawCell>
) {
  return rows
    .slice(y, lastY + 1)
    .map((row) => row.substring(x, lastX + 1).trim())
    .join("\n");
}

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
  // Skip empty rows
  let l = 0;
  while (l < rows.length) {
    if (rows[l].trim() === "") {
      rows.splice(l, 1);
    } else {
      l++;
    }
  }
  let maxLen = 0;
  for (let i = 0; i < rows.length; i++) {
    maxLen = Math.max(maxLen, rows[i].length);
  }
  const originalHeight = rows.length;
  const originalWidth = maxLen;
  const xShiftMatrix = generate(originalHeight, () =>
    generate(originalWidth + 1, () => 0)
  );
  const yShiftMatrix = generate(originalHeight + 1, () =>
    generate(originalWidth, () => 0)
  );
  const regions = generate(originalHeight + 1, () =>
    generate<RawCell>(originalWidth + 1, () => null)
  );
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      const separatorType = getSeparatorType(char, j, row, i, rows);
      xShiftMatrix[i][j + 1] = xShiftMatrix[i][j] + (separatorType & 1);
      yShiftMatrix[i + 1][j] = yShiftMatrix[i][j] + ((separatorType & 2) >> 1);
      if (separatorType > 0) {
        continue;
      }
      const region = regions[i + 1][j] ||
        regions[i][j + 1] || {
          x: j,
          y: i,
          lastX: j,
          lastY: i,
        };
      region.lastX = j;
      region.lastY = i;
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
