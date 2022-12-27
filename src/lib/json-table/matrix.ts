import { generate, Matrix } from 'lib/array'

import { Table, Row, CellType, Cell } from './model'

const UNDEFINED_CELL = Symbol('undefined cell')

export function createMatrix<T, R>(
  { height, width, rows }: Table<T>,
  getValue: (
    cell: Cell<T>,
    rowIndex: number,
    colIndex: number,
    indexInRow: number
  ) => R
): Matrix<R> {
  const matrix: Matrix<typeof UNDEFINED_CELL | R> = generate(height, () =>
    generate(width, () => UNDEFINED_CELL)
  )
  for (let i = 0; i < height; i++) {
    const row = rows[i]
    for (let j = 0; j < row.length; j++) {
      const cell = row[j]
      const { height: cellHeight, width: cellWidth } = cell
      const position = matrix[i].indexOf(UNDEFINED_CELL)
      if (position === -1) {
        throw new Error('Invalid table')
      }
      const value = getValue(cell, i, position, j)
      for (let h = i; h < i + cellHeight && h < height; h++) {
        for (let w = position; w < position + cellWidth && w < width; w++) {
          matrix[h][w] = value
        }
      }
    }
  }
  return matrix as Matrix<R>
}

/** Uses reference equality to define cell boundaries */
export function fromMatrix<T, R>(
  matrix: Matrix<T>,
  getCellType: (value: T, rowIndex: number, colIndex: number) => CellType,
  getCellValue: (value: T, rowIndex: number, colIndex: number) => R
): Table<R> {
  const height = matrix.length
  const width = matrix[0].length
  const cells = new Set<T>()
  const rows = generate(height, (): Row<R> => [])
  for (let i = 0; i < height; i++) {
    let j = 0
    while (j < width) {
      const cell = matrix[i][j]
      if (cells.has(cell)) {
        j++
        continue
      }
      let h = 1
      while (i + h < height && matrix[i + h][j] === cell) {
        h++
      }
      const wStart = j++
      while (j < width && matrix[i][j] === cell) {
        j++
      }
      rows[i].push({
        height: h,
        width: j - wStart,
        type: getCellType(cell, i, wStart),
        value: getCellValue(cell, i, wStart),
      })
      cells.add(cell)
    }
  }
  return {
    height,
    width,
    rows,
  }
}
