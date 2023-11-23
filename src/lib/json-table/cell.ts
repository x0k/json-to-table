import { JSONPrimitiveOrNull } from 'lib/json'

import { Table, CellType } from './model'

export function makeCell(value: JSONPrimitiveOrNull): Table {
  return {
    height: 1,
    width: 1,
    rows: [[{ height: 1, width: 1, value, type: CellType.Value }]],
  }
}
