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

- `checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18`
- SHA : `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`
- lancement Survie par le vrai Shell : couvert ;
- Architecture `35312077754` — SUCCESS ;
- Firefox `35312077693` — SUCCESS ;
- Tactical Dock `35312077713` — SUCCESS.

## Chantier courant

**Phase 1 — sentinelle test-only Save & Quit + vraie reprise Shell**

Branche :
`work/gensrpg-phase1-save-quit-resume-shell-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-save-quit-resume-shell-sentinel-2026-09-18`

SHA de base :
`0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`

## Périmètre déclaré

Propriétaires à traverser sans les remplacer :
- chemin réel de lancement d'une session ;
- vrai Save & Quit ;
- persistance/session existante ;
- `resumeGame()` et bouton Reprendre du vrai Shell ;
- guard de famille/session déjà présent.

Le test doit :
- créer une vraie session ;
- modifier un état observable pertinent ;
- exécuter Save & Quit par le vrai bouton/propriétaire ;
- recréer ou recharger réellement le contexte navigateur ;
- revenir par le vrai Shell ;
- cliquer réellement sur Reprendre ;
- vérifier que le bon module et le bon état reprennent l'autorité.

## Interdictions

- aucun changement runtime/gameplay dans ce lot tant qu'un défaut n'est pas prouvé et caractérisé ;
- aucun wrapper global ;
- aucun MutationObserver global ;
- aucun timer/retry de réparation ;
- aucun changement Dungeon/Tactical hors caractérisation ;
- aucune restauration Capture ;
- aucun moteur PvP ;
- ne jamais modifier `main`.

Risque inter-module : moyen, car la reprise est un raccord Shell/storage/module. Le test doit donc identifier précisément l'autorité fautive en cas de RED.

## Prochaine étape

Lire les vrais propriétaires Save & Quit / `resumeGame()` dans `index.html`, inventorier les sentinelles existantes, puis écrire le plus petit scénario navigateur complet sans recopier leur logique.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
