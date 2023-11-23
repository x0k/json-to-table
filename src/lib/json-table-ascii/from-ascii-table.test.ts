import { getSimpleMySqlASCIITableSeparatorType } from './core';
import {
  fromASCIITableWithBottomRightShift,
  fromASCIITableWithLeftTopShift,
} from "./from-ascii-table";
import { toASCIITable } from './to-ascii-table';

describe("fromASCIITable", () => {
  it("Should work with simple table", () => {
    const { value } = fromASCIITableWithBottomRightShift(
      `
+---+
| a |
+---+
`,
      getSimpleMySqlASCIITableSeparatorType
    ).rows[0][0];
    expect(value).toBe("a");
  });

  it("Should work with complex table", () => {
    const table = fromASCIITableWithLeftTopShift(
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
  const ascii = toASCIITable(table);
  console.log(ascii);
  });
});
