<script lang="ts">
  import { fileOpen } from "browser-fs-access";
  import Ajv from "ajv";
  import { FormBase } from "@sjsf/form";
  import {
    AjvValidator,
    DEFAULT_AJV_CONFIG,
    addFormComponents,
  } from "@sjsf/ajv8-validator";
  import { theme as daisyTheme } from "@sjsf/daisyui-theme";
  import { translation } from "@sjsf/form/translations/en";

  import { OutputFormat, type TransformConfig } from "./app-worker";
  import {
    fetchAsText,
    makeSource,
    resolveSource,
    SourceType,
    TRANSFORM_SCHEMA,
    TRANSFORMED_UI_SCHEMA,
    type Source,
  } from "./core";
  import { isValidUrl } from "./lib/url";
  import Layout from "./layout.svelte";
  import { appWorker, compressor } from "./init";
  import { copyTextToClipboard } from "./lib/copy-to-clipboard";
  import { makeDownloadFileByUrl } from './lib/file';
  import { createPage } from './lib/browser';
  import ThemePicker from './theme-picker.svelte';

  const {
    initialData,
    initialOptions,
  }: { initialData: string; initialOptions: TransformConfig } = $props();

  let source: Source = $state({
    type: isValidUrl(initialData) ? SourceType.URL : SourceType.Text,
    data: initialData,
  });
  let transformData = $state(initialOptions);
  const validator = new AjvValidator(
    addFormComponents(new Ajv(DEFAULT_AJV_CONFIG))
  );

  let form = $state<HTMLFormElement>();

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function sample(name: string) {
    const data = await fetchAsText(`${name}.json`);
    source = { type: SourceType.Text, data };
  }

  const stringifyData = (data: string) => data && compressor.compress(data);
  const stringifyOptions = (options: TransformConfig) =>
    compressor.compress(JSON.stringify(options));

  async function shareTable() {
    const url = `${window.location.href}?createOnOpen=${
      transformData.createOnOpen
    }&data=${stringifyData(source.data)}&options=${stringifyOptions(
      transformData
    )}`;
    copyTextToClipboard(url)
      .then(() => {
        if (url.length > 2000) {
          window.alert("URL is too long");
          // toast({
          //   title: "URL is too long",
          //   description:
          //     "URL is copied to clipboard, but it's too long for a browsers",
          //   status: "warning",
          // });
        } else {
          window.alert("URL copied to clipboard");
          // toast({
          //   title: "URL copied to clipboard",
          //   status: "success",
          // });
        }
      })
      .catch((err): void => {
        window.alert("Failed to copy URL to clipboard");
        // toast({
        //   title: "Failed to copy URL to clipboard",
        //   status: "error",
        //   description: String(err),
        // });
      });
  }

  let theme = $state<"light" | "dark" | "system">(localStorage.theme ?? "system");
</script>

<Layout>
  {#snippet append()}
    <ThemePicker bind:theme />
  {/snippet}
  <div class="flex gap-2 items-center">
    <p>Source type:</p>
    {#each Object.values(SourceType) as type}
      <div class="form-control">
        <label class="label cursor-pointer gap-2">
          <input
            type="radio"
            bind:group={source.type}
            onchange={() => { source = makeSource(source.type) }}
            value={type}
            class="radio"
          />
          <span class="label-text">{capitalize(type)}</span>
        </label>
      </div>
    {/each}
    <a
      class="ml-auto btn btn-outline btn-secondary"
      href="https://github.com/x0k/json-to-table"
      target="_blank"
    >
      Github
    </a>
    <button class="btn btn-secondary" onclick={shareTable}>
      Share your table
    </button>
  </div>
  {#if source.type === SourceType.Text}
    <textarea
      class="textarea textarea-bordered font-mono"
      placeholder="Paste JSON here"
      bind:value={source.data}
      autofocus
      rows="20"
    ></textarea>
    <div class="flex gap-2 items-center">
      <p>Examples:</p>
      <button class="btn" onclick={() => sample("test")}>Basic</button>
      <button class="btn" onclick={() => sample("deduplication")}>
        Deduplication
      </button>
      <button class="btn" onclick={() => sample("company")}>Company</button>
      <button class="btn" onclick={() => sample("large")}>Large</button>
    </div>
  {:else if source.type === SourceType.File}
    <button
      class="btn"
      onclick={async () => {
        const file = await fileOpen();
        const data = await file.text();
        source = { type: SourceType.File, data, fileName: file.name };
      }}
    >
      {source.data ? source.fileName : "Select file"}
    </button>
  {:else if source.type === SourceType.URL}
    <input
      placeholder="File URL"
      bind:value={source.data}
      class="input input-bordered"
      type="url"
    />
  {/if}
  <button
    class="btn btn-primary"
    type="submit"
    onclick={() => form?.requestSubmit()}
  >
    Create Table
  </button>
  <FormBase
    {...daisyTheme}
    bind:form
    bind:value={transformData}
    schema={TRANSFORM_SCHEMA}
    uiSchema={TRANSFORMED_UI_SCHEMA}
    {validator}
    {translation}
    onSubmit={(formData) => {
      const cfg = formData as TransformConfig;
      resolveSource(source)
        .then((data) => appWorker.createTable(data, cfg))
        .then((content) => {
          switch (cfg.format) {
            case OutputFormat.XLSX:
              makeDownloadFileByUrl("table.xlsx")(content);
              return;
            default:
              createPage(content);
          }
        })
        .catch((e) => {
          window.alert(String(e));
          // toast({
          //   title: "Error",
          //   description: e,
          //   status: "error",
          // });
        });
    }}
  >
    {null}
  </FormBase>
</Layout>
