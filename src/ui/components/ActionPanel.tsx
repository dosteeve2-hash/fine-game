"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { buyPrice, legalActions, sellValue, upgradeCost } from "../../engine";
import type { Action, GameState, InsuranceType } from "../../engine";
import { useI18n } from "../i18n";
import type { MessageKey } from "../messages/fr";

interface Props {
  state: GameState;
  disabled: boolean;
  onAct: (action: Action) => void;
}

interface Choice {
  key: string;
  label: string;
  tone: "primary" | "normal" | "danger";
  action: Action;
}

export function ActionPanel({ state, disabled, onAct }: Props) {
  const { t, d, money } = useI18n();
  const [open, setOpen] = useState(false);
  const player = state.players[state.currentPlayerIndex];
  if (!player) return null;
  const actions = legalActions(state);

  const assetName = (assetId: string) => {
    const space = state.spaces.find(item => item.assetId === assetId);
    return space ? d(space.titleKey) : assetId;
  };

  const choices: Choice[] = [];
  for (const action of actions) {
    if (action.type === "roll") choices.push({ key: "roll", label: t("game.roll"), tone: "primary", action });
    else if (action.type === "buyAsset") choices.push({ key: "buy", label: t("game.buy", { price: money(buyPrice(state)) }), tone: "primary", action });
    else if (action.type === "upgradeAsset") {
      const owned = player.assets.find(item => item.assetId === action.assetId);
      if (owned) choices.push({ key: `up-${action.assetId}`, label: t("game.upgrade", { name: assetName(action.assetId), cost: money(upgradeCost(state, owned)) }), tone: "normal", action });
    } else if (action.type === "sellAsset") {
      const owned = player.assets.find(item => item.assetId === action.assetId);
      if (owned) choices.push({ key: `sell-${action.assetId}`, label: t("game.sell", { name: assetName(action.assetId), value: money(sellValue(state, owned)) }), tone: "danger", action });
    } else if (action.type === "takeLoan") choices.push({ key: `loan-${action.amount}`, label: t("game.loan", { amount: money(action.amount) }), tone: "normal", action });
    else if (action.type === "repayLoan") choices.push({ key: `repay-${action.amount}`, label: t("game.repay", { amount: money(action.amount) }), tone: "normal", action });
    else if (action.type === "buyInsurance") choices.push({ key: `ins-${action.insuranceType}`, label: t("game.insure", { type: t(`insurance.${action.insuranceType satisfies InsuranceType}` as MessageKey) }), tone: "normal", action });
    else if (action.type === "joinCircle") choices.push({ key: "circle", label: t("game.joinCircle"), tone: "primary", action });
    else if (action.type === "endTurn") choices.push({ key: "end", label: t("game.endTurn"), tone: state.phase === "actions" ? "primary" : "normal", action });
  }

  const mainKeys = new Set(["roll", "buy", "circle", "end"]);
  const main = choices.filter(choice => mainKeys.has(choice.key)).sort((a, b) => (a.key === "end" ? 1 : b.key === "end" ? -1 : 0));
  const loans = choices.filter(choice => choice.key.startsWith("loan-")).slice(0, 3);
  const secondary = [...choices.filter(choice => !mainKeys.has(choice.key) && !choice.key.startsWith("loan-")), ...loans];

  if (main.length === 0 && secondary.length === 0) return <p className="text-sm text-text2">{t("game.noActions")}</p>;

  const renderButton = (choice: Choice) => (
    <motion.button
      key={choice.key}
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      onClick={() => onAct(choice.action)}
      className={
        "min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 " +
        (choice.tone === "primary"
          ? "border-gold bg-gold text-bg hover:bg-gold2"
          : choice.tone === "danger"
            ? "border-line2 bg-bg3 text-text2 hover:border-red hover:text-red"
            : "border-line2 bg-bg3 text-text hover:border-gold")
      }
    >
      {choice.label}
    </motion.button>
  );

  return (
    <div className="space-y-2" aria-label={t("game.actions")}>
      <div className="flex flex-wrap gap-2">{main.map(renderButton)}</div>
      {secondary.length > 0 && state.phase === "actions" && (
        <>
          <button
            type="button"
            onClick={() => setOpen(previous => !previous)}
            aria-expanded={open}
            className="min-h-10 w-full rounded-xl border border-dashed border-line2 px-3 text-xs text-text2"
          >
            {t("game.more")} ({secondary.length}) {open ? "▴" : "▾"}
          </button>
          {open && <div className="flex flex-wrap gap-2">{secondary.map(renderButton)}</div>}
        </>
      )}
    </div>
  );
}
