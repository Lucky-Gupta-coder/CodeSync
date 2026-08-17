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
    { id: WhiteboardTool.SELECT, label: "Select", icon: "↖" },
    { id: WhiteboardTool.PEN, label: "Pen", icon: "✎" },
    { id: WhiteboardTool.LINE, label: "Line", icon: "╱" },
    { id: WhiteboardTool.RECTANGLE, label: "Rectangle", icon: "⬜" },
    { id: WhiteboardTool.ELLIPSE, label: "Ellipse", icon: "◯" },
    { id: WhiteboardTool.ERASER, label: "Eraser", icon: "⌫" },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-800 shrink-0">
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
        {tools.map((tool) => (
          <button
            key={tool.id}
            disabled={disabled}
            onClick={() => onToolSelect(tool.id)}
            title={tool.label}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              activeTool === tool.id
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-800 mx-1" />

      {/* Color Picker */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
        {COLORS.map((color) => (
          <button
            key={color}
            disabled={disabled}
            onClick={() => onColorSelect(color)}
            title="Color"
            className={`w-6 h-6 rounded-full transition-all border-2 ${
              activeColor === color
                ? "border-white scale-110"
                : "border-transparent hover:scale-110"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-slate-800 mx-1" />

      {/* Stroke Width Picker */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
        {STROKE_WIDTHS.map((width) => (
          <button
            key={width.value}
            disabled={disabled}
            onClick={() => onStrokeWidthSelect(width.value)}
            title={`${width.label} Stroke`}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              activeStrokeWidth === width.value
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            } disabled:opacity-50`}
          >
            <span style={{ fontSize: `${width.value + 10}px` }}>{width.icon}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-800 mx-1" />

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          title="Undo"
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={disabled || !canRedo}
          title="Redo"
          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↷
        </button>
      </div>

      <div className="flex-1" />
      <Button variant="danger" size="sm" onClick={onClear} disabled={disabled} title="Clear Canvas">
        Clear
      </Button>
    </div>
  );
};
