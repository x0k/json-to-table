import { CellType, Table } from "@/lib/json-table/model";

import { toASCIITable } from "./to-ascii-table";

describe("toASCIITable", () => {
  it("Should work with simple table", () => {
    const table: Table = {
      width: 1,
      height: 1,
      rows: [
        [
          {
            type: CellType.Value,
            height: 1,
            width: 1,
            value: "a",
          },
        ],
      ],
    };
    const ascii = toASCIITable(table)
    console.log(ascii)
    expect(`\n${ascii}`).toBe(
      `
+---+
| a |
+---+`
    );
  });
});
