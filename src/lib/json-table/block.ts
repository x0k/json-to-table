import { lcm, max } from "@/lib/math";
import { array } from "@/lib/array";

import {
  BLOCK_SIZE_ASPECT_OPPOSITES,
  Block,
  BlockCompositor,
  BlockSizeAspect,
  BlockTransform,
  Cell,
  ProportionalResizeGuard,
  Row,
  RowsScaler,
} from "./core";
import { scaleRowsHorizontally, scaleRowsVertically } from "./row";

export interface PreProportionalBlocksEqualOptions<V> {
  blocks: Block<V>[];
  lcmWidth: number;
  lcmHeight: number;
}

export function areProportionalBlocksEqual<V>({
  blocks,
  lcmWidth,
  lcmHeight,
}: PreProportionalBlocksEqualOptions<V>) {
  const blocksRows = blocks.map((b) => {
    const wMultiplier = lcmWidth / b.width;
    const hMultiplier = lcmHeight / b.height;
    const newRows = array(lcmHeight, () => new Array<Cell<V>>(lcmWidth));
    for (let i = 0; i < b.rows.length; i++) {
      const { cells, columns } = b.rows[i];
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const row = i * hMultiplier;
        const rowEnd = row + cell.height * hMultiplier;
        const col = columns[j] * wMultiplier;
        const colEnd = col + cell.width * wMultiplier;
        for (let k = row; k < rowEnd; k++) {
          const newRow = newRows[k];
          for (let l = col; l < colEnd; l++) {
            newRow[l] = cell;
          }
        }
      }
    }
    return newRows;
  });
  // Loop over rows
  for (let i = 0; i < lcmHeight; i++) {
    const firstBlockRow = blocksRows[0][i];
    // Loop over cells
    for (let j = 0; j < lcmWidth; j++) {
      const firstBlockCell = firstBlockRow[j];
      // Loop over other blocks
      for (let k = 1; k < blocks.length; k++) {
        const cell = blocksRows[k][i][j];
        if (!cell || firstBlockCell.value !== cell.value) {
          return false;
        }
      }
    }
    i++;
  }
  return true;
}

function applyResize<V>(
  rows: Row<V>[],
  toResize: Map<number, Map<number, number>>,
  sizeAspect: BlockSizeAspect
) {
  const newRows = rows.slice();
  for (const [rowId, cells] of toResize) {
    const newRow = newRows[rowId].cells.slice();
    for (const [cellId, diff] of cells) {
      newRow[cellId] = {
        ...newRow[cellId],
        [sizeAspect]: newRow[cellId][sizeAspect] + diff,
      };
    }
    newRows[rowId] = {
      cells: newRow,
      columns: newRows[rowId].columns,
    };
  }
  return newRows;
}

export function stretchCellsToBottom<V>({ height, rows, width }: Block<V>) {
  const yShift = array(width, () => 0);
  const bottomPositions = new Array<
    | {
        cell: Cell<V>;
        rowIndex: number;
        colIndex: number;
      }
    | null
    | undefined
  >(width);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.cells.length; j++) {
      const cell = row.cells[j];
      const x = row.columns[j];
      yShift[x] += cell.height;
      bottomPositions[x] = { cell, rowIndex: i, colIndex: j };
      for (let k = 1; k < cell.width; k++) {
        yShift[x + k] += cell.height;
        bottomPositions[x + k] = null;
      }
    }
  }
  // rowId: { cellId: diff }
  const toResize = new Map<number, Map<number, number>>();
  for (let i = 0; i < width; i++) {
    const position = bottomPositions[i];
    if (!position) {
      continue;
    }
    const diff = height - yShift[i];
    if (diff <= 0) {
      continue;
    }
    const cells = toResize.get(position.rowIndex) || new Map<number, number>();
    toResize.set(position.rowIndex, cells.set(position.colIndex, diff));
  }
  return {
    height,
    width,
    rows: applyResize(rows, toResize, "height"),
  };
}

export function stretchCellsToRight<V>({ height, rows, width }: Block<V>) {
  const rightPositions = new Array<
    | {
        cell: Cell<V>;
        indexInRow: number;
        xTopRightCorner: number;
      }
    | undefined
  >(height);
  for (let i = 0; i < rows.length; i++) {
    const { cells, columns } = rows[i];
    if (cells.length === 0) {
      continue;
    }
    const indexInRow = cells.length - 1;
    const cell = cells[indexInRow];
    const xTopRightCorner = columns[indexInRow] + cell.width;
    const point = {
      cell,
      indexInRow,
      xTopRightCorner,
    };
    for (let j = i; j < i + cell.height; j++) {
      const rp = rightPositions[j];
      if (!rp || xTopRightCorner > rp.xTopRightCorner) {
        rightPositions[j] = point;
      }
    }
  }
  const addedToResize = new Set<Cell<V>>();
  const toResize = new Map<number, Map<number, number>>();
  for (let i = 0; i < height; i++) {
    const position = rightPositions[i];
    if (!position || addedToResize.has(position.cell)) {
      continue;
    }
    addedToResize.add(position.cell);
    const diff = width - position.xTopRightCorner;
    if (diff <= 0) {
      continue;
    }
    const cells = toResize.get(i) || new Map<number, number>();
    toResize.set(i, cells.set(position.indexInRow, diff));
  }
  return {
    height,
    width,
    rows: applyResize(rows, toResize, "width"),
  };
}

const SIZE_ASPECT_TO_ROWS_SCALER: Record<BlockSizeAspect, RowsScaler<any>> = {
  width: scaleRowsHorizontally,
  height: scaleRowsVertically,
};

const SIZE_ASPECT_TO_CELLS_STRETCHER: Record<
  BlockSizeAspect,
  BlockTransform<any>
> = {
  width: stretchCellsToRight,
  height: stretchCellsToBottom,
};

export function makeBlockScaler<V>(
  sizeAspect: BlockSizeAspect,
  finalSize: number
): BlockTransform<V> {
  const opposite = BLOCK_SIZE_ASPECT_OPPOSITES[sizeAspect];
  const scaleRows = SIZE_ASPECT_TO_ROWS_SCALER[sizeAspect];
  const stretchCells = SIZE_ASPECT_TO_CELLS_STRETCHER[sizeAspect];
  return (table) => {
    const multiplier = Math.floor(finalSize / table[sizeAspect]);
    const block: Block<V> = {
      [sizeAspect as "width"]: finalSize,
      [opposite as "height"]: table[opposite],
      rows:
        multiplier === 1
          ? table.rows
          : scaleRows(table.rows, multiplier, finalSize),
    };
    return finalSize - table[sizeAspect] * multiplier === 0
      ? block
      : stretchCells(block);
  };
}

export function makeVerticalBlockStacker<V>(
  isProportionalResize: ProportionalResizeGuard
): BlockCompositor<V> {
  return function stackBlocksVertically(blocks) {
    let lcmWidth = blocks[0].width;
    let maxWidth = lcmWidth;
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      lcmWidth = lcm(lcmWidth, block.width);
      maxWidth = max(maxWidth, block.width);
    }
    const width = isProportionalResize(lcmWidth, maxWidth)
      ? lcmWidth
      : maxWidth;
    const rows = new Array<Row<V>>(0);
    const scale = makeBlockScaler<V>("width", width);
    for (let i = 0; i < blocks.length; i++) {
      const finalBlock = scale(blocks[i]);
      for (let j = 0; j < finalBlock.rows.length; j++) {
        rows.push(finalBlock.rows[j]);
      }
    }
    return {
      width,
      height: rows.length,
      rows,
    };
  };
}

export function makeHorizontalBlockStacker<V>(
  isProportionalResize: ProportionalResizeGuard
): BlockCompositor<V> {
  return (blocks) => {
    let lcmHeight = blocks[0].height;
    let maxHeight = lcmHeight;
    for (let i = 1; i < blocks.length; i++) {
      lcmHeight = lcm(lcmHeight, blocks[i].height);
      maxHeight = max(maxHeight, blocks[i].height);
    }
    const height = isProportionalResize(lcmHeight, maxHeight)
      ? lcmHeight
      : maxHeight;
    const finalBlocks = blocks.map(makeBlockScaler("height", height));
    const rows = array(height, (): Row<V> => ({ cells: [], columns: [] }));
    let width = 0;
    for (let i = 0; i < finalBlocks.length; i++) {
      const block = finalBlocks[i];
      for (let j = 0; j < block.rows.length; j++) {
        const row = rows[j];
        const blockRow = block.rows[j];
        for (let k = 0; k < blockRow.cells.length; k++) {
          row.cells.push(blockRow.cells[k]);
          row.columns.push(blockRow.columns[k] + width);
        }
      }
      width += block.width;
    }
    return {
      width,
      height,
      rows,
    };
  };
}
