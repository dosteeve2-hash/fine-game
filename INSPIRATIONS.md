# FINE Game — ce que les inspirations de Steve changent

> Tenu par la session cloud « liens Instagram » (dépôt `ambition`, `inspirations/finegame.md`).
> La session locale du jeu le lit, retient ce qui lui sert, et écrit ses réponses dans `SESSIONS.md` du dépôt `ambition`.
> Statut de chaque point : ✅ à faire · 🟡 à décider par Steve · ❌ refusé.

## Ce que le jeu a déjà (rien à refaire)

PWA installable (`manifest.webmanifest`, `sw.js`), moteur pur déterministe, équilibrage dans `src/data/*.json`, textes en clés i18n FR/EN/TR, hors ligne. Les Reels recommandent presque tous ces choix : on ne touche à rien.

## Reel Nick Saraev — « une application mobile complète avec Claude Code »

| Idée | Décision pour FINE Game |
|---|---|
| React Native + Expo, soumission à Apple | ❌ **Inutile.** Le jeu est une PWA qui marche hors ligne, sans compte développeur payant ni délai de validation. Reconsidérer seulement si une école ou une ONG exige une présence dans les boutiques |
| Version minimale d'abord | ✅ Déjà le plan du BRIEF (MVP jouable avant le prix) |
| Tester dans Chrome puis sur un vrai téléphone | ✅ Ajouter à la routine : parcours complet à **375 px** et **hors ligne** (réseau coupé après le premier chargement), à chaque PR d'interface |
| Notifications, séries, récompenses pour faire revenir | 🟡 **Prudence.** Le jeu s'adresse à « tout âge » dont des enfants : pas de séries qui culpabilisent, pas de notifications racoleuses. Un rappel doux pour finir une partie suffit. Décision à prendre avec la cible B2B (écoles) |
| Captures d'écran et fiche de boutique | 🟡 Utile pour la galerie et le dossier de présentation à une école, pas pour une boutique. Ne pas lancer avant le premier testeur nommé |

## Reel Ayo Omolewa — rétro-ingénierie de Subway Surfers

| Idée | Décision |
|---|---|
| Équilibrage piloté par des fichiers JSON | ✅ **Déjà le cas** (`src/data/config.json`, `board.json`, `events.json`). À garder strictement : aucun nombre d'équilibrage en dur dans le code |
| Mettre à jour ces JSON sans republier | 🟡 Possible avec le service worker (paquet de données versionné, récupéré quand le réseau revient, jamais requis pour jouer). **À ne faire que si** un testeur réel en a besoin : c'est une surface de plus à tester |
| Tests A/B et journal d'événements | ✅ **Version minimale seulement.** Pas de serveur de règles : le jeu est hors ligne. À la place, un journal local de parties (durée, mode, victoire, cause de faillite) que l'enseignant ou Steve peut exporter, pour régler l'équilibrage. **Aucune donnée personnelle, aucun identifiant d'enfant, rien d'envoyé sans action explicite** |
| Prix différent selon le profil de dépense du joueur | ❌ **Refusé**, définitivement. C'est le contraire d'un jeu d'éducation financière honnête, et §XVI d'`AMBITION.md` l'interdit. Si le jeu est payant : un prix unique, affiché, identique pour tous |
| Retirer le gain par publicité pour pousser à payer | ❌ Refusé pour la même raison. Pas de publicité dans un jeu pour enfants |

## Loi de Hick (charte SDC, 11/10/2026)

Une action principale par écran. Pendant le tour du joueur, le bouton « lancer » ou « terminer » domine ; « Mes biens », prêts et ventes restent à un toucher mais jamais au même poids. À vérifier sur la barre d'action du dernier commit à 375 px.

## Questions pour Steve (le BRIEF en a cinq restées sans réponse)

1. Cible de départ : **écoles / ONG / microfinance** ou grand public ? Tout le reste (prix, notifications, journal) en dépend.
2. Le prénom du premier testeur (Q6 de la Règle #10). Sans lui, pas de mesure du résultat.
3. Un paquet de données mis à jour sans republier : utile maintenant, ou plus tard ?
