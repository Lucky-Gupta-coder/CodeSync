import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  WhiteboardState,
  WhiteboardTool,
  WhiteboardObject,
  WhiteboardDrawing,
  WhiteboardRectangle,
  WhiteboardEllipse,
  WhiteboardLine,
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

  // Ref for tracking the active shape/stroke (high performance without re-rendering)
  const currentShapeRef = useRef<{
    id: string;
    type: WhiteboardTool;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    points: WhiteboardPoint[]; // Used for PEN
    color: string;
    width: number;
  } | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const renderStroke = (
    ctx: CanvasRenderingContext2D,
    points: WhiteboardPoint[],
    color: string,
    width: number
  ) => {
    if (points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  const renderRectangle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    width: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
  };

  const renderEllipse = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    width: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    // HTML5 Canvas ellipse: (x, y, radiusX, radiusY, rotation, startAngle, endAngle)
    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const renderLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawAllObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw saved objects
    Object.values(state.objects).forEach((obj) => {
      switch (obj.type) {
        case "DRAWING": {
          const drawing = obj as WhiteboardDrawing;
          renderStroke(ctx, drawing.points, drawing.color, drawing.strokeWidth);
          break;
        }
        case "RECTANGLE": {
          const rectObj = obj as WhiteboardRectangle;
          renderRectangle(
            ctx,
            rectObj.x,
            rectObj.y,
            rectObj.width,
            rectObj.height,
            rectObj.color,
            rectObj.strokeWidth
          );
          break;
        }
        case "ELLIPSE": {
          const elObj = obj as WhiteboardEllipse;
          renderEllipse(
            ctx,
            elObj.x,
            elObj.y,
            elObj.width,
            elObj.height,
            elObj.color,
            elObj.strokeWidth
          );
          break;
        }
        case "LINE": {
          const lineObj = obj as WhiteboardLine;
          renderLine(
            ctx,
            lineObj.x,
            lineObj.y,
            lineObj.endX,
            lineObj.endY,
            lineObj.color,
            lineObj.strokeWidth
          );
          break;
        }
      }
    });

    // Draw active preview
    if (currentShapeRef.current) {
      const shape = currentShapeRef.current;
      if (shape.type === WhiteboardTool.PEN && shape.points.length > 0) {
        renderStroke(ctx, shape.points, shape.color, shape.width);
      } else if (shape.type === WhiteboardTool.RECTANGLE) {
        renderRectangle(
          ctx,
          shape.startX,
          shape.startY,
          shape.endX - shape.startX,
          shape.endY - shape.startY,
          shape.color,
          shape.width
        );
      } else if (shape.type === WhiteboardTool.ELLIPSE) {
        renderEllipse(
          ctx,
          shape.startX,
          shape.startY,
          shape.endX - shape.startX,
          shape.endY - shape.startY,
          shape.color,
          shape.width
        );
      } else if (shape.type === WhiteboardTool.LINE) {
        renderLine(
          ctx,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          shape.color,
          shape.width
        );
      }
    }
  }, [state.objects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resizeObserver = new ResizeObserver(() => drawAllObjects());
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [drawAllObjects]);

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

    if (
      state.activeTool === WhiteboardTool.PEN ||
      state.activeTool === WhiteboardTool.RECTANGLE ||
      state.activeTool === WhiteboardTool.ELLIPSE ||
      state.activeTool === WhiteboardTool.LINE
    ) {
      setIsDrawing(true);
      currentShapeRef.current = {
        id: crypto.randomUUID(),
        type: state.activeTool,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        points: [{ x, y }],
        color: activeColor,
        width: activeStrokeWidth,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drawAllObjects();
    } else if (state.activeTool === WhiteboardTool.ERASER) {
      handleEraser(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (isDrawing && currentShapeRef.current) {
      const { x, y } = getCoordinates(e);
      currentShapeRef.current.endX = x;
      currentShapeRef.current.endY = y;

      if (currentShapeRef.current.type === WhiteboardTool.PEN) {
        currentShapeRef.current.points.push({ x, y });
      }

      drawAllObjects();
    } else if (state.activeTool === WhiteboardTool.ERASER && e.buttons > 0) {
      const { x, y } = getCoordinates(e);
      handleEraser(x, y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (isDrawing && currentShapeRef.current) {
      setIsDrawing(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const shape = currentShapeRef.current;

      if (shape.type === WhiteboardTool.PEN) {
        if (shape.points.length > 0) {
          const newDrawing: WhiteboardDrawing = {
            id: shape.id,
            type: "DRAWING",
            x: shape.points[0].x,
            y: shape.points[0].y,
            color: shape.color,
            strokeWidth: shape.width,
            points: shape.points,
          };
          onAddObject(newDrawing);
        }
      } else if (shape.type === WhiteboardTool.RECTANGLE) {
        const newRect: WhiteboardRectangle = {
          id: shape.id,
          type: "RECTANGLE",
          x: shape.startX,
          y: shape.startY,
          width: shape.endX - shape.startX,
          height: shape.endY - shape.startY,
          color: shape.color,
          strokeWidth: shape.width,
        };
        // Don't add if it's too small (just a click)
        if (Math.abs(newRect.width) > 2 || Math.abs(newRect.height) > 2) {
          onAddObject(newRect);
        }
      } else if (shape.type === WhiteboardTool.ELLIPSE) {
        const newEllipse: WhiteboardEllipse = {
          id: shape.id,
          type: "ELLIPSE",
          x: shape.startX,
          y: shape.startY,
          width: shape.endX - shape.startX,
          height: shape.endY - shape.startY,
          color: shape.color,
          strokeWidth: shape.width,
        };
        if (Math.abs(newEllipse.width) > 2 || Math.abs(newEllipse.height) > 2) {
          onAddObject(newEllipse);
        }
      } else if (shape.type === WhiteboardTool.LINE) {
        const newLine: WhiteboardLine = {
          id: shape.id,
          type: "LINE",
          x: shape.startX,
          y: shape.startY,
          endX: shape.endX,
          endY: shape.endY,
          color: shape.color,
          strokeWidth: shape.width,
        };
        if (Math.abs(newLine.endX - newLine.x) > 2 || Math.abs(newLine.endY - newLine.y) > 2) {
          onAddObject(newLine);
        }
      }

      currentShapeRef.current = null;
      drawAllObjects(); // clear preview
    }
  };

  // Helper distance functions
  const distanceToLineSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const distanceToRectangleBorder = (
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ) => {
    // Normalize coordinates just in case width/height are negative
    const x1 = Math.min(rx, rx + rw);
    const x2 = Math.max(rx, rx + rw);
    const y1 = Math.min(ry, ry + rh);
    const y2 = Math.max(ry, ry + rh);

    const dTop = distanceToLineSegment(px, py, x1, y1, x2, y1);
    const dBottom = distanceToLineSegment(px, py, x1, y2, x2, y2);
    const dLeft = distanceToLineSegment(px, py, x1, y1, x1, y2);
    const dRight = distanceToLineSegment(px, py, x2, y1, x2, y2);
    return Math.min(dTop, dBottom, dLeft, dRight);
  };

  const distanceToEllipseBorder = (
    px: number,
    py: number,
    cx: number,
    cy: number,
    rx: number,
    ry: number
  ) => {
    // A simple approximation for ellipse boundary distance
    if (rx === 0 || ry === 0) return Infinity;
    const dx = px - cx;
    const dy = py - cy;
    // Angle to the point
    const angle = Math.atan2(dy, dx);
    // Point on ellipse at that angle
    const ex = cx + rx * Math.cos(angle);
    const ey = cy + ry * Math.sin(angle);
    return Math.hypot(px - ex, py - ey);
  };

  const handleEraser = (x: number, y: number) => {
    const ERASE_RADIUS = 15;

    Object.values(state.objects).forEach((obj) => {
      const threshold = ERASE_RADIUS + obj.strokeWidth / 2;

      if (obj.type === "DRAWING") {
        const drawing = obj as WhiteboardDrawing;
        for (const point of drawing.points) {
          if (Math.hypot(point.x - x, point.y - y) < threshold) {
            onRemoveObject(obj.id);
            return;
          }
        }
      } else if (obj.type === "LINE") {
        const line = obj as WhiteboardLine;
        if (distanceToLineSegment(x, y, line.x, line.y, line.endX, line.endY) < threshold) {
          onRemoveObject(obj.id);
          return;
        }
      } else if (obj.type === "RECTANGLE") {
        const rect = obj as WhiteboardRectangle;
        if (distanceToRectangleBorder(x, y, rect.x, rect.y, rect.width, rect.height) < threshold) {
          onRemoveObject(obj.id);
          return;
        }
      } else if (obj.type === "ELLIPSE") {
        const ellipse = obj as WhiteboardEllipse;
        const cx = ellipse.x + ellipse.width / 2;
        const cy = ellipse.y + ellipse.height / 2;
        const rx = Math.abs(ellipse.width / 2);
        const ry = Math.abs(ellipse.height / 2);
        if (distanceToEllipseBorder(x, y, cx, cy, rx, ry) < threshold) {
          onRemoveObject(obj.id);
          return;
        }
      }
    });
  };

  const getCursor = () => {
    if (readOnly) return "default";
    switch (state.activeTool) {
      case WhiteboardTool.PEN:
      case WhiteboardTool.LINE:
      case WhiteboardTool.RECTANGLE:
      case WhiteboardTool.ELLIPSE:
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
