# GenSrpG — Phase 9 — Pré-audit post-Shell identité Dungeon de Capture

Date : 2026-10-05

## Base

- Base GREEN : `b162cebcc8a9792e1a905ed9ad71835c1a2e8fa7`
- Checkpoint GREEN post-docs : `checkpoint/gensrpg-phase9-capture-shell-family-routing-postdocs-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-post-shell-dungeon-identity-preaudit-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-post-shell-dungeon-identity-preaudit-2026-10-05`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Poursuivre le vrai parcours Monster Capture avec `gameStyle` retiré uniquement dans le navigateur de test afin d'identifier, après le Shell déjà corrigé, le prochain consommateur historique réel du faux mode Dungeon.

Aucune mutation runtime dans ce pré-audit.

## Runtime de base

- taille : `8167187` octets ;
- blob Git : `99d7784676669b629cae6070df8c02606d67002f`.

Le seed de production reste `gameStyle:"dungeon"` et `isDungeonMode()` reste inchangé.

## Diagnostic post-Shell

Test de caractérisation :
`tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs`

### Premier RED

Run ciblé :
- `37256502370`
- résultat : FAILURE de caractérisation attendue.

Le scénario valide d'abord :
- profil Capture visible dans Adventure ;
- famille contenu `creature` ;
- famille Shell `adventure` ;
- `isDungeonMode()===false` ;
- aucun runtime Dungeon créé.

Le parcours poursuit ensuite :
- sélection via le vrai changement d'univers V155 ;
- réinstallation des propriétaires Capture ;
- ouverture du profil Capture ;
- clic `newGame()`.

Point exact de rupture :
- `#pregameSetup` devient bien visible ;
- mais `document.body.classList.contains("gensCapturePregame")` reste faux.

### Diagnostic d'identité

Run instrumenté :
- `37256643602`
- résultat : FAILURE de caractérisation attendue.

État AVANT toute tentative de réconciliation manuelle :
- profil actif : Monster Capture ;
- famille Shell : `adventure` ;
- famille contenu : `creature` ;
- `gensMode151()==="capture"` ;
- `gensCapturePregameMode()===true` ;
- `gensPureCaptureSheetMode()===true` ;
- `gensShellActiveModuleV1()==="capture"` ;
- `isDungeonMode()===false` ;
- `gameStyle` absent ;
- pré-game visible ;
- aucune classe Capture sur `body`.

Après appel manuel de `gensReconcile151()` :
- aucune classe Capture n'est ajoutée.

Après appel manuel de `updateGameStyleUi()` :
- aucune classe Capture n'est ajoutée.

## Conclusion provisoire

La nouvelle rupture n'est PAS une erreur d'identité Capture :
- l'identité canonique Capture est correcte à tous les niveaux observés ;
- le Shell et le mode 151 reconnaissent Capture ;
- le pré-game est déjà affiché.

La dépendance historique restante se trouve donc plus bas dans le **rendu / habillage du pré-game**, là où les classes `gensCapturePregame` / `gens-pure-capture` sont appliquées ou conditionnées.

Le propriétaire exact n'est pas encore sélectionné.

## Périmètre protégé

Ne pas modifier avant inspection exacte :
- `isDungeonMode()` ;
- seed Monster Capture ;
- `GensCaptureV1.isProfile()` ;
- `gensContentFamilyForProfile()` ;
- Shell routing déjà GREEN ;
- vrai Dungeon ;
- Survie ;
- PvP ;
- Tactical ;
- Combat Dynamique / Exploration / Builder / Map Actor.

Interdit :
- ajouter une classe Capture depuis un nouveau wrapper ;
- ajouter un timer/observer pour maintenir la classe ;
- créer une deuxième fonction d'identité ;
- modifier une fonction protégée sans preuve de propriété.

## Prochaine étape

Appliquer Rule 26 sur le runtime exact `99d7784676669b629cae6070df8c02606d67002f`, localiser la définition exacte qui possède `gensCapturePregame` et `gens-pure-capture`, puis sélectionner un seul seam minimal et établir son RED dédié.


## Rule 26 — propriétaire exact du pré-game

Copie utilisateur vérifiée :
- archive `workh.zip` ;
- fichier interne `indexH.txt` ;
- taille `8167187` octets ;
- blob Git `99d7784676669b629cae6070df8c02606d67002f` ;
- SHA-256 `05db467d19495b79171a866965e7db8e5533772303c4d9c99e2b1dcc694fb533`.

Écriture exacte de la classe `gensCapturePregame` localisée dans le propriétaire Shell/pré-game :

`updatePregameWizard()`

Condition actuelle :

`const captureFamily=!!active && active.gameStyle==="dungeon" && typeof gensCurrentContentFamily==="function" && gensCurrentContentFamily()==="creature";`

Cette condition mélange deux identités :
- ancienne identité historique : `active.gameStyle==="dungeon"` ;
- identité de contenu déjà canonique : `gensCurrentContentFamily()==="creature"`.

Le même runtime dispose déjà de l'autorité Capture canonique :

`gensCapturePregameMode() -> GensCaptureV1.isProfile(getActiveGameProfile())`.

`gensPureCaptureSheetMode()` utilise la même autorité canonique.

### Seam minimal sélectionné

Modifier uniquement le calcul de `captureFamily` dans `updatePregameWizard()` afin qu'il repose sur l'identité Capture canonique existante, sans dépendre de `gameStyle==="dungeon"`.

À conserver strictement dans la même fonction :
- `gensAdventurePregame` reste conditionné par le vrai style Dungeon ;
- visibilité `sessionWaveSetupBtn` inchangée ;
- visibilité `sessionCustomRulesBtn` inchangée ;
- vrai Dungeon inchangé ;
- aucun changement à `isDungeonMode()` ;
- aucun changement au seed Monster Capture ;
- aucune nouvelle fonction d'identité.

Effet attendu :
- Capture sans `gameStyle` reçoit de nouveau `gensCapturePregame` ;
- le bouton Dungeon reste masqué en pré-game Capture ;
- le vrai Dungeon conserve son habillage Adventure/Dungeon ;
- aucun runtime Dungeon n'est créé ;
- le parcours peut poursuivre jusqu'au prochain consommateur réel.

### TDD RED permanent

Le test navigateur existant
`tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs`
est désormais câblé dans l'Architecture comme exigence permanente du seam.

Aucune mutation runtime n'est autorisée avant constat du RED sur cette sentinelle.
