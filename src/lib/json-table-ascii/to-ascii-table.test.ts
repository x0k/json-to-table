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
    const ascii = toASCIITable(table);
    expect(`\n${ascii}`).toBe(
      `
+---+
| a |
+---+`
    );
  });
  it("Should't strip cell values", () => {
    const table: Table = {
      height: 2,
      width: 2,
      rows: [
        [
          {
            type: CellType.Header,
            height: 1,
            width: 1,
            value: "name",
          },
          {
            type: CellType.Header,
            height: 1,
            width: 1,
            value: "private",
          },
        ],
        [
          {
            type: CellType.Value,
            height: 1,
            width: 1,
            value: "json-to-table",
          },
          {
            type: CellType.Value,
            height: 1,
            width: 1,
            value: "true",
          },
        ],
      ],
    };
    const ascii = toASCIITable(table);
    expect(`\n${ascii}`).toBe(`
+---------------+---------+
|     name      | private |
+---------------+---------+
| json-to-table | true    |
+---------------+---------+`);
  });
});
