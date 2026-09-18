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

## Dernier lot validé

**Phase 1 — sentinelle du placeholder PvP actuel**

Branche :
`work/gensrpg-phase1-pvp-placeholder-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-pvp-placeholder-sentinel-2026-09-18`

Base exacte :
`578f8fb5cf6ea05682b2ac10329ae6666d38a01e`

SHA fonctionnel vert avant fermeture documentaire :
`fe5eec3cfcfb0973ae5edab5ab8888a48fd761b7`

Checkpoint final :
`checkpoint/gensrpg-phase1-pvp-placeholder-sentinel-green-2026-09-18`

## Résultat du lot PvP

La sentinelle navigateur `tests/gens_pvp_placeholder_shell_browser_v11411.test.cjs` traverse le vrai Shell :

`Accueil -> Duel / PvP -> placeholder`

Elle vérifie :
- présence de la vraie carte PvP racine ;
- affichage de `PVP — À VENIR` ;
- texte `Le moteur PvP n’est pas encore construit.` ;
- une seule carte placeholder désactivée ;
- aucune ouverture de game home, pré-game ou menu de jeu ;
- aucune création de session active ;
- aucun profil de jeu activé ;
- aucun runtime/état Dungeon créé ;
- aucun thème Dungeon activé ;
- aucun écrasement du guard famille Survie/Adventure.

Le harnais réutilise le bloc Shell réel et le bloc custom-content exact de `index.html`. Aucun moteur PvP, runtime, gameplay, asset ou persistance n'a été créé ou modifié.

CI sur `fe5eec3cfcfb0973ae5edab5ab8888a48fd761b7` :
- Architecture : run `35318561984` — SUCCESS
- Firefox : run `35318561927` — SUCCESS
- Tactical Dock : run `35318561939` — SUCCESS

## Prochain chantier Phase 1

**Capture — protéger le comportement actuel uniquement.**

Périmètre prévu :
- nouveau checkpoint de départ et nouvelle branche ;
- sentinelle test-only en première intention ;
- traverser le vrai Shell / flux Capture actuel ;
- caractériser et protéger ce qui fonctionne aujourd'hui ;
- ne restaurer, réécrire ni étendre Capture pendant Phase 1 ;
- aucun correctif runtime si un défaut réel apparaît avant caractérisation dédiée.

Après Capture : sentinelle explicite de non-interférence des quatre modules.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
