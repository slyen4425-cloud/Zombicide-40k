# GenSrpG — point de reprise LIVE

Date : **14 octobre 2026**. **Phase 12 en cours ; D1, D2, D3, D4 GREEN. D5 NON ouvert.**

## Dernier checkpoint GREEN — D4 Dungeon Core200

- Checkpoint final §25 : `checkpoint/gensrpg-phase12-dungeon-core200-d4-green-2026-10-14` à `be7f159a189d1f14579707ba67eb024be4238487`, SHA testé et figé.
- Branche D4 : `work/gensrpg-phase12-dungeon-core200-d4-extraction-2026-10-13`. Départ : `checkpoint/gensrpg-start-phase12-dungeon-core200-d4-extraction-2026-10-13` au SHA `9fa3729d0ae4f3531d53221a9d1021277a1c7382` (triple CI déjà vert).
- Source §26 : ZIP utilisateur `a4.zip` / `index.html(5).txt` authentifié, **7 836 124 octets**, Git blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`.
- Extraction D4 : propriétaire Dungeon actif `dungeonCore200Rebuild`, **55 842 octets** de JS déplacés sans changement à `assets/gensrpg/dungeon/core200-rebuild-v1.js`, blob `5649ae0af69064dde72e6ea28b8dbefd105cb527`. Balise classique synchrone au même emplacement parser ; mêmes comportements historiques.
- `index.html` final : **7 780 333 octets**, Git blob **`ca15dd7b483963d7bd0767b7b5baca915d17ec43`**. Preuves rollback exact D4 → D3 → D2 → D1 et sentinelles de composition conservées.
- Triple CI même SHA : [Architecture/Chromium 38543038090](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038090) **SUCCESS** (356 étapes Architecture et 64 étapes browser), [Firefox 38543037973](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543037973) **SUCCESS**, [Tactical 38543038142](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038142) **SUCCESS**.
- [Application contrôlée 38470070484](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38470070484) SUCCESS. Rapport : `docs/GENSRPG_PHASE12_DUNGEON_CORE200_D4_EXTRACTION_2026-10-13.md`.
- Le HEAD de la branche peut dépasser le checkpoint uniquement pour les mises à jour documentaires post-GREEN : **ne pas confondre avec le SHA testé**.

## Progression Phase 12

- D1 Core01 : 22 768 octets, checkpoint `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13`.
- D2 Core051 : 47 962 octets, checkpoint `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13`.
- D3 MJ72 : 27 511 octets, checkpoint `checkpoint/gensrpg-phase12-dungeon-mj72-d3-green-2026-10-13`.
- D4 Core200 : 55 842 octets, checkpoint ci-dessus.
- **Total 154 083 octets de code déplacés ; baisse nette de `index.html` 153 871 octets** (7 934 204 → 7 780 333 octets). **Phase 12 non terminée.**

## D5 — prochaine étape, PAS ENCORE COMMENCÉE

1. Respect impératif §26 : demander au propriétaire le fichier `index.html` **exact du dernier checkpoint D4** depuis `https://github.com/slyen4425-cloud/Zombicide-40k/blob/be7f159a189d1f14579707ba67eb024be4238487/index.html` (ZIP), puis vérifier **7 780 333 octets** et blob **`ca15dd7b483963d7bd0767b7b5baca915d17ec43`** ; l'ancien `a4.zip` n'est plus la source actuelle.
2. Sur la source nouvelle certifiée, identifier un **propriétaire actif et cohérent**, sans ouvrir un lot inutile ni déplacer les 10 scripts désactivés.
3. Avant modification D5 : checkpoint de départ sur dernier SHA triple-CI GREEN approprié, branche D5 exclusive, inventaire effets de bord, plan de rollback, documentation (§25).
4. Valider rétrocompatibilité D5→D4→D3→D2→D1, graphe propriétaires, navigation réelle Survie/Dungeon/Capture/PvP et CI Architecture/Chromium, Firefox, Tactical sur **le même commit** avant GREEN.

## Invariants non négociables

- Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Laboratoires Combat et Exploration séparés, inchangés. 32 images historiques Survie en place. Aucun changement de gameplay, persistance, PWA, carte Shell, ou hiérarchie des modules. PvP gameplay non commencé.
- Relire `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` et ce document avant toute reprise.
- Ancien point de reprise D4 archivé dans `docs/history/GENSRPG_CURRENT_WORK_PRE_D4_GREEN_2026-10-14.md` ; D3 antérieur dans `docs/history/GENSRPG_CURRENT_WORK_PRE_D4_2026-10-13.md`.
