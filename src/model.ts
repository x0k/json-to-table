import { UiSchema } from '@rjsf/utils'

import { JSONSchema } from 'lib/json-schema'
import { TransformOptions, ViewType, VIEW_TYPES } from 'lib/json-table'

export enum ReportType {
  Default = 'default',
  Custom = 'custom',
}

export const REPORT_TYPE_TITLES: Record<ReportType, string> = {
  [ReportType.Default]: 'Default',
  [ReportType.Custom]: 'Custom',
}

export enum TransformPreset {
  Optimal = 'Optimal',
  Compact = 'Compact',
  Detailed = 'Detailed',
  Manual = 'Manual',
}

export enum TransformFormat {
  HTML = 'HTML',
  XLSX = 'XLSX',
}

export const TRANSFORM_SCHEMA: JSONSchema = {
  type: 'object',
  title: 'Settings',
  properties: {
    preset: {
      title: 'Preset',
      type: 'string',
      enum: Object.values(TransformPreset),
      default: TransformPreset.Optimal,
    },
    format: {
      title: 'File format',
      type: 'string',
      enum: Object.values(TransformFormat),
      default: TransformFormat.HTML,
    },
  },
  required: ['preset', 'format'],
  dependencies: {
    preset: {
      oneOf: [
        {
          properties: {
            preset: {
              const: TransformPreset.Manual,
            },
            headers: {
              type: 'boolean',
              title: 'Headers',
              description:
                'Enables/disables headers when merging tables by columns',
              default: true,
            },
            sortHeaders: {
              type: 'boolean',
              title: 'Sort headers',
              description: 'Enables/disables header sorting',
              default: false,
            },
            indexes: {
              type: 'boolean',
              title: 'Indexes',
              description:
                'Enables/disables headers when merging tables line by line',
              default: false,
            },
            concatPrimitiveValues: {
              title: 'Combine simple values',
              description:
                "Combines the values of an array of primitives into one cell (separated by ',')",
              type: 'boolean',
              default: true,
            },
            mergeRecordValues: {
              title: 'Combine complex values',
              description: 'Combines a set of complex values into one',
              type: 'boolean',
              default: false,
            },
            recordViewType: {
              title: 'Records presentation',
              description: 'Manage the display method for a JSON record type value',
              type: 'string',
              enum: VIEW_TYPES,
              enumNames: ['Rows', 'Columns'],
              default: ViewType.Columns,
            } as JSONSchema,
            arrayViewType: {
              title: 'Arrays presentation',
              description:
                'Manage the display method for a JSON array type value',
              type: 'string',
              enum: VIEW_TYPES,
              enumNames: ['Rows', 'Columns'],
              default: ViewType.Rows,
            } as JSONSchema,
            proportionalResizeLimit: {
              title: 'Proportional increase limit',
              description:
                'Specifies the relative amount by which the maximum element (height/width) can be increased',
              type: 'number',
              minimum: 0,
              default: 100,
            },
            horizontalReflect: {
              type: 'boolean',
              title: 'Reflect horizontally',
              default: false,
            },
            verticalReflect: {
              type: 'boolean',
              title: 'Reflect vertically',
              default: false,
            },
            transpose: {
              type: 'boolean',
              title: 'Transpose',
              default: false,
            },
          },
          required: [
            'recordViewType',
            'arrayViewType',
            'proportionalResizeLimit'
          ],
          dependencies: {
            headers: {
              oneOf: [
                {
                  properties: {
                    headers: {
                      const: true,
                    },
                    collapseHeaders: {
                      title: 'Remove duplicate headings',
                      description: 'Removes identical line headers',
                      type: 'boolean',
                      default: true,
                    },
                  },
                  dependencies: {
                    collapseHeaders: {
                      oneOf: [
                        {
                          properties: {
                            collapseHeaders: {
                              const: false,
                            },
                          },
                        },
                        {
                          properties: {
                            collapseHeaders: {
                              const: true,
                            },
                            supportForHeadersGrouping: {
                              title: 'Support for value grouping',
                              type: 'boolean',
                              default: true,
                            },
                          }
                        },
                      ],
                    },
                  },
                },
              ],
            },
            indexes: {
              oneOf: [
                {
                  properties: {
                    indexes: {
                      const: true,
                    },
                    collapseIndexes: {
                      title: 'Combine nested indexes',
                      description:
                        'Makes hierarchical indexes for nested strings (1.1, 1.2, ...)',
                      type: 'boolean',
                      default: true,
                    },
                  }
                },
              ],
            },
          },
        },
      ],
    },
  },
}

export const TRANSFORMED_UI_SCHEMA: UiSchema = {
  'ui:order': [
    'preset',
    'headers',
    'sortHeaders',
    'collapseHeaders',
    'supportForHeadersGrouping',
    'indexes',
    'collapseIndexes',
    'concatPrimitiveValues',
    'mergeRecordValues',
    'arrayViewType',
    'recordViewType',
    'proportionalResizeLimit',
    'horizontalReflect',
    'verticalReflect',
    'transpose',
    'format',
  ],
}

export type TransformConfig =
  | { preset: Exclude<TransformPreset, TransformPreset.Manual> }
  | ({
      preset: TransformPreset.Manual
    } & TransformOptions)

export function resolvePreset(config: TransformConfig): TransformOptions {
  switch (config.preset) {
    case TransformPreset.Optimal:
      return {
        concatPrimitiveValues: true,
        mergeRecordValues: false,
        headers: true,
        indexes: false,
        sortHeaders: false,
        supportForHeadersGrouping: true,
        recordViewType: ViewType.Columns,
        arrayViewType: ViewType.Rows,
        proportionalResizeLimit: 100,
        collapseIndexes: true,
        collapseHeaders: true,
        horizontalReflect: false,
        verticalReflect: false,
        transpose: false,
      }
    case TransformPreset.Compact:
      return {
        concatPrimitiveValues: true,
        mergeRecordValues: true,
        headers: false,
        indexes: false,
        sortHeaders: true,
        supportForHeadersGrouping: false,
        recordViewType: ViewType.Columns,
        arrayViewType: ViewType.Rows,
        proportionalResizeLimit: 0,
        collapseIndexes: false,
        collapseHeaders: false,
        horizontalReflect: false,
        verticalReflect: false,
        transpose: false,
      }
    case TransformPreset.Detailed:
      return {
        concatPrimitiveValues: false,
        mergeRecordValues: false,
        headers: true,
        indexes: true,
        sortHeaders: false,
        supportForHeadersGrouping: false,
        recordViewType: ViewType.Columns,
        arrayViewType: ViewType.Rows,
        proportionalResizeLimit: 100,
        collapseIndexes: false,
        collapseHeaders: false,
        horizontalReflect: false,
        verticalReflect: false,
        transpose: false,
      }
    case TransformPreset.Manual: {
      const { preset, ...rest } = config
      return rest
    }
    default:
      throw new Error(
        //@ts-expect-error
        `Unexpected preset "${config.preset ?? JSON.stringify(config)}"`
      )
  }
}
