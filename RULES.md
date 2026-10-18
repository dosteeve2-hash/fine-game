# FINE Game — spécification du moteur de règles (v0)

Moteur **pur TypeScript**, sans interface, sans dépendance de runtime. Il doit tourner dans un navigateur hors ligne et dans Node (tests, robots, futur multijoueur).

## Contrat d'API (src/engine/index.ts)

```ts
createGame(config: GameConfig, seed: number): GameState
legalActions(state: GameState): Action[]            // pour le joueur courant
applyAction(state: GameState, action: Action): { state: GameState; events: GameEvent[] }
chooseBotAction(state: GameState, level: 1 | 2 | 3): Action
getWinner(state: GameState): PlayerId | null
```

- État **immuable** : `applyAction` renvoie un nouvel état, ne mute jamais l'ancien.
- **Déterministe** : tout hasard passe par un PRNG à graine (mulberry32) stocké dans l'état. Même graine + mêmes actions = même partie.
- Tout est sérialisable en JSON (sauvegarde, réseau).
- Les nombres (prix, revenus, montants) vivent dans `src/data/*.json`, jamais en dur dans le code.
- Les textes affichables sont des **clés i18n** (`"card.market_crash.title"`), jamais du français en dur. Fournir `src/data/i18n/fr.json`, `en.json`, `tr.json` avec toutes les clés.

## Joueurs et modes

- 2 à 4 joueurs, humains ou robots (`isBot`, `botLevel`).
- 3 durées via `GameConfig.mode` : `quick` (~20 min), `standard` (~1 h), `long` (~2 h). Elles ne changent que les paramètres (cash de départ, dépenses de base, cible de Liberté financière), pas les règles.
- Un joueur humain seul peut jouer contre 1 à 3 robots.

## Plateau (src/data/board.json) : 40 cases en boucle

Types : `start` (Jour de paie), `asset`, `circle`, `event`, `opportunity`, `tax`, `audit` (Contrôle fiscal), `bank`, `rest`.
- 24 `asset` répartis en 6 familles de 4 (ex. commerce, agriculture, immobilier, transport, énergie, technologie), prix croissants.
- 2 `circle`, 5 `event`, 3 `opportunity`, 1 `tax`, 1 `audit`, 2 `bank`, 1 `start`, 2 `rest` dont le coin « Audit / Repos » (`office: true`).
- Les familles et noms de villes sont inspirés de plusieurs continents, sans univers unique.

## Tour de jeu

1. Avant de lancer, le joueur peut déjà gérer ses biens : `upgradeAsset`, `sellAsset`, `takeLoan`, `repayLoan` sont légaux en phase `roll`.
2. `roll` : deux dés à 6 faces (PRNG). Pas de double qui rejoue (anti-complexité en v0). Un joueur retenu à l'Audit ne lance pas : il choisit `payAudit` ou `waitAudit` (voir plus bas).
3. Déplacement, puis résolution de la case.
4. Phase libre (actions optionnelles) : `buyAsset`, `upgradeAsset`, `sellAsset`, `takeLoan`, `repayLoan`, `buyInsurance`, `proposeTrade` (v0 : échange simple d'actifs et de cash, accepté ou refusé par l'autre joueur), `joinCircle`.
5. `endTurn`. Début du tour suivant : encaissement des revenus, paiement des dépenses.

## L'Audit (équivalent original de la prison)

- La case `audit` (« Contrôle fiscal », case 17) envoie directement le pion au coin « Audit / Repos » (case 39, `office: true`), sans passer par le Jour de paie, donc sans salaire. Événement `audit.sent` (montant = index du coin).
- Le joueur est alors retenu `auditTurns` tours (config, 2 dans tous les modes). Simple passage sur le coin = Repos, sans effet.
- Au début de chacun de ses tours retenus, il continue d'encaisser ses revenus et de payer ses dépenses, puis choisit :
  - `payAudit` : il paie la régularisation `auditFee` (config : 90 / 120 / 150 selon le mode), est libéré et lance les dés tout de suite. Possible seulement si son cash couvre la régularisation (il peut vendre ou emprunter avant).
  - `waitAudit` : il reste sur place (phase libre sans déplacement) ; le compteur baisse d'un. Au dernier tour d'attente, événement `audit.released` : il relance normalement au tour suivant.
- Pendant la retenue, ses biens rapportent toujours et les visiteurs lui paient toujours le loyer.
- Robots : ils paient si leur cash après régularisation reste confortable (3 à 8 tours de dépenses selon le niveau) ; le niveau 3 préfère rester quand il reste moins de 4 biens libres à acheter (rester évite alors des loyers).

## Économie

- Chaque joueur a : `cash`, `assets`, `loans`, `insurance`, `baseExpenses` (coût de vie).
- **Revenu passif** d'un actif = `baseIncome × niveau`. Encaissé au début du tour de son propriétaire.
- **Loyer** : quand un autre joueur tombe sur un actif, il paie `rent` au propriétaire (≈ 40 % du revenu passif, config).
- Passer la case `start` : salaire fixe (config), qui baisse après X tours (le salaire ne suffit plus, il faut des actifs).
- **Dépenses par tour** = `baseExpenses` + intérêts des prêts + primes d'assurance.
- **Améliorations** : niveaux 1 à 3, coût croissant, revenu croissant.
- **Achat** : seulement sur la case où l'on tombe, si l'actif est libre et si le cash suffit. Si le joueur refuse, pas d'enchère en v0.
- **Famille complète** (4 actifs d'une famille au même joueur) : bonus de revenu +25 %.

## Dette et banque

- `takeLoan` : montant par tranche (config), intérêt par tour (config, ex. 8 %). Plafond selon la valeur des actifs.
- Case `bank` : choix de prêt ou de remboursement anticipé.
- **Effet de levier** doit être rentable quand l'actif rapporte plus que l'intérêt, et dangereux sinon : c'est la leçon implicite.

## Assurance

- `buyInsurance(type)` contre une prime par tour. Une assurance annule ou réduit les pertes de certaines cartes `event` (panne, incendie, mauvaise récolte, maladie). Sans assurance, la perte tombe pleine. Pas de message moralisateur.

## Le Cercle (mécanique signature)

- Case `circle` : le joueur qui y tombe peut **fonder** un Cercle ou, s'il existe, être invité.
- Un Cercle a 2 à 4 membres, une **cotisation fixe par tour de table**, et un **ordre de réception** tiré au hasard. À chaque fin de tour de table, tous cotisent et le membre suivant reçoit la caisse.
- Recevoir tôt = crédit sans intérêt. Recevoir tard = épargne forcée. Le Cercle dure autant de tours de table que de membres.
- **Défaut** : un membre qui ne peut pas cotiser prend automatiquement un prêt bancaire à taux majoré et perd un point de `reputation`. Un joueur à réputation basse paie plus cher les prêts et ne peut plus fonder de Cercle.
- Le Cercle sert aussi de filet de sécurité (voir faillite).
- Noms locaux affichés selon la langue via i18n (tontine, susu, tanda, chit fund, hui, altın günü).

## Événements et opportunités

- Paquet `event` : 24 cartes (pertes et gains imprévus, hausses de prix, impôts, crise de marché qui change les revenus d'une famille pendant 3 tours, bonne récolte, etc.).
- Paquet `opportunity` : 16 cartes (achat à prix réduit, subvention, partenariat, formation qui augmente le salaire, etc.).
- Chaque carte : clé i18n du titre et du texte, effets déclaratifs en JSON (pas de code dans les données).

## Faillite sans élimination

- Cash négatif et aucun prêt possible : vente forcée des actifs à 50 % de leur valeur.
- Toujours négatif : **redémarrage** via un prêt du Cercle (cash de départ réduit, tous les actifs perdus, `baseExpenses` +10 % pendant 5 tours). Le joueur reste en jeu.

## Victoire : Liberté financière

- Un joueur gagne s'il termine un tour avec `revenu passif total ≥ dépenses totales` **et** `cash ≥ 0`, pendant N tours consécutifs (config par mode).
- `getWinner` renvoie le premier à atteindre ce seuil. Aucun joueur n'est jamais éliminé.
- Garde-fou : si aucun gagnant au bout de `maxTurns` (config), gagne le plus haut patrimoine net.

## Robots

- Niveau 1 : achète quand il peut, ne s'endette jamais.
- Niveau 2 : évalue le rendement d'un actif, s'endette modérément, prend une assurance.
- Niveau 3 : utilise le levier, optimise les familles complètes, gère sa trésorerie, rejoint les Cercles quand c'est rentable.
- Un robot ne triche pas : il n'utilise que `legalActions`.

## Critères d'acceptation (vérifiables)

1. `npm run typecheck` et `npm test` passent.
2. Tests unitaires pour chaque règle ci-dessus (achat, loyer, amélioration, prêt, intérêts, assurance, Cercle avec défaut, faillite-redémarrage, victoire).
3. Test de déterminisme : même graine et mêmes actions donnent le même état final.
4. `scripts/simulate.ts` : joue 1 000 parties robot contre robot par mode, imprime : taux de fin avant `maxTurns` (≥ 99 %), durée moyenne en tours, répartition des victoires par ordre de jeu (aucune place > 40 % à 4 joueurs), taux de victoire des niveaux 1/2/3 (le niveau 3 doit battre le niveau 1 clairement).
5. Aucun texte en dur hors des fichiers i18n ; les trois fichiers de langue ont exactement les mêmes clés (test).
