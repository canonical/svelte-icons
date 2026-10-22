import { z } from "zod";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it";
export const DEFAULT_TIMEOUT_SECONDS = "120";
export const DEFAULT_CONCURRENCY = "6";
export const MAX_RETRIES = 2;
export const TEMPERATURE = 0.2;
export const RENDER_SIZE = 256;
export const FILLER_TAGS = new Set([
  "icon",
  "symbol",
  "graphic",
  "design",
  "shape",
  "ui element",
]);

export const PROMPT = `
You write search tags for an icon library. The icons come from Canonical's design system and are used in web apps for cloud, infrastructure and developer tools (Ubuntu, Juju, MAAS, LXD, Kubernetes), as well as in general UI.
A user looking for an icon types a single word or short phrase. Tags must match what such a user would type, either because of what the icon shows or what it means.

You are given the icon's name and an image of the icon (black on white).
1. In "visual", describe in one short sentence only the shapes drawn in the image, e.g. "an outlined isometric cube" or "a rounded rectangle with a bar across the top". Do not use the name here.
2. In "meaning", state in one short sentence what the icon represents in a software UI. Names often have several senses; choose the one the drawing supports. Use the name to decide only when the drawing itself is ambiguous.
3. In "tags", list 6 to 12 lowercase search terms, most relevant first:
   - the name's concept and its closest synonyms,
   - the objects the drawing depicts, as interpreted in "meaning",
   - the actions or states the icon is commonly used for.
Rules:
- Each tag must fit the meaning. Never add tags for things the shapes merely resemble when that contradicts the meaning.
- Never add objects that are not drawn and not implied by the name.
- Prefer common, concrete words over abstract or formal ones (e.g. "clean" rather than "sanitize").
- Include a product or technology name only when the icon name is a term from it (e.g. a Kubernetes or Juju concept).
- Do not use filler words such as "icon", "symbol", "graphic", "design", "shape", "ui element".
`;

// Field order matters: the model describes the drawing and its meaning before choosing tags.
export const TAGS_SCHEMA = z.strictObject({
  visual: z.string(),
  meaning: z.string(),
  tags: z.array(z.string().trim().min(1)).min(1),
});
