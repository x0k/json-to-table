import { JSONPrimitive } from 'lib/json'

import { Table, CellType } from './model'

export function makeCell(value: JSONPrimitive): Table {
  return {
    height: 1,
    width: 1,
    rows: [[{ height: 1, width: 1, value, type: CellType.Value }]],
  }
}
