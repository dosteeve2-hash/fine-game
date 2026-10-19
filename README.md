# FINE Game

**Fin**ancial **E**ducation Game : un jeu de plateau numérique, hors ligne, pour tous les âges. On joue, on apprend sans qu'on nous fasse la leçon.

Voir `BRIEF.md` (vision et plan), `RULES.md` (règles du moteur), `RECHERCHE.md` (marché et technique).

## Application mobile

FINE s’installe comme une application depuis le navigateur (PWA), sans store :

- **Android / Chrome** : bouton « Installer l’application » sur l’écran d’accueil du jeu (ou menu ⋮ → Installer).
- **iPhone / Safari** : Partager → « Sur l’écran d’accueil ». Une petite fiche l’explique une seule fois.

Une fois installée : plein écran, orientation portrait, icône adaptative, écran de démarrage, jeu hors ligne (service worker `public/sw.js`). Les images d’application sont générées par `python scripts/make-app-images.py`.

### Plus tard : les stores (rien n’est engagé aujourd’hui)

| Étape | Outil | Coût |
|---|---|---|
| Google Play | [PWABuilder](https://www.pwabuilder.com) génère un paquet Android (Trusted Web Activity) à partir de l’URL en ligne | compte Google Play Console : 25 USD une fois |
| App Store | PWABuilder (paquet iOS) ou [Capacitor](https://capacitorjs.com) autour de l’export statique `out/`, compilé sur un Mac avec Xcode | Apple Developer Program : 99 USD par an |

Prérequis communs : politique de confidentialité en ligne, captures d’écran, fiche du store en FR/EN/TR. Le son, l’état de la partie et le profil restent locaux : aucune donnée personnelle n’est envoyée.
