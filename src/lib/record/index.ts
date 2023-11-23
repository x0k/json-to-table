import { JSONRecord } from '@/lib/json'

export function pick(value: JSONRecord, fields: string[]): JSONRecord {
  return Object.fromEntries(
    fields.map((field) => [field, value[field]] as const)
  )
}

export function omit(value: JSONRecord, fields: string[]): JSONRecord {
  return pick(
    value,
    Object.keys(value).filter((key) => !fields.includes(key))
  )
}

export function pluck<T extends Record<string, unknown>, K extends keyof T>(
  key: K
) {
  return (value: T): T[K] => value[key]
}
