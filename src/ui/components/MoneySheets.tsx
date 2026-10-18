"use client";

import { useState } from "react";
import { expenseBreakdown, incomeBreakdown, salaryPreview } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import type { MessageKey } from "../messages/fr";
import { useText } from "../text";
import type { MoveRecord } from "../useGame";
import { Sheet } from "./Sheet";

type Filter = "all" | "gains" | "losses";
const filters: Filter[] = ["all", "gains", "losses"];
const historySize = 25;

interface HistoryProps {
  open: boolean;
  playerIndex: number | null;
  ledger: MoveRecord[];
  state: GameState;
  names: string[];
  onClose: () => void;
}

export function MoneyHistory({ open, playerIndex, ledger, state, names, onClose }: HistoryProps) {
  const { t, money } = useI18n();
  const { moveText } = useText();
  const [filter, setFilter] = useState<Filter>("all");
  const player = playerIndex !== null ? state.players[playerIndex] : undefined;
  const rows = player
    ? ledger
      .filter(move => move.playerId === player.id && (filter === "all" || (filter === "gains" ? move.amount > 0 : move.amount < 0)))
      .slice(-historySize)
      .reverse()
    : [];

  return (
    <Sheet open={open} title={t("history.title", { name: playerIndex !== null ? names[playerIndex] ?? "" : "" })} onClose={onClose}>
      <div className="pb-3">
        <div className="mb-3 flex gap-1.5" role="group" aria-label={t("history.filter")}>
          {filters.map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`min-h-11 flex-1 rounded-xl border text-sm ${filter === item ? "border-gold bg-gold font-semibold text-bg" : "border-line2 text-text2 hover:border-gold hover:text-gold2"}`}
            >
              {t(`history.${item}` as MessageKey)}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-text3">{t("history.empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(move => (
              <li key={move.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-text">{moveText(move, state, names)}</p>
                  <p className="font-mono text-[10px] text-text3">
                    {t("history.turn", { n: Math.floor(move.turn / state.players.length) + 1 })} · {t("history.cash", { amount: money(move.cashAfter) })}
                  </p>
                </div>
                <span className={`shrink-0 font-mono text-sm font-semibold ${move.amount > 0 ? "text-green" : "text-red"}`}>
                  {move.amount > 0 ? "+" : "−"}
                  {money(Math.abs(move.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

interface GuideProps {
  open: boolean;
  playerIndex: number | null;
  state: GameState;
  names: string[];
  onClose: () => void;
}

function Group({ title, tone, lines }: { title: string; tone: "green" | "red" | "gold"; lines: string[] }) {
  const dot = tone === "green" ? "bg-green" : tone === "red" ? "bg-red" : "bg-gold";
  return (
    <section>
      <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">{title}</h3>
      <ul className="space-y-1.5">
        {lines.map(line => (
          <li key={line} className="flex gap-2 text-[13px] leading-snug text-text2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MoneyGuide({ open, playerIndex, state, names, onClose }: GuideProps) {
  const { t, money } = useI18n();
  const { number, signed } = useText();
  const player = playerIndex !== null ? state.players[playerIndex] : undefined;
  const config = state.config;

  let body = null;
  if (player) {
    const income = incomeBreakdown(state, player.id);
    const expenses = expenseBreakdown(state, player.id);
    const salary = salaryPreview(state, player.id);
    const net = income.total - expenses.total;
    const debt = player.loans.reduce((sum, loan) => sum + loan.principal, 0);
    const interest = expenses.interest.reduce((sum, line) => sum + line.amount, 0);
    const goal = Math.max(expenses.total, config.freedomTarget, 1);
    const missing = Math.max(0, goal - income.total);
    const taxes = [...new Set(state.spaces.filter(space => space.type === "tax").map(space => space.amount ?? 0))].map(amount => money(amount)).join(" / ");
    const member = state.circle?.members.includes(player.id) ?? false;

    const comes: string[] = [t("guide.inSalary", { amount: money(salary.amount) })];
    if (salary.reduced) comes.push(t("guide.inSalaryCut", { cut: money(salary.reduction), turn: salary.reducedAfterTurns }));
    else comes.push(t("guide.inSalarySoon", { cut: money(salary.reduction), reduced: money(Math.max(0, salary.base - salary.reduction + salary.bonus)), turn: salary.reducedAfterTurns }));
    if (salary.bonus > 0) comes.push(t("guide.inBonus", { bonus: money(salary.bonus) }));
    comes.push(player.assets.length > 0 ? t("guide.inAssets", { income: money(income.total), n: player.assets.length }) : t("guide.inNoAssets"));
    comes.push(t("guide.inRent", { pct: Math.round(config.rentRatio * 100) }), t("guide.inCards"), t("guide.inCircle"));

    const goes: string[] = [t("guide.outLiving", { amount: money(expenses.living) })];
    if (expenses.restartSurcharge > 0) goes.push(t("guide.outRestart", { amount: money(expenses.restartSurcharge), turns: expenses.restartTurnsLeft }));
    goes.push(debt > 0 ? t("guide.outInterest", { amount: money(interest), debt: money(debt) }) : t("guide.outNoLoan"));
    goes.push(expenses.insurance.length > 0
      ? t("guide.outInsurance", { amount: money(expenses.insurance.reduce((sum, line) => sum + line.amount, 0)), pct: Math.round(config.insuranceCoverage * 100) })
      : t("guide.outNoInsurance", { amount: money(config.insurancePremium) }));
    if (taxes) goes.push(t("guide.outTax", { amount: taxes }));
    goes.push(t("guide.outRent"));
    if (member) goes.push(t("guide.outCircle", { amount: money(config.circleContribution) }));

    const varies: string[] = [
      t("guide.varyLevels"),
      t("guide.varyFamily", { pct: Math.round(config.familyBonus * 100) }),
      t("guide.varyMarket"),
      ...state.marketEffects.map(effect => t("guide.varyMarketNow", { family: t(`family.${effect.family}` as MessageKey), mult: number(effect.multiplier), turns: effect.turnsRemaining }))
    ];

    body = (
      <div className="space-y-4 pb-3">
        <p className="font-mono text-xs text-text3">{names[playerIndex ?? 0] ?? ""}</p>
        <p className="rounded-xl border border-line2 bg-bg3/70 p-3 text-[13px] leading-snug text-text">
          {t("guide.now", { income: money(income.total), expenses: money(expenses.total), net: net === 0 ? money(0) : signed(net) })}
        </p>
        <Group title={t("guide.inTitle")} tone="green" lines={comes} />
        <Group title={t("guide.outTitle")} tone="red" lines={goes} />
        <Group title={t("guide.varyTitle")} tone="gold" lines={varies} />
        <p className="text-[13px] leading-snug text-text">
          {t(missing === 0 ? "guide.freedomDone" : "guide.freedom", { income: money(income.total), goal: money(goal), missing: money(missing), turns: config.freedomTurns })}
        </p>
      </div>
    );
  }

  return (
    <Sheet open={open} title={t("guide.title")} onClose={onClose}>
      {body}
    </Sheet>
  );
}
