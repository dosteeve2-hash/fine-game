"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CircleDollarSign, Dices, HandCoins, Landmark, ShieldCheck, Store, Wallet, type LucideIcon } from "lucide-react";
import { buyPrice, legalActions, sellValue, upgradeCost } from "../../engine";
import type { Action, GameState } from "../../engine";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { MessageKey } from "../messages/fr";
import { Sheet } from "./Sheet";

export interface Choice {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  action: Action;
}

export interface ActionModel {
  primary: Choice | null;
  secondary: Choice[];
  finances: { title: MessageKey; items: Choice[] }[];
  financeCount: number;
}

export function useActionModel(state: GameState): ActionModel {
  const { t, d, money } = useI18n();
  const player = state.players[state.currentPlayerIndex];
  if (!player || state.phase === "finished") return { primary: null, secondary: [], finances: [], financeCount: 0 };
  const actions = legalActions(state);
  const assetName = (assetId: string) => {
    const space = state.spaces.find(item => item.assetId === assetId);
    return space ? d(space.titleKey) : assetId;
  };
  const roll = actions.find(action => action.type === "roll");
  const buy = actions.find(action => action.type === "buyAsset");
  const join = actions.find(action => action.type === "joinCircle");
  const end = actions.find(action => action.type === "endTurn");

  const upgrades: Choice[] = [];
  const sells: Choice[] = [];
  const loans: Choice[] = [];
  const repays: Choice[] = [];
  const insurances: Choice[] = [];
  for (const action of actions) {
    if (action.type === "upgradeAsset") {
      const owned = player.assets.find(item => item.assetId === action.assetId);
      if (owned) upgrades.push({ key: `up-${action.assetId}`, label: assetName(action.assetId), hint: t("game.upgradeHint", { level: owned.level + 1, cost: money(upgradeCost(state, owned)) }), icon: ArrowUpRight, action });
    } else if (action.type === "sellAsset") {
      const owned = player.assets.find(item => item.assetId === action.assetId);
      if (owned) sells.push({ key: `sell-${action.assetId}`, label: assetName(action.assetId), hint: t("game.sellHint", { value: money(sellValue(state, owned)) }), icon: CircleDollarSign, action });
    } else if (action.type === "takeLoan" && loans.length < 4) {
      const rate = state.config.loanInterest + (player.reputation < 0 ? state.config.lowReputationSurcharge : 0);
      loans.push({ key: `loan-${action.amount}`, label: money(action.amount), hint: t("game.loanHint", { rate: Math.round(rate * 100) }), icon: Landmark, action });
    } else if (action.type === "repayLoan") {
      repays.push({ key: `repay-${action.amount}`, label: money(action.amount), icon: Wallet, action });
    } else if (action.type === "buyInsurance") {
      insurances.push({ key: `ins-${action.insuranceType}`, label: t(`insurance.${action.insuranceType}` as MessageKey), hint: t("game.insureHint", { amount: money(state.config.insurancePremium) }), icon: ShieldCheck, action });
    }
  }

  let primary: Choice | null = null;
  const secondary: Choice[] = [];
  if (roll) primary = { key: "roll", label: t("game.roll"), icon: Dices, action: roll };
  else if (buy) primary = { key: "buy", label: t("game.buy", { price: money(buyPrice(state)) }), icon: Store, action: buy };
  if (!roll && join) secondary.push({ key: "circle", label: t("game.joinCircle"), icon: HandCoins, action: join });
  if (end) {
    const endChoice: Choice = { key: "end", label: t("game.endTurn"), icon: ArrowUpRight, action: end };
    if (primary) secondary.push(endChoice);
    else primary = endChoice;
  }

  const finances = [
    { title: "game.section.upgrade" as MessageKey, items: upgrades },
    { title: "game.section.loan" as MessageKey, items: loans },
    { title: "game.section.repay" as MessageKey, items: repays },
    { title: "game.section.insure" as MessageKey, items: insurances },
    { title: "game.section.sell" as MessageKey, items: sells }
  ].filter(section => section.items.length > 0);

  return { primary, secondary, finances, financeCount: finances.reduce((sum, section) => sum + section.items.length, 0) };
}

interface BarProps {
  model: ActionModel;
  disabled: boolean;
  status: string | null;
  onAct: (action: Action) => void;
  onFinances: () => void;
}

export function ActionBar({ model, disabled, status, onAct, onFinances }: BarProps) {
  const { t } = useI18n();
  const { primary, secondary, financeCount } = model;
  const PrimaryIcon = primary?.icon ?? Dices;
  const showFinances = !status && primary?.key !== "roll";

  return (
    <div className="flex items-stretch gap-2" aria-label={t("game.actions")}>
      {showFinances && (
        <button
          type="button"
          onClick={onFinances}
          disabled={disabled}
          className="relative flex min-h-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-line2 bg-bg3 px-3 text-text2 transition-colors hover:border-gold hover:text-gold2 disabled:opacity-40"
        >
          <Landmark size={18} strokeWidth={iconStroke} aria-hidden />
          <span className="mt-0.5 text-[11px] font-medium">{t("game.finances")}</span>
          {financeCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1 font-mono text-[10px] font-semibold text-bg">{financeCount}</span>}
        </button>
      )}
      {!status &&
        secondary.map(choice => (
          <motion.button
            key={choice.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onAct(choice.action)}
            className="min-h-14 shrink-0 rounded-2xl border border-line2 bg-bg3 px-3 text-[13px] font-medium leading-tight text-text transition-colors hover:border-gold disabled:opacity-40 lg:flex-1 lg:text-sm"
          >
            {choice.label}
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
            <PrimaryIcon size={20} strokeWidth={2} aria-hidden />
            <span className="truncate">{primary.label}</span>
          </motion.button>
        )
      )}
    </div>
  );
}

interface SheetProps {
  open: boolean;
  model: ActionModel;
  disabled: boolean;
  onAct: (action: Action) => void;
  onClose: () => void;
}

export function FinanceSheet({ open, model, disabled, onAct, onClose }: SheetProps) {
  const { t } = useI18n();
  return (
    <Sheet open={open} title={t("game.finances.title")} onClose={onClose}>
      {model.finances.length === 0 ? (
        <p className="pb-4 text-sm text-text2">{t("game.finances.empty")}</p>
      ) : (
        <div className="space-y-4 pb-3">
          {model.finances.map(section => (
            <section key={section.title}>
              <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">{t(section.title)}</h3>
              <ul className="space-y-1.5">
                {section.items.map(choice => {
                  const Icon = choice.icon;
                  return (
                    <li key={choice.key}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onAct(choice.action);
                          onClose();
                        }}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-line2 bg-bg3 px-3 text-left transition-colors hover:border-gold disabled:opacity-40"
                      >
                        <Icon size={18} strokeWidth={iconStroke} className="shrink-0 text-gold2" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{choice.label}</span>
                        {choice.hint && <span className="shrink-0 font-mono text-[11px] text-text2">{choice.hint}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}
