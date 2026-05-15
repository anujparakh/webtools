import { useState, useRef } from "preact/hooks";
import { unfoldAll, foldEffect, foldInside, syntaxTree } from "@codemirror/language";
import type { StateEffect } from "@codemirror/state";
import { useToolHistory } from "../hooks/useToolHistory";
import { HistoryPanel } from "../components/HistoryPanel";
import {
  JsonCodeEditor,
  type EditorView,
  type CursorInfo,
} from "../components/JsonCodeEditor";
import { JsonDiffView } from "../components/JsonDiffView";
import { GitDiff } from "@phosphor-icons/react";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface Props {
  onWideModeChange?: (wide: boolean) => void;
}

export function JsonViewer({ onWideModeChange }: Props) {
  const [value, setValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [cursorInfo, setCursorInfo] = useState<CursorInfo | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const { history, push, clear } = useToolHistory("webtools:json:history");

  const toggleCompare = () => {
    const next = !compareMode;
    setCompareMode(next);
    onWideModeChange?.(next);
    if (!next) setParseError(null);
  };

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
      for (const key of Object.keys(v).sort())
        sorted[key] = sortKeys(v[key]);
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
    push({ value: formatted, timestamp: Date.now() });
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

  const loadFromHistory = (val: string) => {
    setValue(val);
    setParseError(null);
  };

  return (
    <div>
      <div class="space-y-4">
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
