"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Briefcase, Dices, Eye, Hourglass, Store, type LucideIcon } from "lucide-react";
import { buyPrice, legalActions } from "../../engine";
import type { Action, GameState } from "../../engine";
import { ArtIcon } from "../art";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";

export interface Choice {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon | "gavel" | "handshake";
  action: Action;
}

export interface ActionModel {
  primary: Choice | null;
  secondary: Choice[];
}

export function useActionModel(state: GameState): ActionModel {
  const { t, money } = useI18n();
  const player = state.players[state.currentPlayerIndex];
  if (!player || state.phase === "finished") return { primary: null, secondary: [] };
  const actions = legalActions(state);
  const roll = actions.find(action => action.type === "roll");
  const pay = actions.find(action => action.type === "payAudit");
  const stay = actions.find(action => action.type === "waitAudit");
  const buy = actions.find(action => action.type === "buyAsset");
  const join = actions.find(action => action.type === "joinCircle");
  const end = actions.find(action => action.type === "endTurn");

  let primary: Choice | null = null;
  const secondary: Choice[] = [];
  if (roll) primary = { key: "roll", label: t("game.roll"), icon: Dices, action: roll };
  else if (stay) {
    if (pay) primary = { key: "payAudit", label: t("audit.pay", { amount: money(state.config.auditFee) }), icon: "gavel", action: pay };
    const remaining = player.auditTurns;
    const stayChoice: Choice = { key: "waitAudit", label: t("audit.stay"), hint: t("audit.stayHint", { n: remaining }), icon: Hourglass, action: stay };
    if (primary) secondary.push(stayChoice);
    else primary = stayChoice;
  } else if (buy) primary = { key: "buy", label: t("game.buy", { price: money(buyPrice(state)) }), icon: Store, action: buy };
  if (!roll && join) secondary.push({ key: "circle", label: t("game.joinCircle"), icon: "handshake", action: join });
  if (end) {
    const endChoice: Choice = { key: "end", label: t("game.endTurn"), icon: ArrowUpRight, action: end };
    if (primary) secondary.push(endChoice);
    else primary = endChoice;
  }
  return { primary, secondary };
}

function ChoiceIcon({ icon, size }: { icon: Choice["icon"]; size: number }) {
  if (icon === "gavel") return <ArtIcon name="game-icons:gavel" size={size} />;
  if (icon === "handshake") return <ArtIcon name="fluent-emoji-flat:handshake" size={size} />;
  const Icon = icon;
  return <Icon size={size} strokeWidth={2} aria-hidden />;
}

interface BarProps {
  model: ActionModel;
  disabled: boolean;
  status: string | null;
  spectator: string | null;
  assetCount: number;
  onAct: (action: Action) => void;
  onAssets: () => void;
}

export function ActionBar({ model, disabled, status, spectator, assetCount, onAct, onAssets }: BarProps) {
  const { t } = useI18n();
  const { primary, secondary } = model;

  const assetsButton = (
    <button
      type="button"
      onClick={onAssets}
      data-testid="assets-button"
      aria-label={t("assets.open", { n: assetCount })}
      className="relative flex min-h-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-line2 bg-bg3 px-3 text-text2 transition-colors hover:border-gold hover:text-gold2"
    >
      <Briefcase size={18} strokeWidth={iconStroke} aria-hidden />
      <span className="mt-0.5 text-[11px] font-medium">{t("assets.button")}</span>
      {assetCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-mono text-[10px] font-semibold text-bg">{assetCount}</span>}
    </button>
  );

  if (spectator) {
    return (
      <div className="flex items-stretch gap-2" aria-label={t("game.actions")}>
        {assetsButton}
        <div className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-dashed border-line2 bg-bg2/70 px-4" aria-live="polite">
          <Eye size={18} strokeWidth={iconStroke} className="shrink-0 text-text3" aria-hidden />
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("spectator.label")}</span>
            <span className="block truncate text-sm text-text2">{spectator}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-2" aria-label={t("game.actions")}>
      {assetsButton}
      {!status &&
        secondary.map(choice => (
          <motion.button
            key={choice.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onAct(choice.action)}
            title={choice.hint}
            className="flex min-h-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-line2 bg-bg3 px-3 text-[13px] font-medium leading-tight text-text transition-colors hover:border-gold disabled:opacity-40 lg:flex-1 lg:text-sm"
          >
            <span>{choice.label}</span>
            {choice.hint && <span className="mt-0.5 font-mono text-[10px] font-normal text-text3">{choice.hint}</span>}
          </motion.button>
        ))}
      {status ? (
        <div className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-line2 bg-bg3/70 px-4 text-sm text-text2" aria-live="polite">
          {status}
        </div>
      ) : (
        primary && (
          <motion.button
            key={primary.key}
            type="button"
            data-primary-action
            whileTap={{ scale: 0.97 }}
            initial={{ scale: 0.96, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            disabled={disabled}
            onClick={() => onAct(primary.action)}
            className="relative flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gold px-5 font-semibold text-bg shadow-[0_12px_30px_-12px_rgba(240,168,50,0.85)] transition-colors hover:bg-gold2 disabled:opacity-50"
          >
            <ChoiceIcon icon={primary.icon} size={20} />
            <span className="truncate">{primary.label}</span>
          </motion.button>
        )
      )}
    </div>
  );
}
