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

## Dernier lot validé

**Phase 1 — Capture : protection du comportement actuel uniquement**

Branche :
`work/gensrpg-phase1-capture-current-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-capture-current-sentinel-2026-09-18`

Base exacte :
`cd797172ec1b32a6edcc84b743a45794d5dfbd32`

SHA fonctionnel vert avant fermeture documentaire :
`97ad8aa05ccd7422f08c1bf1715fcb487d98c0ef`

Checkpoint final :
`checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`

CI sur le SHA fonctionnel :
- Architecture `35321411358` — SUCCESS
- Firefox `35321411333` — SUCCESS
- Tactical Dock `35321411366` — SUCCESS

## Résultat du lot Capture

La sentinelle navigateur `tests/gens_capture_current_shell_browser_v11411.test.cjs` traverse le comportement actuel réel :

`Accueil -> Adventure -> Monster Capture -> reload V16.155 -> Adventure -> Monster Capture -> pré-game -> dresseur -> créature de départ -> startConfiguredGame() -> Hub Capture -> Jour 1 -> Jour 2`

Elle protège notamment :
- profil embarqué actuel `Monster Capture` (`gp_mt7ker7t_m2iw9`) ;
- classification actuelle : Shell `adventure`, contenu `creature`, mode V16.151 `capture`, substrat historique `gameStyle="dungeon"` ;
- vrai changement d'univers V16.155 avec reload lorsqu'une famille de contenu change ;
- pré-game Capture courant et absence d'une entrée Dungeon classique active ;
- sélection réelle du dresseur puis d'une créature de départ via l'UI ;
- activation réelle de session par `startConfiguredGame()` ;
- affichage du Hub Capture et masquage du panneau Dungeon classique ;
- progression réelle du monde Capture de Jour 1 à Jour 2 via son état persistant.

Le harnais réutilise les blocs source exacts nécessaires du Shell et les propriétaires Capture de production. Aucun état de partie Capture n'est injecté pour forcer le succès.

Aucun runtime, gameplay, asset, règle ou structure persistante n'a été modifié.

## Prochain chantier Phase 1

**Sentinelle explicite de non-interférence des quatre modules.**

Périmètre prévu :
- nouveau checkpoint de départ et nouvelle branche ;
- test-only en première intention ;
- vérifier explicitement les frontières Survie / Dungeon / Capture / PvP ;
- prouver qu'un passage par un module ne laisse pas d'autorité, thème, session ou runtime parasite dans le suivant ;
- réutiliser les vrais propriétaires et les sentinelles déjà établies ;
- ne corriger aucun runtime si un défaut réel est découvert avant caractérisation dédiée.

Une fois ce lot GREEN, refaire la matrice complète Phase 1 pour vérifier le critère de sortie avant de passer à la Phase 2.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
