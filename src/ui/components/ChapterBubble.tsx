"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../i18n";
import type { MessageKey } from "../messages/fr";
import { chapterCount } from "../profile";
import { Mascot } from "./Mascot";

interface Props {
  chapter: number | null;
  onDone: () => void;
}

export function ChapterProgress({ chapter }: { chapter: number }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-gold2">{t("chapter.progress", { n: chapter, total: chapterCount })}</span>
      <span
        className="flex flex-1 gap-[3px]"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={chapterCount}
        aria-valuenow={chapter}
        aria-label={t("chapter.progress", { n: chapter, total: chapterCount })}
      >
        {Array.from({ length: chapterCount }, (_, index) => (
          <span key={index} className={`h-1 flex-1 rounded-full ${index < chapter ? "bg-gold" : "bg-line2"}`} />
        ))}
      </span>
    </div>
  );
}

/** Fina introduces a newly opened chapter once, in one short bubble. */
export function ChapterBubble({ chapter, onDone }: Props) {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {chapter !== null && (
        <motion.div
          key={chapter}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-40 flex justify-center px-3 lg:bottom-8 lg:left-8 lg:right-auto lg:justify-start"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <section
            role="dialog"
            aria-label={t(`chapter.${chapter}.title` as MessageKey)}
            data-testid="chapter-bubble"
            data-chapter={chapter}
            className="pointer-events-auto w-full max-w-sm rounded-3xl border border-gold/50 bg-bg2/97 p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur"
          >
            <ChapterProgress chapter={chapter} />
            <div className="mt-2.5 flex items-start gap-3">
              <Mascot size={52} mood="happy" />
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xl font-black italic leading-tight text-gold">{t(`chapter.${chapter}.title` as MessageKey)}</h2>
                <p className="mt-1 text-[14px] leading-snug text-text">{t(`chapter.${chapter}.text` as MessageKey)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDone}
              data-testid="chapter-ok"
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-2xl bg-gold text-sm font-semibold text-bg hover:bg-gold2"
            >
              {t("chapter.ok")}
            </button>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
