import { UiSchema } from '@rjsf/utils'
import mergeAllOf from 'json-schema-merge-allof'

import { isArray, isSomething, isRecord } from 'lib/guards'
import { JSONPrimitiveOrNull, JSONRecord, JSONValue } from 'lib/json'
import { JSONSchema, makeValidator } from 'lib/json-schema'
import { omit } from 'lib/record'
import { apply } from 'lib/function'

export interface VisitorOptions<R> {
  value: JSONPrimitiveOrNull | Array<R> | Record<string, R>
  schema: JSONSchema
  uiSchema: UiSchema
  resolvedSchema: JSONSchema
  resolvedUiSchema: UiSchema
  path: string
}

export type Visitor<R> = (options: VisitorOptions<R>) => R

function mergeUiSchemas(x: UiSchema, y: UiSchema): UiSchema {
  const { 'ui:options': xOptions, items: xItems } = x
  const { 'ui:options': yOptions, items: yItems } = y
  const options = (xOptions || yOptions) && { ...xOptions, ...yOptions }
  const items =
    xItems && yItems
      ? Array.isArray(yItems)
        ? yItems
        : Array.isArray(xItems)
        ? xItems.map((item) => mergeUiSchemas(item, yItems))
        : mergeUiSchemas(xItems, yItems)
      : xItems || yItems
  return {
    ...x,
    ...y,
    'ui:options': options,
    items,
  }
}

function mergeJsonSchemas(x: JSONSchema, y: JSONSchema): JSONSchema {
  const {
    properties: xProperties,
    dependencies: xDependencies,
    definitions: xDefinitions,
    patternProperties: xPatternProperties,
    required: xRequired,
  } = x
  const {
    properties: yProperties,
    dependencies: yDependencies,
    definitions: yDefinitions,
    patternProperties: yPatternProperties,
    required: yRequired,
  } = y
  return {
    ...x,
    ...y,
    properties: { ...xProperties, ...yProperties },
    definitions: { ...xDefinitions, ...yDefinitions },
    patternProperties: { ...xPatternProperties, ...yPatternProperties },
    dependencies: {
      ...xDependencies,
      ...yDependencies,
    },
    required:
      xRequired && yRequired
        ? xRequired.concat(yRequired)
        : xRequired || yRequired,
  }
}

export function resolveSchemas(
  value: JSONValue,
  schema: JSONSchema,
  uiSchema: UiSchema
): [JSONSchema, UiSchema] {
  const { oneOf, anyOf, allOf, dependencies, ...rest } = schema
  // if (oneOf) {
  //   const validSchema = oneOf.find((schema) => ajv.validate(schema, value))
  //   return validSchema !== undefined
  //     ? [validSchema as JSONSchema, uiSchema]
  //     : [rest, uiSchema]
  // }
  if (oneOf) {
    const validSchemaIndex = oneOf.map(makeValidator).findIndex(apply(value))
    const lastIndex = oneOf.length - 1
    return validSchemaIndex > -1
      ? [
          (
            oneOf.map((item, i) =>
              i === validSchemaIndex
                ? oneOf[lastIndex]
                : i === lastIndex
                ? oneOf[validSchemaIndex]
                : item
            ) as JSONSchema[]
          ).reduce(mergeJsonSchemas, rest),
          uiSchema,
        ]
      : [rest, uiSchema]
  }
  if (anyOf) {
    const uiAnyOf = isArray(uiSchema['anyOf']) && uiSchema['anyOf']
    const validSchemas = anyOf
      .map(makeValidator)
      .map(apply(value))
      .map((valid, i) =>
        valid
          ? ([
              anyOf[i],
              uiAnyOf && isRecord(uiAnyOf[i]) ? uiAnyOf[i] : uiSchema,
            ] as [JSONSchema, UiSchema])
          : null
      )
      .filter(isSomething)
    return validSchemas.length > 0
      ? [
          validSchemas.map((pair) => pair[0]).reduce(mergeJsonSchemas, rest),
          validSchemas.map((pair) => pair[1]).reduce(mergeUiSchemas, uiSchema),
        ]
      : [rest, uiSchema]
  }
  if (allOf) {
    return resolveSchemas(value, mergeAllOf(schema), uiSchema)
  }
  if (dependencies) {
    const subSchemes = Object.keys(dependencies).map((key): JSONSchema => {
      const [{ properties, required, ...rest }] = resolveSchemas(
        value,
        dependencies[key] as JSONSchema,
        uiSchema
      )
      return {
        ...rest,
        properties:
          properties &&
          (omit(properties as JSONRecord, [key]) as JSONSchema['properties']),
        required: required && required.filter((name) => name !== key),
      }
    })
    return [subSchemes.reduce(mergeJsonSchemas, rest), uiSchema]
  }
  return [rest, uiSchema]
}

function getSchemaFromPatternProperties(
  patternProperties: JSONSchema['patternProperties'],
  property: string
) {
  if (!patternProperties) {
    return undefined
  }
  const patterns = Object.keys(patternProperties)
  const validPattern = patterns.find((pattern) =>
    new RegExp(pattern).test(property)
  )
  return validPattern !== undefined
    ? patternProperties[validPattern]
    : undefined
}

export type TraverserOptions<R> = Omit<
  VisitorOptions<R>,
  'resolvedSchema' | 'resolvedUiSchema'
>

export function jsonTraverserWithSchemas<R>(
  visitor: Visitor<R>
): (options: TraverserOptions<JSONValue>) => R {
  const traverser = ({
    value,
    schema,
    uiSchema,
    path,
  }: TraverserOptions<JSONValue>): R => {
    const [resolvedSchema, resolvedUiSchema] = resolveSchemas(
      value,
      schema,
      uiSchema
    )
    if (isArray(value)) {
      const { items, additionalItems = {} } = resolvedSchema
      const { items: uiSchemaItems = {} } = resolvedUiSchema
      const schemaItems = (items ?? {}) as JSONSchema
      const isSchemaItemsArray = isArray(schemaItems)
      const isUiSchemaItemsArray = isArray(uiSchemaItems)
      return visitor({
        value: value.map((item, i) =>
          traverser({
            value: item,
            schema: isSchemaItemsArray
              ? ((schemaItems[i] ?? additionalItems) as JSONSchema)
              : schemaItems,
            uiSchema: isUiSchemaItemsArray
              ? uiSchemaItems[i] ?? {}
              : uiSchemaItems,
            path: `${path}/${i}`,
          })
        ),
        schema,
        uiSchema,
        resolvedSchema,
        resolvedUiSchema,
        path,
      })
    }
    if (isRecord(value)) {
      const {
        properties = {},
        additionalProperties,
        patternProperties,
      } = resolvedSchema
      const keys = Object.keys(value)
      return visitor({
        value: Object.fromEntries(
          keys.map(
            (key) =>
              [
                key,
                traverser({
                  value: value[key],
                  schema: (properties[key] ??
                    getSchemaFromPatternProperties(patternProperties, key) ??
                    additionalProperties ??
                    {}) as JSONSchema,
                  uiSchema: resolvedUiSchema[key] ?? {},
                  path: `${path}/${key}`,
                }),
              ] as const
          )
        ),
        schema,
        uiSchema,
        resolvedSchema,
        resolvedUiSchema,
        path,
      })
    }
    return visitor({
      value,
      schema,
      uiSchema,
      resolvedSchema,
      resolvedUiSchema,
      path,
    })
  }
  return traverser
}
