import { parseCliArgs, UsageError, withUsage } from "../utils.ts";
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_SECONDS,
  OPENROUTER_BASE_URL,
} from "./constants.ts";

export function parseBuildArgs(argv: string[]) {
  return withUsage(
    "Usage: bun run scripts/metadata/build.ts -i <inputDir> -o <outputFile> [-c] [-m <model>] [--base-url <apiBaseUrl>] [--timeout <seconds>] [-j <concurrency>] [-v]",
    () => {
      const { values } = parseCliArgs(argv, {
        inputDir: { type: "string", short: "i" },
        outputFile: { type: "string", short: "o" },
        clean: { type: "boolean", short: "c", default: false },
        model: { type: "string", short: "m" },
        "base-url": { type: "string" },
        timeout: { type: "string", default: DEFAULT_TIMEOUT_SECONDS },
        concurrency: {
          type: "string",
          short: "j",
          default: DEFAULT_CONCURRENCY,
        },
        verbose: { type: "boolean", short: "v", default: false },
      });

      if (!values.inputDir || !values.outputFile) {
        throw new UsageError("-i <inputDir> and -o <outputFile> are required");
      }

      const timeoutMs = Number(values.timeout) * 1000;
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new UsageError("--timeout must be a positive number of seconds");
      }

      const concurrency = Number(values.concurrency);
      if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new UsageError("--concurrency must be a positive integer");
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
    },
  );
}

export function parseCheckArgs(argv: string[]) {
  return withUsage(
    "Usage: bun run scripts/metadata/check.ts -i <inputDir> -m <metadataFile>",
    () => {
      const { values } = parseCliArgs(argv, {
        inputDir: { type: "string", short: "i" },
        metadataFile: { type: "string", short: "m" },
      });

      if (!values.inputDir || !values.metadataFile) {
        throw new UsageError(
          "-i <inputDir> and -m <metadataFile> are required",
        );
      }

      return { inputDir: values.inputDir, metadataFile: values.metadataFile };
    },
  );
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
      throw new UsageError("--base-url must be a valid HTTP(S) API base URL");
    }
    if (
      !["http:", "https:"].includes(baseUrl.protocol) ||
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.search ||
      baseUrl.hash
    ) {
      throw new UsageError(
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
      throw new UsageError(
        "OPENROUTER_API_KEY environment variable is not set",
      );
    }
  }

  if (!model.trim()) {
    throw new UsageError(
      "A non-empty --model is required when using --base-url or overriding the default model",
    );
  }

  baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "");

  return { baseUrl, model, apiKey, providerOptions };
}
