import { parseArgs } from "node:util";
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_SECONDS,
  OPENROUTER_BASE_URL,
} from "./constants.ts";

export function parseBuildArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      inputDir: { type: "string", short: "i" },
      outputFile: { type: "string", short: "o" },
      clean: { type: "boolean", short: "c", default: false },
      model: { type: "string", short: "m" },
      "base-url": { type: "string" },
      timeout: { type: "string", default: DEFAULT_TIMEOUT_SECONDS },
      concurrency: { type: "string", short: "j", default: DEFAULT_CONCURRENCY },
      verbose: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (!values.inputDir || !values.outputFile) {
    exitWithUsage(
      "Usage: bun run build:metadata -i <inputDir> -o <outputFile> [-c] [-m <model>] [--base-url <apiBaseUrl>] [--timeout <seconds>] [-j <concurrency>] [-v]",
    );
  }

  const timeoutMs = Number(values.timeout) * 1000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("--timeout must be a positive number of seconds");
  }

  const concurrency = Number(values.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }

  return {
    inputDir: values.inputDir,
    outputFile: values.outputFile,
    clean: values.clean,
    verbose: values.verbose,
    concurrency,
    timeoutMs,
    endpoint: resolveEndpoint(values["base-url"], values.model),
  };
}

export function parseCheckArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      inputDir: { type: "string", short: "i" },
      metadataFile: { type: "string", short: "m" },
    },
    allowPositionals: true,
    strict: true,
  });

  if (!values.inputDir || !values.metadataFile) {
    exitWithUsage(
      "Usage: bun run check:metadata -i <inputDir> -m <metadataFile>",
    );
  }

  return { inputDir: values.inputDir, metadataFile: values.metadataFile };
}

/** Picks the API endpoint, model and key. The OpenRouter key is never sent to a custom endpoint. */
function resolveEndpoint(customBaseUrl?: string, customModel?: string) {
  let baseUrl: URL;
  let model: string;
  let apiKey: string | undefined;
  let providerOptions = {};

  if (customBaseUrl !== undefined) {
    try {
      baseUrl = new URL(customBaseUrl);
    } catch {
      throw new Error("--base-url must be a valid HTTP(S) API base URL");
    }
    if (
      !["http:", "https:"].includes(baseUrl.protocol) ||
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.search ||
      baseUrl.hash
    ) {
      throw new Error(
        "--base-url must be an HTTP(S) API base URL without credentials, a query, or a fragment",
      );
    }
    model = customModel ?? "";
    apiKey = process.env.METADATA_API_KEY?.trim();
  } else {
    baseUrl = new URL(OPENROUTER_BASE_URL);
    model = customModel ?? DEFAULT_MODEL;
    apiKey = process.env.OPENROUTER_API_KEY?.trim();
    providerOptions = { provider: { require_parameters: true } };
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
  }

  if (!model.trim()) {
    throw new Error(
      "A non-empty --model is required when using --base-url or overriding the default model",
    );
  }

  baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "");

  return { baseUrl, model, apiKey, providerOptions };
}

function exitWithUsage(usage: string): never {
  console.error(usage);
  process.exit(1);
}
