Tu travailles dans le dépôt fine-game (TypeScript strict, vitest, tsx déjà installés). Lis d'abord RULES.md en entier : c'est la spécification complète, tu l'implémentes à la lettre. Lis aussi BRIEF.md pour le contexte.

Tâche : implémenter le moteur de règles pur, sans interface.
- Code dans src/engine/ (index.ts exporte createGame, legalActions, applyAction, chooseBotAction, getWinner) ; types dans src/engine/types.ts.
- Données équilibrables dans src/data/ : config.json (3 modes quick/standard/long), board.json (40 cases), events.json (24 cartes), opportunities.json (16 cartes), i18n/fr.json, en.json, tr.json (mêmes clés partout).
- Tests dans tests/ (un fichier par thème : economy, loans, insurance, circle, bankruptcy, victory, determinism, i18n, bots).
- scripts/simulate.ts : simulation de 1 000 parties robot contre robot par mode, avec les statistiques demandées dans la section "Critères d'acceptation" de RULES.md. Lance-le et note les résultats dans SIMULATION.md.
- Si la simulation montre un déséquilibre (une place de départ gagne trop, le niveau 3 ne bat pas le niveau 1, les parties ne se terminent pas), ajuste les nombres dans src/data/config.json et board.json jusqu'à respecter les critères. Ne triche pas sur les tests.

Règles strictes : pas de `any`, pas de `@ts-ignore`, pas de console.log dans src/, pas de texte affichable en dur (clés i18n uniquement), état immuable, hasard seulement via le PRNG à graine, aucun TODO laissé. Pas de commentaires évidents. Ne fais aucun git push. Ne modifie pas RULES.md. À la fin, `npm run typecheck` et `npm test` doivent passer ; résume ce qui est fait et ce qui s'écarte de RULES.md, s'il y a lieu.
