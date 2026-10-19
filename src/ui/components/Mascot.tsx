"use client";

import { Fina, type MascotMood } from "./Fina";

export type { MascotMood };

interface Props {
  mood?: MascotMood;
  size?: number;
  label?: string;
  framed?: boolean;
  className?: string;
}

/** Single insertion point for the guide character: swap the drawing here without touching the screens. */
export function Mascot(props: Props) {
  return <Fina {...props} />;
}
