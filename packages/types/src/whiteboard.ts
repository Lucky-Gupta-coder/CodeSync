export interface WhiteboardPoint {
  x: number;
  y: number;
}

export enum WhiteboardTool {
  SELECT = "SELECT",
  PEN = "PEN",
  RECTANGLE = "RECTANGLE",
  ELLIPSE = "ELLIPSE",
  ERASER = "ERASER",
}

export interface WhiteboardObjectBase {
  id: string;
  type: string;
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
}

export interface WhiteboardDrawing extends WhiteboardObjectBase {
  type: "DRAWING";
  points: WhiteboardPoint[];
}

export interface WhiteboardRectangle extends WhiteboardObjectBase {
  type: "RECTANGLE";
  width: number;
  height: number;
}

export interface WhiteboardEllipse extends WhiteboardObjectBase {
  type: "ELLIPSE";
  width: number;
  height: number;
}

export type WhiteboardObject = WhiteboardDrawing | WhiteboardRectangle | WhiteboardEllipse;

export interface WhiteboardState {
  objects: Record<string, WhiteboardObject>;
  activeTool: WhiteboardTool;
  selectedObjectId: string | null;
}

export interface WhiteboardUpdatePayload {
  roomId: string;
  objects: WhiteboardObject[];
}
