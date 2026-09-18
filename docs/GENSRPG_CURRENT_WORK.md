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

**Phase 1 — Save & Quit + vraie reprise complète par le Shell**

Branche :
`work/gensrpg-phase1-savequit-resume-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-savequit-resume-sentinel-2026-09-18`

Base exacte :
`0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`

SHA fonctionnel vert avant fermeture documentaire :
`47d84f35c802dbe5f15d2f0bca158b82583ed9a8`

Checkpoint final :
`checkpoint/gensrpg-phase1-savequit-resume-sentinel-green-2026-09-18`

## Résultat du lot Save & Quit / reprise

La sentinelle navigateur `tests/gens_savequit_resume_shell_browser_v11411.test.cjs` traverse le vrai chemin utilisateur :

`Accueil -> Adventure -> Dungeon -> pré-game -> sélection héros -> startConfiguredGame() -> Dungeon -> Save & Quit -> recréation de page -> Adventure -> Dungeon -> Reprendre`

Elle vérifie notamment :
- vraie session Dungeon créée par le Shell ;
- vrai bouton Save & Quit de `DungeonCore01.quit` (Core 3.10) ;
- conservation du marqueur de session et du runtime persistant ;
- vraie recréation de page avec le stockage navigateur conservé, sans injection de sauvegarde ;
- bouton `Reprendre` réellement activé puis cliqué ;
- retour d'autorité au runtime Dungeon ;
- profil `game_profile_dungeon_demo`, famille `adventure`, participants et état runtime conservés ;
- guard famille/session de production toujours utilisé ;
- lancement Dungeon depuis le Shell désormais couvert par le même scénario.

Le harnais est construit à partir de blocs source exacts de `index.html` : Shell, support de session online, custom-content, Spatial 3.13, Core 2.00, wrappers 3.04/3.07/3.08, Core 3.10 et guard famille/session. Seul le transport Supabase externe est neutralisé par un stub de fabrique afin que la sentinelle reste strictement hors ligne ; aucune logique de jeu ou de persistance n'est recopiée.

Aucun runtime, gameplay, asset, structure persistante ou règle n'a été modifié.

CI sur `47d84f35c802dbe5f15d2f0bca158b82583ed9a8` :
- Architecture : run `35317905997` — SUCCESS
- Firefox : run `35317906010` — SUCCESS
- Tactical Dock : run `35317905939` — SUCCESS

## Prochain chantier Phase 1

**Sentinelle du placeholder PvP actuel.**

Périmètre prévu :
- nouveau checkpoint de départ et nouvelle branche ;
- test-only en première intention ;
- traverser le vrai Shell jusqu'à Duel/PvP ;
- protéger le comportement actuel `PVP — À VENIR` / moteur non construit ;
- ne pas inventer ni commencer un moteur PvP ;
- aucun correctif runtime si le test révèle un défaut avant caractérisation dédiée.

Après PvP : Capture actuel, puis non-interférence explicite des quatre modules. Le lancement Dungeon Shell n'a plus besoin d'un lot séparé sauf régression future.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
