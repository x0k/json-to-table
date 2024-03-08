import { createMatrix, fromMatrix } from '@/lib/block-matrix';
import { ASCIITableFormat } from "@/lib/block-to-ascii";
import { JSONPrimitiveOrNull } from "@/lib/json";
import { Block } from '@/lib/json-table';
import { TableFactoryOptions } from "@/lib/json-to-table";
import { horizontalMirror, transpose, verticalMirror } from '@/lib/matrix';

export enum TransformPreset {
  Default = "Default",
  Manual = "Manual",
}

export enum OutputFormat {
  HTML = "HTML",
  XLSX = "XLSX",
  ASCII = "ASCII",
}
export type TransformConfig = {
  paginate: boolean;
  createOnOpen: boolean;
} & (
  | {
      format: OutputFormat.ASCII;
      asciiFormat: ASCIITableFormat;
    }
  | {
      format: OutputFormat.HTML;
    }
  | {
      format: OutputFormat.XLSX;
    }
) &
  (
    | { preset: TransformPreset.Default }
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

export const APP_WORKER_ID = "app-worker";


export function extractTableFactoryOptions(
  config: TransformConfig
): TableFactoryOptions<JSONPrimitiveOrNull> {
  switch (config.preset) {
    case TransformPreset.Default:
      return {
        collapseIndexes: true,
        joinPrimitiveArrayValues: true,
        combineArraysOfObjects: false,
        proportionalSizeAdjustmentThreshold: 1,
        stabilizeOrderOfPropertiesInArraysOfObjects: true,
        cornerCellValue: "№",
        enforceDeduplication: false,
      };
    case TransformPreset.Manual: {
      const {
        collapseIndexes,
        joinPrimitiveArrayValues,
        combineArraysOfObjects,
        stabilizeOrderOfPropertiesInArraysOfObjects,
        proportionalSizeAdjustmentThreshold,
        cornerCellValue,
        enforceDeduplication,
      } = config;
      return {
        collapseIndexes,
        joinPrimitiveArrayValues,
        combineArraysOfObjects,
        stabilizeOrderOfPropertiesInArraysOfObjects,
        proportionalSizeAdjustmentThreshold,
        cornerCellValue: cornerCellValue ?? "",
        enforceDeduplication,
      };
    }
    default: {
      const n: never = config;
      throw new Error(`Unexpected preset "${JSON.stringify(n)}"`);
    }
  }
}

export function makeTransformApplicator(config: TransformConfig) {
  return (block: Block) => {
    if (!config.transform) {
      return block;
    }
    let matrix = createMatrix(block, ({ type, value }) => ({ type, value }));
    if (config.horizontalReflect) {
      matrix = horizontalMirror(matrix);
    }
    if (config.verticalReflect) {
      matrix = verticalMirror(matrix);
    }
    if (config.transpose) {
      matrix = transpose(matrix);
    }
    return fromMatrix(
      matrix,
      ({ type }) => type,
      ({ value }) => value
    );
  };
}
