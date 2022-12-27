import { BuildRowStructure, Row, HEADER_CELL_TYPES, CellType } from './model'

export const makeRowStructureBuilder =
  (indexes: boolean): BuildRowStructure =>
  (row: Row, multiplier: number) =>
    row.map((cell) =>
      HEADER_CELL_TYPES.includes(cell.type)
        ? indexes
          ? {
              value: cell.type === CellType.Index ? CellType.Index : cell.value,
              width: cell.width * multiplier,
            }
          : cell.type === CellType.Index
          ? CellType.Index
          : cell.value
        : null
    )
