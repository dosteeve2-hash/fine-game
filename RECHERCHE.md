# Jeu de société numérique d'éducation financière (PWA hors ligne) — Recherche

Date : 2026-10-17. Sources = résultats de recherche web ; tout ce qui vient de ma connaissance générale ou n'a pas été ouvert est marqué [non vérifié]. Aucun code, aucune installation.

## 1. Jeux existants

| Jeu | Ce qui marche | Ce qui ennuie / bloque |
|---|---|---|
| Monopoly | Universel, règles connues de tous. | Longueur (1-2 h à 4), élimination, chance dominante ([Casual Game Revolution](https://casualgamerevolution.com/node/325)). L'original de Lizzie Magie (1903) avait deux jeux de règles dont un où tous gagnent quand la richesse est créée ([Public Domain Review](https://publicdomainreview.org/collection/the-landlords-game)). Piste : reprendre l'idée coopérative. |
| Cashflow 101 (Kiyosaki) | Facile à prendre en main ; états financiers personnels au centre ([Hexagamers](https://hexagamers.com/cashflow-review/)). | Prix (195 $ en 2006, [Honolulu Advertiser](https://honoluluadvertiser.com/article/2006/Feb/02/bz/FP602020322.html)), tenue de comptes fastidieuse, chiffres jugés irréalistes (Hexagamers). Cadre "rat race" américain, immobilier/actions. |
| Catan, Splendor | Splendor a une version numérique officielle (solo, pass & play, en ligne), primée Golden Geek 2015 ([Meeple Mountain](https://meeplemountain.com/reviews/splendor-app)). Moteur d'engrenage : on voit sa progression. | Pas d'éducation financière explicite ; rien trouvé sur l'app Catan. |
| Business Tour (PC, clone Monopoly) | Hotseat 4 joueurs, éditeur de cartes, enchères ([Steam](https://store.steampowered.com/app/397900/Business%20Tour)). | Free-to-play avec monnaie virtuelle, note moyenne (Epic 3,5), contexte occidental. |
| Loy Loy (UC Irvine IMTFI) | Jeu sur une ROSCA (tontine) cambodgienne : chacun cotise, un joueur reçoit la cagnotte chaque mois, imprévus, but collectif (acheter une usine) ; conçu "contre Monopoly" ([UCI](https://www.socsci.uci.edu/newsevents/news/2018/2018-01-26-imtfi.php)). | Jeu de recherche, pas un produit grand public. Meilleur précédent conceptuel trouvé. |
| Awalé / Ayo / Songo / Mancala (apps) | Apps avec tutoriels, hors ligne à 2 ([Mancala AppOn](https://apps.apple.com/app/id854357402), [Babtun's Ayo](https://apps.apple.com/app/id1049380746), [Ayo Game](https://sourceforge.net/app/ayo-game/android/)). | Notes faibles (2,6/5 sur 233 avis pour AppOn), monétisation intrusive ; aucun lien avec l'argent. |
| Études d'efficacité | Étude taïwanaise (401 questionnaires) : Cashflow 101 associé à la littératie financière ([Airiti](https://www.airitilibrary.com/Article/Detail/18105149-N202301140003-00003)). Pilote malaisien (77 élèves) : besoins vs envies ([BAFE 2024](https://atlantis-press.com/proceedings/bafe-24/126009244)). | Auto-déclaratif, sans groupe témoin. Aucune preuve causale trouvée. |

**Trous du marché**
- Aucun jeu trouvé sur Ajo/Esusu/Susu/tontine ouest-africaine (la recherche n'a rien renvoyé ; exhaustivité [non vérifié]).
- Aucun jeu hors ligne, multi-âges, avec monnaie locale (FCFA, mobile money) et événements locaux (récolte, soudure, cérémonies).
- Les jeux soit imposent un livre de comptes (Cashflow), soit un récit prédateur (Monopoly). Trou : la finance comme mécanique ressentie, pas comme leçon.

## 2. Mécaniques financières qui s'apprennent sans leçon

Principe : la mécanique fait vivre la conséquence ; l'écran ne dit jamais "il fallait". Un récapitulatif factuel (courbe de patrimoine) en fin de partie suffit. [Propositions de design, non issues de la recherche.]

- **Intérêts composés** : un champ/atelier rapporte x % par tour sur le capital laissé ; la courbe de patrimoine s'incurve vers le tour 8. Aucun texte.
- **Dette** : prêt rapide (usurier) vs prêt lent (coopérative). Même somme, remboursements très différents ; la dette qui roule bride les tours futurs.
- **Assurance** : cotisation faible chaque tour face à une carte-sinistre rare mais dure (incendie, maladie, mort du bétail). Les assurés survivent, ceux qui ont gardé la prime non.
- **Tontine / épargne rotative** (repris de Loy Loy) : chacun cotise, un joueur ramasse la cagnotte à tour de rôle ; tension : celui qui touche en premier peut cesser de cotiser (confiance, réputation). Mécanique coopérative qui évite l'élimination.
- **Microcrédit** : petit prêt de groupe avec caution solidaire : si un membre ne rembourse pas, les autres paient.
- **Inflation** : les prix des cartes montent doucement ; l'argent dormant perd son pouvoir d'achat.
- **Diversification et risque** : plusieurs actifs (champ, boutique, bétail, mobile money) avec chocs différents (sécheresse, grève, panne réseau). Tout miser = gros gain ou ruine.
- **Contre l'ennui de Monopoly** : pas d'élimination (filet de sécurité communautaire), durée cible 20-30 min, décisions simultanées, objectif collectif + classement individuel.

## 3. Stack technique hors ligne

| Option | Pour | Contre |
|---|---|---|
| Phaser | Cadre 2D complet, ~500 Ko ([cinevva](https://app.cinevva.com/guides/web-game-engines-comparison)) ; licence MIT [non vérifié : une source le dit "freemium"]. Skills Claude existants (§4). | Un jeu de plateau est surtout de l'UI : le canvas gère mal texte, accessibilité, formulaires, i18n. |
| PixiJS | Léger (~200 Ko), rendu rapide ([toolradar](https://toolradar.com/compare/pixijs-vs-phaser)). | Renderer seulement : tout le reste à écrire. |
| Godot export web | Éditeur complet. WebGL2 seulement ([cinevva](https://app.cinevva.com/guides/web-game-engines-comparison)). | Export wasm lourd, en-têtes COOP/COEP pour builds threadés [non vérifié], peu adapté aux Android d'entrée de gamme et au texte multilingue. |
| Next.js + SVG/canvas + Framer Motion en PWA | Stack connue de Steve, texte/UI/i18n natifs, accessibilité, animation de pions et cartes, déploiement Vercel. Service worker + manifest = hors ligne [connaissance générale, non vérifié]. | Pas de moteur physique (inutile ici). Prévoir un export statique (`output: 'export'`) [non vérifié]. |

**Multijoueur** (par priorité)
1. **Hotseat sur un seul appareil** : cas d'usage réel (un téléphone partagé). Zéro réseau, obligatoire en v1.
2. **P2P WebRTC local** (v2) : la poignée de main (signaling) exige un serveur ou un échange manuel. PeerJS + PeerServer auto-hébergé ([FAQ PeerJS](https://peerjs.com/client/faq)) ou Trystero avec relais WebSocket auto-hébergé ([GitHub Trystero](https://github.com/dmotz/trystero), version récente requise, [non vérifié](https://npmjs.com/package/trystero)). Sans internet ni serveur LAN, il reste l'échange de code SDP par QR code [non vérifié] : à prototyper avant de le promettre.

**Recommandation unique : Next.js (export statique) + React + Framer Motion + SVG/CSS (canvas seulement si besoin), en PWA avec service worker, hotseat en v1.** Le jeu est une UI de cartes et de texte, pas un jeu d'action : stack déjà maîtrisée, la moins coûteuse à maintenir, la meilleure pour FR/EN/langues locales et pour l'accessibilité.

## 4. Outils installables

Rien installé. URLs issues de la recherche ; lire le SKILL.md / le dépôt avant d'installer.

**Skills Claude Code**
- Game Design Document : [claudemarketplaces.com](https://claudemarketplaces.com/skills/ityes22/game-design-document/game-design-document) (GDD de 40-80 pages en .docx/.pdf : trop lourd pour nous).
- Game Design Doc Governance : [claudskills.com](https://claudskills.com/skills/game-design-doc-governance/) (GPL-3.0, audit Python).
- Game Design (équilibrage, progression) : [claudskills.com](https://claudskills.com/skills/game-design/).
- Phaser : [chongdashu/phaserjs-tinyswords](https://tomevault.io/tome/chongdashu/phaserjs-tinyswords), [terminalskills phaser](https://openskillindex.com/skills/terminalskills-skills-phaser). Seulement si Phaser est choisi (non recommandé).
- Déjà installés chez Steve et pertinents : `ui-ux-pro-max`, `design-taste-frontend`, `high-end-visual-design`, `imagegen-frontend-mobile`.

**MCP servers**
- [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp) (~4,6 k étoiles selon [dev.co](https://dev.co/ai/mcp/godot-mcp), à confirmer sur GitHub). Seulement si Godot, hors recommandation.
- Pour la stack recommandée : Context7 (docs Next.js/Framer Motion) et le navigateur intégré pour les tests réels, déjà disponibles. Canva `generate-image` pour des assets [non testé pour ce projet].

**Tests** [pistes, non vérifiées par la recherche]
- Vitest sur un moteur de règles séparé de l'UI et déterministe (graine aléatoire) ; Playwright pour le parcours hotseat et le mode hors ligne ; simulations Monte-Carlo (milliers de parties automatiques) pour équilibrer les cartes.

## Questions ouvertes
- Règle #10 : s'il s'agit d'un projet d'apprentissage, pas de test ; sinon, qui paie ? (écoles, ONG, microfinance, ou achat unique grand public). Rien trouvé sur la disposition à payer du public cible.
- Faire valider les événements et les montants par de vrais utilisateurs locaux avant de figer les cartes (zéro faux chiffre).
