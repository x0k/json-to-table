import { JSONPrimitiveOrNull } from "@/lib/json";
import { array } from "./array";

export interface Height {
  height: number;
}

export interface Width {
  width: number;
}

export interface Sized extends Height, Width {}

export interface Cell<V = JSONPrimitiveOrNull> extends Sized {
  value: V;
}

export interface Row<V = JSONPrimitiveOrNull> {
  cells: Cell<V>[];
  /** Absolute position in row for each cell */
  columns: number[];
}

export interface Block<V = JSONPrimitiveOrNull> extends Sized {
  rows: Row<V>[];
}

export interface Table<V = JSONPrimitiveOrNull> {
  header?: Block<V>;
  body: Block<V>;
  indexes?: Block<V>;
}

export function makeTable<V>(value: V): Table<V> {
  return {
    body: {
      height: 1,
      width: 1,
      rows: [
        {
          cells: [{ height: 1, width: 1, value }],
          columns: [0],
        },
      ],
    },
  };
}

export function getHeight<V>(table: Table<V>) {
  return table.body.height + (table.header?.height || 0);
}

export function getWidth<V>(table: Table<V>) {
  return table.body.width + (table.indexes?.width || 0);
}

// export function bakeTable<V>(
//   { body, header, indexes }: Table<V>,
//   cornerCellValue: V
// ): Block<V> {
//   const hasHeader = header !== undefined;
//   const hasIndexes = indexes !== undefined;
//   if (!hasHeader && !hasIndexes) {
//     return body;
//   }
//   const withIndexesRows = hasIndexes
//     ? indexes.rows.map((row, i) => row.concat(body.rows[i]))
//     : body.rows;
//   const width = body.width + (indexes?.width || 0);
//   if (!hasHeader) {
//     return {
//       height: body.height,
//       width,
//       rows: withIndexesRows,
//     };
//   }
//   const height = body.height + header.height;
//   if (!hasIndexes) {
//     return {
//       height,
//       width,
//       rows: header.rows.concat(withIndexesRows),
//     };
//   }
//   const rows: Row<V>[] = [
//     [
//       {
//         height: header.height,
//         width,
//         value: cornerCellValue,
//       },
//       ...header.rows[0],
//     ],
//     ...header.rows.slice(1),
//     ...withIndexesRows,
//   ];
//   return {
//     height,
//     width,
//     rows,
//   };
// }

export function areProportionalBlocksEqual<V>(
  blocks: Block<V>[],
  lcmHeight: number
) {
  const multipliers = blocks.map((b) => lcmHeight / b.height);
  const firstBlockRows = blocks[0].rows;
  const firstBlockMultiplier = multipliers[0];
  let i = 0;
  let p = 0;
  // Loop over rows
  while ((p = i * firstBlockMultiplier) < firstBlockRows.length) {
    const firstBlockRow = firstBlockRows[p].cells;
    // Loop over cells
    for (let j = 0; j < firstBlockRow.length; j++) {
      const firstBlockCell = firstBlockRow[j];
      // Loop over other blocks
      for (let k = 1; k < blocks.length; k++) {
        const cell = blocks[k].rows[i * multipliers[k]].cells[j];
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
  property: "width" | "height"
) {
  const newRows = rows.slice();
  for (const [rowId, cells] of toResize) {
    const newRow = newRows[rowId].cells.slice();
    for (const [cellId, diff] of cells) {
      newRow[cellId] = {
        ...newRow[cellId],
        [property]: newRow[cellId][property] + diff,
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
  const bottomPositions = array<{
    cell: Cell<V>;
    rowIndex: number;
    colIndex: number;
  } | null>(width, () => null);
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
    { cell: Cell<V>; columnIndex: number; indexInRow: number } | undefined
  >(height);
  for (let i = 0; i < rows.length; i++) {
    const { cells, columns } = rows[i];
    const index = cells.length - 1;
    rightPositions[i] = {
      cell: cells[index],
      columnIndex: columns[index],
      indexInRow: index,
    };
  }
  const toResize = new Map<number, Map<number, number>>();
  for (let i = 0; i < height; i++) {
    const position = rightPositions[i];
    if (!position) {
      continue;
    }
    const diff = width - position.columnIndex - position.cell.width;
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
