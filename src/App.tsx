import { useRoute } from "./router";
import { Sidebar } from "./components/Sidebar";
import { Landing } from "./tools/Landing";
import { UrlEncoder } from "./tools/UrlEncoder";
import { UrlBuilder } from "./tools/UrlBuilder";
import { JsonViewer } from "./tools/JsonViewer";
import { JwtViewer } from "./tools/JwtViewer";
import { ColorTool } from "./tools/ColorTool";

const TOOL_META: Record<string, { label: string; color: string; topGradient?: string }> = {
  "/url-encoder": { label: "URL Encoder", color: "#06b6d4" },
  "/url-builder": { label: "URL Builder", color: "#8b5cf6" },
  "/json": { label: "JSON Viewer", color: "#6366f1" },
  "/jwt": { label: "JWT Viewer", color: "#3fb950" },
  "/color": {
    label: "Colors",
    color: "#e879f9",
    topGradient: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899)",
  },
};

export function App() {
  const path = useRoute();
  const isLanding = path === "/";
  const meta = TOOL_META[path];

  return (
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col md:flex-row">
      {!isLanding && <Sidebar currentPath={path} accentColor={meta?.color} />}
      <main class="flex-1 min-w-0">
        {isLanding ? (
          <Landing />
        ) : (
          <div class="px-4 py-6">
            <div
              class="max-w-5xl mx-auto rounded-xl border border-base-300 bg-base-200 p-6 relative overflow-hidden"
              style={meta ? ({ "--card-color": meta.color } as any) : undefined}
            >
              {meta && (
                <div
                  class="absolute top-0 inset-x-0 h-0.5"
                  style={{ background: meta.topGradient ?? meta.color }}
                />
              )}
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
              {path === "/json" && <JsonViewer />}
              {path === "/jwt" && <JwtViewer />}
              {path === "/color" && <ColorTool />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
