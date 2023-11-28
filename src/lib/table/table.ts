import { lcm, max } from "@/lib/math";
import { array } from "@/lib/array";

import {
  Block,
  BlockCompositor,
  CellType,
  ProportionalResizeGuard,
  Row,
  Table,
  TableCompositor,
} from "./core";
import { mergeRows, prependCell, rebaseColumns, shiftRows } from "./row";
import { areProportionalBlocksEqual, makeBlockWidthScaler } from "./block";

export interface BakeOptions<V> {
  bakeHead?: boolean;
  bakeIndexes?: boolean;
  cornerCellValue: V;
}

type TableComponent = "head" | "indexes";
type BlockSizeAspect = "height" | "width";

const TABLE_COMPONENT_MIN_ASPECTS: Record<TableComponent, BlockSizeAspect> = {
  head: "height",
  indexes: "width",
};

export function tryDeduplicateComponent<V>(
  tables: Table<V>[],
  component: "head" | "indexes",
  isProportionalSizeAdjustment: ProportionalResizeGuard
): Block<V> | null {
  const { [component]: cmp } = tables[0];
  if (!cmp) {
    return null;
  }
  const blocks = [cmp];
  let lcmHeight = cmp.height;
  let maxHeight = cmp.height;
  let minIndex = 0;
  const minAspect = TABLE_COMPONENT_MIN_ASPECTS[component];
  for (let i = 1; i < tables.length; i++) {
    const cmp = tables[i][component];
    if (!cmp) {
      return null;
    }
    lcmHeight = lcm(lcmHeight, cmp.height);
    maxHeight = max(maxHeight, cmp.height);
    blocks.push(cmp);
    if (cmp[minAspect] < blocks[minIndex][minAspect]) {
      minIndex = i;
    }
  }
  if (
    !isProportionalSizeAdjustment(lcmHeight, maxHeight) ||
    !areProportionalBlocksEqual(blocks, lcmHeight)
  ) {
    return null;
  }
  return blocks[minIndex];
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
      prependCell(firstHeadRow, {
        height: head.height,
        width,
        value: cornerCellValue,
        type: CellType.Corner,
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

const TABLE_COMPONENT_OPPOSITES: Record<TableComponent, TableComponent> = {
  head: "indexes",
  indexes: "head",
};

export function tryStackTableComponent<V>(
  tables: Table<V>[],
  component: TableComponent,
  bake: boolean,
  cornerCellValue: V,
  compose: BlockCompositor<V>
) {
  const blocks: Block<V>[] = [];
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const {
      [component]: cmp,
      [TABLE_COMPONENT_OPPOSITES[component]]: opposite,
    } = table;
    if (cmp === null) {
      return null;
    }
    if (!bake || !opposite) {
      blocks.push(cmp);
      continue;
    }
    switch (component) {
      case "indexes":
        blocks.push({
          height: cmp.height + opposite.height,
          width: cmp.width,
          rows: [
            {
              cells: [
                {
                  height: opposite.height,
                  width: cmp.width,
                  value: cornerCellValue,
                  type: CellType.Corner,
                },
              ],
              columns: [0],
            },
            ...array(opposite.height - 1, () => ({
              cells: [],
              columns: [],
            })),
            ...cmp.rows,
          ],
        });
        break;
      case "head":
        blocks.push({
          height: cmp.height,
          width: cmp.width + opposite.width,
          rows: [
            {
              cells: [
                {
                  height: cmp.height,
                  width: opposite.width,
                  value: cornerCellValue,
                  type: CellType.Corner,
                },
                ...cmp.rows[0].cells,
              ],
              columns: [
                0,
                ...rebaseColumns(cmp.rows[0].columns, opposite.width),
              ],
            },
            ...cmp.rows.slice(1),
          ],
        });
        break;
      default:
        throw new Error();
    }
  }
  return compose(blocks);
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
    const deduplicatedHead = tryDeduplicateComponent(
      tables,
      "head",
      isProportionalResize
    );
    const bakeHead = deduplicatedHead === null;
    const stackedIndexes = tryStackTableComponent(
      tables,
      "indexes",
      bakeHead,
      cornerCellValue,
      verticalBlockStacker
    );
    const bakeTable = makeTableBaker({
      bakeHead,
      bakeIndexes: stackedIndexes === null,
      cornerCellValue,
    });
    const baked = tables.map(bakeTable);
    const body = verticalBlockStacker(baked);
    return {
      body,
      head:
        deduplicatedHead &&
        makeBlockWidthScaler<V>(body.width)(deduplicatedHead),
      indexes: stackedIndexes,
      baked,
    };
  };
}

export interface HorizontalTableStackerOptions<V> {
  isProportionalResize: ProportionalResizeGuard;
  horizontalBlockStacker: BlockCompositor<V>;
  cornerCellValue: V;
}

export function makeHorizontalTableStacker<V>({
  cornerCellValue,
  horizontalBlockStacker,
  isProportionalResize,
}: HorizontalTableStackerOptions<V>): TableCompositor<V> {
  return (tables) => {
    const deduplicatedIndexes = tryDeduplicateComponent(
      tables,
      "indexes",
      isProportionalResize
    );
    const bakeIndexes = deduplicatedIndexes === null;
    const stackedHeads = tryStackTableComponent(
      tables,
      "head",
      bakeIndexes,
      cornerCellValue,
      horizontalBlockStacker
    )
    const bakeTable = makeTableBaker({
      bakeIndexes,
      bakeHead: stackedHeads === null,
      cornerCellValue,
    })
    const baked = tables.map(bakeTable);
    const body = horizontalBlockStacker(baked);
    return {
      body,
      indexes:
        deduplicatedIndexes &&
        makeBlockHeightScaler<V>(body.height)(deduplicatedIndexes),
      head: stackedHeads,
      baked,
    }
  };
}
