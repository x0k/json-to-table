import { Table, isHeaderOrIndexCellType } from '@/lib/json-table'
import { Entry } from '@/lib/entry'

export const defaultStyle = `table, th, td {border: 1px solid black; border-collapse: collapse;} th, td {padding: 5px; text-align: left;}`

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
          .join('\n')}</tr>`
    )
    .join('\n')}</table>`
}

export const renderPage = (
  title: string,
  content: string,
  style: string
) => `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${style}
  </style>
</head>
<body>
  ${content}
</body>
</html>`

export function makeHTMLPage(
  pageTitle: string,
  tables: Entry<Table>[],
  style = defaultStyle
) {
  const content =
    tables.length > 1
      ? tables
          .map(([title, table]) => `<h2>${title}</h2>${renderTable(table)}`)
          .join('<br />')
      : renderTable(tables[0][1])
  return renderPage(pageTitle, content, style)
}
