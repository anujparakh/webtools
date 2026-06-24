import { useState, useRef, useEffect } from "preact/hooks";
import {
  unfoldAll,
  foldEffect,
  foldInside,
  syntaxTree,
} from "@codemirror/language";
import type { StateEffect } from "@codemirror/state";
import { useToolHistory } from "../hooks/useToolHistory";
import type { HistoryEntry } from "../hooks/useToolHistory";
import { HistoryPanel } from "../components/HistoryPanel";
import {
  JsonCodeEditor,
  type EditorView,
  type CursorInfo,
} from "../components/JsonCodeEditor";
import { JsonDiffView } from "../components/JsonDiffView";
import { GitDiff } from "@phosphor-icons/react";
import { resolveJsonPath } from "../json-utils";
import type { JsonValue } from "../json-utils";

const BASE_TITLE = "JSON Viewer & Formatter | Web Tools";

interface Props {
  onWideModeChange?: (wide: boolean) => void;
}

export function JsonViewer({ onWideModeChange }: Props) {
  const [value, setValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [name, setName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [cursorInfo, setCursorInfo] = useState<CursorInfo | null>(null);
  const [pathQuery, setPathQuery] = useState("");
  const editorRef = useRef<EditorView | null>(null);
  const { history, push, clear } = useToolHistory("webtools:json:history");

  const toggleCompare = () => {
    const next = !compareMode;
    setCompareMode(next);
    onWideModeChange?.(next);
    if (!next) setParseError(null);
  };

  useEffect(() => {
    document.title = name.trim() ? `${name.trim()} | JSON Viewer` : BASE_TITLE;
  }, [name]);

  const tryParse = (): JsonValue | null => {
    try {
      const result = JSON.parse(value) as JsonValue;
      setParseError(null);
      return result;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }
  };

  const sortKeys = (v: JsonValue): JsonValue => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === "object") {
      const sorted: { [key: string]: JsonValue } = {};
      for (const key of Object.keys(v).sort()) sorted[key] = sortKeys(v[key]);
      return sorted;
    }
    return v;
  };

  const handleSort = () => {
    const result = tryParse();
    if (result === null) return;
    const formatted = JSON.stringify(sortKeys(result), null, 2);
    const view = editorRef.current;
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: formatted },
      });
      unfoldAll(view);
    }
    setValue(formatted);
    push({
      value: formatted,
      label: name.trim() || undefined,
      timestamp: Date.now(),
    });
  };

  const handleMinify = () => {
    const result = tryParse();
    if (result === null) return;
    setValue(JSON.stringify(result));
  };

  const handleFold = () => {
    const view = editorRef.current;
    if (!view) return;
    const effects: StateEffect<{ from: number; to: number }>[] = [];
    syntaxTree(view.state).iterate({
      enter(node) {
        if (node.name === "Object" || node.name === "Array") {
          const range = foldInside(node.node);
          if (range) effects.push(foldEffect.of(range));
        }
      },
    });
    if (effects.length) view.dispatch({ effects, scrollIntoView: false });
  };

  const handleUnfold = () => {
    const view = editorRef.current;
    if (view) unfoldAll(view);
  };

  const handleSave = () => {
    if (!value.trim()) return;
    push({ value, label: name.trim() || undefined, timestamp: Date.now() });
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setValue(entry.value);
    setName(entry.label ?? "");
    setParseError(null);
  };

  const pathResult = (() => {
    if (!pathQuery.trim() || !value.trim()) return null;
    let parsed: JsonValue;
    try {
      parsed = JSON.parse(value) as JsonValue;
    } catch {
      return null;
    }
    return resolveJsonPath(parsed, pathQuery);
  })();

  return (
    <div>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <div>
            <input
              type="text"
              placeholder="Name this JSON"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              class="input input-sm input-bordered px-4 text-sm"
            />
            {name.length > 0 && (
              <p class="text-xs text-base-content/30 text-right mt-0.5">{name.length} chars</p>
            )}
          </div>
        </div>

        {compareMode ? (
          <JsonDiffView
            left={value}
            right={rightValue}
            onLeftChange={setValue}
            onRightChange={setRightValue}
          />
        ) : (
          <JsonCodeEditor
            value={value}
            onChange={(v) => {
              setValue(v);
              setParseError(null);
            }}
            onEditorCreated={(view) => {
              editorRef.current = view;
            }}
            onCursorInfo={setCursorInfo}
            minHeight="10rem"
            maxHeight="40rem"
          />
        )}

        <div class="flex flex-wrap gap-2 items-center">
          {!compareMode && (
            <>
              <button class="btn-tool" onClick={handleSort}>
                Sort
              </button>
              <button class="btn-tool" onClick={handleMinify}>
                Minify
              </button>
              <button class="btn-tool" onClick={handleFold}>
                Fold
              </button>
              <button class="btn-tool" onClick={handleUnfold}>
                Unfold
              </button>
              <button class="btn-tool" onClick={handleSave}>
                Save
              </button>
            </>
          )}
          <button
            class={`btn-tool flex items-center gap-1.5 ${compareMode ? "bg-primary/20 text-primary border-primary/40" : ""}`}
            onClick={toggleCompare}
          >
            <GitDiff size={14} />
            {compareMode ? "Exit Compare" : "Compare"}
          </button>
          {!compareMode && cursorInfo && (
            <span class="ml-auto flex items-center gap-1.5 text-xs font-mono">
              <span class="text-base-content/70">{cursorInfo.path}</span>
              {cursorInfo.container && (
                <>
                  <span class="text-base-content/25">·</span>
                  <span class="text-base-content/40">
                    {cursorInfo.container}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {!compareMode && parseError && (
          <div role="alert" class="alert alert-error text-sm py-2">
            <span>{parseError}</span>
          </div>
        )}

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-base-content/50 shrink-0">
              Find Path
            </label>
            <div class="w-full">
              <input
                type="text"
                placeholder="e.g. items[0].name"
                value={pathQuery}
                onInput={(e) =>
                  setPathQuery((e.target as HTMLInputElement).value)
                }
                class="input input-sm input-bordered w-full text-sm font-mono"
              />
              {pathQuery.length > 0 && (
                <p class="text-xs text-base-content/30 text-right mt-0.5">{pathQuery.length} chars</p>
              )}
            </div>
          </div>
          {pathQuery.trim() &&
            pathResult &&
            (pathResult.found ? (
              <pre class="bg-base-300 rounded px-3 py-2 text-sm font-mono text-base-content/90 whitespace-pre-wrap break-all">
                {typeof pathResult.value === "object"
                  ? JSON.stringify(pathResult.value, null, 2)
                  : JSON.stringify(pathResult.value)}
              </pre>
            ) : (
              <p class="text-sm text-error/80 px-1">{pathResult.error}</p>
            ))}
          {pathQuery.trim() && !pathResult && (
            <p class="text-sm text-base-content/40 px-1 italic">
              Enter valid JSON above to resolve the path
            </p>
          )}
        </div>
      </div>

      {!compareMode && (
        <HistoryPanel
          history={history}
          onSelect={loadFromHistory}
          onClear={clear}
        />
      )}
    </div>
  );
}
