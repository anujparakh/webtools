import { describe, it, expect } from "vitest";
import { resolveJsonPath } from "./json-utils";

describe("resolveJsonPath", () => {
  const data = {
    name: "Alice",
    age: 30,
    active: true,
    score: null,
    items: [
      { id: 1, label: "first" },
      { id: 2, label: "second" },
    ],
    nested: { a: { b: { c: 42 } } },
  };

  it("resolves a top-level key", () => {
    expect(resolveJsonPath(data, "name")).toEqual({ found: true, value: "Alice" });
  });

  it("resolves a number value", () => {
    expect(resolveJsonPath(data, "age")).toEqual({ found: true, value: 30 });
  });

  it("resolves a boolean value", () => {
    expect(resolveJsonPath(data, "active")).toEqual({ found: true, value: true });
  });

  it("resolves a null value", () => {
    expect(resolveJsonPath(data, "score")).toEqual({ found: true, value: null });
  });

  it("resolves an array element", () => {
    expect(resolveJsonPath(data, "items[0]")).toEqual({ found: true, value: { id: 1, label: "first" } });
  });

  it("resolves a nested property after array index", () => {
    expect(resolveJsonPath(data, "items[1].label")).toEqual({ found: true, value: "second" });
  });

  it("resolves deeply nested path", () => {
    expect(resolveJsonPath(data, "nested.a.b.c")).toEqual({ found: true, value: 42 });
  });

  it("resolves bracket string notation", () => {
    expect(resolveJsonPath(data, 'nested["a"]')).toEqual({ found: true, value: { b: { c: 42 } } });
  });

  it("resolves bracket single-quote string notation", () => {
    expect(resolveJsonPath(data, "nested['a']")).toEqual({ found: true, value: { b: { c: 42 } } });
  });

  it("resolves a root array element", () => {
    expect(resolveJsonPath([10, 20, 30], "[2]")).toEqual({ found: true, value: 30 });
  });

  it("errors on missing key", () => {
    const r = resolveJsonPath(data, "missing");
    expect(r.found).toBe(false);
    expect((r as { found: false; error: string }).error).toMatch(/not found/i);
  });

  it("errors on out-of-bounds index", () => {
    const r = resolveJsonPath(data, "items[99]");
    expect(r.found).toBe(false);
    expect((r as { found: false; error: string }).error).toMatch(/out of bounds/i);
  });

  it("errors when traversing into a non-object with dot", () => {
    const r = resolveJsonPath(data, "name.something");
    expect(r.found).toBe(false);
  });

  it("errors when using array index on non-array", () => {
    const r = resolveJsonPath(data, "name[0]");
    expect(r.found).toBe(false);
  });

  it("errors on trailing dot", () => {
    const r = resolveJsonPath(data, "nested.");
    expect(r.found).toBe(false);
    expect((r as { found: false; error: string }).error).toMatch(/trailing dot/i);
  });

  it("errors on unexpected character", () => {
    const r = resolveJsonPath(data, "nested!a");
    expect(r.found).toBe(false);
  });

  it("errors on empty path", () => {
    const r = resolveJsonPath(data, "");
    expect(r.found).toBe(false);
  });
});
