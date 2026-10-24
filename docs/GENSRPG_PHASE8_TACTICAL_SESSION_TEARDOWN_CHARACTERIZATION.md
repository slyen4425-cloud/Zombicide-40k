# GenSrpG — Phase 8 — Caractérisation ownership teardown session Tactical — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-session-teardown-preaudit-green-2026-10-02`
- SHA : `1a345a79a387b921e8f78cf5a33e1a2aea7a7f01`
- branche : `work/gensrpg-phase8-tactical-session-teardown-ownership-2026-10-02`

## Pourquoi ce lot est nécessaire

Le pré-audit a prouvé un blocage A unique : après activation puis fermeture locale du combat, les autorités privées Tactical restent actives. Le même propriétaire qui active la pile doit donc posséder son teardown.

Ce lot ne vise aucun nettoyage legacy non bloquant.

## État caractérisé avant migration

- `GensTacticalV1` expose `activate()` mais aucun `deactivate()/dispose()` ;
- `UI.close()` retire l'overlay et le battle local mais n'appelle aucun teardown global ;
- Bridge installe des routes globales sans API d'uninstall/dispose ;
- base UI installe son polish Dungeon privé et garde des wrappers restaurables via `__original` ;
- V108/V109/V110/V111/V112/V113/V114.11 exposent `installWithRetries()` mais aucun teardown ;
- les retries sont bornés mais leurs handles ne sont pas possédés/cancelables ;
- V113 conserve ses listeners document board click/pointerup ;
- V114.11 conserve son listener menu document en capture ;
- la chaîne de compatibilité possède `compatibilityStarted` mais aucun reset lifecycle.

## Invariants protégés

- façade Bridge chargée entre les combats ;
- activation privée uniquement à la première requête ;
- Bridge reste le contrat Dungeon -> Tactical ;
- aucun changement gameplay/hit/dégâts/armure/IA ;
- aucun changement `index.html` ;
- aucun observer/heartbeat/polling/retry supplémentaire ;
- restauration d'un wrapper uniquement s'il est encore le wrapper courant de la couche ;
- deuxième combat après teardown doit pouvoir réinstaller la pile exactement une fois.

## Cible RED suivante

Exiger :
1. `GensTacticalV1.deactivate()/dispose()` idempotent ;
2. `UI.close()` signale la fin de session vers ce propriétaire ;
3. Bridge et couches privées disposent leurs ressources ;
4. retries pendants annulés ;
5. listeners document retirés ;
6. wrappers session restaurés en ordre inverse ;
7. état d'activation remis à froid ;
8. réactivation suivante fonctionnelle sans duplication.

Après GREEN de ce lot, ré-audit immédiat du critère de sortie Phase 8.


## RED confirmé et migration

HEAD RED :
`355065a3f958dda6b39905d46dd017576dcd2643`

- Architecture `37032650051` — FAILURE attendue ;
- étape #260 — échec attendu : `GensTacticalV1 must own session deactivate` ;
- Firefox `37032649902` — SUCCESS ;
- Tactical Dock `37032650125` — SUCCESS.

Le micro-diff lifecycle a ensuite :
- ajouté `GensTacticalV1.deactivate()/dispose()` ;
- raccordé `UI.close()` à ce propriétaire ;
- ajouté des `dispose()` ciblés au Bridge, à la base UI et aux sept couches privées ;
- rendu les retries pendants annulables ;
- retiré les listeners document V113/V114.11 au teardown ;
- restauré uniquement les wrappers encore possédés par la couche ;
- réinitialisé la chaîne de compatibilité pour une réactivation propre.

Aucun changement gameplay, IA, hit, dégâts, armure, callsite Dungeon, Capture, PvP, Survival ou `index.html`.

## Validation technique GREEN

HEAD :
`d82981bcd2fe1e08f4b041d81111b81dc29ac342`

- Architecture + Browser `37039255432` — SUCCESS ;
- Firefox `37039255361` — SUCCESS ;
- Tactical Dock `37039255396` — SUCCESS ;
- garde Phase 8 #260 — SUCCESS ;
- scénarios Browser inter-modules — SUCCESS.

Le dernier réalignement `docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json` est purement descriptif : le nouvel audit de sortie ne référence plus trois fichiers historiques non-production. Aucun runtime n'a été modifié par ce réalignement.

## Décision

**MICRO-LOT 6 TECHNIQUEMENT GREEN.**

Le prochain travail autorisé est l'audit EXIT Phase 8. Aucun nettoyage legacy supplémentaire n'est justifié avant cet audit.
