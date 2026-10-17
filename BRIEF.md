# FINE Game — brief v0 (à valider par Steve)

FINE = **Fin**ancial **E**ducation. Jeu de plateau numérique, mondial, hors ligne, tout âge, zéro leçon de morale.

## 1. Test de vendabilité (Règle #10)

| # | Question | Réponse | Source |
|---|---|---|---|
| 1 | Mal profond | Peu de gens comprennent dette, intérêts, risque, épargne ; aucun jeu grand public ne le fait ressentir sans ennuyer. Pour un acheteur B2C, c'est du loisir : le mal est faible. Pour une école, une ONG ou une institution de microfinance, c'est un vrai besoin d'éducation financière. | [déduit] |
| 2 | Client | Joueur = tout le monde. Décideur/payeur probable = enseignant/école, ONG, banque ou microfinance (programmes jeunes), parent. | [déduit] |
| 3 | Pouvoir d'achat | B2C Afrique : faible pour un jeu payant. B2B éducation/IMF : budgets existants, mais non vérifiés. | [inconnu] |
| 4 | Solution vendue | « Le jeu où l'on apprend à gérer l'argent en s'amusant, sans qu'on nous fasse la leçon : une partie, et on comprend le crédit, le risque et l'épargne. » | [texte+déduit] |
| 5 | Résultat prouvable | À définir : mini-quiz avant/après sur 10 joueurs. Les études d'efficacité des jeux financiers sont faibles ; ne rien promettre sans mesure. | [inconnu] |
| 6 | Chemin vers le client | Aucun prénom. Piste : un enseignant d'économie ou de gestion à Tokat/Ouagadougou pour tester une classe. | [inconnu] |
| 7 | Prix et bouton payer | Non défini. Pistes : gratuit + paquets de cartes/scénarios payants, licence école/ONG, achat unique. | [inconnu] |
| 8 | Pourquoi maintenant / nous | Monopoly est long et éliminatoire ; aucun jeu hors ligne mondial avec mécanique de cercle d'épargne trouvé (non prouvé). Nous : coût de build quasi nul via agents, stack maîtrisée. | [déduit] |

**Verdict : 3/8 établis, 5 inconnus. Ni feu vert ni arrêt.** Q1 et Q3 sont rouges en B2C pur. Ça passe à 6/8 si on vise le B2B éducation (écoles, ONG, microfinance) et si Steve trouve un premier testeur (Q6). Ma proposition : construire le MVP à coût minimal (agents), le faire jouer à 10 vraies personnes, et décider du prix après.

Rappel une seule fois : doctrine = un produit à la fois (LivestockOS d'abord) et B2B. Si FINE avance en parallèle, il reste borné à un MVP jouable, sans chantier lourd.

## 2. Le jeu

**Plateau** : une boucle de ~40 cases, un monde de villes et de métiers (boutique, ferme, atelier, immeuble, transport, énergie, start-up). Pas d'univers unique : cases inspirées de plusieurs continents.

**Mécaniques** (jouer d'abord, apprendre en passant) :
- Achat de biens, loyers, revenus par tour, améliorations.
- **Cercle (signature, mondial)** : épargne rotative où chacun cotise et un joueur reçoit la caisse à tour de rôle. Existe sous des noms locaux : tontine, susu, esusu, tanda, chit fund, hui, altın günü (Turquie). Cases et cartes l'appellent « Cercle » avec le nom local selon la langue.
- Prêts : banque (intérêts) et entre joueurs (négociés).
- Événements : panne, hausse des prix, bonne affaire, impôts, crise, assurance.
- Trésorerie : on peut posséder beaucoup et manquer de cash, ce qui crée la tension.

**Fin de partie** (pas d'élimination, la partie ne s'arrête pas tant que personne n'a gagné) :
- Un joueur en faillite n'est pas éliminé : il repart via un prêt du Cercle avec un handicap.
- **Victoire = Liberté financière** : revenus passifs ≥ dépenses, ou patrimoine cible.
- 3 durées : Rapide (~20 min, cible basse), Standard (~1 h), Long (~2 h).

**Modes** : hotseat 2 à 4 sur un appareil, solo contre robots (3 niveaux), en ligne 2 à 4 (v2, après le hors ligne).

**Langues** : FR, EN, TR au lancement. Autres plus tard.

**Public** : tout âge. Mode « Famille » (cartes simples) et mode « Entrepreneur » (crédit, levier, assurance).

## 3. Technique

Next.js export statique + TypeScript + Framer Motion + SVG, PWA hors ligne. Moteur de règles pur en TypeScript, séparé de l'interface, avec tests (le moteur sert aussi aux robots et au futur multijoueur). Données du jeu (cases, cartes, textes) en JSON traduisible. Charte SDC. Détail et sources : `RECHERCHE.md`.

## 4. Plan de livraison (jalons)

1. **Moteur de règles + tests** (sans interface).
2. **Plateau jouable en hotseat** + une partie complète bout en bout.
3. **Robots solo**, sons et animations sobres, 3 durées.
4. **PWA hors ligne, FR/EN/TR**, déploiement Vercel.
5. **Test avec 10 vraies personnes** (quiz avant/après, ce qui ennuie, ce qui plaît).
6. **Ensuite seulement** : en ligne, prix, canal B2B.

Délégation : moteur et tests → Copilot via `delegate-code.ps1` (worktree isolé) ; textes et cartes FR/EN/TR → Ollama/Gemini ; interface et revue → moi ; vérification navigateur (Règle #1) → moi.

## 5. À décider par Steve

1. Valides-tu le **Cercle** comme mécanique signature (global, noms locaux) ?
2. Valides-tu la **victoire par Liberté financière** sans élimination ?
3. Cible de départ du produit : **écoles/ONG/microfinance** (B2B) ou grand public ?
4. Un prénom pour le premier testeur (prof, étudiant, ami) ?
5. Dépôt GitHub : privé tant que le MVP n'est pas jouable ?
