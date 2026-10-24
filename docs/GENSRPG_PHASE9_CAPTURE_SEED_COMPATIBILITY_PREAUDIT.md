# GenSrpG — Phase 9 — Pré-audit compatibilité seed Capture

Date : 2026-10-05

## Base

- Base GREEN : `d2821fb1a5bf7719f6925f8c81f63ab7461f73f8`
- Checkpoint GREEN : `checkpoint/gensrpg-phase9-capture-pregame-identity-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-seed-compatibility-preaudit-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-seed-compatibility-preaudit-2026-10-05`
- Runtime GREEN inchangé : `8167138` octets / blob `09b1e19c04777da82fd0ad355adc7eb82532db29`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Vérifier qu'un profil Monster Capture déjà persisté sans le champ historique `gameStyle:"dungeon"` reste compatible avec les vrais chemins de reprise avant toute suppression réelle du champ dans le seed intégré.

## Scénario critique sélectionné

Sentinelle source :
`tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs`.

Le scénario dérivé :
`tests/gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs`

effectue le vrai chemin suivant :

1. boot propre ;
2. le profil intégré Monster Capture est présent ;
3. suppression de `gameStyle` uniquement dans le profil persisté du test ;
4. sauvegarde du profil via `saveGameProfiles()` ;
5. vérification de l'identité canonique `GensCaptureV1.isProfile(profile)` ;
6. création d'une vraie sauvegarde Dungeon résiduelle ;
7. lancement réel Capture ;
8. vraie bataille Capture ;
9. vraie victoire + bouton TERMINER ;
10. fermeture de la page ;
11. nouvelle page / reload complet ;
12. vérification que le seed intégré ne réécrit pas `gameStyle` sur le profil existant ;
13. sélection du profil Capture via le vrai Shell ;
14. bouton Reprendre réel ;
15. vérification que la sauvegarde Dungeon résiduelle ne vole pas la reprise Capture.

## Résultat ciblé

Run diagnostic :
- `37279109842` — **SUCCESS**.

Preuves :
- le profil Capture persiste sans `gameStyle` ;
- `GensCaptureV1.isProfile(profile)===true` ;
- famille de contenu `creature` ;
- la vieille sauvegarde Dungeon peut rester présente ;
- victoire Capture conserve Capture comme profil actif ;
- reload complet conserve le profil Capture sans `gameStyle` ;
- le seed intégré n'écrase pas le profil existant ;
- le bouton Reprendre restaure Capture ;
- le runtime Dungeon résiduel ne vole pas la reprise.

## Architecture

Aucune mutation runtime dans ce pré-audit.

Aucun :
- nouveau stockage ;
- migration ;
- wrapper ;
- fallback ;
- timer ;
- observer ;
- polling ;
- deuxième système d'identité.

La sentinelle de compatibilité est désormais branchée à la CI Architecture permanente.

## Décision

La compatibilité profil persistant / reload / reprise ne justifie plus le maintien du champ `gameStyle:"dungeon"` dans le **nouveau seed intégré**.

Les anciens profils qui possèdent encore ce champ restent compatibles et ne nécessitent aucune migration forcée dans le lot suivant.

Le prochain lot peut donc être un micro-lot séparé de **retrait du champ du seed intégré Monster Capture**, sous TDD et Rule 26.

## Périmètre du prochain lot

Ne pas :
- nettoyer globalement les vieux profils ;
- modifier `isDungeonMode()` ;
- modifier les sauvegardes existantes ;
- toucher au vrai Dungeon ;
- toucher à Survie / PvP / Tactical ;
- brancher Combat Dynamique / Exploration / Builder.

Mutation attendue : uniquement la représentation seed/factory Monster Capture, après inspection exacte Rule 26 du runtime courant.
