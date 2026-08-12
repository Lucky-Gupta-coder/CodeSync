import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Global Mock for y-monaco because it imports monaco-editor directly which breaks in jsdom
vi.mock("y-monaco", () => ({
  MonacoBinding: class {
    destroy() {}
  },
}));

// Automatically cleanup DOM elements after each test
afterEach(() => {
  cleanup();
});
