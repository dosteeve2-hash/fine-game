export type Side = "left" | "top" | "right" | "bottom";
export type Orientation = "landscape" | "portrait";

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
  side: Side;
  corner: boolean;
}

export const corner = 1.5;
const longEdge = 11;
const shortEdge = 7;
const landscapeWidth = corner * 2 + longEdge;
const landscapeHeight = corner * 2 + shortEdge;

export const cornerIndices = [7, 19, 27, 39] as const;

function landscapeRect(index: number): TileRect {
  if (index === 39) return { x: 0, y: landscapeHeight - corner, w: corner, h: corner, side: "left", corner: true };
  if (index <= 6) return { x: 0, y: landscapeHeight - corner - (index + 1), w: corner, h: 1, side: "left", corner: false };
  if (index === 7) return { x: 0, y: 0, w: corner, h: corner, side: "top", corner: true };
  if (index <= 18) return { x: corner + (index - 8), y: 0, w: 1, h: corner, side: "top", corner: false };
  if (index === 19) return { x: landscapeWidth - corner, y: 0, w: corner, h: corner, side: "right", corner: true };
  if (index <= 26) return { x: landscapeWidth - corner, y: corner + (index - 20), w: corner, h: 1, side: "right", corner: false };
  if (index === 27) return { x: landscapeWidth - corner, y: landscapeHeight - corner, w: corner, h: corner, side: "bottom", corner: true };
  return { x: landscapeWidth - corner - (index - 27), y: landscapeHeight - corner, w: 1, h: corner, side: "bottom", corner: false };
}

const rotateSide: Record<Side, Side> = { left: "top", top: "right", right: "bottom", bottom: "left" };

export function boardSize(orientation: Orientation): { width: number; height: number } {
  return orientation === "landscape"
    ? { width: landscapeWidth, height: landscapeHeight }
    : { width: landscapeHeight, height: landscapeWidth };
}

export function tileRect(index: number, orientation: Orientation): TileRect {
  const rect = landscapeRect(index);
  if (orientation === "landscape") return rect;
  return { x: landscapeHeight - rect.y - rect.h, y: rect.x, w: rect.h, h: rect.w, side: rotateSide[rect.side], corner: rect.corner };
}

export function centerRect(orientation: Orientation): { x: number; y: number; w: number; h: number } {
  const size = boardSize(orientation);
  return { x: corner, y: corner, w: size.width - corner * 2, h: size.height - corner * 2 };
}

const slots: Array<[number, number]> = [
  [-0.22, -0.2],
  [0.22, -0.2],
  [-0.22, 0.2],
  [0.22, 0.2]
];

export function pawnPoint(index: number, slot: number, orientation: Orientation, ux: number, uy: number): { x: number; y: number } {
  const rect = tileRect(index, orientation);
  const [dx, dy] = slots[slot] ?? [0, 0];
  const scale = Math.min(rect.w * ux, rect.h * uy);
  return {
    x: (rect.x + rect.w / 2) * ux + dx * scale,
    y: (rect.y + rect.h / 2) * uy + dy * scale
  };
}
