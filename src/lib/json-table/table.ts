import { array } from "@/lib/array";
import { lcm, max } from "@/lib/math";

import {
  Block,
  BlockCompositor,
  CellType,
  ProportionalResizeGuard,
  Row,
  TABLE_COMPONENT_SIZE_ASPECTS,
  TABLE_COMPONENT_OPPOSITES,
  Table,
  TableComponent,
  TableCompositor,
  BlockTransform,
  BlockSizeAspect,
  ComposedTable,
} from "./core";
import { mergeRows, prependCell, rebaseColumns, shiftRows } from "./row";
import {
  areProportionalBlocksEqual,
  makeBlockHeightScaler,
  makeBlockWidthScaler,
  makeHorizontalBlockStacker,
  makeVerticalBlockStacker,
} from "./block";

export interface BakeOptions<V> {
  bakeHead?: boolean;
  bakeIndexes?: boolean;
  cornerCellValue: V;
}

export function tryDeduplicateComponent<V>(
  tables: Table<V>[],
  component: "head" | "indexes",
  proportionalResizeGuard: ProportionalResizeGuard
): Block<V> | null {
  const { [component]: cmp } = tables[0];
  if (!cmp) {
    return null;
  }
  const blocks = [cmp];
  let lcmHeight = cmp.height;
  let lcmWidth = cmp.width;
  let maxHeight = cmp.height;
  let maxWidth = cmp.width;
  for (let i = 1; i < tables.length; i++) {
    const cmp = tables[i][component];
    if (!cmp) {
      return null;
    }
    maxHeight = max(maxHeight, cmp.height);
    maxWidth = max(maxWidth, cmp.width);
    lcmHeight = lcm(lcmHeight, cmp.height);
    lcmWidth = lcm(lcmWidth, cmp.width);
    blocks.push(cmp);
  }
  if (
    !proportionalResizeGuard(lcmHeight, maxHeight) ||
    !proportionalResizeGuard(lcmWidth, maxWidth) ||
    !areProportionalBlocksEqual({
      blocks,
      lcmWidth,
      lcmHeight,
    })
  ) {
    return null;
  }
  return cmp;
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
      ? indexes.rows.map((row, i) =>
          mergeRows(row, indexes.width, body.rows[i])
        )
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
        width: indexes.width,
        value: cornerCellValue,
        type: CellType.Corner,
      }),
      ...shiftRows(head.rows.slice(1), indexes.width),
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

export interface TableStackerOptions<C extends TableComponent, V> {
  isProportionalResize: ProportionalResizeGuard;
  cornerCellValue: V;
  deduplicationComponent: C;
}

const TABLE_COMPONENT_TO_BAKE_OPTIONS: Record<
  TableComponent,
  "bakeHead" | "bakeIndexes"
> = {
  head: "bakeHead",
  indexes: "bakeIndexes",
};

const SIZE_ASPECT_SCALE_FACTORIES: Record<
  BlockSizeAspect,
  <V>(value: number) => BlockTransform<V>
> = {
  width: makeBlockWidthScaler,
  height: makeBlockHeightScaler,
};

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
  return (tables) => {
    const opposite = TABLE_COMPONENT_OPPOSITES[deduplicationComponent];
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
        [TABLE_COMPONENT_TO_BAKE_OPTIONS[deduplicationComponent]]: bake,
        [TABLE_COMPONENT_TO_BAKE_OPTIONS[opposite]]: stacked === null,
        cornerCellValue,
      })
    );
    const body = blockStacker(baked);
    const aspect = TABLE_COMPONENT_SIZE_ASPECTS[opposite];
    const scaled =
      deduplicated &&
      SIZE_ASPECT_SCALE_FACTORIES[aspect]<V>(body[aspect])(deduplicated);
    // @ts-expect-error too dynamic
    const composedTable: ComposedTable<V> = {
      body,
      baked,
      [deduplicationComponent]: scaled,
      [opposite]: stacked,
    };
    return composedTable;
  };
}
