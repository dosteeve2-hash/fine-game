# Simulation robot contre robot

`SIM_GAMES=1000 npx tsx scripts/simulate.ts` : 1 000 parties par mode, 4 robots (niveaux 1, 2, 3, 3), rotation des places. Réglage assisté par `scripts/tune.mjs`.

## Avec l'Audit (18/10/2026)

La case Impôt n° 17 est devenue « Contrôle fiscal » et le coin Repos n° 39 « Audit / Repos ». Régularisation : 90 / 120 / 150 selon le mode, retenue maximale de 2 tours.

| Mode | Parties finies | Tours par joueur | Victoires par place (1 à 4) | Victoires par niveau 1 / 2 / 3 | Envois à l'Audit par partie | Sorties payées |
|---|---|---|---|---|---|---|
| Rapide | 100 % | 15,7 | 23,9 / 25,3 / 25,1 / 25,7 % | 0,4 / 0,2 / 49,7 % | 1,84 | 91 % |
| Standard | 100 % | 22,9 | 23,4 / 25,0 / 24,6 / 27,0 % | 0,1 / 0,2 / 49,9 % | 2,63 | 91 % |
| Long | 99,5 % | 28,3 | 26,8 / 23,8 / 24,6 / 24,8 % | 0,5 / 0,3 / 49,6 % | 3,07 | 90 % |

Les trois critères de RULES.md restent respectés : au moins 99 % de parties finies, aucune place au-dessus de 40 %, niveau 3 nettement devant le niveau 1. Aucun autre chiffre n'a eu besoin d'être retouché : la case Impôt retirée (−130) compense à peu près le coût moyen de la régularisation.

## Avant l'Audit (17/10/2026, pour comparaison)

| Mode | Parties finies | Tours par joueur | Victoires par place (1 à 4) | Victoires par niveau 1 / 2 / 3 |
|---|---|---|---|---|
| Rapide | 100 % | 15,8 | 24,1 / 26,1 / 25,2 / 24,6 % | 0,5 / 0,3 / 49,6 % |
| Standard | 100 % | 22,5 | 24,3 / 23,4 / 27,9 / 24,4 % | 0 / 0,2 / 49,9 % |
| Long | 99,7 % | 27,6 | 26,9 / 25,5 / 24,8 / 22,8 % | 0,1 / 0,4 / 49,8 % |

## Réglages retenus
- Revenus des actifs ramenés à environ 7 % du prix par tour, loyers proportionnels.
- Intérêt des prêts : 4 % par tour (7 % en défaut).
- Cible de Liberté financière indépendante des dépenses : 500 / 1 100 / 1 500.
- Bonus de départ par place : +60 de cash par rang, pour compenser l'avantage du premier joueur.
- Audit : régularisation 90 / 120 / 150, 2 tours au plus.

## Limites connues
- Le niveau 3 gagne presque tout contre les niveaux 1 et 2 : il emprunte beaucoup, les autres gardent du cash inactif. Pour un humain, les niveaux 1 et 2 sont donc des adversaires faciles, ce qui est voulu, mais le niveau 2 devrait gagner plus souvent.
- Les robots paient la régularisation 9 fois sur 10 : la régularisation est peu chère par rapport à leur trésorerie. Un humain peut préférer rester en fin de partie pour éviter les loyers ; à observer avec de vrais joueurs.
- Le long mode passe à 99,5 % (contre 99,7 %) : toujours au-dessus du seuil, mais c'est le critère le plus serré.
- Les durées sont mesurées en tours de robots, sans négociation ni Cercle humain. Le vrai rythme sera connu au test avec des joueurs.
- Le Cercle est rarement utilisé par les robots.
