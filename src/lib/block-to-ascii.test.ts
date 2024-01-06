import { ASCIITableFormat, blockToASCII } from "./block-to-ascii";
import { Block, CellType, makeTableBaker } from "./json-table";
import { makeTableFactory } from "./json-to-table";
import { JSONPrimitiveOrNull } from "./json";

import differentHeaders from "./__fixtures__/different-headers.json";

describe("blockToASCII", () => {
  const cornerCellValue = "№";
  const factory = makeTableFactory({ cornerCellValue });
  const bake = makeTableBaker<JSONPrimitiveOrNull>({
    cornerCellValue,
    head: true,
    indexes: true,
  });

  it("Should work with simple table", () => {
    const table: Block = {
      width: 1,
      height: 1,
      data: [
        {
          cells: [
            {
              type: CellType.Value,
              height: 1,
              width: 1,
              value: "a",
            },
          ],
          columns: [0],
        },
      ],
    };
    const ascii = blockToASCII(table);
    expect(`\n${ascii}`).toBe(
      `
+---+
| a |
+---+`
    );
  });
  it("Should draw a simple markdown like table 1", () => {
    const table: Block = {
      width: 1,
      height: 1,
      data: [
        {
          cells: [
            {
              type: CellType.Value,
              height: 1,
              width: 1,
              value: "a",
            },
          ],
          columns: [0],
        },
      ],
    };
    const ascii = blockToASCII(table, {
      format: ASCIITableFormat.MarkdownLike,
    });
    expect(ascii).toBe("| a |");
  });
  it("Should draw a simple markdown like table 2", () => {
    const table = factory({
      a: 1,
      b: 2,
    } as any);
    const ascii = blockToASCII(bake(table), {
      format: ASCIITableFormat.MarkdownLike,
    });
    expect(`\n${ascii}`).toBe(
      `
| a | b |
|---|---|
| 1 | 2 |`
    );
  });
  it("Should draw a simple markdown like table 3", () => {
    const table = factory([
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      { a: 3, b: 4 },
    ]);
    const ascii = blockToASCII(bake(table), {
      format: ASCIITableFormat.MarkdownLike,
    });
    expect(`\n${ascii}`).toBe(
      `
| № | a | b |
|---|---|---|
| 1 | 1 | 2 |
| 2 | 2 | 3 |
| 3 | 3 | 4 |`
    );
  });
  it("Should draw an invalid markdown like table", () => {
    const table = factory(differentHeaders as any);
    const baked = bake(table);
    const ascii = blockToASCII(baked, {
      format: ASCIITableFormat.MarkdownLike,
    });
    expect(`\n${ascii}`).toBe(`
| 1 |         character_id         |       item_id       |
|   |------------------------------|---------------------|
|---|          5428010618020694593 |                  95 |
| 2 |    character_id     |    item_id     | stack_count |
|   | 5428010618020694593 |            101 |           4 |`);
  });
});
