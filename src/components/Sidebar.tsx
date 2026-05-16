import { useState } from "preact/hooks";
import { navigate } from "../router";
import {
  GlobeSimple,
  LinkSimple,
  Hammer,
  BracketsCurly,
  Key,
  Palette,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

const TOOLS = [
  { path: "/url-encoder", label: "URL Encoder", Icon: LinkSimple },
  { path: "/url-builder", label: "URL Builder", Icon: Hammer },
  { path: "/json", label: "JSON Viewer", Icon: BracketsCurly },
  { path: "/jwt", label: "JWT Viewer", Icon: Key },
  { path: "/color", label: "Colors", Icon: Palette },
];

interface SidebarProps {
  currentPath: string;
  accentColor?: string;
}

export function Sidebar({ currentPath, accentColor }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("webtools:sidebar:collapsed") === "true",
  );

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("webtools:sidebar:collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop left rail */}
      <aside
        class={`hidden md:flex flex-col sticky top-0 h-screen bg-base-200 border-r border-base-300 shrink-0 transition-all duration-200 ${collapsed ? "w-14 p-2" : "w-52 p-4"}`}
      >
        <button
          class={`flex items-center gap-2 mb-6 transition-colors text-primary hover:text-secondary ${collapsed ? "justify-center" : "text-left"}`}
          onClick={() => navigate("/")}
          title="Web Tools"
        >
          <GlobeSimple size={22} weight="duotone" />
          {!collapsed && <span class="text-lg font-bold">Web Tools</span>}
        </button>

        <nav class="flex flex-col gap-1 flex-1">
          {TOOLS.map((t) => {
            const isActive = currentPath === t.path;
            const color = isActive ? (accentColor ?? "#6366f1") : undefined;
            return (
              <button
                key={t.path}
                class={`flex items-center gap-2.5 w-full py-2 rounded-lg text-sm transition-colors ${collapsed ? "justify-center px-2" : "px-3"} ${
                  isActive ? "font-medium" : "text-base-content/60 hover:text-base-content hover:bg-base-300"
                }`}
                style={color ? { backgroundColor: color + "2a", color } : undefined}
                onClick={() => navigate(t.path)}
                title={collapsed ? t.label : undefined}
              >
                <t.Icon size={18} />
                {!collapsed && t.label}
              </button>
            );
          })}
        </nav>

        <button
          class="flex items-center justify-center p-2 rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-100 bg-base-300 transition-colors"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <CaretRight size={15} /> : <CaretLeft size={15} />}
        </button>

        {!collapsed && (
          <p class="mt-3 text-xs text-base-content/25 text-center">
            Made by{" "}
            <a
              href="https://anujparakh.dev"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary transition-colors underline underline-offset-2"
            >
              Anuj Parakh
            </a>
          </p>
        )}
      </aside>

      {/* Mobile top bar */}
      <div class="md:hidden bg-base-200 border-b border-base-300 px-3 py-2">
        <div class="flex items-center gap-2 overflow-x-auto">
          <button
            class="flex items-center gap-1.5 font-bold text-sm shrink-0 mr-1 text-primary hover:text-secondary transition-colors"
            onClick={() => navigate("/")}
          >
            <GlobeSimple size={16} weight="duotone" />
            Web Tools
          </button>
          {TOOLS.map((t) => {
            const isActive = currentPath === t.path;
            const color = isActive ? (accentColor ?? "#6366f1") : undefined;
            return (
              <button
                key={t.path}
                class={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive ? "font-medium" : "text-base-content/60 hover:text-base-content hover:bg-base-300"
                }`}
                style={color ? { backgroundColor: color + "2a", color } : undefined}
                onClick={() => navigate(t.path)}
              >
                <t.Icon size={14} weight={isActive ? "fill" : "regular"} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
