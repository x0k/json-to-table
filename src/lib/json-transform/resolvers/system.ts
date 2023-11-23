import { isRecord, isString } from '@/lib/guards'
import { JSONValue } from '@/lib/json'
import { makeEntriesTransform, transformValue } from '@/lib/entry'
import { map } from '@/lib/array'

import {
  TransformActionOrData,
  TransformAction,
  TransformResolver,
} from '../model'
import { evalOrReturn } from '../utils'

export enum SystemActionType {
  Define = 'define',
  Call = 'call',
  Get = 'get',
}

export interface SystemAction<T extends SystemActionType> {
  $sys: T
}

export interface SystemDefineAction
  extends SystemAction<SystemActionType.Define> {
  constants?: Record<string, TransformActionOrData>
  functions?: Record<string, TransformAction>
  for: TransformAction
}

export interface SystemGetAction extends SystemAction<SystemActionType.Get> {
  constant: string
  default?: TransformActionOrData
}

export interface SystemCallAction extends SystemAction<SystemActionType.Call> {
  function: string
  argument?: JSONValue | TransformAction
}

export type SystemActions =
  | SystemDefineAction
  | SystemCallAction
  | SystemGetAction

const SYSTEM_ACTION_TYPES = Object.values(SystemActionType)

function isSystemAction(
  value: unknown
): value is SystemAction<SystemActionType> {
  if (isRecord(value)) {
    const action = value['$sys']
    if (isString(action)) {
      return SYSTEM_ACTION_TYPES.includes(action as SystemActionType)
    }
  }
  return false
}

export interface SystemScope {
  constants: Record<string, JSONValue>
  functions: Record<string, TransformAction>
}

function mergeSystemScopes(a: SystemScope, b: SystemScope): SystemScope {
  return {
    constants: { ...a.constants, ...b.constants },
    functions: { ...a.functions, ...b.functions },
  }
}

export function systemResolver(
  initialScope?: Partial<SystemScope>
): TransformResolver {
  const stack: SystemScope[] = [
    { constants: {}, functions: {}, ...initialScope },
  ]
  let currentScopeIndex = 0
  const handlers: {
    [T in SystemActionType]: (
      params: Extract<SystemActions, SystemAction<T>>
    ) => TransformAction
  } = {
    [SystemActionType.Define]:
      ({ for: scope, constants = {}, functions = {} }) =>
      (context) => {
        const evalConstants = makeEntriesTransform<
          TransformActionOrData,
          JSONValue
        >(map(transformValue(evalOrReturn(context))))
        stack.push(
          mergeSystemScopes(stack[currentScopeIndex++], {
            constants: evalConstants(constants),
            functions,
          })
        )
        const result = scope(context)
        currentScopeIndex--
        stack.pop()
        return result
      },
    [SystemActionType.Call]:
      ({ function: fnName, argument }) =>
      (context) => {
        const fn = stack[currentScopeIndex].functions[fnName]
        const arg = evalOrReturn(context)(argument ?? context)
        return fn(arg)
      },
    [SystemActionType.Get]:
      ({ constant, default: def = null }) =>
      (context) => {
        const val = stack[currentScopeIndex].constants[constant]
        return val === undefined ? evalOrReturn(context)(def) : val
      },
  }
  return (value) =>
    isSystemAction(value) //@ts-expect-error wrong type inference
      ? handlers[value.$sys](value)
      : value
}
