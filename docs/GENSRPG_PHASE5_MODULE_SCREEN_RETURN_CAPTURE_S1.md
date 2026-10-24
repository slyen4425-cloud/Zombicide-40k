# GenSrpG — Phase 5 / raccord retour écran Shell — Capture S1

Date : 2026-09-23

## Base sûre

- Branche :
  `work/gensrpg-phase5-module-screen-return-raccord-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-screen-return-raccord-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-screen-return-raccord-preaudit-green-2026-09-23`
- SHA de base :
  `cdae0a0c9259456ef210cf4f6b15ec943a8ae31b`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## Règle 26

Fichier exact fourni par Sylvain dans `work14.zip`.

Base vérifiée avant modification :
- taille : `8170961`
- blob Git : `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`
- contenu HTML complet.

## Objectif S1

Migrer uniquement le retour écran Capture depuis l'override global
`window.goMenu` vers le contrat public Shell `returnToPrimaryView`.

Dungeon reste volontairement hors de ce micro-lot.

## Modification runtime

Commit runtime :
`7c0863b2c1faf4c4b51564030b935ee20d053d1e`.

Runtime S1 :
- taille : `8172505`
- blob Git : `c17460335b2deb5e5916dbf91448b0706c38d0df`.

Le Shell natif expose désormais :
- un registre public de providers de retour écran ;
- `activeModule()` fondé sur les données publiques de routage ;
- `returnToPrimaryView(moduleId)` ;
- un dispatch au début du `goMenu()` natif.

Capture enregistre son provider owner-local et conserve
`captureEnterWorld139()` comme implémentation de sa vue.

## Réduction d'autorité

Avant S1 :

`captureFix139 -> dungeonCore200Rebuild`

Après S1 :

`dungeonCore200Rebuild`

Le nombre d'affectations inline globales `goMenu` passe donc de 2 à 1.

Capture ne capture plus le propriétaire précédent et ne remplace plus
`window.goMenu`.

## Contraintes respectées

- aucun nouveau wrapper global `goMenu` ;
- aucun observer ;
- aucun polling ;
- aucun timer/retry ajouté ;
- aucune copie de logique Capture dans le Shell ;
- aucun changement Dungeon runtime ;
- aucun changement `startConfiguredGame`, `resumeGame` ou `openChar` ;
- aucun merge sur `main`.

Le workflow et le patch temporaires utilisés pour transporter le gros
`index.html` vérifié ont été retirés de l'arbre final.

## Cartographie

La cartographie Phase 2 a été recalée sur le nouveau blob :
- sourceIndexBlob :
  `c17460335b2deb5e5916dbf91448b0706c38d0df`
- globals distincts : `438`
- affectations inline : `764`
- globals multi-owner : `120`
- `goMenu\t1\tdungeonCore200Rebuild`.

Les gardes historiques Core 0.30 / 0.23 / 0.01 restent actives et vérifient
désormais leur retrait dans l'état cumulatif S1.

## TDD

RED initial confirmé :
- nouvelle sentinelle
  `tests/gens_phase5_module_screen_return_capture_raccord_v1.test.cjs`
  échouait seule avant la modification runtime.

Après raccord, elle vérifie :
- registre public Shell présent ;
- sélection module par données publiques ;
- dispatch `returnToPrimaryView` dans le `goMenu` natif ;
- provider Capture owner-local ;
- absence de `window.goMenu =` dans `captureFix139` ;
- chaîne restante limitée à `dungeonCore200Rebuild`.

## Validation technique du candidat

SHA technique :
`b56703389a17782fc3ce6a040bbdc399b18cdada`.

Runs :
- Architecture + navigateur complet :
  `35908275054` — SUCCESS ;
- Firefox :
  `35908274988` — SUCCESS ;
- Tactical Dock :
  `35908275152` — SUCCESS.

Le navigateur complet confirme notamment :
- Dungeon fiche -> `goMenu` -> map Dungeon ;
- Capture + vieille sauvegarde Dungeon -> Hub Capture ;
- Capture victoire -> reprise inter-module ;
- Survival -> menu Survival ;
- Dungeon -> Tactical ;
- Builder ;
- Config objet ;
- Save & Quit / reprise Shell ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules.

## Prochaine frontière

Après checkpoint GREEN de S1 et validation utilisateur du fichier test :

**Dungeon S2 — migrer `dungeonCore200Rebuild -> window.goMenu` vers le même
contrat Shell.**

Ce lot devra rester séparé et commencer par TDD RED.
