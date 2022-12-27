import { Cell as ExcelCell, Column, Row, Workbook } from 'exceljs'

import { generate, Matrix } from 'lib/array'
import {
  Table,
  createMatrix,
  fromMatrix,
  isHeaderOrIndexCellType,
  Cell
} from 'lib/json-table'
import { isNumber, isString } from 'lib/guards'
import { max, sum } from 'lib/math'
import { Entry } from 'lib/entry'
import { JSONPrimitive } from 'lib/json'

export interface MatrixData {
  cell: Cell
  count: number
}

export interface CalculateSheetDataOptions {
  columnWidth: (
    column: MatrixData[],
    columnIndex: number,
    matrix: Matrix<MatrixData>,
    table: Table
  ) => number
  rowHeight: (
    row: MatrixData[],
    rowIndex: number,
    matrix: Matrix<MatrixData>,
    table: Table
  ) => number
}

export function calculateSheetData(
  table: Table,
  { columnWidth, rowHeight }: CalculateSheetDataOptions
) {
  const { width } = table
  const matrix = createMatrix(table, (cell) => ({
    cell,
    count:
      isString(cell.value) || isNumber(cell.value)
        ? String(cell.value).length / cell.height / cell.width
        : 0,
  }))
  const cells = fromMatrix(
    matrix,
    (cell) => cell.cell.type,
    (cell, row, col) => ({ value: cell.cell.value, row: row + 1, col: col + 1 })
  ).rows.flat()
  return {
    widths: generate(width, (i) =>
      columnWidth(
        matrix.map((row) => row[i]),
        i,
        matrix,
        table
      )
    ),
    heights: matrix.map((row, i) => rowHeight(row, i, matrix, table)),
    cells,
  }
}

export type MakeWorkBookOptions = Partial<
  CalculateSheetDataOptions & {
    cellMinHeight: number
    cellMinWidth: number
    modifyColumn: (column: Column, columnIndex: number) => void
    modifyRow: (row: Row, rowIndex: number) => void
    modifyCell: (
      sheetCell: ExcelCell,
      matrixCell: Cell<{ value: JSONPrimitive; col: number; row: number }>,
      matrixCellIndex: number
    ) => void
  }
>

export function makeWorkBook(
  tables: Entry<Table>[],
  {
    cellMinHeight = 22,
    cellMinWidth = 10,
    modifyCell,
    modifyColumn,
    modifyRow,
    ...options
  }: MakeWorkBookOptions = {}
): Workbook {
  const wb = new Workbook()
  tables.forEach(([title, table]) => {
    const sheet = wb.addWorksheet(title)
    const { heights, widths, cells } = calculateSheetData(table, {
      columnWidth: (column) => {
        const counts = column.map((cell) => cell.count)
        return Math.max(
          Math.ceil(counts.reduce(sum) / table.height + counts.reduce(max)),
          cellMinWidth
        )
      },
      rowHeight: (row) =>
        Math.max(
          Math.ceil(
            (row.map(({ count }) => count).reduce(sum) / table.width) * 2
          ),
          cellMinHeight
        ),
      ...options,
    })
    widths.forEach((width, i) => {
      const column = sheet.getColumn(i + 1)
      column.width = width
      modifyColumn?.(column, i + 1)
    })
    heights.forEach((height, i) => {
      const row = sheet.getRow(i + 1)
      row.height = height
      modifyRow?.(row, i + 1)
    })
    cells.forEach((matrixCell, i) => {
      const {
        height,
        width,
        type,
        value: { col, row, value },
      } = matrixCell
      const sheetCell = sheet.getRow(row).getCell(col)
      sheetCell.value = value
      sheetCell.alignment = { vertical: 'middle', wrapText: true }
      if (isHeaderOrIndexCellType(type)) {
        sheetCell.font = { bold: true }
      }
      modifyCell?.(sheetCell, matrixCell, i)
      if (height > 1 || width > 1) {
        sheet.mergeCells(row, col, row + height - 1, col + width - 1)
      }
    })
  })
  return wb
}
