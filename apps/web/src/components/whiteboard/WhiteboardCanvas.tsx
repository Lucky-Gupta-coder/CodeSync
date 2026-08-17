import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  WhiteboardState,
  WhiteboardTool,
  WhiteboardObject,
  WhiteboardDrawing,
  WhiteboardPoint,
} from "@codesync/types";

interface WhiteboardCanvasProps {
  state: WhiteboardState;
  activeColor: string;
  activeStrokeWidth: number;
  onAddObject: (obj: WhiteboardObject) => void;
  onRemoveObject: (id: string) => void;
  readOnly?: boolean;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  state,
  activeColor,
  activeStrokeWidth,
  onAddObject,
  onRemoveObject,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref for tracking the active stroke (high performance without re-rendering)
  const currentStrokeRef = useRef<{
    id: string;
    points: WhiteboardPoint[];
    color: string;
    width: number;
  } | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const drawAllObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Set default drawing styles
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw saved objects
    Object.values(state.objects).forEach((obj) => {
      if (obj.type === "DRAWING") {
        const drawing = obj as WhiteboardDrawing;
        if (drawing.points.length === 0) return;

        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.strokeWidth;

        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw current active stroke
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const { points, color, width } = currentStrokeRef.current;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  }, [state.objects]);

  // Handle Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resizeObserver = new ResizeObserver(() => {
      drawAllObjects();
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [drawAllObjects]);

  // Redraw when state changes
  useEffect(() => {
    drawAllObjects();
  }, [drawAllObjects]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const { x, y } = getCoordinates(e);

    if (state.activeTool === WhiteboardTool.PEN) {
      setIsDrawing(true);
      currentStrokeRef.current = {
        id: crypto.randomUUID(),
        points: [{ x, y }],
        color: activeColor,
        width: activeStrokeWidth,
      };

      // Prevent scrolling on touch devices
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drawAllObjects();
    } else if (state.activeTool === WhiteboardTool.ERASER) {
      handleEraser(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (state.activeTool === WhiteboardTool.PEN && isDrawing && currentStrokeRef.current) {
      const { x, y } = getCoordinates(e);
      currentStrokeRef.current.points.push({ x, y });

      // Draw continuously for smooth 60fps performance
      drawAllObjects();
    } else if (state.activeTool === WhiteboardTool.ERASER && e.buttons > 0) {
      // Allow dragging to erase
      const { x, y } = getCoordinates(e);
      handleEraser(x, y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (state.activeTool === WhiteboardTool.PEN && isDrawing && currentStrokeRef.current) {
      setIsDrawing(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        const newDrawing: WhiteboardDrawing = {
          id: stroke.id,
          type: "DRAWING",
          x: stroke.points[0].x,
          y: stroke.points[0].y,
          color: stroke.color,
          strokeWidth: stroke.width,
          points: stroke.points,
        };
        onAddObject(newDrawing);
      }
      currentStrokeRef.current = null;
    }
  };

  const handleEraser = (x: number, y: number) => {
    const ERASE_RADIUS = 15;

    // Find if the pointer intersects with any drawing object
    Object.values(state.objects).forEach((obj) => {
      if (obj.type === "DRAWING") {
        const drawing = obj as WhiteboardDrawing;
        // Check distance from pointer to any point in the stroke
        for (const point of drawing.points) {
          const dist = Math.hypot(point.x - x, point.y - y);
          if (dist < ERASE_RADIUS + drawing.strokeWidth / 2) {
            onRemoveObject(obj.id);
            return; // Stop checking this object
          }
        }
      }
    });
  };

  const getCursor = () => {
    if (readOnly) return "default";
    switch (state.activeTool) {
      case WhiteboardTool.PEN:
        return "crosshair";
      case WhiteboardTool.SELECT:
        return "default";
      case WhiteboardTool.ERASER:
        return "cell";
      default:
        return "crosshair";
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
};
