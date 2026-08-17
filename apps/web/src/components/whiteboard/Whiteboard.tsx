import React from "react";
import { useWhiteboard } from "../../hooks/useWhiteboard.js";
import { WhiteboardToolbar } from "./WhiteboardToolbar.js";
import { WhiteboardCanvas } from "./WhiteboardCanvas.js";
import { useSocket } from "../../socket/hooks/useSocket.js";

interface WhiteboardProps {
  roomId: string;
  readOnly?: boolean;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, readOnly = false }) => {
  const { socket } = useSocket();
  const {
    state,
    activeColor,
    activeStrokeWidth,
    canUndo,
    canRedo,
    setActiveTool,
    setActiveColor,
    setActiveStrokeWidth,
    addObject,
    updateObject,
    removeObject,
    clearWhiteboard,
    undo,
    redo,
  } = useWhiteboard(roomId, socket);

  return (
    <div className="flex flex-col w-full h-full border border-slate-850 bg-slate-950/30 rounded-2xl overflow-hidden min-w-0">
      <WhiteboardToolbar
        activeTool={state.activeTool}
        activeColor={activeColor}
        activeStrokeWidth={activeStrokeWidth}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolSelect={setActiveTool}
        onColorSelect={setActiveColor}
        onStrokeWidthSelect={setActiveStrokeWidth}
        onUndo={undo}
        onRedo={redo}
        onClear={clearWhiteboard}
        disabled={readOnly}
      />
      <div className="flex-1 relative">
        <WhiteboardCanvas
          state={state}
          activeColor={activeColor}
          activeStrokeWidth={activeStrokeWidth}
          onAddObject={addObject}
          onRemoveObject={removeObject}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
