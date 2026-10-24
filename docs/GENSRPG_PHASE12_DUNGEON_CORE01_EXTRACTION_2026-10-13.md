# GenSrpG — Phase 12 / D1 : extraction physique du propriétaire Dungeon Core01

Date : 13 octobre 2026. Travail limité à la restructuration, aucune règle ni écran nouveau.

## Base et procédure

- Base GREEN de Phase 11/A1 : `checkpoint/gensrpg-phase11-asset-ownership-a1-green-2026-10-13` SHA `7ef5060a72b883ecee23ddee9c381a300f8be1b9`.
- Départ de chantier §25 : `checkpoint/gensrpg-start-phase12-dungeon-core01-extraction-2026-10-13` sur le même SHA ; branche `work/gensrpg-phase12-dungeon-core01-extraction-2026-10-13`.
- Fichier `index.html` exact fourni précédemment par l'utilisateur et vérifié localement (§26) : taille 7 934 204 octets, blob Git `bf996ec4e748a4927ac6dd57cceaeaf2afcd9441` identique à la branche. Aucune publication demandée à l'utilisateur.

## Extraction effectuée

Le bloc inline identifié `gensDungeonCore01Js` (IIFE d'environ 22,8 ko) a été **transféré sans modification de code** dans `assets/gensrpg/dungeon/core01-session-ui-v1.js`, script de propriétaire Dungeon. La balise HTML reste au même emplacement du chargement parser synchrone (balise `id=gensDungeonCore01Js` conservée, nouveau `src` local). L'autorité Shell reste intacte.

La transformation contrôlée `tools/gensrpg_phase12_dungeon_core01_extract_apply.py` exige les empreintes exactes et fournit `--apply`/`--verify` :

| Donnée | Avant | Après |
|---|---|---|
| `index.html` octets | 7 934 204 | 7 911 489 |
| SHA blob Git index | `bf996ec4e748a4927ac6dd57cceaeaf2afcd9441` | `2921ebadacf6f660e815d9ff7712e44cd765fbdd` |
| JS Dungeon externe | inexistant | 22 768 octets, blob `df36eba9b8a62f806bc50f86f09f53c90608ce07` |

`--verify` reconstruit les octets initiaux exacts de l'index depuis le script externe et démontre le retour arrière lossless ; aucune variable, fonction ou règle métier n'est éditée.

Le commit d'application par GitHub Actions sur la branche de travail est `6b70ed5ce9a1ce8a32eac2c549c4e6f891561cbd` ; <https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38394405104> est SUCCESS pour la transformation, les tests de chargement et les tests historiques sélectionnés. Ce succès seul **ne remplace pas** les trois CI complètes.

## Frontières et critères GREEN

- Seul le code `gensDungeonCore01Js` a été déplacé ; `main`, les labos Combat et Exploration, les images historiques Survie et les autres runtimes restent inchangés.
- `tests/gens_phase12_dungeon_core01_extraction_v1.test.cjs` vérifie le propriétaire, les octets, le retour arrière et le chargement dans le même ordre.
- Les contrats Phase 2 reposant sur le SHA et le graphe ont été explicitement repinnés sur le nouveau fichier physique, sans modifier les snapshots historiques des anciens propriétaires.
- Exiger les tests réels Dungeon, la non-interférence des quatre familles, Architecture/Chromium, Firefox et Tactical sur **le même SHA final**.
- Ne créer de checkpoint GREEN D1 qu'après triple CI réussie, puis mettre à jour `docs/GENSRPG_CURRENT_WORK.md`.
- La Phase 12 complète reste ouverte. Ne pas relancer un grand nettoyage indiscriminé ni supprimer des vieux systèmes sans propriétaire clair.

## Décision graphique toujours active

Les 32 `assets/img_*` historiques restent en place, sans réaffectation exigée. Les assets des labos ont leurs propres dépôts et ne sont ni déplacés ni fusionnés ici. La Phase 11 est conservée avec cette exception documentée ; aucun transfert graphique n'est prétendu.

## Clôture officielle D1 GREEN — 13 octobre 2026

- **Checkpoint créé** : `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13` pointant sur `5d8d0d37982ac2987bd4c72326de28318a4687c6`, après succès effectif des trois CI sur ce SHA.
- Architecture/Chromium : [38419138287](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138287) — SUCCESS ; sentinelles structurelles + navigateur, y compris Dungeon Save & Quit/reprise, provider Dungeon et non-interférence des quatre modules.
- Firefox : [38419138332](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138332) — SUCCESS.
- Tactical : [38419138470](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138470) — SUCCESS.
- Les deux derniers correctifs portent uniquement sur les **tests historiques navigateur** (chargement explicite du module Dungeon Core01 externe), commits `53865246aab030c5076e5b5be5881a23c94ab5bb` et `5d8d0d37982ac2987bd4c72326de28318a4687c6`; aucun changement runtime.
- Prochain lot D2 : nouveau checkpoint §25, inspection du nouvel index certifié §26, propriétaire indépendant, extraction contrôlée. **Aucun D2 déclaré GREEN.**
