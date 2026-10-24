# GenSrpG — Phase 8 — Pré-audit propriété de session Tactical — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-exit-preaudit-green-2026-10-02`
- SHA : `4f57f22d4ada1ee1eb6dba3c88b1739cd1e7a931`
- branche : `work/gensrpg-phase8-tactical-session-ownership-preaudit-2026-10-02`

## Pourquoi ce lot est nécessaire au critère de sortie Phase 8

Le pré-audit de sortie a démontré que Tactical est encore activé avant toute session de combat. Ce point bloque directement le critère :

> Tactical n'existe que pendant une session de combat et se démonte proprement.

Ce chantier ne nettoie aucun fichier pour le principe. Il cherche uniquement la plus petite frontière de propriété de session.

## État réel

### Bootstrap

`assets/gensrpg/core/runtime-bootstrap-v1.js` charge uniquement l'entrée publique :

`assets/gensrpg/tactical/entry-v1.js`

Le Core ne possède donc plus la composition privée Tactical.

### Entrée publique Tactical

L'entrée publique possède encore la liste des six fichiers de base, puis appelle automatiquement `install()` au chargement de l'application.

Conséquence :
- toute la pile privée est chargée sans combat actif ;
- l'intégration démarre la chaîne V108 -> V114.11 ;
- `finalize()` installe le Bridge ;
- les autorités globales apparaissent avant la première session.

### Bridge

Le fichier Bridge possède une propriété utile pour la future frontière :
- son simple chargement publie `GensRpgTacticalCombatV2Bridge` ;
- il n'a pas d'auto-install `DOMContentLoaded` ;
- son `install()` n'est appelé aujourd'hui que par l'entrée publique après chargement de la pile.

Donc **le Bridge peut exister comme façade chargée mais inerte**.

Son `requestCombat()` est déjà le contrat canonique Dungeon -> Tactical, mais il suppose actuellement que engine + adapter + UI sont déjà disponibles et renvoie `modules-missing` sinon.

### Callsites Dungeon

Les sentinelles existantes prouvent déjà :
- les actions actives Runtime 2.00 sont Bridge-backed ;
- Core 2.01 passe par le Bridge ;
- les deux boutons natifs de combat manuel passent par `Bridge.requestCombat` ;
- le dernier `dc200StartCombat` brut est une graine de compatibilité, pas un callsite Dungeon actif.

Il n'est donc pas nécessaire de modifier `index.html` pour créer la prochaine frontière de session.

## Seam sélectionné

**Façade Bridge chargée / pile Tactical privée activée à la première requête de combat.**

Principe du futur lot runtime :
1. RuntimeBootstrap continue de charger l'entrée publique Tactical ;
2. l'entrée rend disponible la façade Bridge sans activer la pile privée ;
3. le premier `Bridge.requestCombat` demande à l'entrée publique d'activer la pile Tactical ;
4. après disponibilité des dépendances, le Bridge s'installe puis rejoue la requête ;
5. aucune migration des callsites Dungeon n'est requise.

Ce seam traite directement **A1 — activation eager**.

## Pourquoi ce seam est préférable au nettoyage couche par couche

- aucune descente V108 -> V114 ;
- aucun changement gameplay ;
- aucun changement des règles hit/dégâts/armure ;
- aucun besoin de `index.html` ;
- conservation du contrat Bridge déjà protégé ;
- réduction immédiate de l'autorité Tactical hors combat avant de traiter le teardown.

## Ce que ce lot ne résoudra pas encore

Après activation au premier combat, les side effects installés peuvent encore survivre à `UI.close()`.

Cela reste un blocage A distinct :
- ownership des timers/listeners/wrappers ;
- `dispose()` / teardown réel ;
- V113 exploration authority hors session après le premier combat ;
- V114.11 menu/start side effects.

Ces sujets ne seront pas ouverts tant que le premier seam n'est pas validé, et ils ne devront pas être traités fichier par fichier.

## Classification B

Restent backlog :
- vieux fichiers non atteignables ;
- noms/version labels historiques ;
- fonctions mortes non activées ;
- nettoyage cosmétique.

## Index

Aucune modification de `index.html` n'est nécessaire pour le seam sélectionné.

## Cible du futur RED

Le futur lot runtime devra d'abord poser un RED prouvant :
- après bootstrap, `GensTacticalV1` et la façade Bridge sont disponibles ;
- engine/adapter/UI/compatibility chain ne sont pas encore activés ;
- la première requête Bridge déclenche l'activation privée une seule fois ;
- une requête avec runtime déjà actif conserve le contrat synchrone existant ;
- aucun gameplay n'est modifié.

Ce pré-audit ne modifie aucun runtime.


## Validation technique GREEN

HEAD :
`87eb363de4b7723f741f77f2514131b3c23878fe`

Triple CI :
- Architecture + Browser `36979070245` — SUCCESS ;
- Firefox `36979070269` — SUCCESS ;
- Tactical Dock `36979070220` — SUCCESS ;
- sentinelle Architecture #255 — SUCCESS.

Aucun runtime n'a été modifié.

## Décision

**PRÉ-AUDIT PROPRIÉTÉ DE SESSION TACTICAL GREEN.**

Le seam sélectionné reste strictement :
**façade Bridge chargée / pile Tactical privée activée à la première requête de combat**.

Le teardown/dispose après fermeture reste un blocage A distinct et hors de ce futur premier lot runtime.

Checkpoint final prévu :
`checkpoint/gensrpg-phase8-tactical-session-ownership-preaudit-green-2026-10-02`.
