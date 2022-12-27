import {
  makeNormalizerBySchemas,
  NormalizeBySchemasOptions,
  TupleTransformType,
} from './index'

const disabledOptions: NormalizeBySchemasOptions = {
  useOrder: false,
  useTitles: false,
  useEnumNames: false,
  useTupleTransform: false,
  addMissingFields: false,
  customDefaults: {},
  globalDefault: null,
  addAnswerVariants: false,
  defineMissingValues: false,
}

describe('makeNormalizerBySchemas', () => {
  it('Should replace values with enum names', () => {
    const normalize = makeNormalizerBySchemas({
      ...disabledOptions,
      useEnumNames: true,
    })
    const result = normalize({
      path: '#',
      schema: {
        type: 'array',
        items: {
          type: 'number',
          enum: [1, 2, 3],
          //@ts-expect-error custom field
          enumNames: ['one', 'two', 'three'],
        },
      },
      uiSchema: {},
      value: [3, 1, 2],
    })
    expect(result).toEqual(['three', 'one', 'two'])
  })
  it('Should transform tuple to record', () => {
    const normalize = makeNormalizerBySchemas({
      ...disabledOptions,
      useTupleTransform: TupleTransformType.Record,
    })
    const result = normalize({
      path: '#',
      schema: {
        type: 'object',
        properties: {
          tuple: {
            type: 'array',
            items: [
              { type: 'string', title: 'string' },
              { type: 'number', title: 'number' },
            ],
          },
          array: {
            type: 'array',
            items: {
              type: 'string',
              title: 'string',
            },
          },
        },
      },
      uiSchema: {
        tuple: {
          items: [{}, { 'ui:title': 'foo' }],
        },
        array: [{ 'ui:title': 'bar' }],
      },
      value: { tuple: ['baz', 123], array: ['val'] },
    })
    expect(result).toEqual({
      tuple: { string: 'baz', foo: 123 },
      array: ['val'],
    })
  })
  it('Should add answer variants', () => {
    const normalize = makeNormalizerBySchemas({
      ...disabledOptions,
      addAnswerVariants: true,
    })
    const result = normalize({
      path: '#',
      schema: {
        type: 'object',
        properties: {
          radioField: {
            type: 'string',
            enum: ['Yes', 'No'],
          },
          radioFieldWithCustomVariant: {
            anyOf: [
              {
                type: 'number',
                enum: [1, 2],
              },
              {
                type: 'string',
                title: 'Other number',
              },
            ],
          },
          checkboxesField: {
            type: 'array',
            uniqueItems: true,
            items: {
              type: 'string',
              enum: ['foo', 'bar'],
            },
          },
          checkboxesFieldWithCustomVariant: {
            type: 'array',
            uniqueItems: true,
            items: {
              anyOf: [
                { type: 'string', enum: ['first', 'second'] },
                { type: 'string', title: 'Other' },
              ],
            },
          },
        },
      },
      uiSchema: {
        radioField: {
          'ui:widget': 'radio',
        },
        radioFieldWithCustomVariant: {
          'ui:widget': 'radio',
        },
        checkboxesField: {
          'ui:widget': 'checkboxes',
        },
        checkboxesFieldWithCustomVariant: {
          'ui:widget': 'checkboxes',
          'ui:field': 'checkboxesWithOtherVariants',
        },
      },
      value: {
        radioField: 'Yes',
        radioFieldWithCustomVariant: 3,
        checkboxesField: ['bar'],
        checkboxesFieldWithCustomVariant: ['first', 'other'],
      },
    })
    expect(result).toEqual({
      radioField: { Yes: 'Yes', No: null },
      radioFieldWithCustomVariant: {
        '1': null,
        '2': null,
        'Other number': 3,
      },
      checkboxesField: {
        foo: null,
        bar: 'bar',
      },
      checkboxesFieldWithCustomVariant: {
        first: 'first',
        second: null,
        Other: 'other',
      },
    })
  })
})
