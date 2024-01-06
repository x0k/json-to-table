import { array } from "@/lib/array";
import { lcm, max } from "@/lib/math";

import {
  Block,
  BlockCompositor,
  CellType,
  ProportionalResizeGuard,
  Cells,
  TABLE_COMPONENT_SIZE_ASPECTS,
  TABLE_COMPONENT_OPPOSITES,
  Table,
  TableComponent,
  TableCompositor,
  ComposedTable,
} from "./core";
import { concatRows, rowPrepend, shiftColumns, shiftRows } from "./row";
import {
  areBlocksEqual,
  makeBlockScaler,
  makeHorizontalBlockStacker,
  makeVerticalBlockStacker,
} from "./block";

export interface BakeOptions<V> {
  head?: boolean;
  indexes?: boolean;
  cornerCellValue: V;
}

function bestHead<V>(a: Block<V>, b: Block<V>) {
  if (a.width === b.width) {
    return a.height < b.height ? a : b;
  }
  return a.width > b.width ? a : b;
}

function bestIndexes<V>(a: Block<V>, b: Block<V>) {
  if (a.height === b.height) {
    return a.width < b.width ? a : b;
  }
  return a.height > b.height ? a : b;
}

const TABLE_COMPONENT_SELECTORS: Record<
  TableComponent,
  <V>(a: Block<V>, b: Block<V>) => Block<V>
> = {
  head: bestHead,
  indexes: bestIndexes,
};

export function tryDeduplicateComponent<V>(
  tables: Table<V>[],
  component: TableComponent,
  proportionalResizeGuard: ProportionalResizeGuard
): Block<V> | null {
  const { [component]: cmp } = tables[0];
  if (!cmp) {
    return null;
  }
  const select = TABLE_COMPONENT_SELECTORS[component];
  const blocks = [cmp];
  let bestCmp = cmp;
  let lcmHeight = cmp.height;
  let lcmWidth = cmp.width;
  let maxHeight = cmp.height;
  let maxWidth = cmp.width;
  for (let i = 1; i < tables.length; i++) {
    const cmp = tables[i][component];
    if (!cmp) {
      return null;
    }
    bestCmp = select(bestCmp, cmp);
    maxHeight = max(maxHeight, cmp.height);
    maxWidth = max(maxWidth, cmp.width);
    lcmHeight = lcm(lcmHeight, cmp.height);
    lcmWidth = lcm(lcmWidth, cmp.width);
    blocks.push(cmp);
  }
  const isHeightProportional = proportionalResizeGuard(lcmHeight, maxHeight);
  const isWidthProportional = proportionalResizeGuard(lcmWidth, maxWidth);
  if (
    !(component === "head" ? isHeightProportional : isWidthProportional) ||
    !areBlocksEqual({
      blocks,
      width: isWidthProportional ? lcmWidth : maxWidth,
      widthIsLcm: isWidthProportional,
      height: isHeightProportional ? lcmHeight : maxHeight,
      heightIsLcm: isHeightProportional,
    })
  ) {
    return null;
  }
  return bestCmp;
}

export function makeTableBaker<V>({
  head: bakeHead,
  indexes: bakeIndexes,
  cornerCellValue,
}: BakeOptions<V>) {
  return ({ body, head, indexes }: Table<V>) => {
    if (!bakeHead && !bakeIndexes) {
      return body;
    }
    const useHead = bakeHead && head !== null;
    const useIndexes = bakeIndexes && indexes !== null;
    const withIndexesRows = useIndexes
      ? indexes.data.map((row, i) =>
          concatRows(row, indexes.width, body.data[i])
        )
      : body.data;
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
        rows: head.data.concat(withIndexesRows),
      };
    }
    const firstHeadRow = head.data[0];
    const rows: Cells<V>[] = [
      rowPrepend(firstHeadRow, {
        height: head.height,
        width: indexes.width,
        value: cornerCellValue,
        type: CellType.Corner,
      }),
      ...shiftRows(head.data.slice(1), indexes.width),
      ...withIndexesRows,
    ];
    return {
      height,
      width,
      rows,
    };
  };
}

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
          data: [
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
            ...cmp.data,
          ],
        });
        break;
      case "head":
        blocks.push({
          height: cmp.height,
          width: cmp.width + opposite.width,
          data: [
            {
              cells: [
                {
                  height: cmp.height,
                  width: opposite.width,
                  value: cornerCellValue,
                  type: CellType.Corner,
                },
                ...cmp.data[0].cells,
              ],
              columns: [
                0,
                ...shiftColumns(cmp.data[0].columns, opposite.width),
              ],
            },
            ...cmp.data.slice(1),
          ],
        });
        break;
      default:
        throw new Error(`Unknown table component: ${component}`);
    }
  }
  return compose(blocks);
}

export interface TableStackerOptions<C extends TableComponent, V> {
  isProportionalResize: ProportionalResizeGuard;
  cornerCellValue: V;
  deduplicationComponent: C;
}

const TABLE_COMPONENT_TO_BLOCK_STACKERS: Record<
  TableComponent,
  <V>(guard: ProportionalResizeGuard) => BlockCompositor<V>
> = {
  head: makeVerticalBlockStacker,
  indexes: makeHorizontalBlockStacker,
};

export function makeTableStacker<C extends TableComponent, V>({
  deduplicationComponent,
  isProportionalResize,
  cornerCellValue,
}: TableStackerOptions<C, V>): TableCompositor<V> {
  const blockStacker =
    TABLE_COMPONENT_TO_BLOCK_STACKERS[deduplicationComponent]<V>(
      isProportionalResize
    );
  const opposite = TABLE_COMPONENT_OPPOSITES[deduplicationComponent];
  return (tables) => {
    const deduplicated = tryDeduplicateComponent(
      tables,
      deduplicationComponent,
      isProportionalResize
    );
    const bake = deduplicated === null;
    const stacked = tryStackTableComponent(
      tables,
      opposite,
      bake,
      cornerCellValue,
      blockStacker
    );
    const baked = tables.map(
      makeTableBaker({
        [deduplicationComponent]: bake,
        [opposite]: stacked === null,
        cornerCellValue,
      })
    );
    const body = blockStacker(baked);
    const aspect = TABLE_COMPONENT_SIZE_ASPECTS[opposite];
    const scaled =
      deduplicated && makeBlockScaler<V>(aspect, body[aspect])(deduplicated);
    const composedTable: ComposedTable<V> = {
      body,
      baked,
      [deduplicationComponent as "head"]: scaled,
      [opposite as "indexes"]: stacked,
    };
    return composedTable;
  };
}
