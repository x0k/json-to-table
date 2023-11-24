import { toASCIITable } from "../json-table-ascii/to-ascii-table";

import { TableFactory } from "./model";
import { makeTableFactory } from "./table-factory";

describe("makeTableFactory", () => {
  let factory: TableFactory;

  beforeEach(() => {
    factory = makeTableFactory({});
  });

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
    // expect(`\n${ascii}\n`).toBe(``)
  })
});
