import { fr } from "../src/ui/messages/fr";
import { en } from "../src/ui/messages/en";
import { tr } from "../src/ui/messages/tr";

const params = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
let problems = 0;
for (const [name, dict] of [["en", en], ["tr", tr]] as const) {
  for (const key of Object.keys(fr) as Array<keyof typeof fr>) {
    const value = dict[key];
    if (typeof value !== "string" || value.length === 0) { console.log(name, "manquant", key); problems++; continue; }
    if (params(value) !== params(fr[key])) { console.log(name, "paramètres différents", key, "|", value); problems++; }
  }
}
console.log(problems === 0 ? "messages OK" : `${problems} problème(s)`);
