import { isArray, isRecord } from 'lib/guards'
import { JSONPrimitiveOrNull, JSONValue } from 'lib/json'

export type ResolvedJson<R> = JSONPrimitiveOrNull | Array<R> | Record<string, R>

export type JsonVisitor<R> = (value: ResolvedJson<R>, path: string) => R

export function jsonTraverser<R>(
  visitor: JsonVisitor<R>
): (value: JSONValue) => R {
  const traverse = (value: JSONValue, path = '#'): R => {
    if (isArray(value)) {
      return visitor(
        value.map((value, i) => traverse(value, `${path}/${i}`)),
        path
      )
    }
    if (isRecord(value)) {
      return visitor(
        Object.fromEntries(
          Object.entries(value).map(([key, value]) => [
            key,
            traverse(value, `${path}/${key}`),
          ])
        ),
        path
      )
    }
    return visitor(value, path)
  }
  return traverse
}
