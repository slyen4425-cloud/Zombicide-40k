# GenSrpG — Audit de sortie Phase 4 vers Phase 5

Date : 2026-09-22

## Base

- branche :
  `work/gensrpg-phase4-exit-audit-2026-09-22` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-exit-audit-2026-09-22` ;
- base exacte :
  `605d90b48b0dedf3ba29e22a7527df7f345c347b` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-text-utils-u1-room-creator-raccord-green-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'a été modifié dans cet audit.

## Critère de sortie de la roadmap

La roadmap définit :

`Critère de sortie : index.html ne contient plus les moteurs communs.`

L'audit interprète ce critère conformément à la charte :
- une frontière/adaptateur historique peut rester chez son propriétaire de domaine ;
- une mutation/UI/session propre à un module peut rester dans son domaine ;
- ce qui ne peut pas rester est un **second moteur commun actif** concurrent du Core.

## Sentinelle de sortie

Nouvelle sentinelle :

`tests/gens_phase4_exit_audit_v1.test.cjs`.

Elle ne réimplémente aucun gameplay. Elle rejoue les preuves déjà GREEN des
vrais propriétaires et vérifie la composition/ownership actuelle.

Résultat sur SHA technique :

`5c87913cfa2543f77da5201dade009e71d762297`.

Étape CI :
`Auditer la sortie Phase 4 vers Phase 5` — SUCCESS.

## Domaine 1 — Resolver d'assets

Preuve réutilisée :
`tests/gens_asset_resolver_final_audit_v1.test.cjs`.

État :
- propriétaire commun : `GensAssetResolverV1` ;
- chemins héros/créatures/items/loots logiques raccordés ;
- anciennes tables logiques dupliquées ciblées retirées ;
- `remainingResolverDebts: {}` ;
- `nextSubLots: []`.

Les assets de présentation exacts restent légitimement chez leurs propriétaires
Dungeon/UI et ne constituent pas un second resolver commun.

Verdict : **sortie Phase 4 satisfaite**.

## Domaine 2 — Storage / migrations

Preuve réutilisée :
`tests/gens_phase4_storage_exit_audit_13_v1.test.cjs`.

État :
- propriétaire commun JSON : `GensStorageV1` ;
- les familles JSON communes raccordées le sont via Core ;
- 19 familles direct-storage restantes sont classées explicitement vers
  Phase 5 Shell, Phase 7 Dungeon, Phase 8 Tactical, Phase 9 Capture ou diagnostic ;
- `autonomousCommonCandidates = []`.

Le Core Storage reste volontairement minimal et n'absorbe pas remove/scalar/
session/migration sans preuve.

Verdict : **extraction Storage commune clôturée**.

## Domaine 3 — Stats

Preuves principales :
- S2 autorité normalization ;
- S3-S7 moteurs purs ;
- S11 Core Snapshot raccord.

État :
- propriétaire runtime historique Stats conserve l'adaptation ;
- Core possède normalisation, valeurs, modificateurs, dérivées et snapshot ;
- Tactical V110 consomme le snapshot Core ;
- les rereads des helpers Dungeon dérivés visés ont été retirés ;
- les contrats résistance/armure non raccordés restent des contrats inertes,
  pas des moteurs concurrents actifs.

Verdict : **moteur commun Stats extrait/raccordé**.

## Domaine 4 — Inventory / Equipment / Sets

Preuves :
- Equipped View / Slot Refs ;
- bonus directs + sets ;
- évolution ;
- invalidation/cache et wrappers historiques.

État :
- `GensInventoryEquippedViewV1` possède la vue équipée pure ;
- `GensEquipmentBonusSetsV1` possède les bonus directs/sets ;
- `GensEquipmentEvolutionV1` possède le calcul d'évolution ;
- le propriétaire cache historique ne recalcule plus localement l'évolution ;
- les couches Performance/Stats restent des consommateurs downstream.

Verdict : **moteurs communs Inventory/Equipment/Sets extraits/raccordés**.

## Domaine 5 — Dice

Preuves :
- `d100ThresholdFromChance` ;
- `d10048`.

État :
- propriétaire commun : `GensDiceV1` ;
- formules communes raccordées retirées de leurs helpers historiques ;
- les helpers historiques conservent uniquement normalisation/frontière legacy ;
- les seams restants sont explicitement différés car ils portent UI, conventions
  low-roll, dés configurables ou règles de domaine distinctes.

Ils ne sont pas reclassés artificiellement comme moteur commun.

Verdict : **scope Core Dice commun retenu terminé**.

## Domaine 6 — Progression / XP

Preuves :
- XP -> niveau ;
- XP dans niveau ;
- points de compétence gagnés.

État :
- propriétaire commun : `GensProgressionV1` ;
- les trois calculs communs sélectionnés délèguent au Core ;
- les duplications locales de calcul correspondantes ont été retirées ;
- les fallbacks Dungeon historiques restent des frontières explicites ;
- mutation XP, partage récompense, persistance, level-up UI/popup et dépense de
  points restent des responsabilités de domaine et non du moteur pur commun.

Verdict : **scope Progression commun retenu extrait/raccordé**.

## Domaine 7 — Event Bus / utilitaires communs

Pré-audit Agent 1 :
`checkpoint/gensrpg-phase4-event-bus-utilities-preaudit-agent1-green-2026-09-22`.

Décision conservée :
- **ne pas créer de Event Bus générique** ;
- aucun besoin transversal suffisamment prouvé ne justifie un bus global ;
- U1 `escapeHtml()` est le micro-lot utilitaire pur retenu.

U1 :
- service `GensTextUtilsV1` ;
- raccord réel Room Creator ;
- helper local `esc(v)` retiré ;
- Pages/Preview/PWA alignés.

Audit :
- aucun fichier Core Event Bus générique ;
- aucune composition Pages/Preview Event Bus non approuvée.

Verdict : **point 7 terminé sans Event Bus artificiel**.

## Cartographie de sortie

La cartographie active contient :
- 14 services Core Phase 4 connectés ;
- 2 contrats Stats Phase 4 inertes ;
- 79 fichiers JS production-reachable ;
- 35 fichiers directs de composition production uniques ;
- 30 modules injectés par Pages.

Les deux contrats Stats inertes ne sont pas des autorités runtime concurrentes.

## Conclusion

**PHASE 4 — CRITÈRE DE SORTIE SATISFAIT.**

L'index conserve encore des fonctions de frontière et des responsabilités
spécifiques de module, mais les moteurs communs sélectionnés par les audits
Phase 4 ont été extraits/raccordés ou explicitement clôturés comme n'étant pas
des responsabilités communes.

Les reliquats restants sont déjà attribués aux phases suivantes :
- Phase 5 : Shell/navigation/session ;
- Phase 7 : Dungeon ;
- Phase 8 : Tactical ;
- Phase 9 : Capture.

Aucun big-bang ni suppression legacy supplémentaire n'est autorisé au titre de
cette clôture.

## Validation technique avant documentation finale

SHA :
`5c87913cfa2543f77da5201dade009e71d762297`.

Runs :
- Architecture + navigateur complet :
  `35768434291` — SUCCESS ;
- Firefox :
  `35768434363` — SUCCESS ;
- Tactical Dock :
  `35768434304` — SUCCESS.

## Validation finale obligatoire

La présente documentation change le SHA.

Avant checkpoint GREEN de sortie Phase 4, le même SHA documentaire final doit
repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Après GREEN seulement, ouvrir un pré-audit Phase 5 séparé.

Aucun merge sur `main`.
