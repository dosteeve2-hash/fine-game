# FINE Game — brief de refonte « sensation de vrai jeu » (v2 de l'interface)

Retour de Steve après le premier test : le jeu est fonctionnel mais « robotique » : pas fluide, emojis enfantins, il faut faire défiler pour appuyer, mauvaise version ordinateur, trop rapide, pas de mascotte, pas de musique ni de sons, notices trop sèches. Il veut **l'expérience de Monopoly** (pour l'esprit, jamais la copie) adaptée à FINE : liberté financière, global, tout âge, sans morale.

Règle d'or : **s'inspirer des idées de Monopoly, ne rien copier**. Mascotte, sons, musique, icônes, cartes : tout doit être original.

## 1. Icônes professionnelles (zéro emoji)
- Installer `lucide-react` (une seule installation npm à la fois ; vérifie qu'aucun autre `npm` ne tourne ; sous Windows, deux installs parallèles corrompent node_modules).
- Remplacer tous les emojis (familles, cases, 🏆, etc.) par des icônes SVG cohérentes (même épaisseur de trait, mêmes tailles). Familles : commerce, agriculture, immobilier, transport, énergie, technologie. Cases : Jour de paie, Banque, Cercle, Événement, Opportunité, Impôt, Repos.
- Aucune icône ne doit ressembler à un emoji ; chaque famille garde sa couleur (voir `src/ui/theme.ts`).

## 2. La mascotte (originale)
Concept imposé : **Fino, une pièce vivante** (disque doré avec reflet, grands yeux expressifs, petit sourire, éventuellement une minuscule casquette ou un éclat). Elle n'a rien d'un homme à moustache ni de chapeau haut-de-forme. Dessinée en SVG animé (framer-motion), avec au minimum ces expressions : repos (clignement), content, réfléchit, surpris, inquiet, célèbre. Elle est le logo de l'écran d'accueil, apparaît au centre du plateau, réagit aux cartes (opportunité = content, événement négatif = inquiet), célèbre à la victoire.

## 3. Son et musique (originaux, synthétisés, hors ligne)
- Aucun fichier audio : tout est synthétisé avec Web Audio (pas de dépendance, marche hors ligne).
- Musique de fond en boucle, douce et chaleureuse, mondiale (gamme pentatonique, sons de type kalimba/marimba + nappe discrète, ~90-100 bpm), qui démarre au premier appui sur « Lancer la partie » (politique d'autoplay des navigateurs). Très différente de la musique de Monopoly.
- Effets : lancer de dés (secousse + roulement + claquement), pas du pion (petit tic), achat (pièces), loyer payé (pièces qui descendent), loyer reçu (pièces qui montent), amélioration (montée), carte retournée (froissement) avec variante opportunité (scintillement) et événement (grave), prêt, Cercle, faillite/redémarrage, victoire (fanfare), appui sur un bouton.
- Bouton son/musique visible en jeu (muet, volume), choix mémorisé (localStorage dans un try/catch), musique en pause quand l'onglet est caché, respect du mode muet.

## 4. Rythme et animations (fluide, jamais robotique)
- Un tour doit se raconter : annonce « Tour de X » (bannière avec la mascotte), dés lancés avec **deux dés** qui roulent ~1,2 s (modifier le moteur pour que l'événement `dice.rolled` fournisse aussi les deux valeurs, par ex. un champ optionnel `dice: [a, b]` ; ne rien changer d'autre dans les règles), pion qui **saute case par case** (~200-260 ms par case, petit arc, tic sonore), case d'arrivée qui pulse, puis la résolution (carte, achat, loyer).
- Les robots jouent plus lentement et lisiblement : ~1,2 à 1,8 s entre deux décisions, avec une indication « X réfléchit… » et la même mise en scène que l'humain.
- Les montants de cash se comptent (compteur animé) avec des « +120 / −60 » flottants.
- Achat : la case se teinte aux couleurs du propriétaire, la fiche de propriété se retourne. Amélioration : petits bâtiments (1 à 3) sur la case, apparition en ressort. Loyer : pièces qui volent du payeur vers le propriétaire.
- Transitions d'écran douces. Tout animé avec `transform` et `opacity` seulement (60 fps sur un téléphone d'entrée de gamme). Respecter `prefers-reduced-motion` (animations réduites, jamais supprimées au point de casser le jeu).

## 5. Cartes et notices, façon Monopoly mais explicatives
- Cartes Événement et Opportunité : plein écran sur fond assombri, dos de carte original (motif aux couleurs SDC), **retournement 3D**, titre, texte, montant, et **une ligne « Dans la vraie vie »** qui explique le principe financier derrière, en ton léger, sans leçon de morale (ex. pourquoi une assurance coûte une prime). Ajouter les clés `card.<id>.tip` / `opportunity.<id>.tip` pour les 40 cartes en FR/EN/TR dans `src/data/i18n/*.json` (parité des clés vérifiée par les tests).
- Fiche de propriété (« titre ») façon carte à bande de couleur : nom, famille, prix, revenus aux niveaux 1/2/3, loyer, coûts d'amélioration. S'ouvre en tapant sur une case, et s'affiche quand on y atterrit.
- Cases neutres expliquées : taper une case Repos, Impôt, Banque, Cercle, Événement, Opportunité, Jour de paie ouvre une petite fiche qui dit ce qu'elle fait. Ajouter les textes (3 langues) aux messages d'interface.
- Notices contextuelles courtes pour chaque événement important (loyer, prêt, Cercle, faillite), lisibles, qui restent assez longtemps (~3 s) et se ferment au toucher.

## 6. Plateau façon vrai plateau de jeu
- Quatre coins distincts (départ/Jour de paie, Banque, Repos, Cercle ou équivalent), bandes de couleur de famille sur le bord intérieur des cases comme sur un plateau de société, noms courts lisibles sur grand écran, icônes + prix sur téléphone.
- Au centre : logo FINE + Fino, zone des dés animés, caisse du Cercle, indicateur du tour.
- Pions : de vrais pions (formes SVG distinctes par joueur et couleur, ombre portée), pas des ronds.
- Joli en 375×812 comme en 1280×800 et 1920×1080.

## 7. Disposition : plus jamais besoin de faire défiler pour jouer
- **Téléphone** : plateau en haut qui tient à l'écran, **barre d'action fixe en bas** (safe-area iOS) avec l'action principale toujours visible (Lancer / Acheter / Finir le tour) et les actions secondaires dans un panneau qui monte (bottom sheet). Bandeau des joueurs compact. Zones tactiles ≥ 44 px.
- **Ordinateur** (≥ 1024 px) : plateau grand et centré à gauche, colonne latérale à droite (joueurs, fiche de la case, journal, barre d'action). Raccourcis clavier : Espace = action principale, Échap = fermer, M = muet.
- Aucun défilement nécessaire pour accomplir un tour.

## 8. Qualité et contraintes
- Ne pas casser : moteur et ses règles (seul ajout permis : valeurs des deux dés dans `dice.rolled`), `npm run typecheck`, `npm test` (19 tests au vert, ajouter un test pour les deux dés), `npm run messages`, i18n FR/EN/TR (toutes les nouvelles chaînes dans les trois langues, mêmes paramètres), PWA hors ligne (mettre à jour le service worker si besoin, bumper la version du cache), en-têtes de sécurité (`vercel.json`).
- TypeScript strict, pas de `any`, pas de `console.log`, composants fonctionnels, Tailwind, charte SDC (fond #070e1f, or #f0a832, Playfair Display / Outfit / JetBrains Mono), accessibilité (aria-labels, focus visible, contraste), états de chargement et d'erreur.
- Séparer l'audio (`src/ui/audio/`), les icônes, la mascotte (`src/ui/components/Fino.tsx`) et le plateau en modules clairs.
- Windows : jamais deux `npm install` en parallèle ; `jsx` est en `react-jsx`.

## 9. Preuves attendues avant de dire « terminé » (Règle #1)
1. `npm run typecheck && npm test && npm run messages && npx next build` passent.
2. Test réel dans le navigateur intégré, en 375×812 **et** en 1280×800 : une partie complète (2 joueurs + robot, puis 4 joueurs), sans erreur console, sans jamais faire défiler pour jouer, avec captures d'écran vérifiées visuellement (plateau, carte retournée, fiche de propriété, barre d'action, victoire).
3. Vérifier que la musique démarre après le premier appui et que le bouton muet coupe tout (contrôler que l'AudioContext est « running » puis « suspended »).
4. Déployer : `vercel deploy --prod --yes` depuis le dépôt (projet déjà lié, alias https://fine-game-three.vercel.app), vérifier l'URL en ligne.
5. Commits clairs sur une branche `feat/ui-polish`, puis fusion rapide (ff-only) dans `main` et push. Terminer les messages de commit par `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## 10. Rapport final (court)
Ce qui est fait, ce qui est vérifié (et comment), ce qui reste, l'URL en ligne, et toute limite honnête (par exemple l'audio ne peut pas être « écouté » par un agent : dire exactement ce qui a été vérifié techniquement).
