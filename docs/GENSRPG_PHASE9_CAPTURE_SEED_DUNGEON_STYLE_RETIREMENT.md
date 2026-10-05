# GenSrpG — Phase 9 — Retrait de l'identité Dungeon du seed Monster Capture

Date : 2026-10-05

## Base

- Base GREEN : `a83e5d01e53e6dd50b9c8cc28edb9b6d179cc4b2`
- Checkpoint GREEN : `checkpoint/gensrpg-phase9-capture-seed-compatibility-preaudit-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-seed-dungeon-style-retirement-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-seed-dungeon-style-retirement-2026-10-05`
- Runtime de base : `8167138` octets / blob `09b1e19c04777da82fd0ad355adc7eb82532db29`
- Production `main` : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Pourquoi ce lot est désormais autorisé

Preuves GREEN accumulées avec `gameStyle` retiré uniquement dans les tests :

1. Shell :
   - profil Capture visible ;
   - famille contenu `creature` ;
   - famille Shell `adventure`.

2. Pré-game :
   - classe `gensCapturePregame` appliquée via l'identité canonique ;
   - sélection dresseur/créature ;
   - aucun runtime Dungeon créé.

3. Lancement :
   - session Capture démarre ;
   - Hub Capture visible ;
   - Jour 1 -> Jour 2.

4. Persistance / reprise :
   - profil Capture sauvegardé sans `gameStyle` ;
   - vraie sauvegarde Dungeon résiduelle présente ;
   - vraie victoire Capture ;
   - reload complet ;
   - seed intégré ne réécrit pas le champ absent sur un profil existant ;
   - vrai bouton Reprendre restaure Capture ;
   - Dungeon résiduel ne vole pas la reprise.

Sentinelle de compatibilité :
`tests/gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs`.

Run ciblé :
`37279109842` — SUCCESS.

## Mission unique

Retirer `gameStyle:"dungeon"` uniquement de la représentation seed/factory intégrée Monster Capture.

Ce lot ne migre pas les profils historiques. Un profil existant qui possède encore ce champ reste accepté.

## RED TDD

Test :
`tests/gens_phase9_capture_seed_dungeon_style_retirement_v1.test.cjs`.

Workflow :
`GenSrpG architecture sentinels`.

RED constaté sur le HEAD `92ea8c27236925ad06e56443f2eb9d31949e60ba` :
- étape 274 : `Exiger le retrait de gameStyle Dungeon du seed Monster Capture Phase 9` — FAILURE attendue ;
- Firefox : `37280565050` — SUCCESS ;
- Tactical Dock : `37280565106` — SUCCESS.

La failure est donc localisée au contrat seed attendu.

## Mutation autorisée

Après Rule 26 uniquement :
- localiser le bloc exact `builtinMonsterCapture162` ;
- retirer uniquement les occurrences `"gameStyle":"dungeon"` appartenant à la représentation seed/factory Monster Capture ;
- conserver id, nom, modules, règles, contenu, factory et bootstrap ;
- ne modifier aucun autre appel `gameStyle` ou `isDungeonMode()`.

## Invariants

Ne pas modifier :
- `isDungeonMode()` ;
- anciens profils persistés ;
- stockage/reprise ;
- vrai Dungeon ;
- Survie ;
- PvP ;
- Tactical ;
- Combat Dynamique ;
- Exploration / Builder / Map Actor.

Interdit :
- migration globale ;
- nouveau wrapper ;
- fallback ;
- timer ;
- observer ;
- polling ;
- deuxième identité Capture.

## Sortie attendue

- GREEN du test seed ;
- GREEN du parcours Shell sans identité Dungeon ;
- GREEN du pré-game ;
- GREEN de la reprise persistée ;
- GREEN victoire/reprise inter-module ;
- GREEN vrai Dungeon ;
- GREEN non-interférence quatre modules ;
- triple CI GREEN ;
- checkpoint final dédié.


## GREEN — retrait du style Dungeon du seed Capture

Runtime final :
- taille `8167094` octets ;
- blob Git `4eee0fd1cc1b932cb7cb8b33ca357cf2d55bafeb`;
- diff runtime : suppression des deux occurrences seed/factory de `"gameStyle":"dungeon",` dans `builtinMonsterCapture162` ;
- delta exact : `-44` octets.

Conservé strictement :
- identifiant et nom Monster Capture ;
- modules/règles/contenu/factory/bootstrap Capture ;
- `GensCaptureV1.isProfile()` ;
- `gensContentFamilyForProfile()` ;
- `isDungeonMode()` ;
- anciens profils persistés avec ou sans `gameStyle` ;
- stockage/reprise ;
- vrai Dungeon ;
- Survie / PvP / Tactical ;
- Combat Dynamique / Exploration / Builder / Map Actor.

Les anciens tests qui attendaient explicitement l'ancien seed Dungeon ont été alignés uniquement lorsque leur contrat historique devenait volontairement obsolète. Les fingerprints runtime cumulés ont été repinés sur le nouveau blob sans assouplir les invariants métier.

### TDD

RED dédié :
- HEAD `92ea8c27236925ad06e56443f2eb9d31949e60ba` ;
- Architecture : étape « Exiger le retrait de gameStyle Dungeon du seed Monster Capture Phase 9 » — FAILURE attendue ;
- Firefox `37280565050` — SUCCESS ;
- Tactical `37280565106` — SUCCESS.

Candidat runtime propre validé sur arbre identique :
- Architecture `37313921257` — SUCCESS ;
- Firefox `37313921062` — SUCCESS ;
- Tactical `37313921292` — SUCCESS.

Triple CI finale sur HEAD propre `cd6746bdad2d5726d38aa7986d152090cd84af69` :
- Architecture + Browser `37316198318` — SUCCESS ;
- Firefox `37316198416` — SUCCESS ;
- Tactical Dock `37316198246` — SUCCESS.

Le job navigateur final confirme notamment :
- victoire/reprise Capture inter-module — SUCCESS ;
- routage Shell Capture sans identité Dungeon — SUCCESS ;
- pré-game Capture sans identité Dungeon — SUCCESS ;
- reprise Capture persistée sans identité Dungeon — SUCCESS ;
- vrai Dungeon / Dungeon après Survie — SUCCESS ;
- non-interférence inter-modules — SUCCESS.

## Résultat architectural

Le **nouveau seed Monster Capture n'emprunte plus l'identité Dungeon**.

Capture reste identifiée par son autorité canonique et peut traverser son chemin utilisateur principal sans que `isDungeonMode()` soit vrai.

Aucune migration forcée n'est appliquée aux profils existants : un ancien profil qui possède encore `gameStyle:"dungeon"` reste toléré.

Critère Phase 9 renforcé :
**le profil intégré Monster Capture est désormais seedé sans identité Dungeon historique.**

## Prochaine étape

Après CI documentaire GREEN + checkpoint final, ouvrir un nouveau pré-audit des couplages résiduels `isDungeonMode()` / services Dungeon effectivement atteints par Capture.

Ne pas lancer de nettoyage global de `isDungeonMode()`.
