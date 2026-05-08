import { useState } from "preact/hooks";
import { useToolHistory } from "../hooks/useToolHistory";
import { HistoryPanel } from "../components/HistoryPanel";
import { CopyableBlock } from "../components/CopyableBlock";
import { encodeUrlParams, decodeUrlParams } from "../url-utils";

function EncoderDecoder({
  input,
  onInputChange,
  onHistoryPush,
}: {
  input: string;
  onInputChange: (v: string) => void;
  onHistoryPush: (value: string) => void;
}) {
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => string) => {
    setError(null);
    try {
      const result = fn();
      setOutput(result);
      onHistoryPush(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
      setOutput("");
    }
  };

  return (
    <div class="space-y-4">
      <textarea
        class="textarea textarea-bordered w-full font-mono min-h-[8rem] resize-y"
        placeholder="Paste text or URL here…"
        value={input}
        onInput={(e) => onInputChange((e.target as HTMLTextAreaElement).value)}
      />
      <div class="flex flex-wrap gap-2">
        <button
          class="btn-tool"
          onClick={() => run(() => encodeURIComponent(input))}
        >
          Encode
        </button>
        <button
          class="btn-tool"
          onClick={() => run(() => encodeUrlParams(input))}
          style={{
            "--card-color": "#a1d9e3",
          }}
        >
          Encode URL Params
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn-tool"
          onClick={() => run(() => decodeURIComponent(input))}
          style={{
            "--card-color": "#8b5cf6",
          }}
        >
          Decode
        </button>
        <button
          class="btn-tool"
          onClick={() => run(() => decodeUrlParams(input))}
          style={{
            "--card-color": "#b494ff",
          }}
        >
          Decode URL Params
        </button>
      </div>
      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}
      {output && (
        <CopyableBlock text={output}>
          <textarea
            class="textarea textarea-bordered w-full font-mono min-h-[8rem] resize-y"
            readOnly
            value={output}
          />
        </CopyableBlock>
      )}
    </div>
  );
}

export function UrlEncoder() {
  const [input, setInput] = useState("");
  const { history, push, clear } = useToolHistory("webtools:url:history");

  return (
    <div>
      <EncoderDecoder
        input={input}
        onInputChange={setInput}
        onHistoryPush={(value) => push({ value, timestamp: Date.now() })}
      />
      <HistoryPanel
        history={history}
        onSelect={(value) => setInput(value)}
        onClear={clear}
      />
    </div>
  );
}
