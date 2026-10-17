import { describe, expect, it } from "vitest";
import fr from "../src/data/i18n/fr.json";
import en from "../src/data/i18n/en.json";
import tr from "../src/data/i18n/tr.json";
import board from "../src/data/board.json";
import events from "../src/data/events.json";
import opportunities from "../src/data/opportunities.json";

describe("i18n", () => {
  it("provides identical locale keys and translates every data key", () => {
    const locales = [fr, en, tr];
    const keys = Object.keys(fr).sort();
    expect(Object.keys(en).sort()).toEqual(keys);
    expect(Object.keys(tr).sort()).toEqual(keys);
    const required = [
      ...board.map(space => space.titleKey),
      ...events.flatMap(card => [card.titleKey, card.textKey]),
      ...opportunities.flatMap(card => [card.titleKey, card.textKey])
    ];
    for (const locale of locales) for (const key of required) expect(locale).toHaveProperty(key);
    expect(board).toHaveLength(40);
    expect(board.filter(space => space.type === "asset")).toHaveLength(24);
    const familyCounts = new Map<string, number>();
    for (const asset of board.filter(space => space.type === "asset")) {
      if (asset.family) familyCounts.set(asset.family, (familyCounts.get(asset.family) ?? 0) + 1);
    }
    expect([...familyCounts.values()].sort()).toEqual([4, 4, 4, 4, 4, 4]);
    expect(events).toHaveLength(24);
    expect(opportunities).toHaveLength(16);
  });
});
