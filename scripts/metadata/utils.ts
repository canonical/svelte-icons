import { createHash } from "node:crypto";
import { z } from "zod";

const METADATA_SCHEMA = z.record(
  z.string(),
  z.object({
    hash: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
);

export function parseMetadata(json: string) {
  return METADATA_SCHEMA.parse(JSON.parse(json));
}

export function hashSvg(svg: string): string {
  return createHash("sha256").update(svg).digest("hex").slice(0, 16);
}
