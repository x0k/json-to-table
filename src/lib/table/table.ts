import { lcm, max } from "@/lib/math";

import {
  Block,
  BlockCompositor,
  ProportionalResizeGuard,
  Row,
  Table,
  TableCompositor,
} from "./core";
import { mergeRows, prependRow, shiftRows } from "./row";
import { areProportionalBlocksEqual, makeBlockWidthScaler } from "./block";

export interface BakeOptions<V> {
  bakeHead?: boolean;
  bakeIndexes?: boolean;
  cornerCellValue: V;
}

export function tryDeduplicateHead<V>(
  tables: Table<V>[],
  isProportionalSizeAdjustment: ProportionalResizeGuard
): Block<V> | null {
  const heads: Block<V>[] = [];
  let lcmHeight = heads[0].height;
  let maxHeight = heads[0].height;
  let minHeightHeadIndex = 0;
  for (let i = 0; i < tables.length; i++) {
    const head = tables[i].head;
    if (!head) {
      return null;
    }
    lcmHeight = lcm(lcmHeight, head.height);
    maxHeight = max(maxHeight, head.height);
    heads.push(head);
    if (head.height < heads[minHeightHeadIndex].height) {
      minHeightHeadIndex = i;
    }
  }
  if (
    !isProportionalSizeAdjustment(lcmHeight, maxHeight) ||
    !areProportionalBlocksEqual(heads, lcmHeight)
  ) {
    return null;
  }
  return heads[minHeightHeadIndex];
}

export function makeTableBaker<V>({
  bakeHead,
  bakeIndexes,
  cornerCellValue,
}: BakeOptions<V>) {
  return ({ body, head, indexes }: Table<V>) => {
    if (!bakeHead && !bakeIndexes) {
      return body;
    }
    const useHead = bakeHead && head !== null;
    const useIndexes = bakeIndexes && indexes !== null;
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

export function tryStackComponent<V>(
  tables: Table<V>[],
  component: "head" | "indexes",
  compose: BlockCompositor<V>
) {
  const components: Block<V>[] = [];
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const cmp = table[component];
    if (cmp === null) {
      return null;
    }
    components.push(cmp);
  }
  return compose(components);
}

export interface VerticalTableStackerOptions<V> {
  isProportionalResize: ProportionalResizeGuard;
  verticalBlockStacker: BlockCompositor<V>;
  cornerCellValue: V;
}

export function makeVerticalTableStacker<V>({
  cornerCellValue,
  verticalBlockStacker,
  isProportionalResize,
}: VerticalTableStackerOptions<V>): TableCompositor<V> {
  return function stackTablesVertically(tables) {
    const stackedIndexes = tryStackComponent(
      tables,
      "indexes",
      verticalBlockStacker
    );
    const deduplicatedHead = tryDeduplicateHead(tables, isProportionalResize);
    const bakeTable = makeTableBaker({
      bakeHead: deduplicatedHead === null,
      bakeIndexes: stackedIndexes === null,
      cornerCellValue,
    });
    const stackedBody = verticalBlockStacker(tables.map(bakeTable));
    const scale = makeBlockWidthScaler<V>(stackedBody.width);
    return {
      body: stackedBody,
      head: deduplicatedHead && scale(deduplicatedHead),
      indexes: stackedIndexes,
    };
  };
}
