"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { ChevronsUp } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BoardSpace, GameState } from "../../engine";
import { ArtIcon } from "../art";
import { pawnDef, type Trail } from "../art/pawns";
import { PawnShape, usePawns } from "../components/Pawn";
import { useI18n } from "../i18n";
import { SpaceIcon, iconStroke } from "../icons";
import { accentFor, cityName, playerColors, withAlpha } from "../theme";
import type { Stage } from "../useGame";
import { boardSize, centerRect, pawnPoint, tileRect, type Orientation, type Side, type TileRect } from "./geometry";
import { useElementSize } from "./useElementSize";

interface Props {
  view: GameState;
  stage: Stage;
  onOpenSpace: (index: number) => void;
  center: (layout: { orientation: Orientation; unit: number; width: number; height: number }) => ReactNode;
}

const sideRotation: Record<Side, number> = { left: 0, top: 90, right: 180, bottom: 270 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function House({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden>
      <path d="M1.5 6.2 6 2l4.5 4.2V10.5h-9z" fill={color} stroke="#070e1f" strokeWidth={1} strokeLinejoin="round" />
      <rect x={4.8} y={7} width={2.4} height={3.5} fill="#070e1f" opacity={0.55} />
    </svg>
  );
}

function bandStyle(side: Side, thickness: number): CSSProperties {
  if (side === "left") return { right: 0, top: 0, bottom: 0, width: thickness };
  if (side === "right") return { left: 0, top: 0, bottom: 0, width: thickness };
  if (side === "top") return { left: 0, right: 0, bottom: 0, height: thickness };
  return { left: 0, right: 0, top: 0, height: thickness };
}

function contentInset(side: Side, thickness: number): CSSProperties {
  if (side === "left") return { right: thickness };
  if (side === "right") return { left: thickness };
  if (side === "top") return { bottom: thickness };
  return { top: thickness };
}

interface TileProps {
  index: number;
  space: BoardSpace;
  rect: TileRect;
  unit: number;
  ux: number;
  uy: number;
  owner: number;
  level: number;
  onOpen: (index: number) => void;
}

function Tile({ index, space, rect, unit, ux, uy, owner, level, onOpen }: TileProps) {
  const { d, money } = useI18n();
  const accent = accentFor(space);
  const width = rect.w * ux;
  const height = rect.h * uy;
  const isAsset = space.type === "asset";
  const band = isAsset ? Math.max(4, unit * 0.15) : 0;
  const large = unit >= 48;
  const iconSize = clamp(unit * (rect.corner ? 0.6 : 0.36), 13, rect.corner ? 52 : 30);
  const nameSize = clamp(unit * (rect.corner ? 0.16 : 0.155), 8, 14);
  const priceSize = clamp(unit * 0.17, 8.5, 14);
  const ownerColor = owner >= 0 ? playerColors[owner] : undefined;
  const name = isAsset && space.assetId ? cityName(space.assetId) : d(space.titleKey);
  const isStart = space.type === "start";
  const danger = space.type === "audit";
  const price = space.price ?? space.amount;

  return (
    <button
      type="button"
      data-space={index}
      onClick={() => onOpen(index)}
      aria-label={`${isAsset ? d(space.titleKey) : name}${price ? ` · ${money(price)}` : ""}`}
      className="absolute overflow-hidden text-left outline-none transition-[background-color,border-color,box-shadow] duration-500 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-gold"
      style={{
        left: rect.x * ux,
        top: rect.y * uy,
        width,
        height,
        borderRadius: rect.corner ? Math.max(8, unit * 0.22) : Math.max(4, unit * 0.1),
        background: isStart
          ? "linear-gradient(145deg, #33260d 0%, #17120a 100%)"
          : ownerColor
            ? `linear-gradient(160deg, ${withAlpha(ownerColor, 0.26)} 0%, ${withAlpha(ownerColor, 0.1)} 100%), #0f1a30`
            : danger
              ? "linear-gradient(160deg, #2a1517 0%, #120d16 100%)"
              : rect.corner
                ? "linear-gradient(150deg, #172540 0%, #0d172b 75%)"
                : "linear-gradient(160deg, #121e36 0%, #0c1629 100%)",
        border: `1px solid ${ownerColor ? withAlpha(ownerColor, 0.8) : isStart ? withAlpha("#f0a832", 0.65) : danger ? withAlpha("#e2706b", 0.5) : rect.corner ? withAlpha("#f0a832", 0.28) : "#1c2b4a"}`,
        boxShadow: ownerColor ? `inset 0 0 0 1px ${withAlpha(ownerColor, 0.22)}` : "inset 0 1px 0 rgba(255,255,255,0.035)"
      }}
    >
      {isAsset && (
        <span className="absolute flex items-center justify-center gap-[2px]" style={{ ...bandStyle(rect.side, band), background: accent, opacity: 0.92 }}>
          <AnimatePresence>
            {ownerColor &&
              Array.from({ length: level }, (_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: 4 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 14, delay: i * 0.06 }}
                  className="flex"
                >
                  <House size={Math.max(6, band * 0.95)} color={ownerColor} />
                </motion.span>
              ))}
          </AnimatePresence>
        </span>
      )}
      <span
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ ...contentInset(rect.side, band), gap: Math.max(1, unit * 0.05), padding: Math.max(1, unit * 0.06) }}
      >
        <SpaceIcon space={space} size={iconSize} color={isStart ? "#f7c060" : isAsset ? accent : danger ? "#ef8f87" : "#e6c98f"} badge={rect.corner} />
        {(large || rect.corner) && (
          <span
            className="line-clamp-2 font-medium leading-[1.05] text-text"
            style={{ fontSize: nameSize, maxWidth: "100%", overflowWrap: "break-word", hyphens: "auto", marginTop: rect.corner ? unit * 0.06 : 0 }}
          >
            {name}
          </span>
        )}
        {price !== undefined && !rect.corner && (
          <span className="font-mono font-semibold leading-none" style={{ fontSize: priceSize, color: space.type === "tax" ? "#ef8f87" : "#f7c060" }}>
            {space.type === "tax" ? `−${price}` : price}
          </span>
        )}
        {isStart && (
          <ChevronsUp aria-hidden strokeWidth={iconStroke} size={clamp(unit * 0.3, 10, 22)} color="#f0a832" style={{ transform: `rotate(${sideRotation[rect.side]}deg)` }} />
        )}
      </span>
    </button>
  );
}

interface Puff {
  id: number;
  x: number;
  y: number;
  trail: Trail;
  color: string;
}

function TrailPuff({ puff, size, onDone }: { puff: Puff; size: number; onDone: (id: number) => void }) {
  const base: CSSProperties = { left: puff.x, top: puff.y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 };
  const variants: Record<Trail, { style: CSSProperties; animate: { opacity: number[]; scale: number[]; y?: number[]; x?: number[] } }> = {
    smoke: { style: { background: "radial-gradient(circle, rgba(220,226,238,0.7) 0%, rgba(220,226,238,0) 70%)" }, animate: { opacity: [0.8, 0], scale: [0.5, 2.2], y: [0, -size * 1.3] } },
    wake: { style: { border: `1.5px solid ${withAlpha("#9fc2e0", 0.8)}`, borderRadius: "50%" }, animate: { opacity: [0.9, 0], scale: [0.3, 2.4] } },
    flight: { style: { background: `linear-gradient(90deg, ${withAlpha(puff.color, 0)} 0%, ${withAlpha(puff.color, 0.6)} 100%)`, height: 2, borderRadius: 2 }, animate: { opacity: [0.8, 0], scale: [1, 2.2], y: [0, -size * 0.4] } },
    flame: { style: { background: "radial-gradient(circle, rgba(255,214,140,0.95) 0%, rgba(240,120,50,0.55) 45%, rgba(240,120,50,0) 72%)" }, animate: { opacity: [1, 0], scale: [0.9, 0.2], y: [0, size * 0.6] } },
    dust: { style: { background: "radial-gradient(circle, rgba(196,170,128,0.65) 0%, rgba(196,170,128,0) 70%)" }, animate: { opacity: [0.7, 0], scale: [0.4, 1.8], x: [0, size * 0.3] } },
    spark: { style: { background: "radial-gradient(circle, rgba(255,226,160,1) 0%, rgba(255,180,80,0) 60%)" }, animate: { opacity: [1, 0], scale: [0.4, 1.4] } },
    soft: { style: { background: `radial-gradient(circle, ${withAlpha(puff.color, 0.35)} 0%, ${withAlpha(puff.color, 0)} 70%)` }, animate: { opacity: [0.6, 0], scale: [0.6, 1.3] } },
    glint: { style: { background: "radial-gradient(circle, rgba(247,192,96,0.9) 0%, rgba(247,192,96,0) 60%)" }, animate: { opacity: [0.9, 0], scale: [0.3, 1.2], y: [0, -size * 0.3] } }
  };
  const variant = variants[puff.trail];
  return (
    <motion.span
      className="pointer-events-none absolute block rounded-full"
      style={{ ...base, ...variant.style }}
      initial={{ opacity: 0 }}
      animate={variant.animate}
      transition={{ duration: 0.75, ease: "easeOut" }}
      onAnimationComplete={() => onDone(puff.id)}
    />
  );
}

export function Board({ view, stage, onOpenSpace, center }: Props) {
  const { t } = useI18n();
  const reduced = Boolean(useReducedMotion());
  const chosen = usePawns();
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const shake = useAnimationControls();
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const lastHop = useRef<{ player: number; position: number } | null>(null);
  const puffId = useRef(1);
  const orientation: Orientation = width >= height * 1.02 ? "landscape" : "portrait";
  const size = boardSize(orientation);
  const fitX = width / size.width;
  const fitY = height / size.height;
  const ux = width > 0 && height > 0 ? Math.floor(Math.min(fitX, fitY * 1.25) * 10) / 10 : 0;
  const uy = width > 0 && height > 0 ? Math.floor(Math.min(fitY, fitX * 1.25) * 10) / 10 : 0;
  const unit = Math.min(ux, uy);
  const boardWidth = ux * size.width;
  const boardHeight = uy * size.height;
  const inner = centerRect(orientation);
  const owners = new Map(view.ownedAssets.map(asset => [asset.assetId, { owner: view.players.findIndex(player => player.id === asset.ownerId), level: asset.level }]));
  const pawnSize = clamp(unit * 0.46, 16, 40);
  const pulseRect = stage.pulse ? tileRect(stage.pulse.space, orientation) : null;
  const moving = stage.hop !== null || stage.dice?.rolling === true;

  useEffect(() => {
    if (!stage.shake || reduced) return;
    void shake.start({ x: [0, -3, 3, -2, 1, 0], y: [0, 1, -1, 1, 0, 0], transition: { duration: 0.34, ease: "easeOut" } });
  }, [stage.shake, reduced, shake]);

  useEffect(() => {
    const hop = stage.hop;
    const previous = lastHop.current;
    lastHop.current = hop ? { player: hop.player, position: hop.position } : null;
    if (!hop || reduced || unit <= 0) return;
    const from = previous && previous.player === hop.player ? previous.position : view.players[hop.player]?.position;
    if (from === undefined || from === hop.position) return;
    const point = pawnPoint(from, hop.player, orientation, ux, uy);
    const def = pawnDef(chosen[hop.player], hop.player);
    const puff: Puff = { id: puffId.current++, x: point.x, y: point.y - pawnSize * 0.15, trail: def.trail, color: playerColors[hop.player] ?? "#f0a832" };
    setPuffs(list => [...list.slice(-10), puff]);
  }, [stage.hop, reduced, unit, orientation, ux, uy, chosen, pawnSize, view.players]);

  const removePuff = (id: number) => setPuffs(list => list.filter(puff => puff.id !== id));

  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center">
      {unit > 0 && (
        <motion.div
          className="relative"
          role="group"
          aria-label={t("game.board")}
          animate={shake}
          style={{
            width: boardWidth,
            height: boardHeight,
            borderRadius: Math.max(12, unit * 0.3),
            background: "radial-gradient(120% 90% at 50% 40%, #121f39 0%, #0a1326 60%, #070e1f 100%)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px #1c2b4a, inset 0 0 0 1px rgba(240,168,50,0.08)"
          }}
        >
          {view.spaces.map((space, index) => {
            const info = space.assetId ? owners.get(space.assetId) : undefined;
            return (
              <Tile
                key={index}
                index={index}
                space={space}
                rect={tileRect(index, orientation)}
                unit={unit}
                ux={ux}
                uy={uy}
                owner={info?.owner ?? -1}
                level={info?.level ?? 0}
                onOpen={onOpenSpace}
              />
            );
          })}

          <div
            className="absolute overflow-hidden"
            style={{
              left: inner.x * ux + unit * 0.12,
              top: inner.y * uy + unit * 0.12,
              width: inner.w * ux - unit * 0.24,
              height: inner.h * uy - unit * 0.24,
              borderRadius: Math.max(10, unit * 0.25),
              background: "radial-gradient(80% 70% at 50% 35%, rgba(240,168,50,0.06) 0%, rgba(7,14,31,0) 70%)",
              border: "1px solid rgba(240,168,50,0.12)"
            }}
          >
            {center({ orientation, unit, width: inner.w * ux - unit * 0.24, height: inner.h * uy - unit * 0.24 })}
          </div>

          <AnimatePresence>
            {stage.pulse && pulseRect && (
              <motion.span
                key={stage.pulse.key}
                className="pointer-events-none absolute"
                style={{
                  left: pulseRect.x * ux,
                  top: pulseRect.y * uy,
                  width: pulseRect.w * ux,
                  height: pulseRect.h * uy,
                  borderRadius: Math.max(5, unit * 0.12),
                  border: "2px solid #f7c060",
                  boxShadow: "0 0 24px rgba(240,168,50,0.55)"
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={reduced ? { opacity: [0, 1, 0.6] } : { opacity: [0, 1, 0.35, 1, 0.5], scale: [0.9, 1.06, 1, 1.04, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
              />
            )}
          </AnimatePresence>

          {puffs.map(puff => (
            <TrailPuff key={puff.id} puff={puff} size={pawnSize * 0.7} onDone={removePuff} />
          ))}

          {view.players.map((player, playerIndex) => {
            const hopping = stage.hop?.player === playerIndex;
            const position = hopping && stage.hop ? stage.hop.position : player.position;
            const jump = hopping && stage.hop?.jump === true;
            const point = pawnPoint(position, playerIndex, orientation, ux, uy);
            const active = playerIndex === view.currentPlayerIndex;
            const idleBounce = active && !moving && !reduced;
            const held = (player.auditTurns ?? 0) > 0;
            return (
              <motion.div
                key={player.id}
                className="pointer-events-none absolute left-0 top-0"
                style={{ width: pawnSize, height: pawnSize * 1.25, zIndex: active ? 7 : 5 }}
                initial={false}
                animate={{ x: point.x - pawnSize / 2, y: point.y - pawnSize * 1.1 }}
                transition={{ duration: reduced ? 0.1 : jump ? 0.85 : 0.22, ease: jump ? [0.5, 0, 0.2, 1] : "easeInOut" }}
              >
                {active && (
                  <motion.span
                    className="absolute left-1/2 block rounded-full"
                    style={{
                      width: pawnSize * 1.5,
                      height: pawnSize * 0.62,
                      bottom: -pawnSize * 0.16,
                      marginLeft: -pawnSize * 0.75,
                      background: "radial-gradient(closest-side, rgba(247,192,96,0.55), rgba(247,192,96,0))"
                    }}
                    animate={reduced ? { opacity: 0.8 } : { opacity: [0.45, 1, 0.45], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                )}
                <motion.div
                  key={jump ? `jump-${position}` : position}
                  initial={{ y: 0 }}
                  animate={
                    reduced
                      ? { y: 0 }
                      : jump
                        ? { y: [0, -pawnSize * 2.2, 0], rotate: [0, -12, 0], scale: [1, 1.15, 1] }
                        : idleBounce
                          ? { y: [0, -pawnSize * 0.18, 0] }
                          : { y: [0, -pawnSize * 0.55, 0], scaleY: [1, 1.04, 0.92, 1] }
                  }
                  transition={jump ? { duration: 0.85, ease: "easeOut" } : idleBounce ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.22, ease: "easeOut" }}
                  style={{ transformOrigin: "50% 100%" }}
                >
                  <PawnShape index={playerIndex} size={pawnSize} active={active} />
                </motion.div>
                {held && (
                  <span className="absolute -right-1 -top-1 flex items-center justify-center rounded-full border border-[#e2706b]/70 bg-bg" style={{ width: pawnSize * 0.5, height: pawnSize * 0.5 }} aria-hidden>
                    <ArtIcon name="game-icons:gavel" size={pawnSize * 0.32} color="#ef8f87" />
                  </span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
