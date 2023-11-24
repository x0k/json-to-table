import merge from 'deepmerge'
import {
  add,
  Duration,
  format,
  formatDuration,
  isValid,
  parse,
  set,
  sub,
} from 'date-fns'
import * as LOCALES from 'date-fns/locale'

import {
  isArray,
  isBoolean,
  isDefined,
  isFunction,
  isNumber,
  isSomething,
  isRecord,
  isString,
  isObject,
} from '@/lib/guards'
import {
  compareJsonValue,
  isJsonPrimitive,
  JSONArray,
  JSONRecord,
  JSONValue,
} from '@/lib/json'
import {
  Entry,
  isEntry,
  transformKey,
  transformValue,
  zip,
  unzip,
} from '@/lib/entry'
import {
  makeNormalizerBySchemas,
  NormalizeBySchemasOptions,
} from '@/lib/json-normalize-by-schemas'
import { sum } from '@/lib/math'
import { pick, omit } from '@/lib/record'
import { jsonTraverser } from '@/lib/json-traverser'
import { identity } from '@/lib/function'
import { NonEmptyArray } from '@/lib/array'

import { TransformAction } from './model'
import { evalOrReturn } from './utils'

export type Locale = keyof typeof LOCALES

export enum TransformOperatorType {
  Identity = 'identity',
  Absolute = 'abs',
  Pluck = 'pluck',
  Not = 'not',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'le',
  LessThanOrEqual = 'lte',
  Equal = 'equal',
  Pipe = 'pipe',
  And = 'and',
  Or = 'or',
  In = 'in',
  First = 'first',
  Last = 'last',
  Sum = 'sum',
  Subtract = 'sub',
  Divide = 'div',
  Multiply = 'mul',
  Modulo = 'mod',
  Pick = 'pick',
  Omit = 'omit',
  Assign = 'assign',
  Condition = 'cond',
  Count = 'count',
  Sort = 'sort',
  Filter = 'filter',
  GroupBy = 'groupBy',
  Fork = 'fork',
  Min = 'min',
  Max = 'max',
  Average = 'avg',
  Map = 'map',
  Join = 'join',
  Zip = 'zip',
  Record = 'record',
  IsNumber = 'isNum',
  IsString = 'isStr',
  IsBoolean = 'isBool',
  IsArray = 'isArr',
  IsObject = 'isObj',
  Push = 'push',
  Reduce = 'reduce',
  SumOf = 'sumOf',
  Wrap = 'wrap',
  TransformKey = 'transformKey',
  TransformValue = 'transformVal',
  TransformKeyValue = 'transformKeyVal',
  NormalizeBySchemas = 'normalizeBySchemas',
  Flat = 'flat',
  Concat = 'concat',
  Merge = 'merge',
  When = 'when',
  Simplify = 'simplify',
  JsonTraverser = 'jsonTraverser',
  TestRegExp = 'testRegExp',
  Every = 'every',
  Some = 'some',
  Unzip = 'unzip',
  Reverse = 'reverse',
  Reorder = 'reorder',
  ParseDate = 'parseDate',
  FormatDate = 'formatDate',
  FormatDuration = 'formatDuration',
  IsValidDate = 'isValidDate',
  ChangeDate = 'changeDate',
}

export const transformOperatorsVisitor = {
  [TransformOperatorType.Identity]: identityOperator,
  [TransformOperatorType.Absolute]: absoluteOperator,
  [TransformOperatorType.Pluck]: pluckOperator,
  [TransformOperatorType.Not]: notOperator,
  [TransformOperatorType.GreaterThan]: greaterThanOperator,
  [TransformOperatorType.GreaterThanOrEqual]: greaterThanOrEqualOperator,
  [TransformOperatorType.LessThan]: lessThanOperator,
  [TransformOperatorType.LessThanOrEqual]: lessThanOrEqualOperator,
  [TransformOperatorType.Equal]: equalOperator,
  [TransformOperatorType.Pipe]: pipeOperator,
  [TransformOperatorType.And]: andOperator,
  [TransformOperatorType.Or]: orOperator,
  [TransformOperatorType.In]: inOperator,
  [TransformOperatorType.First]: firstOperator,
  [TransformOperatorType.Last]: lastOperator,
  [TransformOperatorType.Sum]: sumOperator,
  [TransformOperatorType.Subtract]: subtractOperator,
  [TransformOperatorType.Divide]: divideOperator,
  [TransformOperatorType.Multiply]: multiplyOperator,
  [TransformOperatorType.Modulo]: moduloOperator,
  [TransformOperatorType.Pick]: pickOperator,
  [TransformOperatorType.Omit]: omitOperator,
  [TransformOperatorType.Assign]: assignOperator,
  [TransformOperatorType.Condition]: conditionOperator,
  [TransformOperatorType.Count]: countOperator,
  [TransformOperatorType.Sort]: sortOperator,
  [TransformOperatorType.Filter]: filterOperator,
  [TransformOperatorType.GroupBy]: groupByOperator,
  [TransformOperatorType.Fork]: forkOperator,
  [TransformOperatorType.Min]: minOperator,
  [TransformOperatorType.Max]: maxOperator,
  [TransformOperatorType.Average]: averageOperator,
  [TransformOperatorType.Map]: mapOperator,
  [TransformOperatorType.Join]: joinOperator,
  [TransformOperatorType.Zip]: zipOperator,
  [TransformOperatorType.Record]: recordOperator,
  [TransformOperatorType.IsBoolean]: isBooleanOperator,
  [TransformOperatorType.IsNumber]: isNumberOperator,
  [TransformOperatorType.IsString]: isStringOperator,
  [TransformOperatorType.IsArray]: isArrayOperator,
  [TransformOperatorType.IsObject]: isObjectOperator,
  [TransformOperatorType.Push]: pushOperator,
  [TransformOperatorType.Reduce]: reduceOperator,
  [TransformOperatorType.SumOf]: sumOfOperator,
  [TransformOperatorType.Wrap]: wrapOperator,
  [TransformOperatorType.TransformKey]: transformKeyOperator,
  [TransformOperatorType.TransformValue]: transformValueOperator,
  [TransformOperatorType.TransformKeyValue]: transformKeyValueOperator,
  [TransformOperatorType.NormalizeBySchemas]: normalizeBySchemasOperator,
  [TransformOperatorType.Flat]: flatOperator,
  [TransformOperatorType.Concat]: concatOperator,
  [TransformOperatorType.Merge]: mergeOperator,
  [TransformOperatorType.When]: whenOperator,
  [TransformOperatorType.Simplify]: simplifyOperator,
  [TransformOperatorType.JsonTraverser]: jsonTraverserOperator,
  [TransformOperatorType.TestRegExp]: testRegExpOperator,
  [TransformOperatorType.Every]: everyOperator,
  [TransformOperatorType.Some]: someOperator,
  [TransformOperatorType.Unzip]: unzipOperator,
  [TransformOperatorType.Reverse]: reverseOperator,
  [TransformOperatorType.Reorder]: reorderOperator,
  [TransformOperatorType.ParseDate]: parseDateOperator,
  [TransformOperatorType.FormatDate]: formatDateOperator,
  [TransformOperatorType.FormatDuration]: formatDurationOperator,
  [TransformOperatorType.IsValidDate]: isValidDateOperator,
  [TransformOperatorType.ChangeDate]: changeDateOperator,
}

export interface ValParam {
  /** Значение используемое оператором, по умолчанию `context`. */
  val?: JSONValue | TransformAction
}

export function identityOperator(): TransformAction {
  /**
   * @returns значение `context`
   */
  return identity
}

export function absoluteOperator({ val }: ValParam): TransformAction {
  /**
   * @returns Абсолютное значение `val`.
   */
  return (context) => {
    const num = evalOrReturn(context)(val ?? context)
    return isNumber(num) ? Math.abs(num) : null
  }
}

export interface PluckOperatorParams extends ValParam {
  /**
   * Ключ для значения {@link val}, строковое значение для объектов, числовое для массивов.
   * Для получения вложенных значений используется массив строк (в. ч. и для индексов).
   */
  key: string | number | TransformAction | NonEmptyArray<string>
  /** Значение по умолчанию, если ключ в {@link val} не найден */
  default?: JSONValue | TransformAction
}

export function pluckOperator({
  val,
  key: arg,
  default: def,
}: PluckOperatorParams): TransformAction {
  /**
   * @returns значение по ключу {@link PluckOperatorParams.key} из значения {@link PluckOperatorParams.val}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const key = evl(arg)
    if (isNumber(key) && isArray(value)) {
      return value[key] ?? (def === undefined ? null : evl(def))
    }
    if (isString(key) && isRecord(value)) {
      return value[key] ?? (def === undefined ? null : evl(def))
    }
    if (isArray(key) && key.every(isString)) {
      let result = value
      let i = 0
      while (i < key.length && isRecord(result)) {
        result = result[key[i++]]
      }
      return i === key.length && isDefined(result)
        ? result
        : def === undefined
        ? null
        : evl(def)
    }
    return null
  }
}

export function notOperator({ val }: ValParam): TransformAction {
  /**
   * @returns Инверсию значения {@link ValParam.val}, используя приведение типов.
   */
  return (context) => !evalOrReturn(context)(val ?? context)
}

export interface CompareOperatorParams extends ValParam {
  operand: JSONValue | TransformAction
}

export function greaterThanOperator({
  val,
  operand,
}: CompareOperatorParams): TransformAction {
  /**
   * @returns {@link CompareOperatorParams.val} > {@link CompareOperatorParams.operand}, используется структурное сравнение
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return compareJsonValue(evl(val ?? context), evl(operand)) === 1
  }
}

export function greaterThanOrEqualOperator({
  val,
  operand,
}: CompareOperatorParams): TransformAction {
  /**
   * @returns {@link CompareOperatorParams.val} >= {@link CompareOperatorParams.operand}, используется структурное сравнение
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return compareJsonValue(evl(val ?? context), evl(operand)) > -1
  }
}

export function lessThanOperator({
  val,
  operand,
}: CompareOperatorParams): TransformAction {
  /**
   * @returns {@link CompareOperatorParams.val} < {@link CompareOperatorParams.operand}, используется структурное сравнение
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return compareJsonValue(evl(val ?? context), evl(operand)) === -1
  }
}

export function lessThanOrEqualOperator({
  val,
  operand,
}: CompareOperatorParams): TransformAction {
  /**
   * @returns {@link CompareOperatorParams.val} <= {@link CompareOperatorParams.operand}, используется структурное сравнение
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return compareJsonValue(evl(val ?? context), evl(operand)) < 1
  }
}

export function equalOperator({
  val,
  operand,
}: CompareOperatorParams): TransformAction {
  /**
   * @returns {@link CompareOperatorParams.val} = {@link CompareOperatorParams.operand}, используется структурное сравнение
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return compareJsonValue(evl(val ?? context), evl(operand)) === 0
  }
}

export interface PipeOperatorParams extends ValParam {
  /** Список операторов */
  operators: NonEmptyArray<TransformAction>
}

export function pipeOperator({
  val,
  operators,
}: PipeOperatorParams): TransformAction {
  /**
   * Оператор использует значение {@link PipeOperatorParams.val} в качестве контекста для вычисления первого оператора,
   * результат вычисления становится контекстом для вычисления следующего оператора и т. д.
   *
   * @returns Значение вычисленное последним оператором
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return operators.reduce(
      (acc, operator) => operator(acc),
      evl(val ?? context)
    )
  }
}

export interface ConditionsOperatorProps {
  conditions: NonEmptyArray<TransformAction>
}

export function andOperator({
  conditions,
}: ConditionsOperatorProps): TransformAction {
  /**
   * @returns Последнее истинное значение либо первое ложное.
   * Используется: приведение типов, сокращённое вычисление.
   */
  return (context) => {
    const count = conditions.length
    let i = 0
    let result = null
    while (i < count) {
      result = evalOrReturn(context)(conditions[i++])
      if (!result) {
        return result
      }
    }
    return result
  }
}

export function orOperator({
  conditions,
}: ConditionsOperatorProps): TransformAction {
  return (context) => {
    /**
     * @returns Первое истинное значение либо последнее ложное.
     * Используется: приведение типов, сокращённое вычисление.
     */
    const count = conditions.length
    let i = 0
    let result = null
    while (i < count) {
      result = evalOrReturn(context)(conditions[i++])
      if (result) {
        return result
      }
    }
    return result
  }
}

export interface InOperatorParams extends ValParam {
  /** Список значений */
  values: JSONArray | TransformAction
}

export function inOperator({ val, values }: InOperatorParams): TransformAction {
  /**
   * @returns Входит ли значение {@link InOperatorParams.val} в {@link InOperatorParams.values}.
   * Применяется структурное сравнение.
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const range = evl(values)
    return isArray(range)
      ? range.find((item) => compareJsonValue(value, item) === 0) ?? false
      : null
  }
}

export function firstOperator({ val }: ValParam): TransformAction {
  /**
   * @returns Первый элемент `val`.
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value[0] ?? null : null
  }
}

export function lastOperator({ val }: ValParam): TransformAction {
  /**
   * @returns Последний элемент `val`.
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value[value.length - 1] ?? null : null
  }
}

export interface MathOperatorParams extends ValParam {
  operand: number | TransformAction
}

export function sumOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns {@link MathOperatorParams.val} + {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? a + b : null
  }
}

export function subtractOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns {@link MathOperatorParams.val} - {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? a - b : null
  }
}

export function divideOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns {@link MathOperatorParams.val} / {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? a / b : null
  }
}

export function multiplyOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns {@link MathOperatorParams.val} * {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? a * b : null
  }
}

export function moduloOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns Остаток деления {@link MathOperatorParams.val} на {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? a % b : null
  }
}

export function minOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns Наименьшее из значений {@link MathOperatorParams.val} и {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? Math.min(a, b) : null
  }
}

export function maxOperator({
  val,
  operand,
}: MathOperatorParams): TransformAction {
  /**
   * @returns Наибольшее из значений {@link MathOperatorParams.val} и {@link MathOperatorParams.operand}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const a = evl(val ?? context)
    const b = evl(operand)
    return isNumber(a) && isNumber(b) ? Math.max(a, b) : null
  }
}

export interface ObjectOperatorParams extends ValParam {
  /** Ключи объекта {@link val} */
  keys: NonEmptyArray<string>
}

export function pickOperator({
  val,
  keys,
}: ObjectOperatorParams): TransformAction {
  /**
   * @returns JSON объект содержащий указанные ключи ({@link ObjectOperatorParams.keys}) из объекта {@link ObjectOperatorParams.val}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const fields = evl(keys)
    return isRecord(value) && isArray(fields) && fields.every(isString)
      ? pick(value, fields)
      : null
  }
}

export function omitOperator({
  val,
  keys,
}: ObjectOperatorParams): TransformAction {
  /**
   * @returns JSON Объект {@link ObjectOperatorParams.val} с удаленными указанными ключами ({@link ObjectOperatorParams.keys})
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const fields = evl(keys)
    return isRecord(value) && isArray(fields) && fields.every(isString)
      ? omit(value, fields)
      : null
  }
}

export interface AssignOperatorParams extends ValParam {
  /** JSON Объект для объединения */
  record: JSONRecord | TransformAction
  /**
   * Указывает на необходимость перезаписи ключей {@link val} ключами объекта {@link record} в случае их совпадения.
   * По умолчанию `true`
   */
  override?: boolean
}

export function assignOperator({
  val,
  record,
  override,
}: AssignOperatorParams): TransformAction {
  /**
   * @returns Объединение объектов `val` и `record`
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const object = evl(record)
    return isRecord(value) && isRecord(object)
      ? override
        ? {
            ...value,
            ...object,
          }
        : {
            ...object,
            ...pick(
              value,
              Object.keys(value).filter((key) => isSomething(value[key]))
            ),
          }
      : null
  }
}

export interface ConditionOperatorParams {
  if: TransformAction
  then: JSONValue | TransformAction
  else: JSONValue | TransformAction
}

export function conditionOperator({
  if: condition,
  then,
  else: otherwise,
}: ConditionOperatorParams): TransformAction {
  /**
   * @returns Значение {@link ConditionOperatorParams.then} в случае истинности условия {@link ConditionOperatorParams.if}, иначе значение {@link ConditionOperatorParams.else}.
   */
  return (context) => {
    const evl = evalOrReturn(context)
    return condition(context) ? evl(then) : evl(otherwise)
  }
}

export function countOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value.length : null
  }
}

export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

export interface SortField {
  /** Оператор получения значения для сравнения */
  field: TransformAction
  /** Направление сортировки */
  direction: SortOrder
}

export interface SortOperatorParams extends ValParam {
  /** Список полей, по которым происходит сортировка */
  fields: NonEmptyArray<SortField>
}

export function sortOperator({
  val,
  fields,
}: SortOperatorParams): TransformAction {
  /**
   * @returns Отсортированный список {@link SortOperatorParams.val}.
   * Используется структурное сравнение
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    const len = fields.length
    return isArray(value)
      ? value.slice().sort((a, b) => {
          let i = 0
          while (i < len) {
            const { direction, field } = fields[i++]
            const aVal = field(a)
            const bVal = field(b)
            const result = compareJsonValue(aVal, bVal)
            if (result !== 0) {
              return direction === SortOrder.Ascending ? result : -result
            }
          }
          return 0
        })
      : null
  }
}

export interface ArrayOperatorParams extends ValParam {
  /** Предикат, в качестве контекста получает элемент {@link val} */
  predicate: TransformAction
}

export function filterOperator({
  val,
  predicate,
}: ArrayOperatorParams): TransformAction {
  /**
   * @returns Отфильтрованный список {@link ArrayOperatorParams.val} с использованием указанного предиката ({@link ArrayOperatorParams.predicate})
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value.filter(predicate) : null
  }
}

export function everyOperator({
  val,
  predicate,
}: ArrayOperatorParams): TransformAction {
  /**
   * @returns `true`, если для каждого элемента {@link ArrayOperatorParams.val} значение {@link ArrayOperatorParams.predicate} истинно, иначе `false`
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value.every(predicate) : null
  }
}

export function someOperator({
  val,
  predicate,
}: ArrayOperatorParams): TransformAction {
  /**
   * @returns `true`, если для любого элемента {@link ArrayOperatorParams.val} значение {@link ArrayOperatorParams.predicate} истинно, иначе `false`
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value.some(predicate) : null
  }
}

export interface GroupByOperatorParams extends ValParam {
  /** Оператор получения группировочного значения */
  field: JSONValue | TransformAction
}

export function groupByOperator({
  val,
  field,
}: GroupByOperatorParams): TransformAction {
  /**
   * @returns Список пар (кортежей) состоящих из значения группировки и соответствующих элементов массива {@link GroupByOperatorParams.val}
   */
  return (context) => {
    const items = evalOrReturn(context)(val ?? context)
    if (!isArray(items)) {
      return null
    }
    return items.reduce(
      (acc: [JSONValue, JSONValue[]][], val): [JSONValue, JSONValue[]][] => {
        const fieldValue = evalOrReturn(val)(field)
        const entry = acc.find(
          ([entryKey]) => compareJsonValue(entryKey, fieldValue) === 0
        )
        if (entry) {
          entry[1].push(val)
          return acc
        }
        return [...acc, [fieldValue, [val]]]
      },
      []
    )
  }
}

export interface ForkOperatorParams extends ValParam {
  /**
   * Список либо объект содержащий операторы
   */
  branches:
    | NonEmptyArray<TransformAction | JSONValue>
    | Record<string, TransformAction | JSONValue>
}

export function forkOperator({
  val,
  branches,
}: ForkOperatorParams): TransformAction {
  /**
   * @returns Значение с вычисленными операторами, которым в качестве контекста передавалось значение {@link ForkOperatorParams.val}
   */
  return isArray(branches)
    ? (context) => {
        const value = evalOrReturn(context)(val ?? context)
        return branches.map((item) => (isFunction(item) ? item(value) : item))
      }
    : (context) => {
        const value = evalOrReturn(context)(val ?? context)
        return Object.fromEntries(
          Object.entries(branches).map(
            transformValue((item) => (isFunction(item) ? item(value) : item))
          )
        )
      }
}

/**
 * @returns Среднее значение для `val`.
 */
export function averageOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) && value.length > 0 && value.every(isNumber)
      ? value.reduce(sum) / value.length
      : null
  }
}

export interface MapOperatorParams extends ValParam {
  /** Оператор трансформации элементов {@link val} */
  transform: TransformAction
  /**
   * Если `true`, то в качестве контекста оператора трансформации будет передан объект `{ item, index, array, context }`.
   * По умолчанию `false`.
   */
  withContext?: boolean
}

export function mapOperator({
  transform,
  val,
  withContext,
}: MapOperatorParams): TransformAction {
  /**
   * @returns Массив {@link MapOperatorParams.val} с примененной поэлементной трансформацией ({@link MapOperatorParams.transform})
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value)
      ? withContext
        ? value.map((item, index, array) =>
            transform({ item, index, array, context })
          )
        : value.map(transform)
      : null
  }
}

export interface JoinOperatorParams extends ValParam {
  /** Разделитель элементов {@link val} */
  separator: string | TransformAction
}

export function joinOperator({
  val,
  separator,
}: JoinOperatorParams): TransformAction {
  /**
   * @returns Объединение значений {@link JoinOperatorParams.val} в строку с использованием разделителя ({@link JoinOperatorParams.separator})
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const sep = evl(separator)
    return isArray(value) && isString(sep) ? value.join(sep) : null
  }
}

export interface ZipOperatorParams {
  /** Список ключей */
  keys: NonEmptyArray<string> | TransformAction
  /** Список значений */
  items: JSONArray | TransformAction
}

export function zipOperator({
  keys,
  items,
}: ZipOperatorParams): TransformAction {
  /**
   * @returns Список {@link Entry | записей} состоящих из ключа и значения с одинаковым индексом из {@link ZipOperatorParams.keys} и {@link ZipOperatorParams.items} соответственно
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const keysValue = evl(keys)
    const itemsValue = evl(items)
    return isArray(keysValue) &&
      keysValue.every(isString) &&
      isArray(itemsValue)
      ? zip(keysValue, itemsValue)
      : null
  }
}

/**
 * @returns JSON Объект составленный из {@link Entry | записей} в {@link ValParam.val}
 */
export function recordOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) && value.every(isEntry)
      ? Object.fromEntries(value as Entry<JSONValue>[])
      : null
  }
}

/**
 * @returns Является ли {@link ValParam.val} булевым значением
 */
export function isBooleanOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isBoolean(value)
  }
}

/**
 * @returns Является ли {@link ValParam.val} числом
 */
export function isNumberOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isNumber(value)
  }
}

/**
 * @returns Является ли {@link ValParam.val} строкой
 */
export function isStringOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isString(value)
  }
}

/**
 * @returns Является ли {@link ValParam.val} массивом
 */
export function isArrayOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value)
  }
}

/**
 * @returns Является ли {@link ValParam.val} объектом
 */
export function isObjectOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isRecord(value)
  }
}

export interface PushOperatorParams extends ValParam {
  item: JSONValue | TransformAction
}

export function pushOperator({
  val,
  item,
}: PushOperatorParams): TransformAction {
  /**
   * @returns Список {@link PushOperatorParams.val} с добавленным в конец элементом {@link PushOperatorParams.item}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const lastItem = evl(item)
    return isArray(value) ? [...value, lastItem] : null
  }
}

export interface ReduceOperatorParams extends ValParam {
  /** Оператор вычисления аккумулятора, в качестве контекста получает объект `{ previous, current, index, array, context }` */
  reducer: TransformAction
  /** Начальное значение аккумулятора */
  initial?: JSONValue | TransformAction
}

export function reduceOperator({
  reducer: arg,
  initial,
  val,
}: ReduceOperatorParams): TransformAction {
  /**
   * Выполняет оператор {@link ReduceOperatorParams.reducer} для элементов {@link ReduceOperatorParams.val} слева на право
   * @returns Итоговое значение аккумулятора
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const initialValue = initial && evl(initial)
    const reducer = (
      previous: JSONValue,
      current: JSONValue,
      index: number,
      array: JSONArray
    ) => arg({ previous, current, index, array, context })
    return isArray(value)
      ? initialValue === undefined
        ? value.reduce(reducer)
        : value.reduce(reducer, initialValue)
      : null
  }
}

/**
 * @returns Сумму значений {@link ValParam.val}
 */
export function sumOfOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const items = evalOrReturn(context)(val ?? context)
    return isArray(items) && items.every(isNumber) ? items.reduce(sum, 0) : null
  }
}

export interface WrapOperatorParams extends ValParam {
  /** Ключ, указывает на необходимость создания объекта */
  key?: string | TransformAction
}

export function wrapOperator({
  val,
  key,
}: WrapOperatorParams): TransformAction {
  /**
   * @returns Массив состоящий из значения {@link WrapOperatorParams.val} либо объект содержащий ключ {@link WrapOperatorParams.key} и значение {@link WrapOperatorParams.val}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const result = evl(val ?? context)
    if (key === undefined) {
      return [result]
    }
    const field = evl(key)
    return isString(field) ? { [field]: result } : null
  }
}

export interface TransformKeyOperatorParams extends ValParam {
  transform: TransformAction
}

export function transformKeyOperator({
  val,
  transform,
}: TransformKeyOperatorParams): TransformAction {
  /**
   * @returns Модифицированную {@link Entry | Запись} {@link TransformKeyOperatorParams.val} с измененным ключом при помощи оператора {@link TransformKeyOperatorParams.transform}
   */
  return (context) => {
    const entry = evalOrReturn(context)(val ?? context)
    return isEntry<JSONValue>(entry)
      ? transformKey(transform as (k: string) => string)(entry)
      : null
  }
}

export interface TransformValueOperatorParams extends ValParam {
  transform: TransformAction
  /**
   * Если `true`, то в качестве контекста оператору {@link transform} передается объект `{ key, value, context }`.
   * По умолчанию `false`.
   */
  withContext?: boolean
}

export function transformValueOperator({
  val,
  transform,
  withContext,
}: TransformValueOperatorParams): TransformAction {
  /**
   * @returns Модифицированную {@link Entry | Запись} {@link TransformValueOperatorParams.val} с измененным значением при помощи оператора {@link TransformValueOperatorParams.transform}
   */
  return (context) => {
    const entry = evalOrReturn(context)(val ?? context)
    return isEntry<JSONValue>(entry)
      ? withContext
        ? [
            entry[0],
            transform({
              key: entry[0],
              value: entry[1],
              context,
            }),
          ]
        : transformValue(transform)(entry)
      : null
  }
}

export interface TransformKeyValueOperatorParams extends ValParam {
  transformKey: TransformAction
  transformValue: TransformAction
}

export function transformKeyValueOperator({
  val,
  transformKey,
  transformValue,
}: TransformKeyValueOperatorParams): TransformAction {
  /**
   * @returns Модифицированную {@link Entry | Запись} {@link TransformKeyValueOperatorParams.val} с измененным ключом и значение при помощи операторов {@link TransformKeyValueOperatorParams.transformKey} и {@link TransformKeyValueOperatorParams.transformValue} соответственно.
   */
  return (context) => {
    const entry = evalOrReturn(context)(val ?? context)
    return isEntry<JSONValue>(entry)
      ? [transformKey(entry[0]), transformValue(entry[1])]
      : null
  }
}

export interface NormalizeBySchemasOperatorParams extends ValParam {
  /** JSON схема значения {@link val} */
  schema: JSONRecord
  /** UI схема значения {@link val} */
  uiSchema: JSONRecord
  /** {@link NormalizeBySchemasOptions | Опции нормализации} */
  normalizeOptions?: NormalizeBySchemasOptions
}

export function normalizeBySchemasOperator({
  schema,
  uiSchema,
  normalizeOptions,
  val,
}: NormalizeBySchemasOperatorParams): TransformAction {
  const normalize = makeNormalizerBySchemas({
    useOrder: true,
    useTitles: true,
    addMissingFields: true,
    useEnumNames: false,
    useTupleTransform: false,
    customDefaults: {},
    globalDefault: '',
    addAnswerVariants: false,
    defineMissingValues: true,
    ...normalizeOptions,
  })
  /**
   * @returns Нормализованное значение {@link NormalizeBySchemasOperatorParams.val} с учетом JSON схемы, UI схемы и указанных опций нормализации
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return normalize({ value, schema, uiSchema, path: '#' })
  }
}

export interface FlatOperatorParams extends ValParam {
  /**
   * Глубина уплощения.
   * По умолчанию `1`.
   */
  depth?: number
}

export function flatOperator({
  val,
  depth,
}: FlatOperatorParams): TransformAction {
  /**
   * @returns Уплощенный массив {@link FlatOperatorParams.val} с глубиной уплощения {@link FlatOperatorParams.depth}
   */
  return (context) => {
    const items = evalOrReturn(context)(val ?? context)
    //@ts-expect-error
    return isArray(items) ? items.flat(depth) : null
  }
}

export interface ConcatOperatorParams extends ValParam {
  /** Присоединяемые значения. Если не является списком, то воспринимается как список из одного элемента */
  items: JSONValue | TransformAction
}

export function concatOperator({
  val,
  items,
}: ConcatOperatorParams): TransformAction {
  /**
   * @returns Список {@link ConcatOperatorParams.val} с присоединенными значениями {@link ConcatOperatorParams.items}
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const item = evl(items)
    return isArray(value) ? value.concat(item) : null
  }
}

export interface MergeOperatorParams extends ValParam {
  /**
   * Признак необходимости глубокого объединения.
   * По умолчанию `false`
   */
  deep?: boolean
}

export function mergeOperator({
  val,
  deep,
}: MergeOperatorParams): TransformAction {
  /**
   * @returns Объединение объектов из {@link MergeOperatorParams.val}
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) && value.every(isRecord)
      ? deep
        ? merge.all(value as JSONRecord[])
        : Object.assign({}, ...value)
      : null
  }
}

export interface WhenBranch {
  /** Условие */
  case: TransformAction
  /** Значение */
  then: TransformAction | JSONValue
}

export interface WhenOperatorParams extends ValParam {
  branches: NonEmptyArray<WhenBranch>
  /** Значение по умолчанию, по умолчанию `null` */
  else?: TransformAction | JSONValue
}

export function whenOperator({
  val,
  branches,
  else: otherwise = null,
}: WhenOperatorParams): TransformAction {
  /**
   * @returns {@link WhenBranch.then | Значение} первой {@link WhenBranch | ветки} {@link WhenBranch.case | условие} которой истинно,
   * иначе значение {@link WhenOperatorParams.else}.
   */
  return (context) => {
    const evl = evalOrReturn(context)
    const value = evl(val ?? context)
    const branch = branches.find(({ case: condition }) => condition(value))
    return evalOrReturn(value)(branch ? branch.then : otherwise)
  }
}

export interface SimplifyOperatorParams extends ValParam {
  /** Объединять список примитивов в строку */
  concatPrimitives: boolean
  /** Разделитель для объединения примитивов, по умолчанию `,` */
  primitivesSeparator?: string
  /** Объединять списки объектов в один объект */
  mergeObjects: boolean
  /** Использовать глубокое объединение объектов, по умолчанию `false` */
  deepMerge?: boolean
  /** Уплощать массивы массивов */
  concatArrays: boolean
}

export function simplifyOperator({
  val,
  concatArrays,
  concatPrimitives,
  mergeObjects,
  deepMerge,
  primitivesSeparator,
}: SimplifyOperatorParams): TransformAction {
  /**
   * @returns Упрощенное значение {@link SimplifyOperatorParams.val} в соответствии с указанными параметрами
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    if (isArray(value)) {
      if (concatPrimitives && value.every(isJsonPrimitive)) {
        return value.join(primitivesSeparator)
      }
      if (concatArrays && value.every(isArray)) {
        return value.flat()
      }
      if (mergeObjects && value.every(isRecord)) {
        return deepMerge
          ? merge.all(value as Record<string, unknown>[])
          : Object.assign({}, ...value)
      }
      return value
    }
    return value
  }
}

export interface JsonTraverseOperatorParams extends ValParam {
  visitor: TransformAction
  /** В случае `true` в качестве контекста для оператора {@link visitor} передается объект `{ value, path }` */
  withPath?: boolean
}

export function jsonTraverserOperator({
  val,
  visitor,
  withPath,
}: JsonTraverseOperatorParams): TransformAction {
  /**
   * @returns Трансформированное значение {@link JsonTraverseOperatorParams.val} при помощи оператора {@link JsonTraverseOperatorParams.visitor}.
   * Используется обход в глубину
   */
  return (context) => {
    const traverse = jsonTraverser<JSONValue>(
      withPath ? (value, path) => visitor({ value, path }) : visitor
    )
    return traverse(evalOrReturn(context)(val ?? context))
  }
}

export interface TestRegExpOperatorParams extends ValParam {
  pattern: string
  /** Флаги регулярного выражения */
  flags?: string
}

export function testRegExpOperator({
  val,
  pattern,
  flags,
}: TestRegExpOperatorParams): TransformAction {
  /**
   * @returns Соответствие значения {@link TestRegExpOperatorParams.val} указанному шаблону ({@link TestRegExpOperatorParams.pattern})
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    if (!isString(value)) {
      return null
    }
    const regExp = new RegExp(pattern, flags)
    return regExp.test(value)
  }
}

export function unzipOperator({ val }: ValParam): TransformAction {
  /**
   * {@link ValParam.val} - список {@link Entry | записей}
   * @returns Кортеж из 2 массивов - ключей и значений
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) && value.every(isEntry)
      ? unzip(value as Entry<JSONValue>[])
      : null
  }
}

export function reverseOperator({ val }: ValParam): TransformAction {
  /**
   * @returns Реверсированный список {@link ValParam.val}
   */
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isArray(value) ? value.slice().reverse() : null
  }
}

export interface ReorderOperatorParams extends ValParam {
  /** Список ключей для перемещения в начало */
  head?: string[]
  /** Список ключей для перемещения в конец */
  tail?: string[]
}

export function reorderOperator({
  head,
  tail,
  val,
}: ReorderOperatorParams): TransformAction {
  const allKeys = [head, tail].filter(isDefined).flat()
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isRecord(value)
      ? allKeys.length > 0
        ? {
            ...(head && pick(value, head)),
            ...omit(value, allKeys),
            ...(tail && pick(value, tail)),
          }
        : value
      : null
  }
}

export interface ParseDateParams extends ValParam {
  format: string
  referenceDate?: number | Date
  locale?: Locale
}

export function parseDateOperator({
  val,
  format,
  referenceDate = new Date(),
  locale = 'ru',
}: ParseDateParams): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isString(value)
      ? parse(value, format, referenceDate, {
          locale: LOCALES[locale],
        }).getTime()
      : null
  }
}

type FormatDateOptions = Exclude<Parameters<typeof format>[2], undefined>

export interface FormatDateOperatorParams
  extends ValParam,
    Omit<FormatDateOptions, 'locale'> {
  pattern: string
  locale?: Locale
}

export function formatDateOperator({
  val,
  pattern,
  locale = 'ru',
  ...rest
}: FormatDateOperatorParams): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(val ?? context)
    return isString(value) || isNumber(value)
      ? format(new Date(value), pattern, { locale: LOCALES[locale], ...rest })
      : null
  }
}

export interface FormatDurationParams extends ValParam {
  locale?: Locale
}

export function formatDurationOperator({
  val,
  locale = 'ru',
}: FormatDurationParams): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(context ?? val)
    return isObject(value)
      ? formatDuration(value, { locale: LOCALES[locale] })
      : null
  }
}

export function isValidDateOperator({ val }: ValParam): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(context ?? val)
    return isValid(value)
  }
}

export enum ChangeDateOperation {
  Set = 'set',
  Add = 'add',
  Sub = 'sub',
}

const CHANGE_OPERATIONS = {
  [ChangeDateOperation.Add]: add,
  [ChangeDateOperation.Set]: set,
  [ChangeDateOperation.Sub]: sub,
}

export interface ChangeDateOperatorParams extends ValParam, Duration {
  operation: ChangeDateOperation
}

export function changeDateOperator({
  val,
  operation,
  ...rest
}: ChangeDateOperatorParams): TransformAction {
  return (context) => {
    const value = evalOrReturn(context)(context ?? val)
    const change = CHANGE_OPERATIONS[operation]
    return isString(value) || isNumber(value)
      ? change(new Date(value), rest).getTime()
      : null
  }
}
