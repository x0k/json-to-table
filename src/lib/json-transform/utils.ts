import { isFunction } from '@/lib/guards'

export function evalOrReturn<T>(context: T) {
  return <R>(unit: R | ((value: T) => R)): R =>
    isFunction(unit) ? unit(context) : unit
}
