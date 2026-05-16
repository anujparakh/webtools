export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type PathResolveResult =
  | { found: true; value: JsonValue }
  | { found: false; error: string };

/**
 * Resolve a TypeScript-style property path against a JSON value.
 * Supports dot notation (foo.bar), bracket index (arr[0]), and bracket string (obj["key"]).
 */
export function resolveJsonPath(data: JsonValue, path: string): PathResolveResult {
  const p = path.trim();
  if (!p) return { found: false, error: "Empty path" };

  let current: JsonValue = data;
  let i = 0;

  while (i < p.length) {
    if (p[i] === ".") {
      i++;
      if (i >= p.length) return { found: false, error: "Trailing dot" };
    }

    if (p[i] === "[") {
      i++;
      const start = i;
      while (i < p.length && p[i] !== "]") i++;
      if (i >= p.length) return { found: false, error: "Missing closing ]" };
      const content = p.slice(start, i);
      i++; // skip ']'

      if (/^\d+$/.test(content)) {
        const idx = parseInt(content, 10);
        if (!Array.isArray(current))
          return { found: false, error: `Expected array at [${content}]` };
        if (idx < 0 || idx >= current.length)
          return { found: false, error: `Index ${idx} out of bounds (length: ${current.length})` };
        current = current[idx];
      } else {
        const key = content.replace(/^['"]|['"]$/g, "");
        if (current === null || typeof current !== "object" || Array.isArray(current))
          return { found: false, error: `Not an object at ["${key}"]` };
        if (!(key in current))
          return { found: false, error: `Key "${key}" not found` };
        current = current[key];
      }
    } else if (/[a-zA-Z_$]/.test(p[i])) {
      const start = i;
      while (i < p.length && /[a-zA-Z0-9_$]/.test(p[i])) i++;
      const key = p.slice(start, i);
      if (current === null || typeof current !== "object" || Array.isArray(current))
        return { found: false, error: `Not an object at .${key}` };
      if (!(key in current))
        return { found: false, error: `Key "${key}" not found` };
      current = current[key];
    } else {
      return { found: false, error: `Unexpected character '${p[i]}' at position ${i}` };
    }
  }

  return { found: true, value: current };
}
