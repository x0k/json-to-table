import { generate, isItemsEqual } from '@/lib/array'
import { isSomething } from '@/lib/guards'
import { JSONArray, compareJsonArray, JSONValue } from '@/lib/json'
import { gcd, min } from '@/lib/math'

import {
  Table,
  TableMeta,
  DeduplicationInterval,
  DeduplicationIntervalsCandidate,
  Cell,
  CellType,
  Row,
  BuildRowStructure,
  ComposeTables,
  getHeight,
  Interval,
  SplitIntoColumnsByHeaders,
  isHeaderOrIndexCellType,
} from './model'
import { createMatrix, fromMatrix } from './matrix'

function getDeduplicationInterval(
  { indexOfLastRowWithLegitHeader, structures }: Table & TableMeta,
  candidate: JSONValue[][]
): DeduplicationInterval | null {
  let start = 0
  while (
    start < indexOfLastRowWithLegitHeader &&
    compareJsonArray(structures[start], candidate[0]) !== 0
  ) {
    start++
  }
  if (start === indexOfLastRowWithLegitHeader) {
    return null
  }
  let end = 1
  while (
    start + end < indexOfLastRowWithLegitHeader &&
    end < candidate.length &&
    compareJsonArray(structures[start + end], candidate[end]) === 0
  ) {
    end++
  }
  return [start, end]
}

export function buildDeduplicateTableHeader(
  { width, rows }: Table,
  [from, length]: DeduplicationInterval
): Table {
  if (length === 1) {
    return {
      height: 1,
      width,
      rows: [
        rows[from].map((cell) => ({
          ...cell,
          type: CellType.Header,
          value: cell.type === CellType.Index ? '№' : cell.value,
          height: 1,
        })),
      ],
    }
  }
  let height = length
  let matrix = createMatrix(
    {
      height,
      width,
      rows: rows.slice(from, from + height),
    },
    (cell) => (isHeaderOrIndexCellType(cell.type) ? cell : true)
  )
  let i = 0
  while (i < height) {
    const row = matrix[i]
    let j = 0
    while (j < width) {
      const cellOrBool = row[j]
      if (typeof cellOrBool !== 'boolean') {
        const cell = cellOrBool as Cell
        let h = 0
        while (i - h - 1 >= 0 && matrix[i - h - 1][j] === true) {
          h++
        }
        const newIndex = i - h
        if (h > 0) {
          for (let w = j; w < cell.width; w++) {
            matrix[newIndex][w] = cell
          }
        }
        for (let k = newIndex + 1; k < i + cell.height && k < height; k++) {
          for (let w = j; w < cell.width; w++) {
            matrix[k][w] = true
          }
        }
        j += cell.width
      } else {
        j++
      }
    }
    i++
  }
  const indexOfFirstEmptyRow = matrix.findIndex((row) =>
    row.every((value) => value === true)
  )
  if (indexOfFirstEmptyRow > -1) {
    matrix = matrix.slice(0, indexOfFirstEmptyRow)
    height = indexOfFirstEmptyRow
  }
  i = 0
  const lastRowIndex = height - 1
  const lastRow = matrix[lastRowIndex]
  while (i < width) {
    const value = lastRow[i]
    if (value === true) {
      let j = lastRowIndex - 1
      while (j >= 0) {
        const cellAboveValue = matrix[j][i]
        if (cellAboveValue === true) {
          j--
        } else {
          const { width: cellWidth } = cellAboveValue
          for (let h = j + 1; h < height; h++) {
            for (let w = i; w < i + cellWidth && w < width; w++) {
              matrix[h][w] = cellAboveValue
            }
          }
          i += cellWidth
          break
        }
      }
    } else {
      i += value.width
    }
  }
  return fromMatrix(
    matrix,
    () => CellType.Header,
    (cell) => {
      if (cell === true) {
        throw new Error('All cells should be filled with headers')
      }
      return cell.type === CellType.Header ? cell.value : '№'
    }
  )
}

const isRowsEqual = isItemsEqual<JSONArray>(
  (a, b) => compareJsonArray(a, b) === 0
)

export function makeLevelDeduplicator(buildRowStructure: BuildRowStructure) {
  return (tables: Table[], width: number): number => {
    let i = 0
    const minHeight = tables.map(getHeight).reduce(min)
    while (i < minHeight) {
      if (
        // eslint-disable-next-line no-loop-func
        tables.every((table) => table.rows[i].length === 0) ||
        // eslint-disable-next-line no-loop-func
        (tables.some((table) =>
          table.rows[i].some((cell) => cell.type === CellType.Header)
        ) &&
          isRowsEqual(
            // eslint-disable-next-line no-loop-func
            tables.map((table) =>
              buildRowStructure(table.rows[i], Math.floor(width / table.width))
            )
          ))
      ) {
        i++
      } else {
        return i
      }
    }
    return i
  }
}

const getBestDeduplicationIntervalsCandidate = (
  a: DeduplicationIntervalsCandidate,
  b: DeduplicationIntervalsCandidate
) => (b.minDeduplicationHeight > a.minDeduplicationHeight ? b : a)

export function makeIntervalsDeduplicator(
  buildRowStructure: BuildRowStructure
) {
  return (tables: Table[], width: number): DeduplicationInterval[] | null => {
    const minHeight = tables.map(getHeight).reduce(min)
    const tablesWithIndex = tables.map((table) => {
      let indexOfLastRowWithLegitHeader = 0
      const multiplier = Math.floor(width / table.width)
      while (
        indexOfLastRowWithLegitHeader < minHeight &&
        (table.rows[indexOfLastRowWithLegitHeader].length === 0 ||
          table.rows[indexOfLastRowWithLegitHeader].some(
            (cell) => cell.type === CellType.Header
          ))
      ) {
        indexOfLastRowWithLegitHeader++
      }
      const structures = table.rows
        .slice(0, indexOfLastRowWithLegitHeader)
        .map((row) => buildRowStructure(row, multiplier))
      return {
        ...table,
        indexOfLastRowWithLegitHeader,
        multiplier,
        structures,
      }
    })
    const candidatesOverTables = tablesWithIndex
      .filter(
        ({ indexOfLastRowWithLegitHeader }) => indexOfLastRowWithLegitHeader > 0
      )
      .map(({ indexOfLastRowWithLegitHeader, structures }, i) => {
        const candidatesOverTable = generate(
          indexOfLastRowWithLegitHeader,
          (j) => {
            const structuresSlice = structures.slice(
              j,
              indexOfLastRowWithLegitHeader
            )
            const intervals: (DeduplicationInterval | null)[] =
              tablesWithIndex.map((table, k) =>
                k === i
                  ? [j, indexOfLastRowWithLegitHeader - j]
                  : getDeduplicationInterval(table, structuresSlice)
              )
            return intervals.some((int) => int === null)
              ? null
              : {
                  intervals: intervals as DeduplicationInterval[],
                  minDeduplicationHeight: (
                    intervals as DeduplicationInterval[]
                  ).reduce(
                    (acc, interval) => (interval[1] < acc ? interval[1] : acc),
                    Number.POSITIVE_INFINITY
                  ),
                }
          }
        ).filter(isSomething)
        if (candidatesOverTable.length === 0) {
          return null
        }
        return candidatesOverTable.reduce(
          getBestDeduplicationIntervalsCandidate
        )
      })
      .filter(isSomething)
    if (candidatesOverTables.length === 0) {
      return null
    }
    return candidatesOverTables.reduce(getBestDeduplicationIntervalsCandidate)
      .intervals
  }
}

export function splitTableByHeaders(
  table: Table,
  deduplicateLevel: number,
  currentLevel: number
): Table[] {
  const firstRowCells = table.rows[0]
  const { intervals } = firstRowCells.reduce(
    (acc, cell) => ({
      intervals: acc.intervals.concat({
        ...cell,
        start: acc.start,
        end: acc.start + cell.width,
        heightShift: cell.type === CellType.Header ? cell.height : 0,
      }),
      start: acc.start + cell.width,
    }),
    { intervals: [] as (Interval<number> & Cell)[], start: 0 }
  )
  const tables = generate(intervals.length, (i): Table => {
    const { start, end, heightShift, ...cell } = intervals[i]
    const isHeader = cell.type === CellType.Header
    const tableHeight = table.height - heightShift
    return {
      rows: generate(tableHeight, (i) => (!isHeader && i === 0 ? [cell] : [])),
      height: tableHeight,
      width: cell.width,
    }
  })
  createMatrix(table, (cell, i, startPosition) => {
    if (i > 0) {
      const endPosition = startPosition + cell.width
      for (let k = 0; k < intervals.length; k++) {
        const { start, end, heightShift } = intervals[k]
        if (
          (startPosition >= start && startPosition < end) ||
          (endPosition > start && endPosition <= end) ||
          (startPosition < start && endPosition > end)
        ) {
          tables[k].rows[i - heightShift].push({
            ...cell,
            width: Math.min(end, endPosition) - Math.max(start, startPosition),
          })
        }
      }
    }
  })
  return currentLevel + 1 < deduplicateLevel
    ? tables.flatMap((splitted) =>
        splitted.height === table.height
          ? splitted
          : splitTableByHeaders(splitted, deduplicateLevel, currentLevel + 1)
      )
    : tables
}

export function removeDandlingPlugCells(table: Table): Table {
  const { height, rows, width } = table
  let i = height - 1
  let newHeight = height
  while (
    i > 0 &&
    (rows[i].length === 0 ||
      (rows[i].length === 1 &&
        rows[i][0].type === CellType.Plug &&
        rows[i][0].width === width))
  ) {
    if (rows[i].length === 1) {
      newHeight -= rows[i][0].height
    }
    i--
  }
  return newHeight < height
    ? { ...table, height: newHeight, rows: rows.slice(0, newHeight) }
    : table
}

const makeTableSideReducer =
  (getSide: (cell: Cell) => number) =>
  (table: Table): Table => {
    const coefficient = table.rows
      .flatMap((row) => row)
      .map(getSide)
      .reduce(gcd)
    if (coefficient === 1) {
      return table
    }
    const { rows, height, width } = table
    const newHeight = height / coefficient
    const newRows: Row[] = generate(newHeight, () => [])
    rows.forEach((row, oldRowIndex) => {
      const newRowIndex = oldRowIndex / coefficient
      row.forEach((cell) =>
        newRows[newRowIndex].push({
          ...cell,
          height: cell.height / coefficient,
        })
      )
    })
    return {
      width,
      height: newHeight,
      rows: newRows,
    }
  }

export function makeSplitIntoColumnsByHeaders(
  makeColumns: ComposeTables
): SplitIntoColumnsByHeaders {
  return (table, deduplicateLevel, currentLevel) =>
    makeColumns(
      splitTableByHeaders(table, deduplicateLevel, currentLevel)
        .map(removeDandlingPlugCells)
        .map(makeTableSideReducer(getHeight))
    )
}

export function makeTableHeadersDeduplicatorByLevel(
  splitIntoColumnsByHeaders: SplitIntoColumnsByHeaders
) {
  return (tables: Table[], deduplicateLevel: number): Table[] => [
    buildDeduplicateTableHeader(tables[0], [0, deduplicateLevel]),
    ...tables.map((table) =>
      splitIntoColumnsByHeaders(table, deduplicateLevel, 0)
    ),
  ]
}

export function makeTableHeadersDeduplicatorByIntervals(
  splitIntoColumnsByHeaders: SplitIntoColumnsByHeaders
) {
  return (tables: Table[], intervals: DeduplicationInterval[]): Table[] => [
    buildDeduplicateTableHeader(tables[0], intervals[0]),
    ...tables.flatMap((table, i) => {
      const [from, count] = intervals[i]
      return from === 0
        ? splitIntoColumnsByHeaders(table, count, 0)
        : [
            {
              height: from,
              width: table.width,
              rows: table.rows.slice(0, from),
            },
            splitIntoColumnsByHeaders(
              {
                height: table.height - from,
                width: table.width,
                rows: table.rows.slice(from),
              },
              count,
              0
            ),
          ]
    }),
  ]
}
