import { Table, CellType } from './model'

export const addHeaders = (
  { height, rows, width }: Table,
  titles: string[],
  tables: Table[]
): Table => ({
  width,
  height: height + 1,
  rows: [
    tables.map(({ width }, i) => ({
      height: 1,
      type: CellType.Header,
      value: titles[i],
      width,
    })),
    ...rows,
  ],
})

export function makeIndexesSetter(collapseIndexes: boolean) {
  return (titles: string[], tables: Table[]): Table[] => {
    const everyTableIsRow =
      collapseIndexes &&
      tables.every((table) => {
        const firstCell = table.rows[0][0]
        return (
          firstCell.type === CellType.Index && firstCell.height === table.height
        )
      })
    return tables.map(({ height, width, rows }, i) => ({
      height,
      width: width + Number(!everyTableIsRow),
      rows: rows.map((row, j) => {
        const firstCell = row[0]
        return j === 0
          ? collapseIndexes && firstCell.type === CellType.Index
            ? [
                {
                  ...firstCell,
                  value: `${titles[i]}.${firstCell.value}`,
                  width: everyTableIsRow
                    ? firstCell.width
                    : firstCell.width + 1,
                },
                ...row.slice(1),
              ]
            : [
                {
                  type: CellType.Index,
                  width: 1,
                  height,
                  value: titles[i],
                },
                ...row,
              ]
          : row
      }),
    }))
  }
}
