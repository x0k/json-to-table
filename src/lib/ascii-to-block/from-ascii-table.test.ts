import { blockToASCII } from "../block-to-ascii";

import { getSimpleMySqlASCIITableSeparatorType } from "./core";
import { fromASCIITable } from "./from-ascii-table";

describe("fromASCIITable", () => {
  it("Should work with simple table", () => {
    const { value } = fromASCIITable(
      `
+---+
| a |
+---+
`,
      getSimpleMySqlASCIITableSeparatorType
    ).data.rows[0].cells[0];
    expect(value).toBe("a");
  });

  it("Should work with complex table", () => {
    const table = fromASCIITable(
      `
+--------------------------------------------+------------------------+
|                      Col1                  |          Col3          |
+----------------------------------+---------+------------------------+
| Value 1                          | Value 2 | 123                    |
+----------------------------------+---------+ with a tab or 4 spaces |
| This is a row with only one cell |         |                        |
+----------------------------------+---------+------------------------+
      `,
      getSimpleMySqlASCIITableSeparatorType
    );
    const ascii = blockToASCII(table);
    expect(`\n${ascii}`).toBe(`
+--------------------------------------------+------------------------+
|                    Col1                    |          Col3          |
+----------------------------------+---------+------------------------+
| Value 1                          | Value 2 | 123                    |
|                                  |         | with a tab or 4 spaces |
+----------------------------------+---------+                        |
| This is a row with only one cell |         |                        |
+----------------------------------+---------+------------------------+`);
  });
});
