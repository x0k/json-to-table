import { toASCIITable } from "../json-table-ascii/to-ascii-table";

import { makeTableFactory } from "./table-factory";
import simpleHeadersDuplication from "./__fixtures__/simple-headers-duplication.json";

describe("makeTableFactory", () => {
  const factory = makeTableFactory({});

  it("Should create table for primitives", () => {
    const data = [false, 12345, "abcde"];
    for (const value of data) {
      const table = factory(value);
      const ascii = toASCIITable(table);
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
    const ascii = toASCIITable(table);
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
    const ascii = toASCIITable(table);
    console.log(ascii);
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
    const factory = makeTableFactory({ collapseIndexes: true });
    const data = [1, 2, [11, 22]];
    const table = factory(data);
    console.log(JSON.stringify(table));
    const ascii = toASCIITable(table);
    console.log(ascii);
    expect(`\n${ascii}\n`).toBe(`
+-----+----+
|  1  |  1 |
+-----+----+
|  2  |  2 |
+-----+----+
| 3.1 | 11 |
+-----+----+
| 3.2 | 22 |
+-----+----+
`);
  });

  it("Should deduplicate table headers", () => {
    const table = factory(simpleHeadersDuplication);
    const ascii = toASCIITable(table);
    console.log(ascii);
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
