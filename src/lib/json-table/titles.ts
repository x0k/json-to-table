import { Table, CellType } from "./model";

export function makeHeadersSetter(collapseIndexes: boolean) {
  return (
    { height, rows, width }: Table,
    titles: string[],
    tables: Table[]
  ): Table => {
    const canCollapse =
      collapseIndexes && rows[0].every((cell) => cell.type === CellType.Header);
    return canCollapse
      ? {
          width,
          height,
          rows: [
            tables.flatMap((table, i) =>
              table.rows[0].map((cell) => ({
                ...cell,
                value: `${titles[i]}.${cell.value}`,
              }))
            ),
            ...rows.slice(1),
          ],
        }
      : {
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
        };
  };
}

export function makeIndexesSetter(collapseIndexes: boolean) {
  return (titles: string[], tables: Table[]): Table[] => {
    // TODO: Check and skip solid header
    const canCollapse =
      collapseIndexes &&
      tables.every((table) =>
        table.rows.every((r) => r[0].type === CellType.Index)
      );
    return tables.map(({ height, width, rows }, i) => ({
      height,
      width: width + Number(!canCollapse),
      rows: rows.map((row, j) => {
        const cell = row[0];
        return canCollapse
          ? [
              {
                ...cell,
                value: `${titles[i]}.${cell.value}`,
                width: canCollapse ? cell.width : cell.width + 1,
              },
              ...row.slice(1),
            ]
          : j === 0
          ? [
              {
                type: CellType.Index,
                width: 1,
                height,
                value: titles[i],
              },
              ...row,
            ]
          : row;
      }),
    }));
  };
}
