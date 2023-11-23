import { fromASCIITable, getSimpleMySqlASCIITableSeparatorType } from "./index";

describe("fromASCIITable", () => {
  it("Should work with simple table", () => {
    const { value } = fromASCIITable(
      `
+---+
| a |
+---+
`,
      getSimpleMySqlASCIITableSeparatorType
    ).rows[0][0];
    expect(value).toBe("a");
  });
});
