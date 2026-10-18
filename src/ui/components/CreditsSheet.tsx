"use client";

import { ExternalLink } from "lucide-react";
import { ArtIcon, isMono } from "../art";
import { credits } from "../art/credits";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { MessageKey } from "../messages/fr";
import { Fina } from "./Fina";
import { Sheet } from "./Sheet";

export function CreditsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Sheet open={open} title={t("credits.title")} onClose={onClose}>
      <div className="space-y-5 pb-4" data-testid="credits">
        <p className="text-sm leading-relaxed text-text2">{t("credits.intro")}</p>
        {credits.map(source => (
          <section key={source.id} className="rounded-2xl border border-line2 bg-bg3 p-3">
            <div className="flex items-start gap-3">
              {source.id === "lorelei" && <Fina size={44} mood="happy" />}
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg font-bold italic leading-tight text-text">{source.title}</h3>
                <p className="text-xs text-text2">{source.owner}</p>
                <p className="mt-1 text-xs leading-snug text-text2">{t(`credits.source.${source.id}` as MessageKey)}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]">
                  <a href={source.licenseUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-gold2 underline-offset-2 hover:underline">
                    {t("credits.license", { license: source.license })}
                    <ExternalLink size={11} strokeWidth={iconStroke} aria-hidden />
                  </a>
                  <a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-text2 underline-offset-2 hover:underline">
                    {t("credits.source")}
                    <ExternalLink size={11} strokeWidth={iconStroke} aria-hidden />
                  </a>
                </div>
              </div>
            </div>
            {source.items.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {source.items.map(item => (
                  <li key={item.name}>
                    <a href={item.url} target="_blank" rel="noreferrer noopener" className="flex min-h-9 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-bg2">
                      <ArtIcon name={item.name} size={20} color={isMono(item.name) ? "#e6c98f" : undefined} />
                      <span className="min-w-0 flex-1 truncate text-xs text-text">{item.label}</span>
                      <span className="shrink-0 font-mono text-[10px] text-text3">{t("credits.by", { author: item.author })}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </Sheet>
  );
}
