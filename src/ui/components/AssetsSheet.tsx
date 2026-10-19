"use client";

import { ArrowUpRight, CircleDollarSign, Landmark, ShieldCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { legalActions, playerSummary, sellValue, upgradeCost } from "../../engine";
import type { Action, GameState, InsuranceType, OwnedAsset } from "../../engine";
import { familyIcons, iconStroke } from "../icons";
import type { MessageKey } from "../messages/fr";
import { accentFor, cityName, withAlpha } from "../theme";
import type { Features } from "../profile";
import { useText } from "../text";
import { Sheet } from "./Sheet";

const insuranceTypes: InsuranceType[] = ["property", "health", "harvest", "breakdown"];

export interface AssetControl {
  action: Action | null;
  reason: string | null;
}

export function useAssetControls(state: GameState, playerIndex: number, canAct: boolean) {
  const { t, money } = useText();
  const player = state.players[playerIndex];
  const actions = canAct && state.currentPlayerIndex === playerIndex ? legalActions(state) : [];
  const waiting = t("manage.notYourTurn");
  const find = (predicate: (action: Action) => boolean) => actions.find(predicate) ?? null;

  const upgrade = (owned: OwnedAsset): AssetControl & { cost: number } => {
    const cost = upgradeCost(state, owned);
    const action = find(action => action.type === "upgradeAsset" && action.assetId === owned.assetId);
    if (action) return { action, reason: null, cost };
    if (owned.level >= 3) return { action: null, reason: t("manage.maxLevel"), cost };
    if (!canAct || state.currentPlayerIndex !== playerIndex) return { action: null, reason: waiting, cost };
    return { action: null, reason: t("manage.needCash", { amount: money(Math.max(0, cost - (player?.cash ?? 0))) }), cost };
  };

  const sell = (owned: OwnedAsset): AssetControl & { value: number } => {
    const value = sellValue(state, owned);
    const action = find(action => action.type === "sellAsset" && action.assetId === owned.assetId);
    return action ? { action, reason: null, value } : { action: null, reason: waiting, value };
  };

  const loans = actions.filter((action): action is Extract<Action, { type: "takeLoan" }> => action.type === "takeLoan").slice(0, 4);
  const repays = actions.filter((action): action is Extract<Action, { type: "repayLoan" }> => action.type === "repayLoan");
  const insurances = actions.filter((action): action is Extract<Action, { type: "buyInsurance" }> => action.type === "buyInsurance");
  const debt = player ? player.loans.reduce((sum, loan) => sum + loan.principal, 0) : 0;
  const loanReason = !canAct || state.currentPlayerIndex !== playerIndex ? waiting : (player?.assets.length ?? 0) === 0 ? t("manage.noCollateral") : t("manage.limitReached");
  const repayReason = debt === 0 ? t("manage.noLoan") : !canAct || state.currentPlayerIndex !== playerIndex ? waiting : t("manage.needCash", { amount: money(state.config.loanTranche) });
  const insuranceReason = !canAct || state.currentPlayerIndex !== playerIndex ? waiting : state.phase === "roll" ? t("manage.insureLater") : t("manage.needCash", { amount: money(state.config.insurancePremium) });

  return { player, upgrade, sell, loans, repays, insurances, debt, loanReason, repayReason, insuranceReason };
}

function ControlButton({ icon, label, detail, control, onAct }: { icon: ReactNode; label: string; detail: string; control: AssetControl; onAct: (action: Action) => void }) {
  const action = control.action;
  return (
    <button
      type="button"
      disabled={!action}
      onClick={() => {
        if (action) onAct(action);
      }}
      className="flex min-h-12 flex-1 flex-col items-start justify-center rounded-xl border border-line2 bg-bg2 px-3 py-1.5 text-left transition-colors enabled:hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
        {icon}
        {label}
      </span>
      <span className={`font-mono text-[11px] ${action ? "text-gold2" : "text-text3"}`}>{action ? detail : control.reason}</span>
    </button>
  );
}

export function AssetControls({ state, playerIndex, assetId, canAct, onAct }: { state: GameState; playerIndex: number; assetId: string; canAct: boolean; onAct: (action: Action) => void }) {
  const { t, money } = useText();
  const controls = useAssetControls(state, playerIndex, canAct);
  const owned = controls.player?.assets.find(asset => asset.assetId === assetId);
  if (!owned) return null;
  const up = controls.upgrade(owned);
  const sale = controls.sell(owned);
  return (
    <div className="flex gap-2">
      <ControlButton
        icon={<ArrowUpRight size={15} strokeWidth={iconStroke} aria-hidden />}
        label={owned.level >= 3 ? t("manage.upgradeMax") : t("manage.upgradeTo", { level: owned.level + 1 })}
        detail={t("manage.cost", { amount: money(up.cost) })}
        control={up}
        onAct={onAct}
      />
      <ControlButton
        icon={<CircleDollarSign size={15} strokeWidth={iconStroke} aria-hidden />}
        label={t("manage.sell")}
        detail={t("manage.receive", { amount: money(sale.value) })}
        control={sale}
        onAct={onAct}
      />
    </div>
  );
}

interface SheetProps {
  open: boolean;
  state: GameState;
  names: string[];
  playerIndex: number;
  canAct: boolean;
  features: Features;
  onAct: (action: Action) => void;
  onOpenSpace: (index: number) => void;
  onClose: () => void;
}

export function AssetsSheet({ open, state, names, playerIndex, canAct, features, onAct, onOpenSpace, onClose }: SheetProps) {
  const { t, d, money } = useText();
  const controls = useAssetControls(state, playerIndex, canAct);
  const player = controls.player;
  const summary = player ? playerSummary(state, player.id) : null;
  const rate = player ? state.config.loanInterest + (player.reputation < 0 ? state.config.lowReputationSurcharge : 0) : 0;

  return (
    <Sheet open={open} title={t("assets.title", { name: names[playerIndex] ?? "" })} onClose={onClose}>
      {player && summary && (
        <div className="space-y-4 pb-3">
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              { label: t("game.cash"), value: money(player.cash), tone: player.cash < 0 ? "text-red" : "text-gold2" },
              { label: t("assets.incomeTurn"), value: `+${money(summary.income)}`, tone: "text-green" },
              { label: t("game.debt"), value: money(summary.debt), tone: summary.debt > 0 ? "text-red" : "text-text2" }
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-line bg-bg3 px-2.5 py-2">
                <div className="text-[9px] uppercase tracking-[0.16em] text-text3">{item.label}</div>
                <div className={`mt-0.5 truncate text-sm font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
          {!canAct && <p className="rounded-xl border border-dashed border-line2 px-3 py-2 text-xs text-text2">{t("assets.viewOnly")}</p>}

          <section>
            <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">{t("assets.owned", { n: player.assets.length })}</h3>
            {player.assets.length === 0 ? (
              <p className="text-sm text-text2">{t("assets.none")}</p>
            ) : (
              <ul className="space-y-2">
                {player.assets.map(owned => {
                  const index = state.spaces.findIndex(space => space.assetId === owned.assetId);
                  const space = state.spaces[index];
                  if (!space?.family) return null;
                  const Icon = familyIcons[space.family];
                  const accent = accentFor(space);
                  return (
                    <li key={owned.assetId} className="rounded-2xl border border-line2 bg-bg3 p-2.5" style={{ boxShadow: `inset 3px 0 0 ${accent}` }}>
                      <button type="button" onClick={() => onOpenSpace(index)} className="flex w-full items-center gap-2.5 rounded-lg text-left hover:opacity-90">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: withAlpha(accent, 0.16) }}>
                          <Icon size={16} strokeWidth={iconStroke} color={accent} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{cityName(owned.assetId)}</span>
                          <span className="block truncate font-mono text-[10px] text-text3">{d(space.titleKey)} · {t("deed.level", { level: owned.level })}</span>
                        </span>
                        <span className="font-mono text-xs text-green">+{money((space.baseIncome ?? 0) * owned.level)}</span>
                      </button>
                      <div className="mt-2">
                        <AssetControls state={state} playerIndex={playerIndex} assetId={owned.assetId} canAct={canAct} onAct={onAct} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(features.loans || controls.debt > 0) && (
          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">
              <Landmark size={12} strokeWidth={iconStroke} aria-hidden />
              {t("assets.bank")}
            </h3>
            <div className="space-y-2">
              <div>
                <div className="mb-1 text-xs text-text2">{t("assets.borrow", { rate: Math.round(rate * 100) })}</div>
                {controls.loans.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {controls.loans.map(action => (
                      <button key={action.amount} type="button" onClick={() => onAct(action)} className="min-h-11 rounded-xl border border-line2 bg-bg3 px-3 font-mono text-sm hover:border-gold">
                        +{money(action.amount)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[11px] text-text3">{controls.loanReason}</p>
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs text-text2">
                  <Wallet size={13} strokeWidth={iconStroke} aria-hidden />
                  {t("assets.repay", { debt: money(controls.debt) })}
                </div>
                {controls.repays.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {controls.repays.map(action => (
                      <button key={action.amount} type="button" onClick={() => onAct(action)} className="min-h-11 rounded-xl border border-line2 bg-bg3 px-3 font-mono text-sm hover:border-gold">
                        −{money(action.amount)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[11px] text-text3">{controls.repayReason}</p>
                )}
              </div>
            </div>
          </section>
          )}

          {(features.insurance || player.insurance.length > 0) && (
          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">
              <ShieldCheck size={12} strokeWidth={iconStroke} aria-hidden />
              {t("assets.insurance", { amount: money(state.config.insurancePremium) })}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {insuranceTypes.map(type => {
                const has = player.insurance.includes(type);
                const action = controls.insurances.find(item => item.insuranceType === type) ?? null;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={!action}
                    onClick={() => {
                      if (action) onAct(action);
                    }}
                    className={`flex min-h-12 flex-col items-start justify-center rounded-xl border px-3 text-left transition-colors enabled:hover:border-gold disabled:cursor-not-allowed ${has ? "border-green/50 bg-green/10" : "border-line2 bg-bg3 disabled:opacity-60"}`}
                  >
                    <span className="text-[13px] font-semibold">{t(`insurance.${type}` as MessageKey)}</span>
                    <span className={`font-mono text-[10px] ${has ? "text-green" : action ? "text-gold2" : "text-text3"}`}>{has ? t("manage.insured") : action ? t("manage.cost", { amount: money(state.config.insurancePremium) }) : controls.insuranceReason}</span>
                  </button>
                );
              })}
            </div>
          </section>
          )}
          {(!features.loans || !features.insurance) && <p className="text-[12px] leading-snug text-text3">{t("chapter.moreLater")}</p>}
        </div>
      )}
    </Sheet>
  );
}
