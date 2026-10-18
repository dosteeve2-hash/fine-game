import type { ArtName } from "./icons.generated";

export type Trail = "smoke" | "wake" | "flight" | "flame" | "dust" | "spark" | "soft" | "glint";
export type StepSound = "chuff" | "splash" | "prop" | "flame" | "hoof" | "roll" | "clank" | "pad" | "coin" | "die" | "thud" | "flap";

export interface PawnDef {
  id: string;
  art: ArtName;
  trail: Trail;
  step: StepSound;
}

export const pawns = [
  { id: "top-hat", art: "game-icons:top-hat", trail: "glint", step: "pad" },
  { id: "steam-locomotive", art: "game-icons:steam-locomotive", trail: "smoke", step: "chuff" },
  { id: "sailboat", art: "game-icons:sailboat", trail: "wake", step: "splash" },
  { id: "ship-bow", art: "game-icons:ship-bow", trail: "wake", step: "splash" },
  { id: "cargo-ship", art: "game-icons:cargo-ship", trail: "wake", step: "splash" },
  { id: "old-wagon", art: "game-icons:old-wagon", trail: "dust", step: "roll" },
  { id: "biplane", art: "game-icons:biplane", trail: "flight", step: "prop" },
  { id: "rocket", art: "game-icons:rocket", trail: "flame", step: "flame" },
  { id: "cat", art: "game-icons:cat", trail: "soft", step: "pad" },
  { id: "wolf-head", art: "game-icons:wolf-head", trail: "soft", step: "pad" },
  { id: "elephant", art: "game-icons:elephant", trail: "dust", step: "thud" },
  { id: "rooster", art: "game-icons:rooster", trail: "soft", step: "flap" },
  { id: "horse-head", art: "game-icons:horse-head", trail: "dust", step: "hoof" },
  { id: "camel-head", art: "game-icons:camel-head", trail: "dust", step: "hoof" },
  { id: "wheelbarrow", art: "game-icons:wheelbarrow", trail: "dust", step: "roll" },
  { id: "anvil", art: "game-icons:anvil", trail: "spark", step: "clank" },
  { id: "coins", art: "game-icons:coins", trail: "glint", step: "coin" },
  { id: "dice", art: "game-icons:dice-six-faces-five", trail: "glint", step: "die" },
  { id: "noto-top-hat", art: "noto:top-hat", trail: "glint", step: "pad" },
  { id: "noto-coin", art: "noto:coin", trail: "glint", step: "coin" },
  { id: "noto-die", art: "noto:game-die", trail: "glint", step: "die" },
  { id: "noto-money-bag", art: "noto:money-bag", trail: "glint", step: "coin" }
] as const satisfies readonly PawnDef[];

export type PawnId = (typeof pawns)[number]["id"];

export const defaultPawns: PawnId[] = ["top-hat", "steam-locomotive", "sailboat", "horse-head"];

export function pawnDef(id: string | undefined, fallbackIndex = 0): PawnDef {
  return pawns.find(pawn => pawn.id === id) ?? pawns.find(pawn => pawn.id === defaultPawns[fallbackIndex % defaultPawns.length]) ?? pawns[0];
}

export function isPawnId(value: unknown): value is PawnId {
  return typeof value === "string" && pawns.some(pawn => pawn.id === value);
}
