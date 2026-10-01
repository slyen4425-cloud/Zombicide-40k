# GenSrpG — Phase 8 — Pré-audit consolidation Tactical — 2026-10-01

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase7-exit-green-2026-10-01`
- SHA : `c8a4b845caf2ccc78c678516c62ab9d5d358cfe4`
- branche : `work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`

## Cible Roadmap

Phase 8 doit converger vers :
- engine pur ;
- adapter ;
- UI ;
- AI ;
- bridge Dungeon.

Le critère final sera : Tactical n'existe que pendant une session de combat et se démonte proprement.

## État réel actuel

### Entrée publique cible

`assets/gensrpg/tactical/entry-v1.js` existe mais reste inert.
Le contrat `module-contract-v1.json` est encore `contract-only-not-loaded`.

### Composition active

Le propriétaire actuel de la composition de base Tactical est encore :
`assets/gensrpg/core/runtime-bootstrap-v1.js`.

Il charge dans cet ordre :
1. engine `gens-rpg-tactical-combat-v2.js` ;
2. adapter ;
3. rules ;
4. integration ;
5. UI ;
6. bridge.

RuntimeBootstrap conserve aussi l'installation du bridge avec les retries historiques 250 / 1200 / 3000 ms.

### Chaîne de compatibilité active

L'intégration charge encore progressivement :
V108 -> V109 -> V110 -> V111 -> V112 -> V113 -> V114.11.

Cependant les sentinelles actuelles prouvent déjà que :
- les observers globaux historiques V108/V109/V111/V112/V113 ne sont plus activés par leurs `install()` ;
- V114.1, ancien hotfix observer global, n'est plus chargé ;
- V114.4 session guard n'est plus chargé ;
- l'autorité murs est déjà consolidée dans la base UI ;
- la détection active est concentrée sur V113 + bridge explicite ;
- stats/snapshot/dégâts/explication sont déjà figés par la CI.

## Dette restante notable

- Core RuntimeBootstrap possède encore une composition spécifique Tactical ;
- l'entrée publique Tactical n'est pas réellement l'entrée du module ;
- la chaîne V108-V114.11 reste longue et s'auto-installe avec de nombreux retries ;
- certaines couches gardent du code historique observer/wall/detection inactif pour rollback ;
- plusieurs couches patchent encore UI/adapter/bridge après chargement.

## Premier seam Phase 8 sélectionné

**Composition ownership handoff** :

transférer uniquement la propriété de la composition de base Tactical depuis Core RuntimeBootstrap vers l'entrée publique Tactical.

Contraintes :
- conserver exactement les six modules de base ;
- conserver leur ordre ;
- conserver le comportement d'installation du bridge tant qu'il n'est pas audité séparément ;
- ne toucher ni engine rules, ni hit/dégâts, ni UI, ni V108-V114.11 dans ce premier lot ;
- aucun changement `index.html` attendu ;
- aucun changement utilisateur attendu.

Ce seam est choisi car il retire une responsabilité Tactical du Core sans modifier les règles du combat et prépare les lots suivants de consolidation interne.

## Hors périmètre

- suppression V108/V109/V111/V112/V113 ;
- réécriture detection V113 ;
- réduction des retries internes ;
- AI ;
- lifecycle/dispose final ;
- Dungeon bridge gameplay ;
- UI/rendu/dés ;
- stats, hit, armure, dégâts.

## Décision

Pré-audit prêt à être verrouillé par CI.

Après GREEN :
1. checkpoint GREEN du pré-audit ;
2. nouveau checkpoint de départ ;
3. branche dédiée au premier seam : handoff composition RuntimeBootstrap -> Tactical entry ;
4. caractérisation RED/GREEN avant micro-diff.
