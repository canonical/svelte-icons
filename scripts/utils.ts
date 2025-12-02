export function kebabToPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (match) =>
    match.replace("-", "").toUpperCase(),
  );
}

export function indent(str: string, levels: number): string {
  const indent = "  ".repeat(levels);
  return str
    .split("\n")
    .map((line) => (line ? `${indent}${line}` : line))
    .join("\n");
}
