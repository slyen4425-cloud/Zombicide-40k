# Phase 12 / D3 : Dungeon Core211 Consolidation — 13 octobre 2026

Lancement §25 depuis D2 GREEN `06c3608f36d020ac4f470de4dbe4ca272da3b897`; branche dédiée `work/gensrpg-phase12-dungeon-core211-d3-extraction-2026-10-13`.
Source §26 : ZIP `ar.zip` certifié au Git blob `e5f8895495f969597a6c209fcc29afd66b7a0636`, 7 863 589 octets.
Propriétaire `dungeonCore211Consolidation` dans `docs/GENSRPG_PHASE2_INLINE_OWNERS.json` : Dungeon exclusif, bloc script réellement actif.
Attention : Core104 marqué actif dans la cartographie, mais `type="application/x-gensrpg-disabled"` dans le vrai fichier, non sélectionné.

- Déplacer l'IIFE intégrale de 17 511 octets vers `assets/gensrpg/dungeon/core211-consolidation-v1.js` : Git blob `bba60d921df20a114b489e17f9222e0c4f310871`.
- Index après remplacement à position identique : 7 846 135 octets, Git blob `18afb7fa25f86eea9993acc7f961fb7c11901168`.
- Restaurer les snapshots historiques D1/D2 strictement par un rollback de ce seul changement d'index ; pas de nouvelles implémentations/autorités runtime.
- Vérifier source et cible byte-exact, syntaxe JS, graphe et propriété, vraies CI navigateur Architecture/Chromium, Firefox et Tactical sur le **même SHA final**.
- Lot non GREEN avant checkpoint explicite sur SHA triple-CI SUCCESS. `main`, labos, gameplay, images historiques protégés.

## Livraison GitHub

Workflow de transformation [38434266794](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38434266794) SUCCESS ; commit source [a4e8723](https://github.com/slyen4425-cloud/Zombicide-40k/commit/a4e8723ab6a9d4cada787f939b94faad503ffa0c). Nouveau fichier JS 17 511 octets, sha blob bba60d921df20a114b489e17f9222e0c4f310871 ; index 7 846 135 octets, sha blob 18afb7fa25f86eea9993acc7f961fb7c11901168. Tests de rollback et propriétaire passés dans ce workflow. **CI triple finale encore requise pour qualifier le lot GREEN.**
