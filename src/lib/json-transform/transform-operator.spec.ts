import { SystemActionType } from './resolvers'
import { makeTransformOperator } from './transform-operator'
import { TransformOperatorType } from './transform-operators'

describe('makeTransformOperator', () => {
  it('Should transform value', () => {
    const operator = makeTransformOperator({
      $sys: SystemActionType.Define,
      constants: {
        val: 1,
      },
      functions: {
        fn: {
          $op: TransformOperatorType.Multiply,
          operand: 2,
        },
      },
      for: {
        $op: TransformOperatorType.Pipe,
        operators: [
          {
            $op: TransformOperatorType.Sum,
            operand: { $sys: SystemActionType.Get, constant: 'val' },
          },
          { $sys: SystemActionType.Call, function: 'fn' },
        ],
      },
    })
    expect(operator(1)).toBe(4)
  })
  it('Stack should work', () => {
    const operator = makeTransformOperator({
      $sys: SystemActionType.Define,
      constants: {
        foo: 1,
      },
      functions: {
        fn: {
          $sys: SystemActionType.Get,
          constant: 'foo',
        },
      },
      for: {
        $op: TransformOperatorType.Sum,
        val: {
          $sys: SystemActionType.Define,
          constants: {
            foo: 2,
          },
          for: {
            $op: TransformOperatorType.Sum,
            operand: {
              $sys: SystemActionType.Call,
              function: 'fn',
            },
          },
        },
        operand: {
          $sys: SystemActionType.Call,
          function: 'fn',
        },
      },
    })
    expect(operator(2)).toBe(5)
  })
})
