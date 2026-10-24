import type { CSSProperties } from "react";

type Variant = "seal" | "horizontal";
type Tone = "dark" | "light";

interface Props {
  /** Height in pixels. */
  size: number;
  variant?: Variant;
  tone?: Tone;
  /** Hidden from screen readers when a heading already names the game. */
  decorative?: boolean;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

const files: Record<Variant, Record<Tone, string>> = {
  seal: { dark: "/logos/fine-sceau-rond.svg", light: "/logos/fine-sceau-rond-clair.svg" },
  horizontal: { dark: "/logos/fine-5-sceau-horizontal.svg", light: "/logos/fine-5-sceau-horizontal-clair.svg" }
};

const ratios: Record<Variant, number> = { seal: 1, horizontal: 1000 / 220 };

/** FINE Game's mark, "Le Sceau": the round seal alone, or the seal next to its signature. */
export function Logo({ size, variant = "seal", tone = "dark", decorative = false, priority = false, className, style }: Props) {
  return (
    <img
      src={files[variant][tone]}
      width={Math.round(size * ratios[variant])}
      height={size}
      alt={decorative ? "" : "FINE Game"}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={`inline-block shrink-0 select-none ${className ?? ""}`}
      style={{ height: size, width: "auto", ...style }}
    />
  );
}
