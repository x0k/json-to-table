import {
  JSONSchema7Definition,
  JSONSchema7Type,
  JSONSchema7,
  JSONSchema7TypeName,
  validate,
} from 'json-schema'

import { JSONRecord, JSONArray, JSONValue } from '@/lib/json'

export interface JSONSchema extends JSONSchema7 {
  /** custom field from rjsf */
  enumNames?: string[]
}
export type JSONSchemaTypeName = JSONSchema7TypeName
export type JSONSchemaType = JSONSchema7Type
export interface JSONSchemaNameTypes {
  string: string
  number: number
  integer: number
  boolean: boolean
  object: JSONRecord
  array: JSONArray
  null: null
}
export type JSONSchemaTypeByName<N extends JSONSchemaTypeName> =
  JSONSchemaNameTypes[N]

export type JSONSchemaTypeNames = JSONSchemaTypeName[]

export function makeValidator(
  schema: JSONSchema7Definition
): (value: JSONValue) => boolean {
  return typeof schema === 'boolean'
    ? () => schema
    : //@ts-expect-error wrong types
      (value: JSONValue): boolean => validate(value, schema).valid
}

export function makeIsSchemaType(typeName: JSONSchemaTypeName) {
  return ({ type }: JSONSchema): boolean =>
    Array.isArray(type) ? type.includes(typeName) : type === typeName
}
