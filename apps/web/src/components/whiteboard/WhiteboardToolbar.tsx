import React from "react";
import { WhiteboardTool } from "@codesync/types";
import { Button } from "../common/Button.js";

interface WhiteboardToolbarProps {
  activeTool: WhiteboardTool;
  activeColor: string;
  activeStrokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolSelect: (tool: WhiteboardTool) => void;
  onColorSelect: (color: string) => void;
  onStrokeWidthSelect: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const COLORS = [
  "#f8fafc",
  "#94a3b8",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
const STROKE_WIDTHS = [
  { value: 2, label: "Small", icon: "•" },
  { value: 5, label: "Medium", icon: "●" },
  { value: 10, label: "Large", icon: "⬤" },
];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  activeTool,
  activeColor,
  activeStrokeWidth,
  canUndo,
  canRedo,
  onToolSelect,
  onColorSelect,
  onStrokeWidthSelect,
  onUndo,
  onRedo,
  onClear,
  disabled = false,
}) => {
  const tools = [
    { id: WhiteboardTool.SELECT, label: "Select", icon: "arrow_selector_tool" },
    { id: WhiteboardTool.PEN, label: "Pen", icon: "draw" },
    { id: WhiteboardTool.LINE, label: "Line", icon: "horizontal_rule" },
    { id: WhiteboardTool.RECTANGLE, label: "Rectangle", icon: "square" },
    { id: WhiteboardTool.ELLIPSE, label: "Ellipse", icon: "circle" },
    { id: WhiteboardTool.ERASER, label: "Eraser", icon: "ink_eraser" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-surface-container border-b border-surface-container-highest shrink-0 shadow-sm">
      {/* Tool Selector */}
      <div className="flex bg-surface-container-high p-1 rounded-lg border border-outline/40 gap-0.5">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              disabled={disabled}
              onClick={() => onToolSelect(tool.id)}
              title={tool.label}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 bg-primary text-on-primary font-bold shadow-md ring-1 ring-primary/50"
                  : "text-on-surface hover:text-on-surface hover:bg-surface-bright"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${isActive ? "text-on-primary" : "text-on-surface"}`}
              >
                {tool.icon}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-outline/40 mx-1 hidden sm:block" />

      {/* Color Swatches */}
      <div className="flex bg-surface-container-high p-1 rounded-lg border border-outline/40 gap-1.5 items-center">
        {COLORS.map((color) => {
          const isActive = activeColor === color;
          return (
            <button
              key={color}
              disabled={disabled}
              onClick={() => onColorSelect(color)}
              title="Select Color"
              className={`w-6 h-6 rounded-full transition-all border-2 cursor-pointer shadow-sm ${
                isActive
                  ? "border-primary ring-2 ring-primary/40 scale-110"
                  : "border-outline-variant hover:border-on-surface hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      <div className="w-px h-6 bg-outline/40 mx-1 hidden sm:block" />

      {/* Stroke Width Selector */}
      <div className="flex bg-surface-container-high p-1 rounded-lg border border-outline/40 gap-1">
        {STROKE_WIDTHS.map((width) => {
          const isActive = activeStrokeWidth === width.value;
          return (
            <button
              key={width.value}
              disabled={disabled}
              onClick={() => onStrokeWidthSelect(width.value)}
              title={`${width.label} Stroke`}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer text-xs font-bold ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface hover:bg-surface-bright"
              } disabled:opacity-40`}
            >
              <span style={{ fontSize: `${width.value + 10}px` }}>{width.icon}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-outline/40 mx-1 hidden sm:block" />

      {/* Undo/Redo Controls */}
      <div className="flex bg-surface-container-high p-1 rounded-lg border border-outline/40 gap-1">
        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          title="Undo"
          className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface hover:bg-surface-bright disabled:text-on-surface-variant/40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">undo</span>
        </button>
        <button
          onClick={onRedo}
          disabled={disabled || !canRedo}
          title="Redo"
          className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface hover:bg-surface-bright disabled:text-on-surface-variant/40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">redo</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Clear Canvas Action Button */}
      <Button
        variant="danger"
        size="sm"
        onClick={onClear}
        disabled={disabled}
        title="Clear Canvas"
        className="h-8 text-xs font-bold px-3 shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
        Clear
      </Button>
    </div>
  );
};
