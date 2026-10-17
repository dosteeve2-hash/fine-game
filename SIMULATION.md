# Simulation robot contre robot

La simulation est implémentée dans `scripts/simulate.ts`. Elle lance 1 000 parties pour chacun des modes `quick`, `standard` et `long`, avec quatre robots et une rotation équilibrée des niveaux, puis imprime le taux de fin avant `maxTurns`, la durée moyenne, la répartition des victoires par siège et les taux de victoire par niveau. Elle marque également les critères de fin ≥ 99 %, aucune place au-dessus de 40 % et un avantage d'au moins cinq points pour le niveau 3 sur le niveau 1.

**Résultats non disponibles :** l'exécution de `npm run simulate` a été bloquée par l'environnement, qui refuse le lancement de commandes sans approbation interactive. Aucun résultat n'est inventé; les critères de simulation restent à vérifier en exécutant `npm run simulate` dans un environnement autorisant les commandes.
