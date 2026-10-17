Lis src/ui/messages/fr.ts. Cree deux fichiers : src/ui/messages/en.ts et src/ui/messages/tr.ts.

Chacun exporte `export const en: Record<MessageKey, string> = { ... }` (et `tr`), avec `import type { MessageKey } from "./fr";`. Toutes les cles de fr.ts doivent exister, avec exactement les memes marqueurs {param} (ne traduis jamais ce qui est entre accolades).

Style : jeu de societe, ton simple et vivant, phrases courtes, jamais de ton moralisateur. Anglais naturel (pas de mot a mot). Turc naturel, correct, avec les accents et caracteres turcs (ç, ğ, ı, ö, ş, ü). Garde les noms propres et chiffres. "Cercle" = "Circle" en anglais, "Çember" en turc ; "Liberté financière" = "Financial freedom" / "Finansal özgürlük". Les bouts de phrase des journaux "ev.*" sont des phrases completes avec le nom du joueur en tete.

Pas de commentaires dans le code. Ne modifie aucun autre fichier. Ne lance pas de commande git push.
