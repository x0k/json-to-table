import { flow } from '@/lib/function'
import { jsonTraverser } from '@/lib/json-traverser'

import { TransformAction, TransformInput } from './model'
import {
  operatorResolver,
  Operators,
  systemResolver,
  SystemActions,
} from './resolvers'
import { transformOperatorsVisitor } from './transform-operators'

export type TransformOperators = Operators<typeof transformOperatorsVisitor>

export type Input = TransformInput<SystemActions | TransformOperators>

const transform = flow(
  systemResolver(),
  operatorResolver(transformOperatorsVisitor)
)

export const makeTransformOperator = jsonTraverser(transform) as (
  value: Input
) => TransformAction
