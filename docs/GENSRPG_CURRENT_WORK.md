# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne pas travailler directement sur `main`

## Dernier checkpoint vert utilisateur

`checkpoint/gensrpg-tactical-dock-legacy-layer-green-2026-09-17`  
SHA : `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`

Le test manuel utilisateur du Dock après combats répétés est concluant.

## Chantier courant

**Phase 1 — audit des gaps de sentinelles après Dock**

Branche :
`work/gensrpg-phase1-sentinel-gap-audit-post-dock-2026-09-17`

Checkpoint de départ rétroactif conforme :
`checkpoint/gensrpg-start-phase1-sentinel-gap-audit-2026-09-18`

SHA de base :
`ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`

Périmètre : documentation/audit uniquement. Aucun runtime ou gameplay.

Matrice détaillée :
`docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Conclusion de l'audit

Couverture forte : fiche héros, mouvement Dungeon, stats, D100/D6, toucher, dégâts/armure, Tactical, persistance Dungeon, PWA/cache.

Gaps confirmés :
- lancement Survie : pas de sentinelle shell réelle ;
- lancement Dungeon : runtime fortement couvert, shell complet non couvert ;
- Save & Quit : sortie couverte, vraie reprise complète non couverte ;
- Capture : données couvertes, lancement/gameplay non couvert ;
- PvP : placeholder actuel non protégé ;
- non-interférence entre les quatre modules : partielle.

## Prochaine étape

Après validation CI de ce SHA documentaire :
1. créer le checkpoint vert de l'audit ;
2. créer le checkpoint de départ du lot suivant ;
3. ouvrir une branche **test-only** dédiée à la sentinelle de lancement Survie ;
4. ne modifier aucun runtime ;
5. brancher uniquement la nouvelle sentinelle au workflow d'architecture.

## Dette explicitement différée

La détection ennemie hors embuscade fera l'objet d'un chantier de caractérisation dédié après la Phase 1.
