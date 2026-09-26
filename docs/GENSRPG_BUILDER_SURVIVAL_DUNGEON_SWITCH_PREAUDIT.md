# GenSrpG — Correctif Builder après switch Survie -> Dungeon — pré-audit — 2026-09-26

## Base sûre

- SHA de départ : `1af678b7d4453cafdab629a58c334ee15e4393fb`
- checkpoint : `checkpoint/gensrpg-start-builder-survival-dungeon-switch-2026-09-26`
- branche : `work/gensrpg-builder-survival-dungeon-switch-2026-09-26`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

La base a été triple GREEN :
- Architecture + Browser : `36223748855` — SUCCESS ;
- Firefox : `36223748871` — SUCCESS ;
- Tactical Dock : `36223748873` — SUCCESS.

## Signalement utilisateur

Validation mobile de la preview :
`Hmmm builder a disparu`.

La fermeture du micro-lot Phase 6 parent est donc bloquée.

## Test existant et angle mort

`tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs` passe actuellement.

Mais ce test :
- vide `localStorage` et `sessionStorage` ;
- entre directement par la famille Aventure RPG ;
- ne couvre pas un switch depuis Survie via `switchGameModeFromHome()`.

## Caractérisation source

La source exacte du runtime parent est déjà vérifiée par Rule 26.
Les fonctions de navigation concernées sont inchangées par le raccord Phase 6.

Constat :
- `openGensFamily("survival")` pose `gensSelectedFamily="survival"` ;
- `switchGameModeFromHome(profileId)` appelle `applyGameProfile(profileId,false)` mais ne synchronise pas `gensSelectedFamily` ;
- `editorHubIsRpgContext()` retourne explicitement `false` si le hub est visible et `gensSelectedFamily==="survival"` ;
- `syncEditorHubForActiveFamily()` masque alors `#dungeonAdvancedEditorBtn` ;
- `applyModeEditorVisibility()` applique la même priorité à `gensSelectedFamily`.

## Hypothèse

Survie -> switch accueil vers profil Dungeon -> Éditeurs peut laisser :
- profil actif : Dungeon ;
- `gensSelectedFamily` : Survival ;
- carte Dungeon masquée ;
- Builder inaccessible.

## Correction admissible si RED confirmé

À la frontière `switchGameModeFromHome(profileId)` :
- dériver la famille depuis le profil cible avec l'autorité existante `gensFamilyForProfileId(profileId)` ;
- mettre `gensSelectedFamily` en cohérence avant les rendus de visibilité ;
- ne modifier aucun propriétaire Builder.

## Tests obligatoires

1. reproduire le switch avec stockage persistant ;
2. profil actif Dungeon après switch ;
3. famille logique Adventure après switch ;
4. carte `dungeonAdvancedEditorBtn` visible ;
5. ouverture de l'éditeur Dungeon ;
6. `drc100Launcher` présent ;
7. `drc300Launch` visible ;
8. ouverture réelle de `drc300Modal` ;
9. test historique Builder toujours GREEN ;
10. Architecture + Browser + Firefox + Tactical Dock.

Aucun runtime avant RED.
