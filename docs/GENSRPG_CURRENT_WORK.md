# GenSrpG — CURRENT_WORK officiel (16 octobre 2026)

**Phase 12 : D1–D9 GREEN ; R01 GREEN ; R02 GREEN technique, checkpoint final créé. Phase 12 globale OUVERTE. Prochain périmètre : R03–R07 (bornage du code métier résiduel). Aucun R03 ni Core203 ouvert.**

## Dernier code GREEN et branche d'autorité

- **Checkpoint final R02 §25** : `checkpoint/gensrpg-phase12-r02-legacy-visual-data-extraction-green-2026-10-16`, sur le SHA **`b5f923fa0426467827c12696ad9a4a02f24e3b6f`** (créé après validation des trois CI, avant actualisation documentaire).
- **Branche retenue** : `work/gensrpg-phase12-r02-legacy-visual-data-extraction-2026-10-16` ; seuls les documents de reprise sont mis à jour après le checkpoint. Pour toute nouvelle branche de code, repartir du checkpoint R02 GREEN et non d'une piste R02 concurrente.
- **Socle R01** : SHA `1b0fa3a718059242507d3e95de45033bba57ea24`, checkpoint `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16`.
- **Départ R02 §25** : `checkpoint/gensrpg-start-phase12-r02-legacy-visual-data-extraction-2026-10-16`, exactement sur R01 GREEN.
- **Source historique §26** : `c5.zip` = index R01, **6 969 593 octets**, blob `caf31c121d926b7b76b9bb05688fab8f2839814e`. **Ce ZIP n'est PAS l'index R02**.

## R02 clôturé : cinq URL data uniquement

- **Index R02 contrôlé** : **2 869 485 octets**, Git blob `062c4cd37634f504cc75ce3329d6e69e19b5f547`, [permalink SHA](https://github.com/slyen4425-cloud/Zombicide-40k/blob/b5f923fa0426467827c12696ad9a4a02f24e3b6f/index.html). Gain HTML net de **4 100 108 octets**.
- **Données propriétaires** : `assets/gensrpg/core/legacy-visual-data-v1.js` = **4 100 559 octets**, blob `f7adfca9b04b23c489aae71ae9284c9b849f1d0b`. Cinq URL PNG/WebP d'origine, valeurs VM identiques ; chargement classique et synchrone avant le monolithe, pas de nouvelle autorité métier ou de global `window`.
- **Monolithe restant** : **1 264 265 octets** de corps script, blob `c7e4d2e7175814fcbe0a3d09e57b438286986ff3` ; code Survie/Dungeon/Capture/Shell/stockage NON encore découpé.
- **Rollback** : `tools/gensrpg_phase12_r02_legacy_visual_data_extract_apply.py --verify` + tests VM/Node reconstruisent R01 strictement à l'octet près ; checks anciens R01→D9→D1 conservés.
- **PWA** : nouveau script ajouté au pré-cache `service-worker.js`, cache versionné ; format des cinq URL `data:image` conservé, sans changement de structure de sauvegarde/export.

## Preuves CI et limites

- **Application ciblée + test R02/rollback** : [run 38933052158](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38933052158) SUCCESS.
- **Triple CI SUCCESS au même SHA R02 `b5f923fa0426467827c12696ad9a4a02f24e3b6f`** : [Architecture/Chromium 38934318213](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318213), [Firefox 38934318235](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318235), [Tactical 38934318218](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318218). Les six checks associés sont SUCCESS.
- **Non attesté manuellement** : installation Android/PWA, rendu visuel réel des cinq images, expérience hors-ligne sur appareil et chemins complets de sauvegarde utilisateur. Aucun de ces tests n'est déclaré effectué ; le GREEN est **technique/CI**, non une validation Android ou une publication sur `main`.
- **Protections** : `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; laboratoires combat/exploration, 32 images Survie historiques et gameplay des quatre modes non modifiés.

## Réconciliation et prochaine étape

- **En attente / sans fusion automatique** : `work/gensrpg-phase12-r02-legacy-multidomain-boundary-2026-10-16` (CI Architecture FAILURE ; pont de 5,36 Mo multi-domaines), `work/gensrpg-phase12-r02-megablock-boundary-audit-2026-10-16`, `work/gensrpg-phase12-r02-monolith-exit-scoping-2026-10-16`. Conserver leur historique documentaire, ne pas les prendre comme source d'autorité.
- **Suite** : caractériser les frontières du **1,264 Mo restant** selon audit A/B/C et enveloppes R03–R07. Identifier propriétaires et dépendances avant déplacement ; privilégier les grands lots cohérents plutôt que D10/Core203 mécanique. Pour chaque futur vrai lot : §25 checkpoint de départ + branche dédiée, §26 index **nouveau SHA R02**, source ZIP exacte si inspection nécessaire, rollback, puis triple CI au même SHA.
- **Rapports** : `docs/GENSRPG_PHASE12_R02_LEGACY_VISUAL_DATA_2026-10-16.md` et `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md`.
