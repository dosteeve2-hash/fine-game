"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronsUp } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { BoardSpace, GameState } from "../../engine";
import { PawnShape } from "../components/Pawn";
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
  owner: number;
  level: number;
  onOpen: (index: number) => void;
}

function Tile({ index, space, rect, unit, owner, level, onOpen }: TileProps) {
  const { d, money } = useI18n();
  const accent = accentFor(space);
  const width = rect.w * unit;
  const height = rect.h * unit;
  const isAsset = space.type === "asset";
  const band = isAsset ? Math.max(5, unit * 0.2) : 0;
  const large = unit >= 48;
  const iconSize = clamp(unit * (rect.corner ? 0.62 : 0.36), 13, rect.corner ? 52 : 30);
  const nameSize = clamp(unit * (rect.corner ? 0.17 : 0.155), 8, 14);
  const priceSize = clamp(unit * 0.17, 8.5, 14);
  const ownerColor = owner >= 0 ? playerColors[owner] : undefined;
  const name = isAsset && space.assetId ? cityName(space.assetId) : d(space.titleKey);
  const isStart = space.type === "start";
  const price = space.price ?? space.amount;

  return (
    <button
      type="button"
      data-space={index}
      onClick={() => onOpen(index)}
      aria-label={`${isAsset ? d(space.titleKey) : name}${price ? ` · ${money(price)}` : ""}`}
      className="absolute overflow-hidden text-left outline-none transition-[background-color,border-color,box-shadow] duration-500 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-gold"
      style={{
        left: rect.x * unit,
        top: rect.y * unit,
        width,
        height,
        borderRadius: rect.corner ? Math.max(8, unit * 0.22) : Math.max(4, unit * 0.1),
        background: isStart
          ? "linear-gradient(145deg, #3a2a0c 0%, #1a1405 100%)"
          : ownerColor
            ? `linear-gradient(160deg, ${withAlpha(ownerColor, 0.3)} 0%, ${withAlpha(ownerColor, 0.12)} 100%), #0f1a30`
            : rect.corner
              ? `linear-gradient(150deg, ${withAlpha(accent, 0.2)} 0%, #0f1a30 70%)`
              : "linear-gradient(160deg, #13203a 0%, #0d172b 100%)",
        border: `1px solid ${ownerColor ? withAlpha(ownerColor, 0.85) : isStart ? withAlpha("#f0a832", 0.7) : "#1f3054"}`,
        boxShadow: ownerColor ? `inset 0 0 0 1px ${withAlpha(ownerColor, 0.25)}` : "inset 0 1px 0 rgba(255,255,255,0.04)"
      }}
    >
      {isAsset && (
        <span className="absolute flex items-center justify-center gap-[2px]" style={{ ...bandStyle(rect.side, band), background: accent }}>
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
                  <House size={Math.max(6, band * 0.85)} color={ownerColor} />
                </motion.span>
              ))}
          </AnimatePresence>
        </span>
      )}
      <span
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ ...contentInset(rect.side, band), gap: Math.max(1, unit * 0.05), padding: Math.max(1, unit * 0.06) }}
      >
        <SpaceIcon space={space} size={iconSize} color={isStart ? "#f7c060" : accent} />
        {(large || rect.corner) && (
          <span
            className="line-clamp-2 font-medium leading-[1.05] text-text"
            style={{ fontSize: nameSize, maxWidth: "100%", overflowWrap: "anywhere" }}
          >
            {name}
          </span>
        )}
        {price !== undefined && !rect.corner && (
          <span className="font-mono font-semibold leading-none" style={{ fontSize: priceSize, color: space.type === "tax" ? "#f87171" : "#f7c060" }}>
            {space.type === "tax" ? `−${price}` : price}
          </span>
        )}
        {isStart && (
          <ChevronsUp
            aria-hidden
            strokeWidth={iconStroke}
            size={clamp(unit * 0.3, 10, 22)}
            color="#f0a832"
            style={{ transform: `rotate(${sideRotation[rect.side]}deg)` }}
          />
        )}
      </span>
    </button>
  );
}

export function Board({ view, stage, onOpenSpace, center }: Props) {
  const { t } = useI18n();
  const reduced = Boolean(useReducedMotion());
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const orientation: Orientation = width >= height * 1.02 ? "landscape" : "portrait";
  const size = boardSize(orientation);
  const unit = width > 0 && height > 0 ? Math.floor(Math.min(width / size.width, height / size.height) * 10) / 10 : 0;
  const boardWidth = unit * size.width;
  const boardHeight = unit * size.height;
  const inner = centerRect(orientation);
  const owners = new Map(view.ownedAssets.map(asset => [asset.assetId, { owner: view.players.findIndex(player => player.id === asset.ownerId), level: asset.level }]));
  const pawnSize = clamp(unit * 0.42, 15, 36);
  const pulseRect = stage.pulse ? tileRect(stage.pulse.space, orientation) : null;

  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center">
      {unit > 0 && (
        <div
          className="relative"
          role="group"
          aria-label={t("game.board")}
          style={{
            width: boardWidth,
            height: boardHeight,
            borderRadius: Math.max(12, unit * 0.3),
            background: "radial-gradient(120% 90% at 50% 40%, #13213d 0%, #0a1326 60%, #070e1f 100%)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px #1f3054, inset 0 0 0 1px rgba(240,168,50,0.08)"
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
                owner={info?.owner ?? -1}
                level={info?.level ?? 0}
                onOpen={onOpenSpace}
              />
            );
          })}

          <div
            className="absolute overflow-hidden"
            style={{
              left: inner.x * unit + unit * 0.12,
              top: inner.y * unit + unit * 0.12,
              width: inner.w * unit - unit * 0.24,
              height: inner.h * unit - unit * 0.24,
              borderRadius: Math.max(10, unit * 0.25),
              background: "radial-gradient(80% 70% at 50% 35%, rgba(240,168,50,0.07) 0%, rgba(7,14,31,0) 70%)",
              border: "1px solid rgba(240,168,50,0.12)"
            }}
          >
            {center({ orientation, unit, width: inner.w * unit - unit * 0.24, height: inner.h * unit - unit * 0.24 })}
          </div>

          <AnimatePresence>
            {stage.pulse && pulseRect && (
              <motion.span
                key={stage.pulse.key}
                className="pointer-events-none absolute"
                style={{
                  left: pulseRect.x * unit,
                  top: pulseRect.y * unit,
                  width: pulseRect.w * unit,
                  height: pulseRect.h * unit,
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

          {view.players.map((player, playerIndex) => {
            const position = stage.hop?.player === playerIndex ? stage.hop.position : player.position;
            const point = pawnPoint(position, playerIndex, orientation, unit);
            const active = playerIndex === view.currentPlayerIndex;
            return (
              <motion.div
                key={player.id}
                className="pointer-events-none absolute left-0 top-0"
                style={{ width: pawnSize, height: pawnSize * 1.25, zIndex: active ? 6 : 5 }}
                initial={false}
                animate={{ x: point.x - pawnSize / 2, y: point.y - pawnSize * 1.1 }}
                transition={{ duration: reduced ? 0.1 : 0.22, ease: "easeInOut" }}
              >
                <motion.div
                  key={position}
                  initial={{ y: 0 }}
                  animate={reduced ? { y: 0 } : { y: [0, -pawnSize * 0.55, 0], scaleY: [1, 1.04, 0.92, 1] }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ transformOrigin: "50% 100%" }}
                >
                  <PawnShape index={playerIndex} size={pawnSize} active={active} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
