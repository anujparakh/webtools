import { useState, useMemo } from "preact/hooks";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { foldGutter, codeFolding, syntaxTree } from "@codemirror/language";
import { CodeBlockIcon } from "@phosphor-icons/react";

export type { EditorView };

export interface CursorInfo {
  path: string; // e.g. "a.b[1]" or "Root"
  container: string | null; // e.g. "Array · 3 items"
}

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "#21262d" },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    caretColor: "#e6edf3",
  },
  ".cm-gutters": {
    backgroundColor: "#1c2128",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(230,237,243,0.3)",
  },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.03)" },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(99,102,241,0.35) !important",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "4px",
    padding: "0 5px",
    color: "rgba(230,237,243,0.65)",
    fontSize: "0.8em",
    cursor: "pointer",
  },
});

function prepareFoldLabel(
  state: EditorState,
  range: { from: number; to: number },
): string {
  for (const end of [range.to + 1, range.to]) {
    try {
      const parsed = JSON.parse(state.doc.sliceString(range.from - 1, end));
      if (Array.isArray(parsed)) {
        const n = parsed.length;
        return `${n} ${n === 1 ? "item" : "items"}`;
      } else if (parsed !== null && typeof parsed === "object") {
        const n = Object.keys(parsed).length;
        return `${n} ${n === 1 ? "key" : "keys"}`;
      }
    } catch {}
  }
  return "…";
}

function makeFoldPlaceholderDOM(
  _view: EditorView,
  onclick: (e: Event) => void,
  prepared: string,
): HTMLElement {
  const dom = document.createElement("span");
  dom.className = "cm-foldPlaceholder";
  dom.textContent = ` ${prepared} `;
  dom.addEventListener("click", onclick);
  return dom;
}

const JSON_VALUE_TYPES = new Set([
  "String",
  "Number",
  "True",
  "False",
  "Null",
  "Object",
  "Array",
]);

function getCursorInfo(update: ViewUpdate): CursorInfo | null {
  const { state } = update;
  if (!state.doc.length) return null;

  const pos = state.selection.main.head;
  const tree = syntaxTree(state);
  const doc = state.doc;

  const segments: string[] = [];
  let container: string | null = null;

  // Walk from cursor node up to root, collecting path segments and container info.
  for (
    let cur: ReturnType<typeof tree.resolve> | null = tree.resolve(pos, -1);
    cur;
    cur = cur.parent
  ) {
    // Index within a containing Array
    if (
      cur.parent?.type.name === "Array" &&
      JSON_VALUE_TYPES.has(cur.type.name)
    ) {
      let index = 0;
      for (let sib = cur.prevSibling; sib; sib = sib.prevSibling)
        if (JSON_VALUE_TYPES.has(sib.type.name)) index++;
      segments.push(`[${index}]`);
    }

    // Container info — capture only the nearest Object/Array
    if (cur.type.name === "Object" && !container) {
      let count = 0;
      for (let ch = cur.firstChild; ch; ch = ch.nextSibling)
        if (ch.type.name === "Property") count++;
      container = `Object · ${count} ${count === 1 ? "key" : "keys"}`;
    } else if (cur.type.name === "Array" && !container) {
      let count = 0;
      for (let ch = cur.firstChild; ch; ch = ch.nextSibling)
        if (JSON_VALUE_TYPES.has(ch.type.name)) count++;
      container = `Array · ${count} ${count === 1 ? "item" : "items"}`;
    }

    // Key name from Property nodes — skip if cursor is on the key itself
    if (cur.type.name === "Property") {
      const propName = cur.getChild("PropertyName");
      if (propName && !(pos >= propName.from && pos <= propName.to)) {
        const raw = doc.sliceString(propName.from, propName.to);
        try {
          segments.push(JSON.parse(raw));
        } catch {
          segments.push(raw.replace(/^"|"$/g, ""));
        }
      }
    }
  }

  if (!container) return null;

  segments.reverse();
  let path = "";
  for (const seg of segments) {
    if (!path || seg.startsWith("[")) path += seg;
    else path += "." + seg;
  }

  return { path: path || "Root", container };
}

interface Props {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  lineNumbers?: boolean;
  onEditorCreated?: (view: EditorView) => void;
  onCursorInfo?: (info: CursorInfo | null) => void;
}

export function JsonCodeEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "10rem",
  maxHeight = "24rem",
  lineNumbers = true,
  onEditorCreated,
  onCursorInfo,
}: Props) {
  const [focused, setFocused] = useState(false);

  const format = () => {
    if (!onChange) return;
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2));
    } catch {}
  };

  const foldExtension = useMemo(
    () =>
      lineNumbers
        ? [
            foldGutter(),
            codeFolding({
              preparePlaceholder: prepareFoldLabel,
              placeholderDOM: makeFoldPlaceholderDOM,
            }),
          ]
        : [],
    [lineNumbers],
  );

  const borderStyle = focused
    ? {
        borderColor: "var(--card-color, #6366f1)",
        boxShadow:
          "0 0 0 2px color-mix(in srgb, var(--card-color, #6366f1) 20%, transparent)",
      }
    : { borderColor: "rgba(255,255,255,0.1)" };

  return (
    <div class="relative">
      <div
        class="rounded-lg overflow-hidden border transition-all"
        style={borderStyle}
      >
        <CodeMirror
          value={value}
          extensions={[json(), baseTheme, ...foldExtension]}
          theme={oneDark}
          onChange={onChange ? (val: string) => onChange(val) : undefined}
          onCreateEditor={(view: EditorView) => onEditorCreated?.(view)}
          onUpdate={
            onCursorInfo
              ? (update: ViewUpdate) => {
                  if (update.selectionSet || update.docChanged)
                    onCursorInfo(getCursorInfo(update));
                }
              : undefined
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          readOnly={readOnly}
          minHeight={minHeight}
          maxHeight={maxHeight}
          basicSetup={{
            lineNumbers,
            foldGutter: false,
            highlightActiveLine: !readOnly,
            highlightActiveLineGutter: !readOnly,
            tabSize: 2,
          }}
        />
      </div>
      {!readOnly && onChange && (
        <button
          class="absolute top-2 right-2 p-1.5 rounded text-base-content/40 hover:text-base-content/80 bg-base-300 hover:bg-base-content/20 transition-colors"
          onClick={format}
          title="Format JSON"
        >
          <CodeBlockIcon size={14} />
        </button>
      )}
    </div>
  );
}
