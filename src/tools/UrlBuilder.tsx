import { useState } from "preact/hooks";
import { useToolHistory } from "../hooks/useToolHistory";
import { HistoryPanel } from "../components/HistoryPanel";
import { CopyableBlock } from "../components/CopyableBlock";
import { buildUrl, parseUrlForBuilder, type Param } from "../url-utils";

export function UrlBuilder() {
  const [baseUrl, setBaseUrl] = useState("");
  const [params, setParams] = useState<Param[]>([
    { id: crypto.randomUUID(), key: "", value: "", isJson: false, error: null },
  ]);
  const { history, push, clear } = useToolHistory(
    "webtools:url-builder:history",
  );

  const updateParam = (id: string, patch: Partial<Param>) =>
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const addParam = () =>
    setParams((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        key: "",
        value: "",
        isJson: false,
        error: null,
      },
    ]);

  const removeParam = (id: string) =>
    setParams((prev) => prev.filter((p) => p.id !== id));

  const handleBaseUrlInput = (value: string) => {
    const parsed = parseUrlForBuilder(value);
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl);
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        })),
      );
    } else {
      setBaseUrl(value);
    }
  };

  const encodeParamValue = (id: string, value: string) => {
    updateParam(id, { value: encodeURIComponent(value), error: null });
  };

  const decodeParamValue = (id: string, value: string) => {
    try {
      updateParam(id, { value: decodeURIComponent(value), error: null });
    } catch {
      updateParam(id, { error: "Invalid percent-encoding" });
    }
  };

  const { url: builtUrl, error } = buildUrl(baseUrl, params);

  const loadFromHistory = (value: string) => {
    const parsed = parseUrlForBuilder(value);
    if (parsed && parsed.params.length > 0) {
      setBaseUrl(parsed.baseUrl);
      setParams(
        parsed.params.map(({ key, value: v }) => ({
          id: crypto.randomUUID(),
          key,
          value: v,
          isJson: false,
          error: null,
        })),
      );
    } else {
      setBaseUrl(value);
      setParams([
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
          isJson: false,
          error: null,
        },
      ]);
    }
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="label label-text text-sm font-medium">Base URL</label>
        <input
          type="text"
          class="input input-bordered w-full font-mono"
          placeholder="https://example.com/api  — paste a full URL to auto-fill params"
          value={baseUrl}
          onInput={(e) =>
            handleBaseUrlInput((e.target as HTMLInputElement).value)
          }
        />
      </div>

      <div class="space-y-2">
        <label class="label label-text text-sm font-medium">Query Params</label>
        {params.map((p) => (
          <div key={p.id} class="space-y-3">
            {/* Key + value row with delete on the right */}
            <div class="flex gap-2 items-start">
              <input
                type="text"
                class="input input-bordered input-sm font-mono w-36 shrink-0"
                placeholder="key"
                value={p.key}
                onInput={(e) =>
                  updateParam(p.id, {
                    key: (e.target as HTMLInputElement).value,
                  })
                }
              />
              <textarea
                class="textarea textarea-bordered textarea-sm font-mono flex-1 min-h-[2.5rem] resize-y"
                placeholder={p.isJson ? '{"key": "value"}' : "value"}
                value={p.value}
                onInput={(e) =>
                  updateParam(p.id, {
                    value: (e.target as HTMLTextAreaElement).value,
                    error: null,
                  })
                }
              />
              <button
                class="btn btn-ghost btn-xs text-error shrink-0 mt-1"
                onClick={() => removeParam(p.id)}
                disabled={params.length === 1}
              >
                ✕
              </button>
            </div>
            {/* Inline actions below the value, aligned to the value column */}
            <div class="flex justify-end gap-2 items-center mr-[2.5rem]">
              <label class="flex items-center gap-1 cursor-pointer text-xs text-base-content/50 select-none">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={p.isJson}
                  onChange={(e) =>
                    updateParam(p.id, {
                      isJson: (e.target as HTMLInputElement).checked,
                    })
                  }
                />
                JSON
              </label>
              <button
                class="btn-tool btn-tool-xs"
                title="URL-encode this value"
                onClick={() => encodeParamValue(p.id, p.value)}
              >
                Encode
              </button>
              <button
                class="btn-tool btn-tool-xs"
                title="URL-decode this value"
                onClick={() => decodeParamValue(p.id, p.value)}
              >
                Decode
              </button>
            </div>
            {p.error && <p class="text-xs text-error ml-[9.5rem]">{p.error}</p>}
          </div>
        ))}
        <button class="btn-tool mt-1" onClick={addParam}>
          + Add param
        </button>
      </div>

      {error && (
        <div role="alert" class="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      {builtUrl && !error && (
        <CopyableBlock
          text={builtUrl}
          onCopy={() => push({ value: builtUrl, timestamp: Date.now() })}
        >
          <pre class="bg-base-100 rounded-xl p-3 text-sm font-mono break-all whitespace-pre-wrap border border-base-300">
            {builtUrl}
          </pre>
        </CopyableBlock>
      )}

      <HistoryPanel
        history={history}
        onSelect={loadFromHistory}
        onClear={clear}
      />
    </div>
  );
}
