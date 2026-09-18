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

**Phase 1 — non-interférence explicite des quatre modules**

Branche :
`work/gensrpg-phase1-four-module-noninterference-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-four-module-noninterference-2026-09-18`

Base exacte :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

SHA fonctionnel vert avant fermeture documentaire :
`1a4cac626592360ac676042c67f5568bfb5e5276`

Checkpoint final :
`checkpoint/gensrpg-phase1-four-module-noninterference-green-2026-09-18`

CI sur le SHA fonctionnel :
- Architecture `35322217121` — SUCCESS
- Firefox `35322217184` — SUCCESS
- Tactical Dock `35322217172` — SUCCESS

## Résultat du lot non-interférence

La sentinelle `tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs` traverse le vrai Shell :

`Survie -> Dungeon -> Capture -> PvP -> Survie`

Elle vérifie notamment :
- les reloads V16.155 réels entre familles de contenu différentes ;
- le guard `survival/adventure` correct selon le module actif ;
- Survie sans thème/autorité Dungeon ou Capture ;
- Dungeon en `adventure / rpg / dungeon` ;
- Capture en `adventure / creature / capture` sans panneau Dungeon classique actif ;
- PvP limité au placeholder, sans création de session ou de profil ;
- retour final en Survie sans fuite du thème Adventure/Dungeon ;
- aucun Hub Capture ou panneau Dungeon visible hors contexte ;
- conservation des états persistants Dungeon/Capture lorsqu'ils sont inactifs, sans les confondre avec une autorité active.

Aucun runtime, gameplay, asset, règle ou structure persistante n'a été modifié.

## Phase 1 — statut

**Phase 1 terminée fonctionnellement.**

La matrice `GENSRPG_PHASE1_SENTINEL_AUDIT.md` ne contient plus de manque majeur identifié :
- lancement Survie ;
- lancement Dungeon ;
- fiche héros ;
- Save & Quit / vraie reprise ;
- mouvement ;
- stats ;
- dés ;
- touche ;
- dégâts / armure / résistances ;
- Tactical entrée/sortie ;
- Monster Capture actuel ;
- PvP placeholder actuel ;
- sauvegarde ;
- PWA/cache ;
- non-interférence des quatre modules.

Le critère de sortie de Phase 1 est atteint : une régression majeure sur ces chemins est désormais couverte par la CI.

## Prochain chantier prévu

**Phase 2 — cartographie réelle du runtime.**

Avant tout déplacement physique de code :
- nouveau checkpoint de départ et nouvelle branche ;
- inventaire des scripts réellement chargés ;
- auto-installs ;
- wrappers / monkey-patches ;
- MutationObserver ;
- listeners document/window ;
- timers/retries ;
- accès directs localStorage/IndexedDB ;
- fonctions globales remplacées ;
- responsabilités dupliquées ;
- classement de chaque runtime actif : Core, Shell, Survie, Dungeon, Tactical, Capture, PvP, Builders, legacy/inactif.

Phase 2 reste d'abord un chantier de **cartographie/documentation**. Aucun déplacement massif ni correction gameplay ne doit être mélangé à l'inventaire.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
