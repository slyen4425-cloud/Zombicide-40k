# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Dernier checkpoint vert

Phase 2 — cartographie runtime initiale :
`checkpoint/gensrpg-phase2-runtime-cartography-initial-green-2026-09-18`

SHA :
`d247b277ebadc0457b9ff463993d5fd3bafae7b8`

CI :
- Architecture `35326145505` — SUCCESS
- Firefox `35326145516` — SUCCESS
- Tactical Dock `35326145484` — SUCCESS

Livrables déjà verts :
- `docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md`
- `tests/gens_phase2_runtime_load_graph_v11411.test.cjs`

## Chantier courant

**Phase 2 — cartographie réelle du runtime actif**

Branche :
`work/gensrpg-phase2-runtime-cartography-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase2-runtime-cartography-2026-09-18`

Base exacte :
`04cce98e79252a791bd7130fe6993f00916fa5dc`

## Périmètre déclaré

Lot documentaire/diagnostic en première intention.

Inventorier :
- scripts réellement chargés par `index.html` ;
- chargements dynamiques ;
- auto-installs ;
- wrappers / monkey-patches ;
- `MutationObserver` ;
- listeners `document` / `window` ;
- timers / retries ;
- accès directs à `localStorage` / IndexedDB ;
- fonctions globales remplacées ;
- responsabilités potentiellement dupliquées.

Classer les fichiers/blocs actifs :
- Core ;
- Shell ;
- Survie ;
- Dungeon ;
- Tactical ;
- Capture ;
- PvP ;
- Builders ;
- legacy/inactif.

## Interdictions du lot

- aucun déplacement de fichier runtime ;
- aucun changement de gameplay ;
- aucun correctif de dette découvert pendant l'audit ;
- aucun nouveau wrapper/observer/timer ;
- aucune modification de `main`;
- aucune suppression de code historique avant cartographie complète.

## Source index.html

Appliquer strictement la règle 26 de la charte.

Si le contenu exact de `index.html` doit être consulté ou modifié :
- identifier d'abord le SHA exact requis ;
- fournir immédiatement à l'utilisateur le lien direct GitHub vers ce `index.html` précis ;
- lui demander de le télécharger, le compresser et le joindre ;
- vérifier ensuite le fichier reçu avant utilisation.

Ne pas réutiliser automatiquement une ancienne copie locale si le chantier exige un état plus récent.

Pour les analyses qui n'exigent pas son contenu exact, GitHub reste utilisé pour SHA, diff, CI, workflow Pages et métadonnées.

## Livrables du lot

1. inventaire des scripts externes chargés ;
2. inventaire des blocs inline identifiables ;
3. table des propriétaires probables ;
4. inventaire des mécanismes globaux à risque ;
5. liste des fichiers actifs sans propriétaire clair ;
6. liste des blocs probablement legacy/inactifs ;
7. recommandations de découpage pour la suite, sans déplacement dans ce lot.

## Risques

- `index.html` contient encore de nombreuses couches historiques ;
- certains scripts sont chargés dynamiquement et non visibles dans les seules balises `script src` ;
- un nom de version historique ne signifie pas automatiquement qu'un bloc est inactif ;
- la présence d'une fonction globale n'implique pas qu'elle soit propriétaire : il faut suivre les callsites/chargements.

## Critère de sortie Phase 2

Aucun fichier runtime actif sans propriétaire connu.

## État Phase 2 actuel

Cartographie déjà établie :
- 72 fichiers JS physiques sous `assets/gensrpg` + `assets/dungeon` ;
- 21 entrées locales directes dans la composition GitHub Pages ;
- 65 fichiers JS atteignables dans le graphe de production ;
- 7 fichiers hors graphe de production actuel ;
- 130 blocs inline identifiés dans `index.html` ;
- 120 blocs exécutables / 10 explicitement désactivés ;
- chaînes d'autorité/global wrappers cartographiées pour les fonctions critiques ;
- dettes observer/timers/storages documentées.

Gardes Phase 2 :
- graphe runtime production : GREEN ;
- inventaire des chaînes d'autorité : GREEN ;
- manifeste des propriétaires runtime : GREEN ;
- inventaire effets globaux / stockage : GREEN.

Caractérisation encore en cours :
- Capture dans la composition Pages complète ;
- le test n'a pas encore atteint une assertion gameplay ;
- le blocage actuel se produit pendant le boot complet du gros runtime ;
- instrumentation ajoutée pour remonter le dernier bloc inline exécuté avant gel.

## Caractérisation boot complet — résultat actuel

Le run instrumenté a identifié le point d'arrêt exact du boot complet Pages :

- blocs 001 à 029 : atteints ;
- bloc 030 : `builtinMonsterCapture162` — entrée confirmée ;
- aucun bloc 031 atteint avant watchdog 90 s ;
- aucune assertion gameplay atteinte ;
- requêtes HTML/CDN stub/assets terminées.

Le blocage est donc situé pendant l'exécution synchrone de `builtinMonsterCapture162` ou d'un appel synchrone effectué avant son retour.

Ce constat est **caractérisé mais non corrigé** dans ce lot.

`index.html` requis pour la suite :
- SHA de travail : `95db8780eeecdd33a662fbe99c260ecec2cb24a0`
- blob `index.html` : `a515c3d34a1f5c4973159457090e4437a33c2630`
- taille : 8 175 610 octets.

Fichier reçu et vérifié le 2026-09-18 :
- taille : 8 175 610 octets ;
- blob recalculé : `a515c3d34a1f5c4973159457090e4437a33c2630` ;
- correspondance exacte avec le blob attendu : OUI.

Le contenu exact de `index.html` est donc désormais disponible localement conformément à la règle 26.

## Caractérisation bloc 030 — défaut fonctionnel confirmé

Le `index.html` exact a été vérifié :
- taille : 8 175 610 octets ;
- blob : `a515c3d34a1f5c4973159457090e4437a33c2630`.

Le scénario navigateur Pages complet a prouvé que le gel commence dans :

`builtinMonsterCapture162 -> ensureBuiltinMonsterCapture162() -> refreshCustomEquipmentIntoItems()`.

Chaîne récursive exacte observée :

```text
refreshCustomEquipmentIntoItems
→ gensCurrentContentFamily
→ getActiveGameProfile
→ loadGameProfiles
→ ensureBaseGameProfile
→ captureCurrentGameProfile(game_profile_zombicide_base)
→ currentAllHeroIds
→ applyCustomHeroesMulti
→ gensContentCompatible(hero)
→ gensCurrentContentFamily
→ ...
```

Le traceur borné a enregistré 80 appels successifs de cette boucle avant watchdog.

Cause :
- le profil Capture est seedé via `loadGameProfilesRaw()` alors que Base/Dungeon sont absents ;
- le dresseur Capture est ensuite seedé ;
- le refresh équipement déclenche le bootstrap canonique des profils ;
- pendant la construction Base, le dresseur Capture exige une résolution de famille qui réentre dans le même bootstrap avant sa persistance.

Commit de caractérisation :
`8c25a0940374ff36ff6754a8bd4aa4d59cf51afb`.

Résultat CI important :
- gardes Architecture Phase 2 : SUCCESS ;
- UI native / Survie / Save & Quit-Reprise / PvP / Capture réduit : SUCCESS ;
- composition Pages complète Capture : RED sur cette récursion, avant toute assertion gameplay.

## Décision de périmètre

Il s'agit d'un **vrai défaut fonctionnel** découvert par un lot de cartographie.

Conformément à la charte :
- **aucun correctif runtime dans ce lot Phase 2** ;
- la cartographie s'arrête sur cette caractérisation ;
- le correctif doit être traité dans un lot dédié, avec checkpoint et branche propres.

## Prochain chantier

**Correctif dédié — bootstrap à froid des profils avant seed Monster Capture 162.**

Objectif :
- supprimer la récursion au vrai propriétaire / bon ordre de bootstrap ;
- ne pas créer de deuxième système ;
- aucun nouveau wrapper, observer, timer ou retry ;
- conserver les données/règles Capture existantes ;
- valider le vrai chemin Pages complet.

Tests obligatoires :
- `gens_phase2_full_composition_capture_browser_v11411.test.cjs` (doit atteindre les assertions gameplay) ;
- sentinelle Capture courante ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox / Tactical Dock.

Prochaine action :
1. créer le checkpoint de départ sur le SHA de clôture documentaire de cette caractérisation ;
2. créer une branche dédiée de correctif ;
3. appliquer le correctif minimal au vrai propriétaire ;
4. valider entièrement avant tout checkpoint GREEN ;
5. ne rien fusionner sur `main`.

Aucun correctif runtime dans ce lot de cartographie.

## Dette séparée

La détection ennemie hors embuscade reste un chantier de caractérisation fonctionnelle distinct ; elle n'est pas corrigée dans cette cartographie.
