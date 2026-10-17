"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ open, title, onClose, children }: Props) {
  const { t } = useI18n();
  const panel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#02060f]/70 backdrop-blur-[2px] lg:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={event => event.stopPropagation()}
            initial={{ y: 60, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="flex max-h-[78dvh] w-full max-w-md flex-col rounded-t-3xl border border-line2 bg-bg2 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl outline-none lg:rounded-3xl lg:pb-4"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line2 lg:hidden" aria-hidden />
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <h2 className="font-serif text-xl font-bold italic text-text">{title}</h2>
              <button type="button" onClick={onClose} aria-label={t("game.close")} className="flex h-11 w-11 items-center justify-center rounded-xl text-text2 hover:bg-bg3 hover:text-text">
                <X size={20} strokeWidth={iconStroke} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
