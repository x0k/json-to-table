import { UiSchema } from '@rjsf/utils'

import { isArray, isRecord, isString } from 'lib/guards'
import {
  JSONSchema,
  JSONSchemaType,
  makeIsSchemaType,
} from 'lib/json-schema'
import { JSONType } from 'lib/json'
import { omit, pick } from 'lib/record'
import {
  Entry,
  makeEntriesTransform,
  transformKey,
  transformValue,
} from 'lib/entry'
import {
  jsonTraverserWithSchemas,
  TraverserOptions,
} from 'lib/json-traverser-with-schemas'
import { map, generate } from 'lib/array'

export type CustomDefaults = Record<string, JSONType>

export enum TupleTransformType {
  Entries = 'entries',
  Record = 'record',
}

const DEFAULT_OTHER_VARIANT_NAME = '_other'

export interface NormalizeBySchemasOptions {
  /**Использовать `ui:order` для сортировки полей объектов
   * По умолчанию `true`.
   */
  useOrder?: boolean
  /** Использовать `ui:title` из UI схемы и `title` из JSON схемы
   * По умолчанию `true`
   */
  useTitles?: boolean
  /** Использовать `enumNames` из JSON схемы
   * По умолчанию `false`
   */
  useEnumNames?: boolean
  /** Восстанавливать поля с учетом JSON схемы
   * По умолчанию `false`
   */
  useTupleTransform?: false | TupleTransformType
  /** Объект, где ключ - шаблон пути, при совпадении которого будет использовано значение в качестве значения по умолчанию
   * По умолчанию `true`
   */
  addMissingFields?: boolean
  /** Добавлять информацию о вариантах ответа с учетом JSON и UI схем
   * По умолчанию `false`
   */
  addAnswerVariants?: boolean
  /** Устанавливать значение по умолчанию для полей объектов без установленного значения
   * По умолчанию `true`
   */
  defineMissingValues?: boolean
  /** Применять трансформацию к кортежам согласно JSON схеме и UI схеме
   * По умолчанию `{}`
   */
  customDefaults?: CustomDefaults
  /** Значение по умолчанию - применяется, если значение не определено в {@link customDefaults}
   * По умолчанию `null`
   */
  globalDefault?: JSONType
}

function getTitleFromSchemas(
  schema: JSONSchema,
  uiSchema: UiSchema
): string | undefined {
  return uiSchema['ui:title'] ?? schema['title']
}

const tupleToEntries = (
  value: JSONType[],
  schemas: JSONSchema[],
  uiSchemas: UiSchema[]
) =>
  schemas.map(
    (schema, i): Entry<JSONType> => [
      getTitleFromSchemas(schema, uiSchemas[i]) ?? `№ ${i + 1}`,
      value[i],
    ]
  )

export type TupleTransform = (
  value: JSONType[],
  schemas: JSONSchema[],
  uiSchemas: UiSchema[]
) => JSONType

const TUPLES_TRANSFORMS: Record<TupleTransformType, TupleTransform> = {
  [TupleTransformType.Entries]: tupleToEntries,
  [TupleTransformType.Record]: (value, schemas, uiSchemas) =>
    Object.fromEntries(tupleToEntries(value, schemas, uiSchemas)),
}

export enum VariantsWidget {
  Radio = 'radio',
  Checkboxes = 'checkboxes',
}

export enum VariantsField {
  CheckboxesWithOtherVariants = 'checkboxesWithOtherVariants',
}

function getRadioVariants(
  { enum: enumValues, enumNames }: JSONSchema,
  value: JSONType,
  defaultValue: JSONType
) {
  if (!enumValues) {
    return []
  }
  const index = enumValues.indexOf(value)
  return ((enumNames ?? enumValues) as JSONSchemaType[]).map(
    (key, i) => [key, i === index ? value : defaultValue] as Entry<JSONType>
  )
}

function getCheckboxesVariants(
  { enum: enumValues, enumNames }: JSONSchema,
  value: JSONType[],
  defaultValue: JSONType
) {
  if (!enumValues) {
    return []
  }
  return (enumNames ?? enumValues).map(
    (key, i) =>
      [
        key,
        value.includes(enumValues[i]) ? enumValues[i] : defaultValue,
      ] as Entry<JSONType>
  )
}

const isArraySchemaType = makeIsSchemaType('array')

export function makeNormalizerBySchemas({
  useOrder = true,
  useTitles = true,
  useEnumNames = false,
  useTupleTransform = false,
  addMissingFields = true,
  addAnswerVariants = false,
  defineMissingValues = true,
  customDefaults = {},
  globalDefault = null,
}: NormalizeBySchemasOptions): (
  options: TraverserOptions<JSONType>
) => JSONType {
  const expressions = Object.keys(customDefaults).map(
    (pattern) => new RegExp(pattern)
  )
  function getDefaultValue(path: string) {
    const expressionIndex = expressions.findIndex((expression) =>
      expression.test(path)
    )
    return expressionIndex > -1
      ? customDefaults[expressionIndex]
      : globalDefault
  }
  const defineUndefinedValues = makeEntriesTransform(
    map(
      transformValue((val: JSONType | undefined) =>
        val === undefined ? globalDefault : val
      )
    )
  )
  return jsonTraverserWithSchemas<JSONType>(
    ({ value, resolvedSchema, resolvedUiSchema, path, schema }) => {
      const {
        properties,
        enum: enumValues,
        enumNames,
        items,
        uniqueItems,
      } = resolvedSchema
      const {
        'ui:order': order,
        items: uiItems,
        'ui:widget': widget,
        'ui:field': field,
        anyOf: uiAnyOf,
      } = resolvedUiSchema
      if (addAnswerVariants) {
        // Radio
        if (widget === VariantsWidget.Radio) {
          if (enumValues) {
            return Object.fromEntries(
              getRadioVariants(resolvedSchema, value, globalDefault)
            )
          }
          const { anyOf } = schema
          // Radio field with custom variant
          if (isArray(anyOf) && anyOf.length === 2) {
            const [enumSchema, customSchema] = anyOf as JSONSchema[]
            const variants = getRadioVariants(enumSchema, value, globalDefault)
            const { enum: enumValues } = enumSchema
            const customVariant: Entry<JSONType> = [
              getTitleFromSchemas(
                customSchema,
                (uiAnyOf && uiAnyOf[1]) || {}
              ) ?? DEFAULT_OTHER_VARIANT_NAME,
              enumValues && enumValues.includes(value) ? globalDefault : value,
            ]
            return Object.fromEntries([...variants, customVariant])
          }
        }
        // Checkboxes
        if (
          widget === VariantsWidget.Checkboxes &&
          isArraySchemaType(resolvedSchema) &&
          uniqueItems &&
          isArray(value) &&
          isRecord(items)
        ) {
          const { enum: enumValues, anyOf } = items as JSONSchema
          // Common
          if (enumValues) {
            return Object.fromEntries(
              getCheckboxesVariants(items, value, globalDefault)
            )
          }
          // With custom variant
          if (
            field === VariantsField.CheckboxesWithOtherVariants &&
            isArray(anyOf) &&
            anyOf.length === 2
          ) {
            const [enumSchema, customSchema] = anyOf as JSONSchema[]
            const variants = getCheckboxesVariants(
              enumSchema,
              value,
              globalDefault
            )
            const { enum: enumValues = [] } = enumSchema
            const customVariantValues = value.filter(
              (val) => !enumValues.includes(val)
            )
            const customVariant: Entry<JSONType> = [
              getTitleFromSchemas(
                customSchema,
                (uiAnyOf && uiAnyOf[1]) || {}
              ) ?? DEFAULT_OTHER_VARIANT_NAME,
              customVariantValues.length > 0
                ? customVariantValues[0]
                : globalDefault,
            ]
            return Object.fromEntries([...variants, customVariant])
          }
        }
      }
      if (isArray(value)) {
        if (
          useTupleTransform &&
          isArray(items) &&
          items.length === value.length
        ) {
          return TUPLES_TRANSFORMS[useTupleTransform](
            value,
            items as JSONSchema[],
            isArray<UiSchema>(uiItems) && items.length === uiItems.length
              ? uiItems
              : generate(items.length, () => ({}))
          )
        }
        return value
      }
      if (isRecord(value)) {
        let result = value
        if (addMissingFields && properties) {
          result = Object.keys(properties).reduce(
            (acc, key) =>
              key in acc
                ? acc
                : {
                    ...acc,
                    [key]: getDefaultValue(`${path}/${key}`),
                  },
            result
          )
        }
        if (useOrder && order) {
          result = {
            ...pick(result, order),
            ...omit(result, order),
          }
        }
        if (useTitles) {
          const replaceKeysWithTitles = makeEntriesTransform<
            JSONType,
            JSONType
          >(
            map(
              transformKey((key) => {
                const itemSchema = properties
                  ? ((properties[key] ?? {}) as JSONSchema)
                  : {}
                const itemUiSchema = resolvedUiSchema[key] ?? {}
                return getTitleFromSchemas(itemSchema, itemUiSchema) ?? key
              })
            )
          )
          result = replaceKeysWithTitles(result)
        }
        return defineMissingValues ? defineUndefinedValues(result) : result
      }
      if (
        useEnumNames &&
        enumValues &&
        isArray(enumNames) &&
        enumNames.every(isString)
      ) {
        const index = enumValues.indexOf(value)
        if (index >= 0) {
          return enumNames[index]
        }
      }
      return value
    }
  )
}
