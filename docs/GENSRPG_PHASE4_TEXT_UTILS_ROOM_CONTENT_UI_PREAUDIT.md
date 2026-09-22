# GenSrpG — Phase 4 / U1 — pré-audit premier consommateur Text Utils

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-room-content-ui-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-room-content-ui-preaudit-2026-09-22`
- Base : `fb5ad67f13adb97d04533d1cd692a5e6cc75b794`
- GREEN de départ : `checkpoint/gensrpg-phase4-text-utils-contract-green-2026-09-22`
- Production `main` reste gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Source de décision

Le pré-audit Event Bus / utilitaires Agent 1 a sélectionné U1 comme premier utilitaire commun sûr
et interdit la création spéculative d'un Event Bus générique.

U1 est maintenant GREEN et inert :
`GensTextUtilsV1.escapeHtml(value)`.

Le lot suivant doit sélectionner **un seul consommateur UI à faible risque** avant tout raccord.

## Consommateurs représentatifs examinés

1. `assets/dungeon/dungeon-world-builder-167821.js`
2. `assets/dungeon/dungeon-room-content-ui-167831.js`
3. `assets/gensrpg/gens-rpg-stats-clean-167874.js`
4. `assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js`

Tous possèdent une transformation d'échappement HTML équivalente.

## Consommateur sélectionné pour caractérisation

`assets/dungeon/dungeon-room-content-ui-167831.js`

Raisons :
- couche explicitement UI-only ;
- helper local `esc()` sans état ;
- usages limités à génération de chaînes HTML d'éditeur ;
- aucun calcul gameplay ;
- aucun Storage ;
- aucun Stats/Dice/Tactical ;
- tests dédiés existants ;
- surface plus étroite que World Builder ;
- criticité plus faible que Stats UI ou Tactical Stats.

Ce choix n'autorise encore aucun raccord.

## Risque principal découvert avant raccord

`assets/gensrpg/core/text-utils-v1.js` est volontairement **inert** après U1.

Room Content UI est chargé dynamiquement par :
`assets/dungeon/dungeon-room-creator-feedback-167821.js`.

Le loader actuel charge `dungeon-room-content-ui-167831.js` sans charger Text Utils.

Donc remplacer directement :
`esc(...)`

par :
`GensTextUtilsV1.escapeHtml(...)`

serait incorrect tant que l'ordre de chargement n'est pas explicitement garanti.

## Pré-audit demandé

La sentinelle doit prouver :
- parité comportementale exacte du helper local et du Core sur une matrice représentative ;
- nombre de callsites du helper local ;
- absence de rôle gameplay/Storage/navigation dans ce helper ;
- service U1 toujours inert ;
- absence de dépendance Text Utils dans le loader actuel ;
- Room Content UI actuellement chargé après les dépendances de contenu existantes ;
- aucun changement runtime dans ce pré-audit.

## Candidat pour un futur lot de raccord séparé

Le futur raccord devra :
1. garantir explicitement le chargement de `text-utils-v1.js` avant Room Content UI ;
2. raccorder **seulement** Room Content UI ;
3. retirer son helper local `esc()` ;
4. conserver la parité HTML ;
5. conserver tous les autres consommateurs inchangés ;
6. valider le vrai Room Creator dans le navigateur.

Aucune stratégie de fallback silencieuse ou de double implémentation permanente ne doit être ajoutée.

## Hors périmètre

- aucun changement de `dungeon-room-content-ui-167831.js` ;
- aucun changement du loader ;
- aucun changement de `text-utils-v1.js` ;
- aucun `index.html` ;
- aucun Service Worker ;
- aucun World Builder ;
- aucun Stats UI ;
- aucun Tactical ;
- aucun Event Bus ;
- aucun gameplay.

## Critère GREEN

Pré-audit documentaire/test uniquement, triple CI GREEN, puis checkpoint dédié.


## Résultat du pré-audit

Consommateur retenu :
`assets/dungeon/dungeon-room-content-ui-167831.js`.

Le helper local `esc()` :
- possède 4 callsites réels ;
- ne porte aucune politique métier ;
- est strictement équivalent à `GensTextUtilsV1.escapeHtml` sur 17 cas caractérisés.

Risque principal :
Text Utils U1 est inert et le loader de Room Content UI ne le charge pas actuellement.

Conclusion :
le futur raccord doit inclure un ordre de chargement explicite avant suppression du helper local.
Aucun fallback permanent ou double implémentation ne doit être conservé.

Validation technique sur `1d700b30d42fbdb653766b619070cbe69df37fa4` :
- Architecture + navigateur complet `35759849292` — SUCCESS ;
- Firefox `35759849442` — SUCCESS ;
- Tactical Dock `35759849358` — SUCCESS.

Aucun runtime, loader, Core ou consumer n'a été modifié dans ce pré-audit.

La clôture documentaire doit maintenant passer la triple CI sur son propre SHA exact.
