import { JSONPrimitiveOrNull } from "@/lib/json";

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
