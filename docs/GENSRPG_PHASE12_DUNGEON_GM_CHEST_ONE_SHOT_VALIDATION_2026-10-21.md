# GenSrpG — Phase 12 — Coffres MJ : tirage de défi effectué à la création

Date : 21 octobre 2026. **État : JALON TESTÉ, NON GREEN GLOBAL.** Production intacte.

## Provenance / reproductibilité

- Dépôt : `slyen4425-cloud/Zombicide-40k`.
- Référence de départ GREEN du coffre : `7e82bf8e1b3235bc4ee8dcf2ce4535eb6d9e7aa7`.
- Checkpoint §25 START avant changement : `checkpoint/gensrpg-start-phase12-dungeon-gm-chest-evaluation-2026-10-21` sur ce SHA.
- Branche de travail dédiée : `work/gensrpg-phase12-dungeon-gm-chest-evaluation-2026-10-21`.
- Checkpoint intermédiaire figé : `checkpoint/gensrpg-phase12-dungeon-gm-chest-evaluation-tests-passed-2026-10-21`, SHA **`d9b611b34a7bfa7f5646bdcdf4698f52c0f4fd83`**.
- Backup avant raccord : `backup/gensrpg-phase12-dungeon-gm-chest-before-render-dispatch-2026-10-21` sur le SHA GREEN de départ.
- Main **non modifiée** `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de merge ou déploiement.

## Anomalie prouvée

Le test navigateur réel de la branche `work/gensrpg-phase12-dungeon-secondary-events-replay-2026-10-21` (CI 39666700503) a établi que le coffre ajouté depuis les vrais outils MJ apparaissait sans `_dc051ChallengeRolled`. Lors d'un `REPRENDRE`, Core051 évaluait alors le défi de coffre (chance 28 % en profil de test), pouvant transformer un coffre jusque-là sans défi. Position et identifiant n'avaient pas changé.

La tentative de correction limitée au `DungeonCore01.render()` public a échoué à reproduire l'évaluation immédiate : CI navigateur 39668063590 RED. Elle a été abandonnée.

## Raccord effectif (deux autorités explicites, pas de moteur concurrent)

- **Core200** `assets/gensrpg/dungeon/core200-rebuild-v1.js`, `gmChest` : après l'ajout natif du coffre et la sauvegarde de la carte, déclenche `GensDungeonChallengeLifecycle051.onChestCreated(el.id)`, puis conserve son rendu normal.
- **Core051** `assets/gensrpg/dungeon/core051-exploration-polish-v1.js` : nouveau contrat ciblé `onChestCreated(id)` vérifiant que la scène possède bien ce coffre dans la salle courante, puis délègue sans duplication à l'unique propriétaire existant `assignChallenges051()`.
- Le calcul du défi, sa probabilité, les valeurs de configuration et le stockage existant ne sont pas recodés dans Core200. Aucun `index.html`, service worker, Tactical, stats, dés, XP, Survie, Capture ou PvP ne change.
- Le parcours de test remet les chances d'énigme authentiques avant l'ajout du coffre ciblé et ferme les fenêtres d'événement par leurs boutons natifs. Il n'injecte aucun gain de combat ni état de coffre.

## Historique immuable D2 toujours vérifié

La reconstitution d'un ancien `index.html` D2 lisait par erreur le fichier Core051 actif ; la nouvelle API faisait donc échouer son empreinte historique. Pour **conserver** les vérifications historiques :

- `tests/fixtures/gensrpg_phase12_d2_core051_original_2026-10-21.txt` contient exactement les 47 962 octets de la version D2 d'origine, blob Git `d7ec321ffa05b8749de5d7bf9e8264e55b24f919`.
- `tests/helpers/gens_capture_team_roster_snapshot_v1.cjs` reconstitue D2 depuis ce cliché figé, en continuant d'exiger taille, empreinte blob, taille de l'index restitué et empreinte de l'index historique **sans relâchement**.
- `tests/gensrpg_phase12_dungeon_core051_historical_fixture_and_hook.test.cjs` vérifie le blob immuable et que la version Core051 active est identique à l'original **octet pour octet**, hormis l'unique contrat ajouté.

## Preuves CI sur le même SHA testé

- [Validation ciblée 39670146775](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39670146775) : **PASS** `regression` (règles et sentinelles R10–R15 + preuve D2) et `browser` (vrai parcours UI Chromium ET Firefox : combat, victoire, salle 2, ajout coffre MJ, évaluation immédiate, rechargement/reprise, identité, marqueur et résultat immuables).
- [Tactical dock 39670146748](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39670146748) : PASS (contrat, Chromium, Firefox).
- [Firefox wall 39670146746](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39670146746) : PASS.
- [Architecture globale 39670146716](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39670146716) : **FAIL** sur `tools/gensrpg_phase12_r08_shared_catalog_extract_apply.py --verify`, erreur `R08 index source mismatch: 1729855 / 9f35eb833a6ede4b91399854f19bb9bef59f45ab`. Défaut également présent sur le SHA GREEN de départ ; non causé par cette évolution ni masqué. Le reste du job architecture a été ignoré après cet échec.

## Décision et suite

Le **correctif spécifique coffre est testé** mais le chantier ne peut pas être qualifié GREEN global tant que la CI générale d'architecture est rouge. Aucun checkpoint final de clôture GREEN ni fusion. Conserver le checkpoint tests-passed isolé. Nouveau sous-chantier **distinct et doté de son START** requis pour auditer la restitution historique R08 sur le `index.html` moderne, sans modifier les empreintes historiques ou contourner l'extraction. Les événements `trap`, `special_branch` et porte après `REPRENDRE` conservent leur statut de diagnostic séparé NON GREEN.

§26 : `index.html` non consulté/modifié en intégralité ; blob actuel `9f35eb833a6ede4b91399854f19bb9bef59f45ab`. Un futur besoin de ses octets exacts exige le ZIP utilisateur du SHA ciblé.
