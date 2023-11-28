import { blockToASCII } from "./block-to-ascii";
import { Block, CellType } from "./json-table";

describe("blockToASCII", () => {
  it("Should work with simple table", () => {
    const table: Block = {
      width: 1,
      height: 1,
      rows: [
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
});
