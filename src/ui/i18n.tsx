"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fr, type MessageKey } from "./messages/fr";
import { en } from "./messages/en";
import { tr } from "./messages/tr";
import dataFr from "../data/i18n/fr.json";
import dataEn from "../data/i18n/en.json";
import dataTr from "../data/i18n/tr.json";

export type Locale = "fr" | "en" | "tr";
export const locales: Locale[] = ["fr", "en", "tr"];

const messages: Record<Locale, Record<MessageKey, string>> = { fr, en, tr };
const gameData: Record<Locale, Record<string, string>> = { fr: dataFr, en: dataEn, tr: dataTr };

type Params = Record<string, string | number>;

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Params) => string;
  d: (key: string) => string;
  money: (amount: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLocale(): Locale {
  try {
    const saved = window.localStorage.getItem("fine.locale");
    if (saved === "fr" || saved === "en" || saved === "tr") return saved;
  } catch {
    return "fr";
  }
  const language = window.navigator.language.slice(0, 2);
  return language === "en" || language === "tr" ? language : "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem("fine.locale", next);
    } catch {
      return;
    }
  }, []);

  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale,
    t: (key, params) => fill(messages[locale][key], params),
    d: key => gameData[locale][key] ?? key,
    money: amount => `${Math.round(amount).toLocaleString(locale === "fr" ? "fr-FR" : locale === "tr" ? "tr-TR" : "en-US")} ¤`
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
