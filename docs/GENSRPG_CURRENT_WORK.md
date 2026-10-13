# GenSrpG — reprise LIVE

**Date : 13 octobre 2026.** Phase 12 en cours : D1 et D2 GREEN, **D3 Dungeon Core211 Consolidation ouvert**.

## Chantier actif D3

- **Dernier checkpoint GREEN :** `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13`, SHA `06c3608f36d020ac4f470de4dbe4ca272da3b897`.
- **Checkpoint de départ D3 (§25) :** `checkpoint/gensrpg-start-phase12-dungeon-core211-d3-extraction-2026-10-13` au SHA `06c3608f36d020ac4f470de4dbe4ca272da3b897`.
- **Branche de travail D3 :** `work/gensrpg-phase12-dungeon-core211-d3-extraction-2026-10-13`.
- **Source §26 certifiée :** ZIP utilisateur `ar.zip`, entrée `index.html(4).txt`, 7 863 589 octets, Git blob `e5f8895495f969597a6c209fcc29afd66b7a0636` exactement conforme au checkpoint D2.
- **Propriétaire D3 :** `dungeonCore211Consolidation` (Dungeon actif, `crossDomains: []`), 17 511 octets, blob `bba60d921df20a114b489e17f9222e0c4f310871`. Cible `assets/gensrpg/dungeon/core211-consolidation-v1.js`. Index attendu après extraction : 7 846 135 octets, blob `18afb7fa25f86eea9993acc7f961fb7c11901168`.
- **Écart de cartographie :** Core104 initialement considéré, mais sa balise porte `type="application/x-gensrpg-disabled"` ; écarté sans modification.
- **Périmètre :** déplacer exactement la seule IIFE Core211, conserver ordre parser, interfaces et comportement ; zéro nouvelle autorité, wrapper, règle métier, modification d'assets ou changement de sauvegardes.
- **Garde-fous :** script de transformation SHA/longueur verrouillés ; réversion exacte D3 → D2 → D1 → source, sentinelles historisées, vrais tests navigateur multi-modules + CI Architecture/Chromium, Firefox et Tactical SUCCESS sur un même SHA ; checkpoint D3 GREEN uniquement après succès.
- **État :** la transformation contrôlée est préparée, non présumée validée. Seule la branche D3 peut recevoir les changements.

## Historique et protections

- D2 GREEN : `06c3608f36d020ac4f470de4dbe4ca272da3b897` ; Architecture/Chromium [38428721362](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721362), Firefox [38428721028](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721028), Tactical [38428721250](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721250) SUCCESS.
- D1 GREEN : `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13` sur `5d8d0d37982ac2987bd4c72326de28318a4687c6`.
- `main` gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Les laboratoires Combat/Exploration et leurs assets sont hors périmètre ; les 32 images historiques Survie restent en place ; PvP gameplay non commencé.
- D1 + D2 : 70 730 octets déjà déplacés ; Phase 12 complète toujours ouverte.
- Charte `docs/GENSRPG_CHARTE.md`, checkpoint policy et roadmap à relire avant toute modification ; historique étendu sauvegardé dans `docs/history/GENSRPG_CURRENT_WORK_HISTORY_PRE_D1_2026-10-13.md`.
