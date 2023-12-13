# JSON to Table

[App for converting JSON data to table (HTML, XLSX, ASCII)](https://x0k.github.io/json-to-table/)

## Example

Input data:

```json
{
  "key": "val",
  "primitiveArr": [1, "two", false],
  "object": {
    "key1": "value1",
    "key2": 789,
    "key3": {
      "nestedKey": "nestedVal"
    }
  },
  "nestedArray": [
    {
      "name": "John",
      "age": 30,
      "isStud": false
    },
    {
      "name": "Alice",
      "age": 25,
      "isStud": true
    }
  ]
}

```

Output:

```
+-----+---------------+---------------------------+--------------------------+
| key | primitiveArr  |          object           |         nestedArray      |
+-----+---------------+--------+------+-----------+---+-------+-----+--------+
|     |               |  key1  | key2 |   key3    | № | name  | age | isStud |
|     |               +--------+------+-----------+---+-------+-----+--------+
| val | 1, two, false |        |      | nestedKey | 1 | John  |  30 | false  |
|     |               | value1 |  789 +-----------+---+-------+-----+--------+
|     |               |        |      | nestedVal | 2 | Alice |  25 | true   |
+-----+---------------+--------+------+-----------+---+-------+-----+--------+
```
