"use client";

import { salaryPreview } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import type { MessageKey } from "../messages/fr";
import { playerColors } from "../theme";
import { useText } from "../text";
import type { StatementRecord } from "../useGame";

interface Row {
  key: string;
  label: string;
  tags?: string[];
  amount: number;
}

function Rows({ rows, sign }: { rows: Row[]; sign: 1 | -1 }) {
  const { money } = useI18n();
  return (
    <ul className="space-y-1">
      {rows.map(row => (
        <li key={row.key} className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
          <span className="min-w-0 text-text2">
            {row.label}
            {row.tags?.map(tag => (
              <span key={tag} className="ml-1.5 whitespace-nowrap rounded-md bg-line px-1.5 py-px font-mono text-[10px] text-gold2">
                {tag}
              </span>
            ))}
          </span>
          <span className={`shrink-0 font-mono text-[13px] font-semibold ${sign > 0 ? "text-green" : "text-red"}`}>
            {sign > 0 ? "+" : "−"}
            {money(row.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StatementView({ statement, state, names }: { statement: StatementRecord; state: GameState; names: string[] }) {
  const { t, money, number, signed, assetName } = useText();
  const index = state.players.findIndex(player => player.id === statement.playerId);
  const incomeRows: Row[] = statement.income.lines.map(line => {
    const tags: string[] = [];
    if (line.familyBonusApplied) tags.push(t("statement.family", { pct: Math.round(state.config.familyBonus * 100) }));
    if (line.marketMultiplier !== 1) tags.push(t("statement.market", { mult: number(line.marketMultiplier) }));
    return { key: `i-${line.assetId}`, label: t("statement.assetLine", { asset: assetName(state, line.assetId), level: line.level }), tags, amount: line.amount };
  });
  const expenses = statement.expenses;
  const expenseRows: Row[] = [
    { key: "living", label: t("statement.living"), amount: expenses.living },
    ...(expenses.restartSurcharge > 0 ? [{ key: "restart", label: t("statement.restartSurcharge", { turns: expenses.restartTurnsLeft }), amount: expenses.restartSurcharge }] : []),
    ...expenses.interest.map((line, position) => ({
      key: `l-${position}`,
      label: t("statement.interest", { principal: money(line.principal), rate: Math.round(line.rate * 100) }),
      amount: line.amount
    })),
    ...expenses.insurance.map(line => ({ key: `s-${line.type}`, label: t("statement.insurance", { type: t(`insurance.${line.type}` as MessageKey) }), amount: line.amount }))
  ].filter(row => row.amount !== 0);
  const salary = salaryPreview(state, statement.playerId);
  const net = statement.net;
  const verdict = net < 0
    ? t("statement.deficit", { n: money(-net) })
    : net > 0
      ? t("statement.surplus", { n: money(net) })
      : t("statement.even");
  const progress = Math.min(1, statement.incomeTotal / statement.goal);
  const done = statement.missing === 0;
  const salaryLine = salary.reduced
    ? t("statement.salaryReduced", { amount: money(salary.amount), cut: money(salary.reduction), turn: salary.reducedAfterTurns })
    : salary.turnsBeforeReduction <= 4
      ? t("statement.salarySoon", { amount: money(salary.amount), cut: money(salary.reduction), turn: salary.reducedAfterTurns })
      : t("statement.salaryNext", { amount: money(salary.amount) });
  const round = Math.floor(statement.turn / state.players.length) + 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: playerColors[index] ?? "#f0a832" }} />
        <h3 className="min-w-0 flex-1 truncate font-serif text-lg font-bold italic text-text">{t("statement.of", { name: names[index] ?? "" })}</h3>
        <span className="shrink-0 rounded-md border border-line2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text2">{t("game.round", { n: round })}</span>
      </div>

      <section aria-label={t("statement.income")}>
        <h4 className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-text3">
          <span>{t("statement.income")}</span>
          <span className="text-green">+{money(statement.incomeTotal)}</span>
        </h4>
        {incomeRows.length > 0 ? <Rows rows={incomeRows} sign={1} /> : <p className="text-[13px] text-text2">{t("statement.incomeNone")}</p>}
      </section>

      <section aria-label={t("statement.expenses")}>
        <h4 className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-text3">
          <span>{t("statement.expenses")}</span>
          <span className="text-red">−{money(statement.expensesTotal)}</span>
        </h4>
        <Rows rows={expenseRows} sign={-1} />
      </section>

      <section className="rounded-xl border border-line2 bg-bg3/70 p-3" aria-label={t("statement.net")}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-text">{t("statement.net")}</span>
          <span className={`font-mono text-lg font-semibold ${net < 0 ? "text-red" : net > 0 ? "text-green" : "text-text2"}`}>{net === 0 ? money(0) : signed(net)}</span>
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-text3">{t("statement.cash", { from: money(statement.cashBefore), to: money(statement.cashAfter) })}</p>
        <p className="mt-2 text-[13px] leading-snug text-text">{verdict}</p>
      </section>

      <section aria-label={t("game.freedom")}>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={statement.goal}
          aria-valuenow={statement.incomeTotal}
          aria-label={t("game.freedomProgress", { income: statement.incomeTotal, goal: statement.goal })}
        >
          <div className="h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%`, background: playerColors[index] ?? "#f0a832", transition: "width 0.5s ease-out" }} />
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-text2">
          {done
            ? t("statement.freedomDone", { income: money(statement.incomeTotal), goal: money(statement.goal) })
            : t("statement.freedom", { income: money(statement.incomeTotal), goal: money(statement.goal), missing: money(statement.missing) })}
        </p>
      </section>

      <p className="text-[12px] leading-snug text-text3">{salaryLine}</p>
    </div>
  );
}
