import { UiSchema } from "@rjsf/utils";

import { JSONSchema } from "@/lib/json-schema";
import { TableFactoryOptions } from "@/lib/json-to-table";
import { JSONPrimitiveOrNull } from "@/lib/json";

export enum TransformPreset {
  Optimal = "Optimal",
  Manual = "Manual",
}

export enum OutputFormat {
  HTML = "HTML",
  XLSX = "XLSX",
  ASCII = "ASCII",
}

export const TRANSFORM_SCHEMA: JSONSchema = {
  type: "object",
  title: "Settings",
  properties: {
    preset: {
      title: "Preset",
      type: "string",
      enum: Object.values(TransformPreset),
      default: TransformPreset.Optimal,
    },
    transform: {
      title: "Transform",
      description: "Apply a transformation to the output data",
      type: "boolean",
      default: false,
    },
    format: {
      title: "Output format",
      type: "string",
      enum: Object.values(OutputFormat),
      default: OutputFormat.HTML,
    },
    paginate: {
      title: "Paginate",
      description:
        "Partitioning the input data (object or array) into pages by their keys",
      type: "boolean",
      default: false,
    },
  },
  required: ["preset", "format"],
  dependencies: {
    preset: {
      oneOf: [
        {
          properties: {
            preset: {
              const: TransformPreset.Optimal,
            },
          },
        },
        {
          properties: {
            preset: {
              const: TransformPreset.Manual,
            },
            collapseIndexes: {
              title: "Combine nested indexes",
              description:
                "Combines hierarchical indexes into one cell (1.1, 1.2, ...)",
              type: "boolean",
              default: true,
            },
            joinPrimitiveArrayValues: {
              title: "Combine simple values",
              description:
                "Combines the values of an array of primitives into one cell (separated by ',')",
              type: "boolean",
              default: true,
            },
            combineArraysOfObjects: {
              title: "Combine objects",
              description: "Combine arrays of objects into a single object",
              type: "boolean",
              default: false,
            },
            proportionalSizeAdjustmentThreshold: {
              title: "Proportional size adjustment threshold",
              description:
                "Specifies the threshold to which the value (height, width) can be increased for a proportional increase. The default is 1 (by 100%).",
              type: "number",
              minimum: 0,
              default: 1,
            },
            cornerCellValue: {
              title: "Corner cell value",
              description: "The value of the corner cell.",
              type: "string",
              default: "№",
            },
          },
          required: ["proportionalSizeAdjustmentThreshold"],
        },
      ],
    },
    transform: {
      oneOf: [
        {
          properties: {
            transform: {
              const: false,
            },
          },
        },
        {
          properties: {
            transform: {
              const: true,
            },
            horizontalReflect: {
              type: "boolean",
              title: "Reflect horizontally",
              default: false,
            },
            verticalReflect: {
              type: "boolean",
              title: "Reflect vertically",
              default: false,
            },
            transpose: {
              type: "boolean",
              title: "Transpose",
              default: false,
            },
          },
        },
      ],
    },
  },
};

export const TRANSFORMED_UI_SCHEMA: UiSchema = {
  "ui:order": [
    "preset",
    "collapseIndexes",
    "joinPrimitiveArrayValues",
    "combineArraysOfObjects",
    "proportionalSizeAdjustmentThreshold",
    "cornerCellValue",
    "transform",
    "horizontalReflect",
    "verticalReflect",
    "transpose",
    "format",
    "paginate",
  ],
};

export type TransformConfig = {
  format: OutputFormat;
  paginate: boolean;
} & (
  | { preset: TransformPreset.Optimal }
  | ({
      preset: TransformPreset.Manual;
    } & TableFactoryOptions<JSONPrimitiveOrNull>)
) &
  (
    | { transform: false }
    | {
        transform: true;
        horizontalReflect: boolean;
        verticalReflect: boolean;
        transpose: boolean;
      }
  );

export function extractTableFactoryOptions(
  config: TransformConfig
): TableFactoryOptions<JSONPrimitiveOrNull> {
  switch (config.preset) {
    case TransformPreset.Optimal:
      return {
        collapseIndexes: true,
        joinPrimitiveArrayValues: true,
        combineArraysOfObjects: false,
        proportionalSizeAdjustmentThreshold: 1,
        cornerCellValue: "№",
      };
    case TransformPreset.Manual: {
      const {
        collapseIndexes,
        joinPrimitiveArrayValues,
        combineArraysOfObjects,
        proportionalSizeAdjustmentThreshold,
        cornerCellValue,
      } = config;
      return {
        collapseIndexes,
        joinPrimitiveArrayValues,
        combineArraysOfObjects,
        proportionalSizeAdjustmentThreshold,
        cornerCellValue,
      };
    }
    default: {
      const n: never = config;
      throw new Error(`Unexpected preset "${JSON.stringify(n)}"`);
    }
  }
}
