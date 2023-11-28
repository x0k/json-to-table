import { blockToASCIITable } from "./block-to-ascii-table";
import { JSONPrimitiveOrNull } from "./json";
import { makeTableFactory } from "./json-to-table";
import { makeTableBaker } from "./table";

describe("makeTableFactory", () => {
  const cornerCellValue = "№";
  const factory = makeTableFactory({ cornerCellValue });
  const bake = makeTableBaker<JSONPrimitiveOrNull>({
    cornerCellValue,
    bakeHead: true,
    bakeIndexes: true,
  });

  it("Should create table for primitives", () => {
    const data = [false, 12345, "abcde"];
    for (const value of data) {
      const table = factory(value);
      const ascii = blockToASCIITable(bake(table));
      expect(`\n${ascii}`).toBe(`
+-------+
| ${value} |
+-------+`);
    }
  });

  it("Should create table for objects", () => {
    const data = {
      a: 1,
      b: 2,
      c: { aa: 11, bb: 22 },
    };
    const table = factory(data);
    const ascii = blockToASCIITable(bake(table));
    expect(`\n${ascii}\n`).toBe(`
+---+---+---------+
| a | b |    c    |
+---+---+----+----+
|   |   | aa | bb |
| 1 | 2 +----+----+
|   |   | 11 | 22 |
+---+---+----+----+
`);
  });
});
