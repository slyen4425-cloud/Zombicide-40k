# GenSrpG — Phase 8 — Pré-audit de sortie — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-legacy-observer-seam-retirement-green-2026-10-02`
- SHA : `87ceb515a90c5dbf093c3d9bd78a28cf52ecb75d`
- branche : `work/gensrpg-phase8-exit-preaudit-2026-10-02`

## Règle de pilotage

Ce pré-audit applique la règle anti-chantier infini :

- **A — bloque réellement le critère de sortie Phase 8** : un futur micro-lot peut être justifié ;
- **B — ne bloque pas le critère** : backlog, aucune correction opportuniste.

Le fait qu'un fichier soit vieux, redondant, divergent ou améliorable ne suffit pas.

## Critère officiel

> Tactical n'existe que pendant une session de combat et se démonte proprement.

La cible architecturale reste : engine pur, adapter, UI, AI, bridge Dungeon.

## État factuel actuel

### Ce qui est déjà sain

- le moteur Tactical pur reste isolé des DOM/timers legacy ;
- la composition de base appartient à l'entrée publique Tactical ;
- les retries différés 250/1200/3000 du Bridge dans l'entrée publique sont retirés ;
- les anciens seams `MutationObserver` V108/V109/V111/V112/V113 sont physiquement retirés ;
- le Bridge expose un contrat explicite `requestCombat(rt, options)` ;
- le contrat Dungeon déclare `combat trigger` comme responsabilité Dungeon et interdit la résolution Tactical ;
- Architecture + Browser, Firefox et Tactical Dock sont GREEN sur le checkpoint de base.

### A — blocages réels du critère de sortie

#### A1 — activation eager de la pile Tactical

`assets/gensrpg/core/runtime-bootstrap-v1.js` charge encore `assets/gensrpg/tactical/entry-v1.js` au bootstrap application.

L'entrée Tactical exécute encore son `install()` immédiatement, charge les six fichiers de base, puis l'intégration déclenche la chaîne V108 -> V109 -> V110 -> V111 -> V112 -> V113 -> V114.11.

Conséquence : l'autorité Tactical existe avant toute session de combat.

#### A2 — auto-install / retries sans propriétaire de session

V108, V109, V110, V111, V112, V113 et V114.11 s'auto-installent au chargement, exposent `installWithRetries()`, planifient encore leurs retries propres et n'exposent aucun `dispose()`.

Les retries ne sont donc pas possédés/cancelables par une session Tactical.

#### A3 — fermeture locale, pas teardown runtime

`GensRpgTacticalCombatV2Ui.close()` retire l'overlay et remet l'état local à zéro, mais ne retire pas les listeners globaux, ne restaure pas les wrappers, ne cancelle pas les retries et n'appelle aucun `dispose()`.

Le critère « se démonte proprement » n'est donc pas satisfait.

#### A4 — autorité Tactical active pendant exploration Dungeon

V113 installe encore hors combat :
- wrapper de `dungeonMoveHero098` ;
- hooks d'événements Dungeon ;
- listeners document `click` + `pointerup` sur le board ;
- détection qui peut déclencher `dc200StartCombat`.

Or le contrat Dungeon déclare explicitement Dungeon propriétaire du `combat trigger`.

Cette responsabilité doit être reclassée vers une frontière Dungeon/Bridge explicite ou autrement rendue session-compatible avant EXIT GREEN. Le pré-audit ne choisit pas encore la migration.

#### A5 — side effects UI/start globaux hors session

La base UI installe encore automatiquement le polish global Dungeon (`patchDungeonMapHtml`, hooks render).

V114.11 installe encore un listener menu global en capture, `stopImmediatePropagation` sur ce chemin, un wrapper `dc200StartCombat` et des wrappers d'ouverture UI.

Ces autorités survivent à `UI.close()`.

## B — backlog, pas de lot Phase 8 automatique

Voir `docs/GENSRPG_PHASE8_BACKLOG.md`.

Principes retenus :
- les fichiers V114.1 / V114.4 / V114.5 non atteignables ne bloquent pas la sortie ;
- la présence physique de code historique inactif ne bloque pas la sortie ;
- les nettoyages de noms, versions, commentaires et documentation historique ne justifient pas un micro-lot ;
- aucune suppression de couche V108-V114 n'est demandée simplement parce qu'elle est ancienne.

## Décision de pré-audit

**PHASE 8 N'EST PAS ENCORE EXIT-READY.**

La raison n'est pas la présence de legacy : ce sont les side effects actifs hors session et l'absence de teardown.

Le prochain travail Phase 8 devra partir d'un blocage A et répondre explicitement à :

> Pourquoi ce lot est-il nécessaire au critère de sortie Phase 8 ?

Aucun lot ne sera ouvert pour un élément B.

## Orientation du prochain audit technique

Ne pas descendre les fichiers un par un.

Chercher le plus petit raccord permettant d'établir une propriété de session explicite :
1. frontière de démarrage ;
2. activation des autorités uniquement quand nécessaire ;
3. ownership des timers/listeners/wrappers ;
4. `dispose` / teardown à la fermeture ;
5. maintien d'un Bridge Dungeon explicite.

La détection Dungeon/V113 doit être traitée comme une question d'ownership, pas comme un prétexte à refondre le gameplay ou la portée/vision.

## Index

Aucune lecture/modification exacte de `index.html` n'est nécessaire pour ce pré-audit.

Si un futur lot exige une modification de ses callsites inline, appliquer Rule 26 avant toute modification.

## Validation finale

Audit documentaire + sentinelle statique uniquement ; aucun runtime modifié.

HEAD validé :
`d631f8f914b150b50b3b2d228f2e3e2aa8325953`

Triple CI :
- Architecture + Browser `36949611830` — SUCCESS ;
- Firefox `36949611826` — SUCCESS ;
- Tactical Dock `36949611965` — SUCCESS.

Décision : **PRÉ-AUDIT DE SORTIE PHASE 8 GREEN**.

La Phase 8 n'est pas encore EXIT-ready pour une raison lifecycle démontrée, non pour dette legacy générique. Toute suite doit partir d'un blocage A explicite.

Checkpoint final prévu :
`checkpoint/gensrpg-phase8-exit-preaudit-green-2026-10-02`.
