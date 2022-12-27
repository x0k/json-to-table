import { JSONType } from 'lib/json'
import { isFunction } from 'lib/guards'

import { TransformResolver, TransformAction } from '../model'

export interface TransformLoggerOptions {
  value: TransformAction
  context: JSONType
  result: JSONType
}

export function loggerResolver(
  logger: (options: TransformLoggerOptions) => void
): TransformResolver {
  return (value) =>
    isFunction(value)
      ? (context) => {
          const result = value(context)
          logger({ value, context, result })
          return result
        }
      : value
}
