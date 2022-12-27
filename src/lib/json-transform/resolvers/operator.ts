import { isRecord, isString } from 'lib/guards'

import { TransformAction, TransformResolver } from '../model'

export interface TypeParam<T extends string> {
  $op: T
}

export type OperatorFactory<Params> = (params: Params) => TransformAction

export type OperatorsVisitor<Operators extends Record<string, unknown>> = {
  [K in keyof Operators]: OperatorFactory<Operators[K]>
}

export function makeIsOperator<Operators extends Record<string, unknown>>(
  visitor: OperatorsVisitor<Operators>
) {
  return (value: unknown): value is TypeParam<keyof Operators & string> => {
    if (isRecord(value)) {
      const op = value['$op']
      if (isString(op)) {
        return op in visitor
      }
    }
    return false
  }
}

export function operatorResolver<Operators extends Record<string, unknown>>(
  visitor: OperatorsVisitor<Operators>
): TransformResolver {
  const isOperator = makeIsOperator(visitor)
  return (value) =>
    isOperator(value) //@ts-expect-error have no idea how to fix it
      ? visitor[value.$op](value)
      : value
}

export type Operators<
  OperatorsVisitor extends Record<string, OperatorFactory<never>>
> = {
  [K in keyof OperatorsVisitor & string]: TypeParam<K> &
    Parameters<OperatorsVisitor[K]>[0]
}[keyof OperatorsVisitor & string]
