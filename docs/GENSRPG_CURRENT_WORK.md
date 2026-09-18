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

Phase 1 complète :
`checkpoint/gensrpg-phase1-complete-green-2026-09-18`

SHA :
`04cce98e79252a791bd7130fe6993f00916fa5dc`

CI de clôture :
- Architecture `35325172047` — SUCCESS
- Firefox `35325172074` — SUCCESS
- Tactical Dock `35325172035` — SUCCESS

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

Conformément à la règle 26, le contenu exact doit maintenant être fourni par l'utilisateur depuis ce SHA précis avant inspection du bloc 30.

## Prochaine étape

1. recevoir le `index.html` exact du SHA indiqué ;
2. vérifier son blob ;
3. isoler `builtinMonsterCapture162` ;
4. inventorier ses appels synchrones et la cause du gel ;
5. reproduire sans modifier le runtime ;
6. si défaut fonctionnel réel confirmé, arrêter ce lot de cartographie et ouvrir un lot correctif dédié.

Aucun correctif runtime dans ce lot de cartographie.

## Dette séparée

La détection ennemie hors embuscade reste un chantier de caractérisation fonctionnelle distinct ; elle n'est pas corrigée dans cette cartographie.
