"use client";

import eventCards from "../data/events.json";
import opportunityCards from "../data/opportunities.json";
import type { CardEffect, GameCard, GameEvent, GameState } from "../engine";
import { useI18n } from "./i18n";
import type { MessageKey } from "./messages/fr";

const events = eventCards as GameCard[];
const opportunities = opportunityCards as GameCard[];

export function findCard(id: string): { card: GameCard; deck: "event" | "opportunity" } | null {
  const event = events.find(card => card.id === id);
  if (event) return { card: event, deck: "event" };
  const opportunity = opportunities.find(card => card.id === id);
  return opportunity ? { card: opportunity, deck: "opportunity" } : null;
}

export function cardPrefix(id: string): string {
  return findCard(id)?.deck === "opportunity" ? `opportunity.${id}` : `card.${id}`;
}

export function useText() {
  const { t, d, money, locale } = useI18n();

  const number = (value: number) => value.toLocaleString(locale === "fr" ? "fr-FR" : locale === "tr" ? "tr-TR" : "en-US");

  const effectLine = (effect: CardEffect): string | null => {
    if (effect.type === "asset_multiplier" && effect.family && effect.multiplier !== undefined) {
      return t("card.effect.multiplier", { family: t(`family.${effect.family}` as MessageKey), mult: number(effect.multiplier), turns: effect.turns ?? 3 });
    }
    if (effect.type === "salary_bonus") return t("card.effect.salary", { amount: money(effect.amount ?? 0), turns: effect.turns ?? 1 });
    if (effect.type === "base_expenses") return t("card.effect.expenses", { amount: `${(effect.amount ?? 0) < 0 ? "−" : "+"}${money(Math.abs(effect.amount ?? 0))}` });
    if (effect.type === "asset_discount" && effect.multiplier !== undefined) return t("card.effect.discount", { pct: Math.round((1 - effect.multiplier) * 100) });
    return null;
  };

  const eventText = (event: GameEvent, state: GameState, names: string[], owner?: number): string | null => {
    const nameIndex = state.players.findIndex(player => player.id === event.playerId);
    const name = nameIndex >= 0 ? names[nameIndex] ?? "" : "";
    const space = event.assetId ? state.spaces.find(item => item.assetId === event.assetId) : undefined;
    if (event.type === "rent.paid" && owner !== undefined) {
      return t("notice.rent", { name, amount: money(Math.abs(event.amount ?? 0)), owner: names[owner] ?? "" });
    }
    if (event.type === "asset.bought" && space) return t("notice.bought", { name, asset: d(space.titleKey) });
    const key = `ev.${event.type}` as MessageKey;
    try {
      return t(key, {
        name,
        amount: money(Math.abs(event.amount ?? 0)),
        n: event.amount ?? 0,
        asset: space ? d(space.titleKey) : "",
        card: event.cardKey ? d(`${cardPrefix(event.cardKey)}.title`) : ""
      });
    } catch {
      return null;
    }
  };

  return { t, d, money, number, effectLine, eventText };
}
