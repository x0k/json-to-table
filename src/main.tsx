import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import { OutputFormat, TransformConfig, TransformPreset } from "./app-worker";
import { App } from "./app";
import { HTMLTablePage } from "./html-table-page";
import { DownloadTablePage } from "./download-page";
import { compressor, appWorker } from "./init";

function page() {
  let initialData = "";
  let initialOptions: TransformConfig = {
    preset: TransformPreset.Default,
    transform: false,
    format: OutputFormat.HTML,
    paginate: false,
    createOnOpen: true,
  };
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has("data")) {
    try {
      initialData = compressor.decompress(searchParams.get("data")!) || "";
    } catch (error) {
      console.error(error);
    }
  }
  if (searchParams.has("options")) {
    try {
      initialOptions = JSON.parse(
        compressor.decompress(searchParams.get("options")!)
      );
      console.log(initialOptions);
    } catch (error) {
      console.error(error);
    }
  }
  if (searchParams.get("createOnOpen") === "true") {
    const table = appWorker.createTable(initialData, initialOptions);
    switch (initialOptions.format) {
      case OutputFormat.XLSX:
        return <DownloadTablePage title="table.xlsx" content={table} />;
      default:
        return <HTMLTablePage content={table} />;
    }
  }
  return <App initialData={initialData} initialOptions={initialOptions} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>{page()}</ChakraProvider>
  </React.StrictMode>
);
