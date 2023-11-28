import { blockToASCIITable } from "./block-to-ascii-table";
import { JSONPrimitiveOrNull } from "./json";
import { makeTableFactory } from "./json-to-table";
import { makeTableBaker } from "./table";

import simpleHeadersDuplication from "./__fixtures__/simple-headers-duplication.json";
import simpleIndexesDeduplication from "./__fixtures__/simple-indexes-deduplication.json";

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

  it("Should create table for arrays", () => {
    const data = [1, 2, [11, 22]];
    const table = factory(data);
    const ascii = blockToASCIITable(bake(table));
    expect(`\n${ascii}\n`).toBe(`
+---+--------+
| 1 |      1 |
+---+--------+
| 2 |      2 |
+---+---+----+
|   | 1 | 11 |
| 3 +---+----+
|   | 2 | 22 |
+---+---+----+
`);
  });

  it("Should create table for arrays with indexes collapse", () => {
    const factory = makeTableFactory({
      cornerCellValue,
      collapseIndexes: true,
    });
    const data = [
      [1, 2],
      [11, 22],
    ];
    const table = factory(data);
    const ascii = blockToASCIITable(bake(table));
    expect(`\n${ascii}\n`).toBe(`
+-----+----+
| 1.1 |  1 |
+-----+----+
| 1.2 |  2 |
+-----+----+
| 2.1 | 11 |
+-----+----+
| 2.2 | 22 |
+-----+----+
`);
  });

  it("Should deduplicate table headers", () => {
    const table = factory(simpleHeadersDuplication);
    const ascii = blockToASCIITable(bake(table));
    expect(`\n${ascii}\n`).toBe(`
+---+---+---+---+
| № | a | b | c |
+---+---+---+---+
| 1 | 1 | 2 | 3 |
+---+---+---+---+
| 2 | 4 | 5 | 6 |
+---+---+---+---+
| 3 | 7 | 8 | 9 |
+---+---+---+---+
`);
  });

  it("Should deduplicate table indexes", () => {
    const table = factory(simpleIndexesDeduplication);
    const ascii = blockToASCIITable(bake(table));
    expect(`\n${ascii}\n`).toBe(`
+---+---+---+---+
| № | a | b | c |
+---+---+---+---+
| 1 | 1 | 2 | 3 |
+---+---+---+---+
| 2 | 4 | 5 | 6 |
+---+---+---+---+
| 3 | 7 | 8 | 9 |
+---+---+---+---+
`);
  });
});
