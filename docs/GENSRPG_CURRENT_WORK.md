# GenSrpG — reprise LIVE

**13 octobre 2026 — Phase 12 en cours. D1, D2 et D3 GREEN. D4 non ouvert.**

## Dernier checkpoint GREEN : D3 Dungeon Core211

- **Checkpoint :** `checkpoint/gensrpg-phase12-dungeon-core211-d3-green-2026-10-13`.
- **SHA testé :** `1e3c718a862704f819cb4eafe3fbaac6492b9344`. Branche D3 : `work/gensrpg-phase12-dungeon-core211-d3-extraction-2026-10-13`.
- **Départ §25 :** `checkpoint/gensrpg-start-phase12-dungeon-core211-d3-extraction-2026-10-13`, base GREEN D2 `06c3608f36d020ac4f470de4dbe4ca272da3b897`.
- **Fichier utilisateur §26 :** `ar.zip`, `index.html(4).txt`, 7 863 589 octets ; Git blob `e5f8895495f969597a6c209fcc29afd66b7a0636`, identique à D2 GREEN.
- **D3 :** bloc actif `dungeonCore211Consolidation` transféré byte-exact vers `assets/gensrpg/dungeon/core211-consolidation-v1.js` (17 511 octets, blob `bba60d921df20a114b489e17f9222e0c4f310871`) à son emplacement de chargement synchrone. Core104 reste désactivé et non modifié.
- **Index résultant :** 7 846 135 octets ; blob `18afb7fa25f86eea9993acc7f961fb7c11901168`. Tests exacts de reconstruction D3 → D2 → D1, sans changement de comportement ni ajout d'autorité.
- **CI GREEN au même SHA :** Architecture/Chromium [38435658574](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38435658574) SUCCESS (356 sentinelles structurelles + vrais tests navigateur), Firefox [38435658608](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38435658608) SUCCESS, Tactical [38435658635](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38435658635) SUCCESS.
- **Clôture documentaire postérieure au checkpoint :** seulement `docs/GENSRPG_CURRENT_WORK.md`, roadmap et rapport D3 ; l'extraction du checkpoint reste inchangée. Détails : `docs/GENSRPG_PHASE12_DUNGEON_CORE211_EXTRACTION_2026-10-13.md`.

## Jalons précédents

- **D2 GREEN** : `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13` (`06c3608f36d020ac4f470de4dbe4ca272da3b897`), 47 962 octets sortis vers `assets/gensrpg/dungeon/core051-exploration-polish-v1.js`.
- **D1 GREEN** : `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13` (`5d8d0d37982ac2987bd4c72326de28318a4687c6`), 22 768 octets sortis vers `assets/gensrpg/dungeon/core01-session-ui-v1.js`.
- **Gain cumulé D1–D3 :** 88 241 octets de JS externalisés, **88 069 octets nets retirés** de `index.html` (de 7 934 204 à 7 846 135 octets).

## Prochain lot D4 — non commencé

- Ne sélectionner D4 qu'après identification d'un bloc encore **actif et autonome** dans le HTML réel, pas seulement d'après le manifeste.
- **§25 :** checkpoint de départ sur D3 GREEN, puis branche D4 dédiée avant tout changement.
- **§26 :** demander à l'utilisateur le **nouvel index exact après D3** depuis `https://github.com/slyen4425-cloud/Zombicide-40k/blob/1e3c718a862704f819cb4eafe3fbaac6492b9344/index.html`, à zipper et retourner ; vérifier les **7 846 135 octets** et blob `18afb7fa25f86eea9993acc7f961fb7c11901168`. Ne pas réutiliser `ar.zip` pour le D4.
- Test de rollback lossless D4 → D3 → D2 → D1, graphe des propriétaires, E2E sur les quatre familles, Architecture/Chromium, Firefox, Tactical SUCCESS sur un même SHA avant GREEN. Éviter les audits non bloquants.

## Protections permanentes

- `main` gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Laboratoires Combat/Exploration hors périmètre, assets propres inchangés.
- 32 images historiques Survie conservées sans migration.
- Aucun gameplay PvP nouveau, aucune retouche gameplay/règles/sauvegardes, Shell maître de navigation, Core des services partagés.
- Relire avant reprise : `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` et cette page. Historique ancien archivé : `docs/history/GENSRPG_CURRENT_WORK_HISTORY_PRE_D1_2026-10-13.md`.
