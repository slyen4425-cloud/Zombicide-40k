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

Phase 1 — placeholder PvP actuel :
`checkpoint/gensrpg-phase1-pvp-placeholder-sentinel-green-2026-09-18`

SHA :
`cd797172ec1b32a6edcc84b743a45794d5dfbd32`

CI de fermeture :
- Architecture `35318887146` — SUCCESS
- Firefox `35318887102` — SUCCESS
- Tactical Dock `35318887116` — SUCCESS

## Chantier courant

**Phase 1 — Capture : protéger le comportement actuel uniquement**

Branche :
`work/gensrpg-phase1-capture-current-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-capture-current-sentinel-2026-09-18`

Base exacte :
`cd797172ec1b32a6edcc84b743a45794d5dfbd32`

## Périmètre déclaré

Première intention **test-only** :
- traverser le vrai Shell jusqu'au flux Capture actuellement exposé ;
- identifier les vrais propriétaires du lancement Capture et de son écran/runtime actuel ;
- protéger uniquement le comportement qui existe aujourd'hui ;
- vérifier que Capture ne prend pas l'autorité sur Survie/Dungeon/PvP en dehors de son contexte ;
- brancher une sentinelle stable à la CI.

Interdictions du lot :
- ne pas restaurer Capture ;
- ne pas réécrire Capture ;
- ne pas ajouter de créatures, règles, combats, capture, biomes ou progression ;
- ne pas corriger un défaut fonctionnel découvert avant caractérisation dédiée ;
- aucun MutationObserver global, timer/retry de réparation, wrapper permanent ou monkey-patch ;
- ne pas toucher au gameplay Survie/Dungeon/Tactical/PvP ;
- ne pas toucher à `main`.

## Propriétaires à identifier avant test

- entrée Shell exacte vers Capture ;
- profil/famille ou route réellement utilisée par Capture ;
- écran/host Capture actuel ;
- fonctions de lancement et état persistant réellement lus/écrits ;
- éventuels guards empêchant Dungeon/Survie de reprendre l'autorité.

## Tests prévus

1. localiser le vrai point d'entrée Capture dans `index.html` ;
2. vérifier le comportement actuel sans supposer qu'il est complet ;
3. construire un harnais à partir des blocs source exacts nécessaires ;
4. traverser la vraie UI Shell jusqu'à Capture ;
5. vérifier les invariants observés (vue active, absence de runtime parasite, état/famille/profil si applicable) ;
6. relancer Architecture + navigateur + sentinelles existantes ;
7. si GREEN, mettre à jour l'audit et créer le checkpoint final.

## Risques

- Capture peut être partiellement historique ou exposé par un chemin différent des familles Survie/Adventure ;
- un vieux bloc UI peut exister sans runtime complet ;
- un test qui invente une session Capture serait invalide ;
- un RED fonctionnel réel devra être caractérisé sans correctif dans ce lot.

## Prochaine étape

Cartographier dans le vrai `index.html` le point d'entrée Capture, son propriétaire UI/runtime et les clés persistantes touchées, puis écrire la plus petite sentinelle réelle.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
