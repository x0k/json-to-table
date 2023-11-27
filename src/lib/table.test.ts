import { Block, stretchCellsToBottom, stretchCellsToRight } from "./table";

describe("stretchCellsToBottom", () => {
  it("Should work with shifted bottom cell", () => {
    const data: Block = {
      height: 2,
      width: 3,
      rows: [
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 1,
            },
            {
              height: 1,
              width: 1,
              value: 2,
            },
            {
              height: 1,
              width: 1,
              value: 3,
            },
          ],
          indexes: [0, 1, 2],
        },
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 4,
            },
          ],
          indexes: [1],
        },
      ],
    };
    const result = stretchCellsToBottom(data);
    expect(result).toEqual({
      height: 2,
      width: 3,
      rows: [
        {
          cells: [
            {
              height: 2,
              width: 1,
              value: 1,
            },
            {
              height: 1,
              width: 1,
              value: 2,
            },
            {
              height: 2,
              width: 1,
              value: 3,
            },
          ],
          indexes: [0, 1, 2],
        },
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 4,
            },
          ],
          indexes: [1],
        },
      ],
    });
  });
});

describe("stretchCellsToRight", () => {
  it("Should work with shifted right cell", () => {
    const data: Block = {
      height: 3,
      width: 2,
      rows: [
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 1,
            },
          ],
          indexes: [0],
        },
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 2,
            },
            {
              height: 1,
              width: 1,
              value: 4,
            },
          ],
          indexes: [0, 1],
        },
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 3,
            },
          ],
          indexes: [0],
        }
      ],
    };
    expect(stretchCellsToRight(data)).toEqual({
      height: 3,
      width: 2,
      rows: [
        {
          cells: [
            {
              height: 1,
              width: 2,
              value: 1,
            },
          ],
          indexes: [0],
        },
        {
          cells: [
            {
              height: 1,
              width: 1,
              value: 2,
            },
            {
              height: 1,
              width: 1,
              value: 4,
            },
          ],
          indexes: [0, 1],
        },
        {
          cells: [
            {
              height: 1,
              width: 2,
              value: 3,
            },
          ],
          indexes: [0],
        }
      ],
    })
  });
});
