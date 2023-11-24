import { Table, isHeaderOrIndexCellType } from "@/lib/json-table";
import { Entry } from "@/lib/entry";

export const HTML_TABLE_STYLES = `table, th, td {border: 1px solid black; border-collapse: collapse;} th, td {padding: 5px; text-align: left;} th:has(> b), td:has(> b) {text-align: center;}`;

export function renderTable(model: Table) {
  return `<table>${model.rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td colspan="${cell.width}" rowspan="${cell.height}">${
                isHeaderOrIndexCellType(cell.type)
                  ? `<b>${cell.value}</b>`
                  : cell.value
              }</td>`
          )
          .join("\n")}</tr>`
    )
    .join("\n")}</table>`;
}

export function makeHTMLPageContent(tables: Entry<Table>[]) {
  return tables.length > 1
    ? tables
        .map(([title, table]) => `<h2>${title}</h2>${renderTable(table)}`)
        .join("<br />")
    : renderTable(tables[0][1]);
}
