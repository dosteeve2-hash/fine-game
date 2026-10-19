"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Receipt } from "lucide-react";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { StatementRecord } from "../useGame";

interface Props {
  statement: StatementRecord | null;
  onOpen: () => void;
}

/** Start-of-turn statement reduced to one line; the full statement opens only on request. */
export function StatementLine({ statement, onOpen }: Props) {
  const { t } = useI18n();
  return (
    <AnimatePresence initial={false}>
      {statement && (
        <motion.button
          key={statement.id}
          type="button"
          onClick={onOpen}
          data-testid="statement-line"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          aria-label={t("statement.lineOpen")}
          className="mb-1.5 flex min-h-10 w-full items-center gap-2 rounded-xl border border-line2 bg-bg2/90 px-3 text-left font-mono text-[12.5px] text-text2 hover:border-gold"
        >
          <Receipt size={15} strokeWidth={iconStroke} className="shrink-0 text-text3" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            <span className="text-green">+{statement.incomeTotal}</span> {t("statement.lineIncome")}
            <span className="text-text3"> · </span>
            <span className="text-red">−{statement.expensesTotal}</span> {t("statement.lineExpenses")}
            <span className="text-text3"> = </span>
            <span className={`font-semibold ${statement.net < 0 ? "text-red" : statement.net > 0 ? "text-green" : "text-text"}`}>
              {statement.net > 0 ? "+" : statement.net < 0 ? "−" : ""}
              {Math.abs(statement.net)}
            </span>
          </span>
          <ChevronRight size={15} strokeWidth={iconStroke} className="shrink-0 text-text3" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
