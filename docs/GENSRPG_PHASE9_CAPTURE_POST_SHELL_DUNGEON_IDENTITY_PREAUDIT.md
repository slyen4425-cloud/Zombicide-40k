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
