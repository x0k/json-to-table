import { type Block, CellType } from "@/lib/json-table";
import type { Entry } from "@/lib/entry";
import { escapeHtml } from "@/lib/html";

export const HTML_TABLE_STYLES = `table, th, td {border: 1px solid black; border-collapse: collapse;} th, td {padding: 5px; text-align: left;} th:has(> b), td:has(> b) {text-align: center;}`;

export function renderTable(model: Block) {
  const rows: string[] = [];
  let r = 0;
  let index = model.data.indexes[r];
  for (let i = 0; i < model.height; i++) {
    if (i === index) {
      const row = model.data.rows[r];
      rows.push(
        `<tr>${row.cells
          .map((cell) => {
            const val =
              typeof cell.value === "string"
                ? escapeHtml(cell.value)
                : cell.value;
            return `<td colspan="${cell.width}" rowspan="${cell.height}">${
              cell.type !== CellType.Value ? `<b>${val}</b>` : val
            }</td>`;
          })
          .join("\n")}</tr>`
      );
      index = model.data.indexes[++r];
    } else {
      rows.push(`<tr></tr>`);
    }
  }
  return `<table>${rows.join("\n")}</table>`;
}

export function makeHTMLPageContent(tables: Entry<Block>[]) {
  return tables.length > 1
    ? tables
        .map(([title, table]) => `<h2>${title}</h2>${renderTable(table)}`)
        .join("<br />")
    : renderTable(tables[0][1]);
}
