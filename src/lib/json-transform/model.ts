import { JSONPrimitive, JSONType } from 'lib/json'

export type TransformAction = (context: JSONType) => JSONType

export type TransformActionOrData = JSONType | TransformAction

export type ResolvedTransformData =
  | JSONPrimitive
  | TransformAction
  | ResolvedTransformData[]
  | { [k: string]: ResolvedTransformData }

export type TransformResolver = (
  value: ResolvedTransformData
) => ResolvedTransformData

export type TransformInput<
  Input,
  Global = Input
> = Input extends TransformAction
  ? Exclude<Input, TransformAction> | TransformInput<Global>
  : Input extends Array<infer I>
  ? TransformInput<I, Global>[]
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Input extends Record<string, any>
  ? { [K in keyof Input]: TransformInput<Input[K], Global> }
  : Input
