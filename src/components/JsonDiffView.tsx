import { useEffect, useRef } from "preact/hooks";
import { MergeView } from "@codemirror/merge";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  foldGutter,
  codeFolding,
  syntaxTree,
  indentOnInput,
  bracketMatching,
} from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import type { EditorStateConfig } from "@codemirror/state";

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "#21262d" },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    caretColor: "#e6edf3",
    minHeight: "10rem",
    maxHeight: "60rem",
  },
  ".cm-scroller": { overflow: "auto", maxHeight: "60rem" },
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
  // MergeView diff gutter / changed-chunk colours
  ".cm-mergeView": { height: "100%" },
  ".cm-mergeViewEditors": { display: "flex" },
  ".cm-mergeViewEditor": { flex: "1 1 0", minWidth: 0 },
  ".cm-changedLine": { backgroundColor: "rgba(210,167,0,0.10)" },
  ".cm-changedText": { backgroundColor: "rgba(210,167,0,0.25)" },
  ".cm-deletedChunk": {
    backgroundColor: "rgba(248,81,73,0.12)",
  },
  ".cm-insertedLine, .cm-insertedText": {
    backgroundColor: "rgba(63,185,80,0.18)",
  },
  ".cm-deletedLine, .cm-deletedText": {
    backgroundColor: "rgba(248,81,73,0.18)",
  },
  ".cm-mergeGap": {
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#1c2128",
    minWidth: "2px",
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

const sharedExtensions = [
  json(),
  oneDark,
  baseTheme,
  history(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  foldGutter(),
  codeFolding(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  EditorView.lineWrapping,
];

interface Props {
  left: string;
  right: string;
  onLeftChange: (v: string) => void;
  onRightChange: (v: string) => void;
}

export function JsonDiffView({ left, right, onLeftChange, onRightChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<MergeView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const leftChange = EditorView.updateListener.of((u) => {
      if (u.docChanged) onLeftChange(u.state.doc.toString());
    });
    const rightChange = EditorView.updateListener.of((u) => {
      if (u.docChanged) onRightChange(u.state.doc.toString());
    });

    const aConfig: EditorStateConfig = {
      doc: left,
      extensions: [...sharedExtensions, leftChange],
    };
    const bConfig: EditorStateConfig = {
      doc: right,
      extensions: [...sharedExtensions, rightChange],
    };

    const mv = new MergeView({
      a: aConfig,
      b: bConfig,
      parent: containerRef.current,
      highlightChanges: true,
      gutter: true,
    });

    mvRef.current = mv;
    return () => {
      mv.destroy();
      mvRef.current = null;
    };
    // Only mount once — external value changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes into the editors
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;
    const cur = mv.a.state.doc.toString();
    if (cur !== left) {
      mv.a.dispatch({ changes: { from: 0, to: cur.length, insert: left } });
    }
  }, [left]);

  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;
    const cur = mv.b.state.doc.toString();
    if (cur !== right) {
      mv.b.dispatch({ changes: { from: 0, to: cur.length, insert: right } });
    }
  }, [right]);

  return (
    <div
      ref={containerRef}
      class="rounded-lg overflow-hidden border"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    />
  );
}
