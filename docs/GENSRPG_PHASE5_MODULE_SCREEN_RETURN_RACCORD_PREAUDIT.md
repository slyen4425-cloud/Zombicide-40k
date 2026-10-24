# GenSrpG — Phase 5 / pré-audit raccord runtime retour écran module

Date : 2026-09-23

## Base

- Branche :
  `work/gensrpg-phase5-module-screen-return-raccord-preaudit-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-screen-return-raccord-preaudit-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-screen-return-contract-green-2026-09-23`
- SHA de base :
  `05daf6383005c1b4ae75409ac53444602179e500`
- Runtime :
  taille `8170961`, blob `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié dans ce pré-audit.

## État confirmé

Le contrat public pur existe :

`assets/gensrpg/shell/module-screen-return-contract-v1.json`

Opération :

`returnToPrimaryView`

Providers déclarés :

- Survival
- Dungeon
- Capture
- PvP

Le contrat reste `declared-not-loaded`.

La chaîne runtime globale `goMenu` reste exactement :

`captureFix139 -> dungeonCore200Rebuild`.

## Pourquoi le RuntimeBootstrap historique est rejeté

`assets/gensrpg/core/runtime-bootstrap-v1.js` ne constitue pas un modèle de
raccord acceptable pour le futur Shell.

Il :
- est un loader historique Tactical / Survival ;
- ne charge aucun point d'entrée Phase 3 Shell/Capture/Dungeon/PvP ;
- utilise encore des réinstallations temporisées à 250, 1200 et 3000 ms.

La charte interdit de recréer une autorité Shell par retry ou polling.
Le futur raccord doit donc être explicite, déterministe et owner-local.

## État des points d'entrée Phase 3

`assets/gensrpg/shell/entry-v1.js` et les quatre points d'entrée module restent
volontairement inertes.

La sentinelle Phase 3 exige encore :
- aucun DOM ;
- aucun stockage ;
- aucun global ;
- aucun listener ;
- aucun timer ;
- aucune installation ;
- aucun chargement dans la composition production.

Le futur raccord devra donc être un chantier explicite de migration de cette
frontière, pas une activation opportuniste du scaffolding Phase 3.

## Frontière module actuelle

### Capture

`captureFix139` possède encore la vraie transition Capture et appelle son
chemin owner-local `captureEnterWorld139()`.

Cette logique doit rester Capture-owned.

### Dungeon

`dungeonCore200Rebuild` possède encore la vraie transition Dungeon et appelle
son `show()` owner-local.

Cette logique doit rester Dungeon-owned.

### Survival / PvP

Les sentinelles Shell actuelles verrouillent déjà :
- retour Survie sans fuite Dungeon/Capture ;
- placeholder PvP ;
- non-interférence des quatre modules.

Le futur contrat ne doit pas dégrader ces chemins pour supprimer les deux
interceptions restantes.

## Point encore non prouvé

La cartographie versionnée des affectations globales caractérise les deux
interceptions `window.goMenu = ...`, mais elle ne suffit pas à établir
l'implémentation Shell native qui se trouve sous la chaîne :

- déclaration native exacte de `goMenu` ;
- appels réels vers cette frontière ;
- données publiques exactes utilisées pour connaître le module actif ;
- emplacement de chargement le plus petit et le plus sûr ;
- accessibilité réelle des fonctions owner-local actuellement fermées dans
  les closures Capture/Dungeon.

Ces éléments sont indispensables avant de choisir une stratégie de raccord.

## Décision

**Aucun raccord runtime n'est autorisé depuis ce pré-audit seul.**

Le prochain micro-lot runtime doit être préparé à partir du fichier
`index.html` exact du checkpoint GREEN courant, conformément à la règle 26.

Une fois ce fichier vérifié, le pré-audit runtime devra déterminer lequel de
ces modèles est réellement compatible avec le code existant :

1. raccord d'une autorité Shell native déjà existante vers des entrées publiques
   module owner-local ;
2. introduction d'une API Shell nommée et unique, seulement si aucune autorité
   native appropriée n'existe.

Le modèle 2 ne doit pas être choisi par défaut.

Dans les deux cas sont interdits :
- chaîne de wrappers `goMenu` supplémentaire ;
- lecture par Shell d'état privé Capture/Dungeon ;
- copie de `captureEnterWorld139` ou de `show()` dans Shell ;
- observer global ;
- timer/retry/polling ;
- fallback inter-module implicite.

## Preuves E2E obligatoires pour le futur raccord

Avant tout retrait de l'un des deux propriétaires restants :

1. Dungeon actif + fiche -> retour map Dungeon ;
2. Dungeon map -> Tactical inchangé ;
3. Capture actif + vieille sauvegarde Dungeon -> Hub Capture ;
4. Capture victoire -> Hub -> reload -> Reprendre Capture ;
5. Survival -> fiche -> menu Survival ;
6. PvP placeholder inchangé ;
7. Builder inchangé ;
8. non-interférence quatre modules ;
9. aucun overlay / thème / pointer-events résiduel.

## Sentinelle du présent pré-audit

`tests/gens_phase5_module_screen_return_raccord_preaudit_v1.test.cjs`

Elle verrouille :
- empreinte runtime inchangée ;
- contrat public existant ;
- providers déclarés mais non chargés ;
- points d'entrée Phase 3 toujours inertes ;
- RuntimeBootstrap historique non utilisé comme raccord Shell ;
- chaîne `goMenu` toujours limitée aux deux propriétaires réels ;
- présence des E2E critiques.

## Règle 26 — fichier nécessaire pour la suite

Avant toute modification runtime, demander à l'utilisateur le fichier exact :

`index.html` du SHA
`05daf6383005c1b4ae75409ac53444602179e500`

et vérifier avant travail :
- taille `8170961` ;
- blob Git `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`.

Ne jamais réutiliser une ancienne copie.
