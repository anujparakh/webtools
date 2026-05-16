import { useRoute } from "./router";
import { useEffect, useState } from "preact/hooks";
import { Sidebar } from "./components/Sidebar";
import { Landing } from "./tools/Landing";
import { UrlEncoder } from "./tools/UrlEncoder";
import { UrlBuilder } from "./tools/UrlBuilder";
import { JsonViewer } from "./tools/JsonViewer";
import { JwtViewer } from "./tools/JwtViewer";

const TOOL_META: Record<
  string,
  { label: string; color: string; title: string; description: string }
> = {
  "/url-encoder": {
    label: "URL Encoder / Decoder",
    color: "#06b6d4",
    title: "URL Encoder & Decoder | Web Tools",
    description:
      "Encode and decode URLs and query parameters instantly in your browser. Supports full URLs and individual components. No data sent to any server.",
  },
  "/url-builder": {
    label: "URL Builder",
    color: "#8b5cf6",
    title: "URL Builder | Web Tools",
    description:
      "Compose URLs with query parameters visually. Supports JSON values, encode/decode, and history. Runs entirely in your browser.",
  },
  "/json": {
    label: "JSON Viewer",
    color: "#6366f1",
    title: "JSON Viewer & Formatter | Web Tools",
    description:
      "Parse, format, and explore JSON data with syntax highlighting. Pretty-print or minify output. Everything stays in your browser.",
  },
  "/jwt": {
    label: "JWT Viewer",
    color: "#3fb950",
    title: "JWT Decoder & Inspector | Web Tools",
    description:
      "Decode and inspect JWT tokens — view the header, payload, and expiry. Your tokens never leave the browser.",
  },
};

const LANDING_META = {
  title: "Web Tools - Browser-Based Developer Utilities",
  description:
    "Free browser-based developer tools: URL encoder/decoder, URL builder, JSON formatter, and JWT decoder. No server required — everything runs in your browser.",
};

export function App() {
  const path = useRoute();
  const isLanding = path === "/";
  const meta = TOOL_META[path];
  const [jsonWideMode, setJsonWideMode] = useState(false);

  useEffect(() => {
    const pageMeta = meta ?? LANDING_META;
    document.title = isLanding ? LANDING_META.title : pageMeta.title;
    const descEl = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (descEl)
      descEl.content = isLanding
        ? LANDING_META.description
        : pageMeta.description;
  }, [path]);

  return (
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col md:flex-row">
      {!isLanding && <Sidebar currentPath={path} />}
      <main class="flex-1 min-w-0">
        {isLanding ? (
          <Landing />
        ) : (
          <div class="px-4 py-6">
            <div
              class={`${jsonWideMode ? "max-w-full" : "max-w-5xl"} mx-auto rounded-xl border border-base-300 bg-base-200 p-6 transition-all duration-200`}
              style={
                meta
                  ? ({
                      "--card-color": meta.color,
                      borderTopColor: meta.color,
                      borderTopWidth: "2px",
                    } as any)
                  : undefined
              }
            >
              {meta && (
                <h1
                  class="text-lg font-semibold mb-5"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </h1>
              )}
              {path === "/url-encoder" && <UrlEncoder />}
              {path === "/url-builder" && <UrlBuilder />}
              {path === "/json" && <JsonViewer onWideModeChange={setJsonWideMode} />}
              {path === "/jwt" && <JwtViewer />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
