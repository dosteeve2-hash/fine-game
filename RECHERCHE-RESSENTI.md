# FINE - Recherche : bibliothèques, sons, ressenti Monopoly (18/10/2026)

Méthode : chaque page citée a été ouverte, chaque licence lue sur la page, sauf mention **[non vérifié]**.
Les licences des jeux d'icônes viennent de l'API Iconify (`api.iconify.design/collections`). Galerie visuelle : `/galerie.html`.
Rien ci-dessous n'est un avis juridique : relire la licence de chaque fichier au moment de l'intégrer.

## A) Bibliothèques visuelles (classées pour nous, vente future incluse)

| # | Source | Licence lue | Attribution | Commercial | SVG | Idéal pour |
|---|---|---|---|---|---|---|
| 1 | [DiceBear, styles CC0](https://www.dicebear.com/styles/) (Lorelei, Notionists, Open Peeps, Thumbs, Pixel Art, Glass...) | CC0 1.0 | non | oui | oui (API ou npm `@dicebear/core`, code MIT) | **Mascotte** (personnage + réactions par graine) |
| 2 | [Kenney](https://kenney.nl/support) (dont [Board Game Icons](https://kenney.nl/assets/board-game-icons), 250 fichiers) | CC0 (page du pack) | non (logo Kenney interdit) | oui | formats du pack [non vérifié] | Pions, icônes de plateau, cartes, **sons** |
| 3 | [Iconify](https://iconify.design/docs/api/) + jeux ci-dessous | par jeu | par jeu | selon jeu | oui (API gratuite, JSON par lot) | Tout : pions, coins |
| 3a | Noto Emoji (Google) via Iconify | Apache 2.0 | mention de licence | oui | oui | **Pions** couleur (voiture, tracteur, chameau, coq...) |
| 3b | Fluent Emoji Flat (Microsoft) | MIT | mention de licence | oui | oui | **Pions** couleur, style doux (le plus proche d'une "mascotte-jouet") |
| 3c | Phosphor, Tabler (MIT), Lucide (ISC), Material Design Icons (Apache 2.0) | idem | mention de licence | oui | oui | Coins du plateau sobres, UI |
| 3d | Game-icons.net via Iconify | **CC BY 3.0** | **obligatoire** | [la page n'en parle pas ; CC BY l'autorise] | oui via Iconify ; page about : pas de lien SVG direct | Silhouettes de pions, coins (banque, prison, juge) |
| 3e | OpenMoji, Twemoji, Streamline Emojis | CC BY-SA 4.0 / CC BY 4.0 / CC BY 4.0 | obligatoire (OpenMoji : partage à l'identique des dérivés) | oui | oui | Pions couleur contour net ; à éviter si on veut un code fermé (SA) |
| 4 | [unDraw](https://undraw.co/license) | licence maison | non | oui | non précisé | Illustrations de scènes (onboarding). **Interdits** : IA/ML, packs concurrents, scraping |
| 5 | [Open Peeps](https://www.openpeeps.com/) | CC0 | non | oui | SVG + PNG | Personnages humains (joueurs, banquier) |
| 6 | [LottieFiles](https://lottiefiles.com/page/license) | Lottie Simple License | non (conseillée) | oui | JSON Lottie (pas SVG) | **Animations** (confettis, pièces, prison) ; ne pas recompiler en service concurrent |
| 7 | [OpenGameArt](https://opengameart.org/content/faq) | **varie par fichier** (CC0, CC BY, CC BY-SA, OGA-BY, GPL) | selon fichier | oui hors GPL strict | selon fichier | Pions, tuiles, sons : toujours lire la licence du fichier, pas de l'aperçu |
| 8 | [DiceBear, styles CC BY 4.0](https://www.dicebear.com/licenses/) (Fun Emoji, Adventurer, Micah, Big Smile, Toon Head...) | CC BY 4.0 | **obligatoire** (artiste + lien licence + modifs) | oui | oui | Mascotte si le style plaît beaucoup ; ajouter une page crédits |
| 9 | DiceBear Avataaars / Bottts | "gratuit usage perso et commercial" (Pablo Stanley), texte complet non lu | à relire sur la source | oui | oui | Mascotte robot (Bottts) ; licence à confirmer **[non vérifié]** |
| 10 | [Noun Project](https://thenounproject.com/legal/) | domaine public ou CC BY 3.0 par icône | CC BY : oui, sauf achat | oui (sauf objets revendus, attribution sur l'objet) | oui | Icônes ponctuelles ; filtrer "domaine public" |
| 11 | [Storyset](https://storyset.com/terms) (Freepik) | licence maison | **obligatoire en gratuit** | oui avec crédit, pas de revente en pack | non précisé | Illustrations d'accueil ; contrainte de crédit visible |
| 12 | [Lordicon](https://lordicon.com/pricing) | plan gratuit | **obligatoire** | oui (page pricing) | animations Lottie | Micro-animations d'icônes (texte de licence 404, **[non vérifié]** en détail) |
| 13 | Flaticon, [SVG Repo](https://www.svgrepo.com/) | Flaticon : attribution (gratuit) ; SVG Repo : page en 429 | - | - | - | **[non vérifié]** : licence par fichier, à lire au cas par cas. SVG Repo mélange CC0/MIT/Apache/CC BY sans garantie ici |

**Écarté / avec réserve :** aucune source écartée pour "non commercial", mais : OpenMoji (SA, contraignant), Storyset et Lordicon (crédit imposé), unDraw (interdit l'usage IA, scraping), Flaticon (crédit sauf abonnement, bots interdits). Les photos du Noun Project (CC BY-NC-ND) sont exclues.

**Point technique important :** l'API Iconify limite le débit (HTTP 429 observé pendant les tests). Pour la production : télécharger les SVG retenus dans le dépôt, ou installer `@dicebear/core` (MIT). Ne jamais dépendre d'une API publique en direct dans le jeu.

**Ma lecture pour FINE :**
- Mascotte : **Lorelei / Notionists / Open Peeps** (CC0, expressifs, graine = personnage unique), ou un personnage-objet dessiné sur mesure en gardant la palette SDC.
- Pions : **Fluent Emoji Flat** (MIT, couleur, charmants) ou **Noto** (Apache 2.0). Game-icons si l'on veut des silhouettes à teinter par joueur (crédit obligatoire).
- Coins : Game-icons (banque, balance, banc, feu de camp) ou Phosphor/Tabler si l'on veut sobre.

## B) Sons et musique libres (complément à l'audio synthétisé)

| Source | Licence lue | Attribution | Commercial | À prendre |
|---|---|---|---|---|
| [Kenney Casino Audio](https://kenney.nl/assets/casino-audio) (50 fichiers, tags : cartes, dés, jetons) | CC0 | non | oui | **Dés, jetons, cartes** : meilleur candidat |
| Kenney : [Interface Sounds](https://kenney.nl/assets/interface-sounds), [Impact Sounds](https://kenney.nl/assets/impact-sounds), [Music Jingles](https://kenney.nl/assets/music-jingles), [RPG Audio](https://kenney.nl/assets/rpg-audio), [UI Audio](https://kenney.nl/assets/ui-audio) | CC0 d'après la page Kenney (licence par pack non relue pour chacun) | non | oui | Clics, impacts (porte de prison), jingles de victoire |
| [Freesound](https://freesound.org/help/faq/) | **par son** : CC0 (libre), CC BY (crédit), CC BY-NC (**interdit en commercial**), Sampling+ (pas de pub) | selon son | CC0 et CC BY oui | Sons précis (cellule, coffre, applaudissements). Compte requis. Filtrer CC0 |
| [Pixabay](https://pixabay.com/service/terms/) | Pixabay Content License, couvre musique et effets | non (appréciée) | oui | Musique d'ambiance. Interdit : revente isolée du fichier brut |
| [OpenGameArt](https://opengameart.org/content/faq) | par fichier | selon fichier | oui hors GPL strict | Musique de boucle ; lire la licence de l'audio, pas de l'aperçu |
| Mixkit | page de licence ouverte mais texte non affiché ; des sources secondaires disent "commercial oui, crédit non requis" | - | - | **[non vérifié]**, relire mixkit.co/license avant usage |

Règle : garder un fichier `CREDITS` listant chaque son non CC0 (titre, auteur, licence, lien).

## C) Ressenti de Monopoly (ce que disent de vrais joueurs et analystes)

Sources réellement ouvertes : [Zivanovic (analyse psychologique)](https://zivanovic.substack.com/p/why-is-monopoly-so-frustrating),
[Meeple Mountain (défense du jeu)](https://www.meeplemountain.com/articles/in-defence-of-monopoly-why-a-toxic-attitude-is-bad-for-the-hobby),
[California Magazine (prof. Acland)](https://alumni.berkeley.edu/california-magazine/online/mind-boggled-berkeley-prof-board-game-addict/),
[Today I Found Out (histoire des pions)](https://www.todayifoundout.com/index.php/2012/11/monopoly-pieces/),
[TheGamer (test de l'appli)](https://www.thegamer.com/monopoly-mobile-review/).
**Non ouvertes (résumé de moteur de recherche seulement, [non vérifié]) :** [fil Reddit r/tabletopgamedesign](https://www.reddit.com/r/tabletopgamedesign/comments/1in0a8v/problems_with_monopoly/), blog [DanQ](https://danq.me/2013/04/03) (page de teaser seule), avis d'appli AppGamer (403), Smithsonian (403). Je n'ai pas pu lire les avis App Store/Play eux-mêmes.

**Ce qui rend Monopoly attirant**
- **Dés et action** : lancer, avancer, un sentiment d'action constant et d'inattendu (Zivanovic).
- **Posséder et voir sa fortune grandir** : sentiment de compétence ; **choisir où investir** : sentiment de liberté (Zivanovic).
- **Le social** : blagues, échanges, rires ; le jeu "crée le contexte d'une vraie interaction" (Meeple Mountain). Prof. Acland : on vend parce qu'on peut se chamailler et se chambrer.
- **Les histoires** : prison, mauvais jets, fins de partie tendues deviennent des souvenirs partagés (Meeple Mountain). Rituel : règles maison transmises par la famille.
- **Les pions-objets** : à l'origine aucun pion (boutons, pièces), puis métal 1937 (voiture, fer, dé à coudre, chaussure, haut-de-forme...), bois en 1942 faute de métal ; le chien, le cheval-cavalier et la brouette remplacent lanterne, bourse et cheval à bascule dans les années 1950 ; un onzième pion (sac d'argent) a été choisi par vote (Today I Found Out). Il y a une vraie **histoire autour des objets**, que les joueurs adoptent.
- **L'appli** : le plateau 3D animé, les pions qui bougent joyeusement et la musique sont salués ; un mode rapide (sans taxes/cartes, prison d'un tour, fin à la première faillite) répond à la longueur (TheGamer).

**Ce qui frustre**
- **Loyers qui grignotent** le capital, sentiment de perdre sans contrôle ; la prison peut même sembler un refuge face aux loyers (Zivanovic).
- **Durée** : jusqu'à ~3 h, le plaisir s'effondre avant la fin, la lassitude s'installe ; ressentiment envers le joueur qui s'enrichit (Zivanovic).
- **Élimination et chance excessive**, décisions pauvres ("acheter est presque toujours bon") : thèmes récurrents dans les résumés de recherche sur le fil Reddit et les blogs **[non vérifié]**. Acland : "pire jeu jamais devenu un succès", mais on le joue pour le conflit.
- **Appli** : enchères chaotiques, multijoueur buggé, jeu à plusieurs sur un seul téléphone peu pratique (TheGamer).

**Les "moments" à retenir :** (1) le suspense du dé qui roule, (2) la case qu'il manque pour le groupe, (3) la maison puis l'hôtel qui rend le loyer cruel, (4) la négociation qui fait rire ou crier, (5) le pion qu'on a choisi et qui nous représente, (6) la prison et son "tour de moins", (7) la fin où la fortune de l'un écrase les autres.

## D) 15 idées pour FINE (sans copier Monopoly)

Effort : P petit, M moyen, G grand. Règles : modifie-t-on les règles ?

| # | Idée | Effet recherché | Effort | Règles |
|---|---|---|---|---|
| 1 | **Roulé de dés avec suspense** : dés qui roulent, ralentissent, un temps d'arrêt, rebond sonore (sons Kenney CC0) | Le frisson du dé | P | non |
| 2 | **Pions-personnages** : nom, petit trait ("Le Tracteur est patient"), réaction quand il atterrit | Attachement au pion | M | non |
| 3 | **Mascotte qui réagit** (sourire, sursaut, clin d'oeil) aux événements : bonne affaire, impôt, faillite | Vie, ton, pédagogie | M | non |
| 4 | **Scènes courtes de 2 s pour Banque / Impôt / Cercle / Repos / faillite** (icône animée, phrase) | Chaque case a une histoire | M | non |
| 5 | **Équivalent original de la prison : "L'audit"** : on rate un tour mais on peut aussi payer pour régulariser ; mini-leçon sur la dette | Tension + humour + pédagogie | M | oui |
| 6 | **Ambiance sonore** : boucle de fond légère + sons de pièces, cartes, jetons (Kenney Casino) | Sentiment de table réelle | P | non |
| 7 | **Panneau "mes biens" accessible à tout moment** (vendre, hypothéquer, voir loyers) | Moins de frustration, contrôle | M | non |
| 8 | **Clarté de qui joue** : halo doré, pion qui rebondit, bandeau "C'est à Léa" | Rythme et lisibilité | P | non |
| 9 | **Compte à rebours doux pour la décision** (optionnel, pas de pénalité) | Éviter les temps morts | P | non |
| 10 | **Cartes événement narrées** avec une illustration et une petite histoire locale | Ambiance, rire, éducation | M | non |
| 11 | **Négociation guidée** (proposer échange en deux touches, la mascotte commente) | Le meilleur moment social | G | non |
| 12 | **Enchère rapide à timer** quand quelqu'un refuse d'acheter | Moins de chaos qu'une enchère libre | M | oui |
| 13 | **Mode "partie courte"** : objectif patrimoine, fin à N tours ou à la première faillite | Durée maîtrisée | M | oui |
| 14 | **Filet anti-élimination** : un joueur en faillite devient "conseiller" et touche un petit bonus de fin | Plus de spectateurs frustrés | G | oui |
| 15 | **Moments de fête** : confettis, pièces qui volent, ralenti à l'achat du dernier terrain d'un groupe | Récompense émotionnelle | M | non |

Priorité d'impact par rapport au coût : 1, 8, 6, 3, 5.

## Limites
- Avis de joueurs : je n'ai pu lire ni App Store ni Google Play ni Reddit directement ; la part "élimination/chance" repose sur des résumés de recherche **[non vérifié]**.
- Licences DiceBear Avataaars/Bottts, Flaticon, SVG Repo, Lordicon (détail), Mixkit : non confirmées en texte intégral.
- Les noms d'icônes de la galerie ont tous répondu via l'API Iconify (JSON en lot) ; les URL directes `.svg` n'ont pas toutes été rouvertes une à une à cause de la limite de débit.
