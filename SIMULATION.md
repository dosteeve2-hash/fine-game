# Simulation robot contre robot

`SIM_GAMES=1000 npx tsx scripts/simulate.ts` : 1 000 parties par mode, 4 robots (niveaux 1, 2, 3, 3), rotation des places. Réglage assisté par `scripts/tune.mjs`.

| Mode | Parties finies | Tours par joueur | Victoires par place (1 à 4) | Victoires par niveau 1 / 2 / 3 |
|---|---|---|---|---|
| Rapide | 100 % | 15,8 | 24,1 / 26,1 / 25,2 / 24,6 % | 0,5 / 0,3 / 49,6 % |
| Standard | 100 % | 22,5 | 24,3 / 23,4 / 27,9 / 24,4 % | 0 / 0,2 / 49,9 % |
| Long | 99,7 % | 27,6 | 26,9 / 25,5 / 24,8 / 22,8 % | 0,1 / 0,4 / 49,8 % |

Les trois critères de RULES.md sont respectés : au moins 99 % de parties finies, aucune place au-dessus de 40 %, niveau 3 nettement devant le niveau 1.

## Réglages retenus
- Revenus des actifs ramenés à environ 7 % du prix par tour, loyers proportionnels.
- Intérêt des prêts : 4 % par tour (7 % en défaut).
- Cible de Liberté financière indépendante des dépenses : 500 / 1 100 / 1 500.
- Bonus de départ par place : +60 de cash par rang, pour compenser l'avantage du premier joueur.

## Limites connues
- Le niveau 3 gagne presque tout contre les niveaux 1 et 2 : il emprunte beaucoup, les autres gardent du cash inactif. Pour un humain, les niveaux 1 et 2 sont donc des adversaires faciles, ce qui est voulu, mais le niveau 2 devrait gagner plus souvent.
- Les durées sont mesurées en tours de robots, sans négociation ni Cercle humain. Le vrai rythme sera connu au test avec des joueurs.
- Le Cercle est rarement utilisé par les robots.
