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

## Phase 1 — état

**Phase 1 complète et GREEN.**

Lot de fermeture :
`work/gensrpg-phase1-shell-context-cleanup-fix-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-shell-context-cleanup-fix-2026-09-18`

Base du correctif :
`6c73c598c7cee070056397bc51592e01cbb6275b`

SHA fonctionnel GREEN :
`08220589eb89a06c73f5777050bbcc90275e48fd`

CI :
- Architecture `35324953366` — SUCCESS
- Firefox `35324953326` — SUCCESS
- Tactical Dock `35324953417` — SUCCESS

## Correctif de fermeture Phase 1

Le RED de non-interférence Capture -> PvP était causé par le propriétaire Shell `openGensFamily(family)`.

Correctif appliqué :
- retrait de `gensCapturePregame` ;
- retrait de `gensAdventurePregame` ;
- retrait de `gensDungeonTheme` uniquement lorsqu'on entre dans une famille autre que `adventure`.

Le changement runtime est strictement limité à **deux lignes** dans `openGensFamily()`.

Non modifié :
- profil actif ;
- sauvegardes ;
- session ;
- runtimes Survie/Dungeon/Tactical/Capture/PvP ;
- gameplay ;
- `gens-pure-capture` ;
- règles ou données persistantes.

La sentinelle `gens_four_module_noninterference_shell_browser_v11411.test.cjs` traverse désormais GREEN :

`Survie -> Dungeon -> Survie -> Capture -> PvP placeholder`

Elle confirme qu'aucune autorité visuelle/runtime parasite majeure ne fuit entre ces contextes.

## Critère de sortie Phase 1

La matrice obligatoire est couverte :
- lancement Survie ;
- lancement Dungeon ;
- fiche héros Dungeon ;
- Save & Quit + reprise ;
- mouvement Dungeon ;
- stats canoniques ;
- dés D100/D6 ;
- calcul de touche ;
- dégâts + armure + résistances ;
- Tactical entrée/sortie ;
- Monster Capture ;
- Duel/PvP ;
- sauvegarde ;
- PWA/cache ;
- non-interférence des quatre modules.

La Phase 1 peut donc être clôturée avant tout déplacement structurel important.

## Prochain chantier

**Phase 2 — cartographie réelle du runtime actif.**

Avant toute modification :
- créer un nouveau checkpoint de départ depuis le checkpoint Phase 1 GREEN ;
- créer une nouvelle branche dédiée ;
- cartographier les scripts réellement chargés, leurs propriétaires et dépendances ;
- classer chaque fichier/bloc : Core, Shell, Survie, Dungeon, Tactical, Capture, PvP, Builders, legacy/inactif ;
- identifier les fonctions globales et responsabilités encore dupliquées ;
- ne déplacer aucun gameplay dans ce premier lot de cartographie.

Critère de sortie Phase 2 : aucun runtime actif sans propriétaire connu.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1 ; elle ne doit pas être mélangée à la cartographie structurelle.
