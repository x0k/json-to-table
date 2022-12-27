export type JSONPrimitive = string | number | boolean | null

export type JSONRecord = { [k: string]: JSONType }

export type JSONArray = JSONType[]

export type JSONObject = JSONRecord | JSONArray

export type JSONType = JSONPrimitive | JSONObject

export const isJsonPrimitive = (value: JSONType): value is JSONPrimitive =>
  typeof value !== 'object' || value === null

export type CompareResult = -1 | 0 | 1

export function compareJsonPrimitive(
  a: JSONPrimitive,
  b: JSONPrimitive
): CompareResult {
  if (a === null) {
    return b === null ? 0 : -1
  }
  return b === null ? 1 : a > b ? 1 : a < b ? -1 : 0
}

export function compareJsonArray(a: JSONArray, b: JSONArray): CompareResult {
  if (a.length < b.length) {
    return -1
  }
  if (a.length > b.length) {
    return 1
  }
  const len = a.length
  let i = 0
  while (i < len) {
    const result = compareJsonType(a[i], b[i])
    if (result !== 0) {
      return result
    }
    i++
  }
  return 0
}

export function compareJsonRecords(
  a: JSONRecord,
  b: JSONRecord
): CompareResult {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  const result = compareJsonArray(aKeys, bKeys)
  if (result !== 0) {
    return result
  }
  const len = aKeys.length
  let i = 0
  while (i < len) {
    const key = aKeys[i]
    const result = compareJsonType(a[key], b[key])
    if (result !== 0) {
      return result
    }
    i++
  }
  return 0
}

export function compareJsonObjects(
  a: JSONObject,
  b: JSONObject
): CompareResult {
  if (Array.isArray(a)) {
    return Array.isArray(b) ? compareJsonArray(a, b) : -1
  }
  return Array.isArray(b) ? 1 : compareJsonRecords(a, b)
}

export function compareJsonType(a: JSONType, b: JSONType): CompareResult {
  if (isJsonPrimitive(a)) {
    return isJsonPrimitive(b) ? compareJsonPrimitive(a, b) : -1
  }
  return isJsonPrimitive(b) ? 1 : compareJsonObjects(a, b)
}
