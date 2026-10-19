import type { CSSProperties } from "react";

interface Props {
  size: number;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "h1" | "div";
}

/** Single insertion point for the FINE wordmark: a future logo replaces this text without touching the screens. */
export function Logo({ size, className, style, as = "span" }: Props) {
  const Tag = as;
  return (
    <Tag className={`font-serif font-black italic leading-none text-gold ${className ?? ""}`} style={{ fontSize: size, ...style }}>
      FINE
    </Tag>
  );
}
