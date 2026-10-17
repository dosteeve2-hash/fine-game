import { useId } from "react";
import { playerColors } from "../theme";

const outlines = [
  "M12 2.2a5 5 0 0 1 3 9 4.6 4.6 0 0 1 2.2 1.6h-1.1c.9 2.6 2.2 6.2 3.7 9.4 1.4.5 2.2 1.3 2.2 2.3 0 1.7-4.5 3.3-10 3.3s-10-1.6-10-3.3c0-1 .8-1.8 2.2-2.3 1.5-3.2 2.8-6.8 3.7-9.4H6.8A4.6 4.6 0 0 1 9 11.2a5 5 0 0 1 3-9z",
  "M5.5 3.5h3v2.4h2.3V3.5h2.4v2.4h2.3V3.5h3v6l-1.8 1.6.9 10.8c1.6.5 2.6 1.3 2.6 2.3 0 1.7-4.5 3.3-10.2 3.3S1.8 25.9 1.8 24.2c0-1 1-1.8 2.6-2.3l.9-10.8L5.5 9.5z",
  "M12 1.8 19 9.6 12 17.4 5 9.6zM9.4 17.2h5.2l1.6 4.7c1.8.5 2.9 1.3 2.9 2.3 0 1.7-3.2 3.3-7.1 3.3s-7.1-1.6-7.1-3.3c0-1 1.1-1.8 2.9-2.3z",
  "M12 2.4c3.6 0 6.4 2.7 6.4 6 0 2.1-1.1 3.9-2.8 5l2.6 8.4c1.5.5 2.4 1.3 2.4 2.3 0 1.7-4 3.3-8.6 3.3s-8.6-1.6-8.6-3.3c0-1 .9-1.8 2.4-2.3l2.6-8.4a5.9 5.9 0 0 1-2.8-5c0-3.3 2.8-6 6.4-6zm0 3.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z"
] as const;

export function PawnShape({ index, size = 28, active = false }: { index: number; size?: number; active?: boolean }) {
  const id = useId().replace(/:/g, "");
  const color = playerColors[index % playerColors.length] ?? "#f0a832";
  const path = outlines[index % outlines.length] ?? outlines[0];
  return (
    <svg viewBox="0 0 24 30" width={size} height={size * 1.25} aria-hidden style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`pawn-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="18%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <ellipse cx={12} cy={28.4} rx={9.5} ry={2} fill="#000" opacity={0.45} />
      {active && <ellipse cx={12} cy={27.6} rx={11.5} ry={2.8} fill="none" stroke={color} strokeWidth={1.2} opacity={0.9} />}
      <path d={path} fill={`url(#pawn-${id})`} stroke="#070e1f" strokeWidth={1.3} strokeLinejoin="round" fillRule="evenodd" />
      <path d={path} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.6} transform="translate(-0.4 -0.4)" fillRule="evenodd" />
    </svg>
  );
}
