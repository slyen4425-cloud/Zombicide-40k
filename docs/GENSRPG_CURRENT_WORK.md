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

Phase 1 — Save & Quit + vraie reprise complète par le Shell :
`checkpoint/gensrpg-phase1-savequit-resume-sentinel-green-2026-09-18`

SHA :
`578f8fb5cf6ea05682b2ac10329ae6666d38a01e`

CI de fermeture :
- Architecture `35318065938` — SUCCESS
- Firefox `35318066103` — SUCCESS
- Tactical Dock `35318066006` — SUCCESS

## Chantier courant

**Phase 1 — sentinelle du placeholder PvP actuel**

Branche :
`work/gensrpg-phase1-pvp-placeholder-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-pvp-placeholder-sentinel-2026-09-18`

Base exacte :
`578f8fb5cf6ea05682b2ac10329ae6666d38a01e`

## Périmètre déclaré

Première intention **test-only** :
- traverser le vrai Shell jusqu'au mode Duel/PvP ;
- vérifier que le comportement actuel reste explicitement un placeholder ;
- protéger les textes actuels `PVP — À VENIR` et `Le moteur PvP n’est pas encore construit.` ;
- vérifier qu'aucune session de jeu ni autorité Dungeon/Survie/Tactical n'est activée par ce choix ;
- brancher la sentinelle à la CI.

Aucun moteur PvP ne doit être créé, démarré ou simulé dans ce lot.

## Propriétaire identifié

- `openGensFamily('pvp')` dans le Shell actuel ;
- ce propriétaire affiche le placeholder et ne délègue pas à un runtime PvP.

## Fonctions/systèmes protégés

Ne pas modifier dans ce lot :
- runtime Survie/Dungeon/Tactical/Capture ;
- navigation globale hors besoin strict de caractérisation ;
- combat, stats, dés, inventaire, persistance ;
- PWA/cache ;
- aucun nouveau wrapper global, observer, timer/retry ou monkey-patch ;
- aucun fichier runtime PvP à créer.

## Tests prévus

1. charger le vrai Shell ;
2. cliquer sur la vraie carte Duel/PvP ;
3. vérifier le titre/texte placeholder actuels ;
4. vérifier qu'aucun profil/session de jeu n'est activé ;
5. vérifier qu'aucune UI/runtime Dungeon/Tactical n'acquiert l'autorité ;
6. relancer Architecture + navigateur + sentinelles existantes.

## Risques

- un sélecteur de test peut être obsolète ; ne jamais remplacer cela par une valeur injectée ;
- ne pas transformer ce chantier de protection en début d'implémentation PvP ;
- si le Shell actuel fait autre chose qu'un placeholder, caractériser avant toute correction runtime.

## Prochaine étape

Créer la sentinelle navigateur minimale du vrai Shell pour le placeholder PvP et l'ajouter à la CI.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
