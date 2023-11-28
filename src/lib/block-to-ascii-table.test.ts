import { blockToASCIITable } from "./block-to-ascii-table";
import { Block, CellType } from "./json-table";

describe("blockToASCIITable", () => {
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
    const ascii = blockToASCIITable(table);
    expect(`\n${ascii}`).toBe(
      `
+---+
| a |
+---+`
    );
  });
});
