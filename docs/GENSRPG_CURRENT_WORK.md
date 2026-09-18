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

Phase 1 — Capture : protection du comportement actuel :
`checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`

SHA :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

## Lot caractérisé RED

**Phase 1 — sentinelle explicite de non-interférence des quatre modules**

Branche :
`work/gensrpg-phase1-four-module-noninterference-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-four-module-noninterference-sentinel-2026-09-18`

Base exacte :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

SHA de caractérisation :
`c098eb1c110e31a01269810d1e9f8117028f7c5f`

## Résultat de la sentinelle

La sentinelle traverse correctement dans un même contexte navigateur :

`Survie -> Dungeon -> Survie -> Capture -> PvP placeholder`

Les transitions suivantes sont conformes :
- Survie -> Dungeon ;
- Dungeon -> Survie ;
- Survie -> Capture ;
- aucun runtime/session Dungeon parasite n'est créé pendant ces changements ;
- le placeholder PvP n'active ni nouvelle session ni nouveau profil.

Le RED fonctionnel est précis sur **Capture -> PvP** :
- `gensDungeonTheme` reste actif sur `body` ;
- `gensCapturePregame` reste actif sur `body` ;
- le profil actif reste Monster Capture, ce qui est acceptable pour un placeholder sans profil propre ;
- le guard famille reste `adventure`, ce qui est acceptable car PvP n'a pas de famille persistante supportée ;
- Hub Capture et panneau Dungeon restent cachés ;
- aucune session ou runtime Dungeon n'est créé.

## Cause identifiée

Le propriétaire Shell `openGensFamily(family)` :
- masque les niveaux d'accueil ;
- affiche la famille demandée ;
- rend les cartes de famille ;
- **ne nettoie pas les classes transitoires de contexte laissées par le pré-game précédent**.

Les classes sont posées ailleurs par les propriétaires normaux :
- `gensDungeonTheme` par le profil/style Adventure-Dungeon ;
- `gensCapturePregame` par le wizard de pré-game Capture ;
- `gensAdventurePregame` par le wizard Adventure ;
- `gens-pure-capture` par le runtime Capture actif.

Le lot sentinelle reste test/workflow/documentation uniquement. Aucun runtime n'est corrigé ici.

## Prochain chantier dédié

**Correctif Shell — nettoyage de contexte lors d'un changement de famille hors gameplay.**

Périmètre :
- nouveau checkpoint de départ depuis la caractérisation RED ;
- nouvelle branche dédiée ;
- propriétaire modifié : `openGensFamily()` uniquement, sauf preuve contraire ;
- correction soustractive : retirer les classes de contexte transitoires lorsqu'on quitte leur vue ;
- ne pas effacer les données persistantes ni les profils ;
- ne pas toucher aux moteurs Survie/Dungeon/Capture/PvP ;
- aucune nouvelle couche, observer, timer ou wrapper ;
- la sentinelle quatre modules doit passer GREEN ;
- toutes les sentinelles existantes doivent rester GREEN.

Après ce correctif GREEN : clôturer la non-interférence et refaire la matrice complète Phase 1.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
