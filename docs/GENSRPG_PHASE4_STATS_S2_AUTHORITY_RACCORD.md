# GenSrpG — Phase 4 Core Stats — Raccord d'autorité de normalisation

Date : 2026-09-21

Base GREEN : `d9929477332b9436a3da12fddc2b13777d2b4e0d`.

## Objet

Raccorder `GensStatsNormalizationV1` au propriétaire actif
`GensCleanRpgStats167874` sans modifier les valeurs, dérivées, règles de combat,
UI, persistance ou progression.

## Composition cible

Ordre obligatoire dans GitHub Pages et preview :

1. `gens-world-summary-167820.js`
2. `core/stats-normalization-v1.js`
3. `gens-rpg-stats-clean-167874.js`
4. `gens-dungeon-hero-art-repair-167874.js`
5. `gens-mobile-combat-performance-16781022.js`

Aucun loader dynamique supplémentaire.

## Autorité cible

Le module Core possède :
- ALIAS ;
- slug ;
- canon ;
- normalizeDefinition ;
- isValidTarget ;
- normalizeEffect ;
- compare ;
- effectContribution.

Le propriétaire historique conserve tous les callsites métier mais délègue les
primitives précédentes au Core.

Aucun fallback local n'est autorisé.

## Hors périmètre

- value/baseValue ;
- equipment/talents/challenges ;
- dérivées gameplay ;
- armor/hit/resistances ;
- Tactical snapshot ;
- UI/editor ;
- stockage/migrations ;
- cache performance.

## TDD

La garde
`tests/gens_phase4_stats_s2_authority_raccord_v1.test.cjs`
doit être RED avant raccord puis GREEN après raccord.

Elle vérifie :
- ordre Pages/preview ;
- service Core production-reachable ;
- absence de duplication ALIAS et des normalizers historiques ;
- dépendance Core explicite ;
- parité comportementale chargée Core -> Stats ;
- aucune modification du contrat public Stats.

## Critère de sortie

Architecture+navigateur, Firefox et Tactical Dock GREEN sur le HEAD final,
puis checkpoint dédié. `main` reste inchangé.


## Résultat du raccord

### RED TDD

La garde d'autorité a d'abord échoué comme prévu sur le commit
`f0da210616e02879bc184a78cee8f1b75ac163bf`.

Cause exacte :
`stats-normalization-v1.js` n'était pas encore présent dans la composition Pages.
Les sentinelles S1/S2 précédentes étaient GREEN.

### Raccord appliqué

Le propriétaire historique
`assets/gensrpg/gens-rpg-stats-clean-167874.js`
exige désormais explicitement `GensStatsNormalizationV1`.

Les implémentations locales suivantes ont été retirées au profit du Core :
- table ALIAS ;
- slug ;
- canon ;
- normDef ;
- targetValid ;
- normEffect ;
- compare.

Les callsites historiques restent inchangés via des références directes aux fonctions
Core. Aucun fallback local, wrapper, timer/retry ou loader dynamique n'a été ajouté.

Composition :
- GitHub Pages charge `stats-normalization-v1.js` avant le propriétaire Stats ;
- `preview.html` reproduit le même ordre ;
- le service est production-reachable dans la cartographie runtime ;
- `index.html` n'a pas été modifié.

Les tests VM historiques qui exécutaient directement le propriétaire Stats ont été
réalignés pour charger explicitement sa dépendance Core avant lui.

### Réalignements de sentinelles

Deux attentes de composition étaient figées sur l'ancienne topologie :
- composition complète Capture : 20 -> 21 modules ;
- preview navigateur : topologie mise à jour avec le Core Stats normalization.

Ces modifications ne changent aucune logique gameplay.

### Validation GREEN technique

HEAD technique :
`e490ce38ed654a328d588968ff55002c0ce6edf7`.

Runs :
- Architecture + navigateur complet : `35564423357` — SUCCESS ;
- Firefox : `35564423354` — SUCCESS ;
- Tactical Dock : `35564423345` — SUCCESS.

Le navigateur complet a notamment validé :
- Survie ;
- Fouiller / arts Survie ;
- Dungeon après Survie ;
- Builder ;
- Config objet ;
- fiche RPG ;
- cache / retour / pièges authored ;
- Save & Quit / reprise ;
- PvP placeholder ;
- Monster Capture ;
- composition complète Capture ;
- non-interférence des quatre modules ;
- murs Chromium ;
- preview Chromium ;
- resolver d'assets.

Aucune modification de `value()`, des providers équipement/talents/challenges,
des dérivées gameplay, de l'armure, du toucher, des résistances ou des snapshots
Tactical n'a été introduite par ce lot.

## Clôture documentaire

Le présent commit de clôture doit repasser Architecture+navigateur, Firefox et
Tactical Dock sur son SHA exact. Après trois SUCCESS, créer le checkpoint :

`checkpoint/gensrpg-phase4-stats-s2-authority-raccord-green-2026-09-21`.

La suite autorisée est S3 : extraction pure du moteur valeur/effets, avec TDD et
sans migration des formules Tactical/Armor/Hit.
