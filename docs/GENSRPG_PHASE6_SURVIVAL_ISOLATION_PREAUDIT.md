# GenSrpG — Phase 6 / pré-audit isolation Survie — 2026-09-24

## Base

- Phase 5 clôturée sur :
  `checkpoint/gensrpg-phase5-exit-green-2026-09-24`
- SHA de base Phase 6 :
  `e9837460bb42bb5661b7b0d66f510b99523344e4`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-isolation-2026-09-24`
- Branche :
  `work/gensrpg-phase6-survival-isolation-2026-09-24`
- `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## État réel du dossier Survie

`assets/gensrpg/survival/` contient actuellement uniquement :
- `entry-v1.js` — entrée Phase 3 inerte ;
- `module-contract-v1.json` — contrat déclaratif.

Le runtime Survie n'est donc pas encore réellement extrait dans ce dossier.

## Frontières déjà préparées

La Phase 5 a déjà créé deux frontières publiques utiles :
- lancement de module via `GensShellModuleLaunchV1` ;
- retour écran via `GensShellScreenReturnV1`.

Le provider public Survie existe et délègue encore vers le propriétaire natif du lancement Survie.

Les sentinelles navigateur déjà GREEN couvrent notamment :
- lancement Survie par le vrai Shell ;
- provider public Survie ;
- Survie après Dungeon ;
- goMenu Survie ;
- Fouiller / arts Survie ;
- non-interférence quatre modules.

## Dette inter-module prouvée

Fichier :
`assets/gensrpg/gens-survival-mode-isolation-1678104.js`

Ce fichier est actuellement chargé par :
`assets/gensrpg/core/runtime-bootstrap-v1.js`.

Il est clairement spécifique à Survie mais il ne peut PAS simplement être déplacé dans
`assets/gensrpg/survival/`, car son implémentation contient encore des accès directs au runtime privé Dungeon :

- `DungeonCore01.show` ;
- `openDungeonCombatSetup` ;
- stockage `gensrpg_dungeon_runtime_v2` ;
- fermeture directe de DOM Dungeon.

Le déplacer tel quel dans le module Survie violerait donc le critère Phase 6 :
**aucun appel aux fonctions privées Dungeon**.

## Hypothèse du premier micro-lot

La Phase 5 a peut-être rendu cette rustine historique partiellement ou totalement redondante.

Avant tout retrait runtime, caractériser le vrai parcours Survie :
- avec le garde `GensSurvivalModeIsolation1678104` neutralisé ;
- avec un ancien état Dungeon volontairement conservé en stockage ;
- via le vrai Shell ;
- jusqu'au démarrage d'une session Survie ;
- en vérifiant que Dungeon reste inactif et que son état n'est ni utilisé ni écrasé.

### Deux issues autorisées

1. **GREEN sans le garde**
   - premier micro-lot Phase 6 = retirer ce garde legacy du bootstrap ;
   - supprimer le fichier après TDD ;
   - ne pas le déplacer dans `survival/`.

2. **RED sans le garde**
   - ne rien supprimer ;
   - utiliser l'échec pour identifier exactement UNE dépendance encore nécessaire ;
   - traiter uniquement cette responsabilité dans le micro-lot suivant.

## Interdictions

- aucun déplacement opportuniste d'autres fonctions Survie ;
- aucun changement gameplay ;
- aucun changement UI ;
- aucun changement Dungeon/Tactical ;
- aucune nouvelle rustine globale ;
- aucun nouveau retry / polling / observer ;
- aucun changement de `index.html` dans ce pré-audit.
