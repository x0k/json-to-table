import { CellType, Table } from "@/lib/json-table/model";

import { toASCIITable } from "./to-ascii-table";
import numberTable from './__fixtures__/number-table.json';
import stripCaseTable from './__fixtures__/strip-case-table.json'

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
    const ascii = toASCIITable(stripCaseTable as Table);
    expect(`\n${ascii}`).toBe(`
+---------------+---------+
|     name      | private |
+---------------+---------+
| json-to-table | true    |
+---------------+---------+`);
  });
  it('Should properly work with numbers', () => {
    const ascii = toASCIITable(numberTable as Table);
    console.log(ascii);
    // expect(`\n${ascii}`).toBe(``)
  })
});
