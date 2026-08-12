import { describe, it, expect, beforeEach, vi } from "vitest";
import { SocketEvents } from "@codesync/types";
import * as Y from "yjs";
// We need to re-instantiate or mock the service for tests to ensure isolation
// Since yjs.service exports a singleton, we'll reset it or use a fresh mock.

// Actually, we can just test the pure Yjs sync logic conceptually first.
describe("Pure Yjs Synchronization", () => {
  it("should merge changes from two separate documents concurrently", () => {
    // 1. Client A and Client B start with the same document state
    const docA = new Y.Doc();
    const textA = docA.getText("index.js");
    textA.insert(0, "hello");

    const stateA = Y.encodeStateAsUpdate(docA);

    const docB = new Y.Doc();
    Y.applyUpdate(docB, stateA);
    const textB = docB.getText("index.js");
    expect(textB.toString()).toBe("hello");

    // 2. Client A inserts text
    textA.insert(5, " A");

    // 3. Client B concurrently inserts text at the same position
    textB.insert(5, " B");

    // 4. They exchange updates (simulate network)
    const updateA = Y.encodeStateAsUpdate(docA);
    const updateB = Y.encodeStateAsUpdate(docB);

    Y.applyUpdate(docB, updateA);
    Y.applyUpdate(docA, updateB);

    // 5. They should converge to the exact same string
    expect(docA.getText("index.js").toString()).toBe(docB.getText("index.js").toString());

    // The merged result typically orders deterministically based on client IDs
    const merged = textA.toString();
    expect(merged.includes("hello")).toBe(true);
    expect(merged.includes(" A")).toBe(true);
    expect(merged.includes(" B")).toBe(true);
  });
});
