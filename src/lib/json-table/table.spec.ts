import { JSONType } from 'lib/json'

import { ViewType, Table, CellType, TransformOptions } from './model'
import { makeTableTransformer } from './table'

const defaultTransformOptions: TransformOptions = {
  arrayViewType: ViewType.Rows,
  proportionalResizeLimit: 0,
  concatPrimitiveValues: false,
  mergeRecordValues: false,
  sortHeaders: false,
  supportForHeadersGrouping: false,
  headers: false,
  indexes: false,
  collapseIndexes: false,
  collapseHeaders: false,
  recordViewType: ViewType.Columns,
  horizontalReflect: false,
  verticalReflect: false,
  transpose: false,
}

describe('TableTransformer', () => {
  it('Should build correct sized table', () => {
    const data = { a: 1, b: 2, c: { aa: 11, bb: 22 } }
    const transform = makeTableTransformer({
      ...defaultTransformOptions,
      headers: true,
      proportionalResizeLimit: 100,
    })
    const result = transform(data)
    const expected: Table = {
      width: 4,
      height: 3,
      rows: [
        [
          {
            height: 1,
            width: 1,
            value: 'a',
            type: CellType.Header,
          },
          {
            height: 1,
            width: 1,
            value: 'b',
            type: CellType.Header,
          },
          {
            height: 1,
            width: 2,
            value: 'c',
            type: CellType.Header,
          },
        ],
        [
          {
            height: 2,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 2,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 'aa',
            type: CellType.Header,
          },
          {
            height: 1,
            width: 1,
            value: 'bb',
            type: CellType.Header,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 11,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 22,
            type: CellType.Value,
          },
        ],
      ],
    }
    expect(result).toEqual(expected)
  })
  it('Should deduplicate headers with grouping header', () => {
    const data: JSONType = [
      {
        a: 1,
        b: 2,
      },
      {
        a: 1,
        b: 2,
      },
      {
        a: 1,
        b: 2,
      },
      {
        Totlal: [
          {
            a: 1,
            b: 2,
          },
          {
            a: 1,
            b: 2,
          },
          {
            a: 1,
            b: 2,
          },
          {
            a: 1,
            b: 2,
          },
        ],
      },
    ]
    const transform = makeTableTransformer({
      ...defaultTransformOptions,
      headers: true,
      proportionalResizeLimit: 100,
      collapseHeaders: true,
      supportForHeadersGrouping: true,
    })
    const result = transform(data)
    const expected: Table = {
      height: 9,
      width: 2,
      rows: [
        [
          {
            height: 1,
            type: CellType.Header,
            value: 'a',
            width: 1,
          },
          {
            height: 1,
            type: CellType.Header,
            value: 'b',
            width: 1,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            type: CellType.Header,
            value: 'Totlal',
            width: 2,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            value: 1,
            type: CellType.Value,
          },
          {
            height: 1,
            width: 1,
            value: 2,
            type: CellType.Value,
          },
        ],
      ],
    }
    expect(result).toEqual(expected)
  })
  it('Should transpose table', () => {
    const data = [
      { a: 1, b: 2, c: 3 },
      { a: 4, b: 5, c: 6 },
    ]
    const transform = makeTableTransformer({
      ...defaultTransformOptions,
      transpose: true,
    })
    const result = transform(data)
    const expected: Table = {
      height: 3,
      width: 2,
      rows: [
        [
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 1,
          },
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 4,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 2,
          },
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 5,
          },
        ],
        [
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 3,
          },
          {
            height: 1,
            width: 1,
            type: CellType.Value,
            value: 6,
          },
        ],
      ],
    }
    expect(result).toEqual(expected)
  })
})
