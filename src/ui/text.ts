"use client";

import eventCards from "../data/events.json";
import opportunityCards from "../data/opportunities.json";
import type { CardEffect, GameCard, GameState } from "../engine";
import type { LogEvent, MoneyMove } from "../engine/ledger";
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

  const signed = (amount: number) => `${amount < 0 ? "−" : "+"}${money(Math.abs(amount))}`;

  const effectLine = (effect: CardEffect): string | null => {
    if (effect.type === "asset_multiplier" && effect.family && effect.multiplier !== undefined) {
      return t("card.effect.multiplier", { family: t(`family.${effect.family}` as MessageKey), mult: number(effect.multiplier), turns: effect.turns ?? 3 });
    }
    if (effect.type === "salary_bonus") return t("card.effect.salary", { amount: money(effect.amount ?? 0), turns: effect.turns ?? 1 });
    if (effect.type === "base_expenses") return t("card.effect.expenses", { amount: `${(effect.amount ?? 0) < 0 ? "−" : "+"}${money(Math.abs(effect.amount ?? 0))}` });
    if (effect.type === "asset_discount" && effect.multiplier !== undefined) return t("card.effect.discount", { pct: Math.round((1 - effect.multiplier) * 100) });
    return null;
  };

  const assetName = (state: GameState, assetId?: string) => {
    const space = assetId ? state.spaces.find(item => item.assetId === assetId) : undefined;
    return space ? d(space.titleKey) : "";
  };

  const playerName = (state: GameState, names: string[], playerId?: string) => {
    const index = state.players.findIndex(player => player.id === playerId);
    return index >= 0 ? names[index] ?? "" : "";
  };

  const cardName = (cardKey?: string) => (cardKey ? d(`${cardPrefix(cardKey)}.title`) : "");

  const moveText = (move: MoneyMove, state: GameState, names: string[]): string => {
    const found = move.cardKey ? findCard(move.cardKey) : null;
    let key = `money.reason.${move.reason}` as MessageKey;
    if (move.reason === "interest" && (move.count ?? 1) > 1) key = "money.reason.interestMany";
    else if (move.reason === "insurance" && (move.count ?? 1) > 1) key = "money.reason.insuranceMany";
    else if (move.reason === "card") key = found?.deck === "opportunity" ? "money.reason.cardOpportunity" : "money.reason.cardEvent";
    return t(key, { asset: assetName(state, move.assetId), card: cardName(move.cardKey), name: playerName(state, names, move.counterpartId) });
  };

  const eventText = (event: LogEvent, state: GameState, names: string[], owner?: number): string | null => {
    const name = playerName(state, names, event.playerId);
    const asset = assetName(state, event.assetId);
    const ownerName = owner !== undefined ? names[owner] ?? "" : playerName(state, names, event.counterpartId);
    if (event.type === "rent.paid" && owner !== undefined) {
      return t("notice.rent", { name, amount: money(Math.abs(event.amount ?? 0)), owner: ownerName });
    }
    if (event.type === "asset.bought" && asset) return t("notice.bought", { name, asset });
    if (event.type === "turn.statement") {
      return t("ev.turn.statement", { name, income: money(event.income ?? 0), expenses: money(event.expenses ?? 0) });
    }
    if (event.type === "card.resolved" && event.cardKey) {
      const found = findCard(event.cardKey);
      const deck = t(found?.deck === "opportunity" ? "card.opportunity" : "card.event");
      if (found?.card.effect.type === "cash") return t("ev.card.cash", { name, deck, card: cardName(event.cardKey), signed: signed(event.amount ?? 0) });
      return t("ev.card.drawn", { name, deck, card: cardName(event.cardKey) });
    }
    const key = `ev.${event.type}` as MessageKey;
    try {
      return t(key, {
        name,
        amount: money(Math.abs(event.amount ?? 0)),
        n: event.amount ?? 0,
        asset,
        owner: ownerName,
        card: cardName(event.cardKey)
      });
    } catch {
      return null;
    }
  };

  return { t, d, money, number, signed, effectLine, eventText, moveText, assetName, playerName };
}
