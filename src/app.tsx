import React, { useCallback, useState } from 'react'
import { Stack, Textarea, Button, Heading } from '@chakra-ui/react'
import { Form } from '@rjsf/chakra-ui'
import validator from "@rjsf/validator-ajv8";

import { makeTableTransformer } from 'lib/json-table';
import { isJsonPrimitive, JSONType } from 'lib/json';
import { JSONParseStatus, jsonTryParse } from 'lib/json-parser';
import { Input, makeTransformOperator, TransformAction } from 'lib/json-transform';
import { Entry, transformValue } from 'lib/entry';
import { createPage } from 'lib/browser';
import { makeHTMLPage } from 'lib/json-table-html';
import { makeWorkBook } from 'lib/json-table-xlsx';
import { max, sum } from 'lib/math';
import { createFileURL, createXLSBlob, makeDownloadFileByUrl } from 'lib/file';

import {
  ReportType,
  resolvePreset,
  TransformConfig,
  TRANSFORMED_UI_SCHEMA,
  TransformFormat,
  TransformPreset,
  TRANSFORM_SCHEMA
} from './model'

function useChangeHandler (handler: (value: string) => void) {
  return useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    handler(e.target.value), [handler])
}

function makeTableData (
  report: ReportType,
  data: string,
  reportData: string
): JSONType {
  const dataParseResult = jsonTryParse<JSONType>(data)
  const reportParseResult = jsonTryParse<Input>(reportData)
  try {
    return dataParseResult.status === JSONParseStatus.Ok
      ? report === ReportType.Custom
        ? reportParseResult.status === JSONParseStatus.Ok
          ? (makeTransformOperator(reportParseResult.data) as TransformAction)(
            dataParseResult.data
          )
          : {
            Error: 'An error occurred while trying to recognize the operator',
          }
        : dataParseResult.data
      : {
        Error: 'An error occurred while trying to recognize the data',
      }
  } catch (e) {
    console.error(e)
    return {
      Error:
        e instanceof Error
          ? e.message
          : 'An unknown error occurred when trying to calculate the operator',
    }
  }
}

export function App () {
  const [data, setData] = useState('')
  const [report, setReport] = useState(ReportType.Default)
  const [reportData, setReportData] = useState('')
  const [transformData, setTransformData] = useState<TransformConfig>({
    preset: TransformPreset.Optimal
  })
  const [separateOnPages, setSeparateOnPages] = useState(false)
  const handleDataChange = useChangeHandler(setData)
  return (
    <Stack p={8}>
      <Heading>JSON to Table</Heading>
      <Textarea autoFocus value={data} onChange={handleDataChange} />
      <Form
        validator={validator}
        schema={TRANSFORM_SCHEMA}
        uiSchema={TRANSFORMED_UI_SCHEMA}
        showErrorList={false}
        formData={transformData}
        onChange={({ formData }) => setTransformData(formData)}
        onSubmit={({ formData }) => {
          const tableTransformer = makeTableTransformer(
            resolvePreset(formData)
          )
          const tableData = makeTableData(report, data, reportData)
          const pagesData: Entry<JSONType>[] =
            isJsonPrimitive(tableData) || !separateOnPages
              ? [['Report', tableData] as Entry<JSONType>]
              : Array.isArray(tableData)
                ? tableData.map(
                  (item, i) => [String(i + 1), item] as Entry<JSONType>
                )
                : Object.keys(tableData).map(
                  (key) => [key, tableData[key]] as Entry<JSONType>
                )
          const pagesTables = pagesData.map(
            transformValue(tableTransformer)
          )
          switch (formData.format as TransformFormat) {
            case TransformFormat.HTML: {
              return createPage(makeHTMLPage('Table', pagesTables))
            }
            case TransformFormat.XLSX:
              return makeWorkBook(pagesTables, {
                columnWidth: (column, i, m, table) => {
                  const counts = column.map((cell) => cell.count)
                  return Math.max(
                    Math.ceil(
                      (counts.reduce(sum) / table.height +
                        (counts.reduce(max) * column.length) /
                        table.height) /
                      2
                    ),
                    10
                  )
                },
              })
                .xlsx.writeBuffer()
                .then(createXLSBlob)
                .then(createFileURL)
                .then(makeDownloadFileByUrl('table.xlsx'))
            default:
              throw new Error(`Unexpected transform format`)
          }
        }}>
        <Button w="100%" type='submit' colorScheme="teal">Create Table</Button>
      </Form>
    </Stack>
  )
}
