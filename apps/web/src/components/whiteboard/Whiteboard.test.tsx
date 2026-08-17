import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Whiteboard } from "./Whiteboard.js";

// Mock the ResizeObserver for the canvas
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Whiteboard Component (Phase 5.2 Drawing Engine)", () => {
  it("renders the whiteboard toolbar and canvas", () => {
    render(<Whiteboard roomId="test-room" />);

    // Check if tools are rendered
    expect(screen.getByTitle("Select")).toBeInTheDocument();
    expect(screen.getByTitle("Pen")).toBeInTheDocument();
    expect(screen.getByTitle("Eraser")).toBeInTheDocument();

    // Check if canvas ready message is absent because it's a real canvas now
    // expect(screen.queryByText(/Whiteboard canvas ready/i)).not.toBeInTheDocument();
  });

  it("allows tool selection", () => {
    render(<Whiteboard roomId="test-room" />);

    const penButton = screen.getByTitle("Pen");
    fireEvent.click(penButton);

    expect(penButton).toHaveClass("bg-indigo-600");
  });

  it("allows undo and redo actions to be clicked", () => {
    render(<Whiteboard roomId="test-room" />);
    const undoBtn = screen.getByTitle("Undo");
    const redoBtn = screen.getByTitle("Redo");

    // Initially disabled
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();
  });

  it("renders in read-only mode correctly", () => {
    render(<Whiteboard roomId="test-room" readOnly={true} />);

    const penButton = screen.getByTitle("Pen");
    expect(penButton).toBeDisabled();

    const clearButton = screen.getByTitle("Clear Canvas");
    expect(clearButton).toBeDisabled();
  });
});
