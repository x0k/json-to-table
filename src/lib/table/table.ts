import { Row, Table } from "./core";
import { mergeRows, prependRow, shiftRows } from "./row";

export interface BakeOptions<V> {
  bakeHead?: boolean;
  bakeIndexes?: boolean;
  cornerCellValue: V;
}

export function makeBaker<V>({
  bakeHead,
  bakeIndexes,
  cornerCellValue,
}: BakeOptions<V>) {
  return ({ body, head, indexes }: Table<V>) => {
    if (!bakeHead && !bakeIndexes) {
      return body;
    }
    const useHead = bakeHead && head !== undefined;
    const useIndexes = bakeIndexes && indexes !== undefined;
    const withIndexesRows = useIndexes
      ? indexes.rows.map((row, i) => mergeRows(row, body.rows[i]))
      : body.rows;
    const width = body.width + (useIndexes ? indexes.width : 0);
    if (!useHead) {
      return {
        height: body.height,
        width,
        rows: withIndexesRows,
      };
    }
    const height = body.height + head.height;
    if (!useIndexes) {
      return {
        height,
        width,
        rows: head.rows.concat(withIndexesRows),
      };
    }
    const firstHeadRow = head.rows[0];
    const rows: Row<V>[] = [
      prependRow(firstHeadRow, {
        height: head.height,
        width,
        value: cornerCellValue,
      }),
      ...shiftRows(head.rows.slice(1), width),
      ...withIndexesRows,
    ];
    return {
      height,
      width,
      rows,
    };
  };
}
