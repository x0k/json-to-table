import { isArray, isString } from '@/lib/guards'

export type Entry<V> = [string, V]

export function transformKey(map: (value: string) => string) {
  return function <T>([key, value]: Entry<T>): Entry<T> {
    return [map(key), value]
  }
}

export function transformValue<V, R>(map: (value: V) => R) {
  return ([key, value]: Entry<V>): Entry<R> => [key, map(value)]
}

export function isEntry<T>(value: unknown): value is Entry<T> {
  return isArray(value) && value.length === 2 && isString(value[0])
}

export function zip<T>(keys: string[], items: T[]): Entry<T>[] {
  const len = Math.min(keys.length, items.length)
  const result: Entry<T>[] = []
  for (let i = 0; i < len; i++) {
    result.push([keys[i], items[i]])
  }
  return result
}

export function unzip<T>(entries: Entry<T>[]): [string[], T[]] {
  const keys = []
  const items = []
  for (let i = 0; i < entries.length; i++) {
    const [key, item] = entries[i]
    keys.push(key)
    items.push(item)
  }
  return [keys, items]
}

export function makeEntriesTransform<V, R>(
  action: (entries: Entry<V>[]) => Entry<R>[]
) {
  return (object: Record<string, V>): Record<string, R> =>
    Object.fromEntries(action(Object.entries(object)))
}

export function filterByKey(filter: (key: string) => boolean) {
  return function <V>(entry: Entry<V>): entry is Entry<V> {
    return filter(entry[0])
  }
}

export function filterByValue<V, R extends V = V>(
  filter: ((value: V) => value is R) | ((value: V) => boolean)
) {
  return (entry: Entry<V>): entry is Entry<R> => filter(entry[1])
}
