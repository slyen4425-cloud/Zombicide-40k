# GenSrpG — Phase 9 — Pré-audit Capture public-entry ownership — 2026-10-03

## Base

- GREEN précédent : `checkpoint/gensrpg-phase9-capture-recovery-preaudit-green-2026-10-03`
- SHA : `08f727f7fa5dab01515c03ae57937aa5ca8b7810`
- checkpoint start : `checkpoint/gensrpg-start-phase9-capture-public-entry-ownership-preaudit-2026-10-03`
- branche : `work/gensrpg-phase9-capture-public-entry-ownership-preaudit-2026-10-03`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Faits déjà GREEN avant inspection du gros HTML

Les preuves Phase 5 déjà versionnées établissent :
- le Shell final est routing-only ;
- `GensShellModuleLaunchV1` possède un provider public `capture` ;
- ce provider délègue à une référence stable capturée depuis Capture139 ;
- il ne possède pas le gameplay/session Capture ;
- les protections Dungeon excluent explicitement Capture de leurs chemins de lancement/reprise ;
- `assets/gensrpg/capture/entry-v1.js` reste actuellement inerte et non chargé.

Ces preuves suffisent pour sélectionner le seam, mais pas pour modifier le propriétaire inline.

## Seam candidat

```text
Shell
  -> GensShellModuleLaunchV1.startModuleSession("capture")
  -> assets/gensrpg/capture/entry-v1.js
  -> délégation temporaire vers propriétaire historique Capture139
```

Objectif du futur micro-lot :
mettre la frontière publique Capture à sa place cible sans déplacer encore le gameplay interne et sans créer une seconde autorité.

## Gate Rule 26

Gate franchie avec `work43.zip/index43.txt` : taille et blob exacts vérifiés.

Cette copie est désormais la source locale autorisée pour l'inspection exacte de Capture139 dans ce pré-audit.

## Rule 26 — vérification réussie

Fichier utilisateur reçu : `work43.zip`.

Le ZIP contient `index43.txt`, copie exacte du `index.html` attendu :
- taille : `8169555` octets ;
- blob Git recalculé : `02a052bc231728eb383e17c83e61a958be0ac58c` ;
- contenu HTML valide commençant par `<!doctype html>`.

Le fichier correspond exactement au blob du checkpoint GREEN de base et sert à l'inspection locale de Capture139.

## Inspection exacte de Capture139

Le propriétaire inline `captureFix139` :
- installe un chemin `window.startConfiguredGame` dédié Capture ;
- délègue au propriétaire précédent uniquement hors contexte Capture ;
- vérifie participants et starters ;
- initialise la session et le monde Capture ;
- initialise éventuellement le mode tours ;
- entre dans le Hub Capture via `captureEnterWorld139()` ;
- capture sa propre fonction dans `gensCaptureStartConfiguredGame139V1` ;
- crée actuellement `gensCaptureStartModuleSessionV1` ;
- enregistre directement ce provider dans `GensShellModuleLaunchV1`.

La référence stable est exploitable pour un handoff vers la future entrée publique sans déplacer le gameplay interne.

### Absence de runtime Dungeon privé dans le cœur de lancement

La fonction de lancement Capture139 ne référence directement aucun `DungeonCore01`, `DungeonSpatial*`, runtime Tactical ou démarrage de combat Dungeon.

Capture139 contient néanmoins `gensEnsureDungeonAdventureButton139`, helper UI destiné au vrai profil Dungeon. Il ne doit pas migrer dans la future entrée Capture.

### Dépendances historiques encore actives

1. **Identité Capture encore basée sur Dungeon**
   - `gensCapturePregameMode()` et `gensPureCaptureSheetMode()` exigent encore `gameStyle="dungeon"` ;
   - ils excluent le profil Dungeon built-in via `GAME_PROFILE_DUNGEON_ID` ;
   - `gensShellActiveModuleV1()` classe encore Capture par `gameStyle="dungeon"` + content-family `creature`.

2. **Participants**
   - Capture139 appelle `normalizeGameParticipants()` ;
   - cette fonction prend encore sa branche `isDungeonMode()` ;
   - Capture étant historiquement `gameStyle="dungeon"`, cette branche Dungeon participe réellement au lancement.

3. **Initialisation de profil**
   - Capture139 appelle `ensureBaseGameProfile()` ;
   - ce propriétaire historique maintient aussi le profil Dungeon et appelle `ensureDungeonContent()`.

4. **Nettoyage ennemis**
   - Capture139 appelle `saveActiveEnemies([])` ;
   - ce helper appelle encore `updateDungeonExploreButtons()` lorsqu'il existe.

5. **UI de compatibilité**
   - Capture138/139 cachent ou recréent encore des éléments `sessionDungeonSetup` selon le contexte.

Ces dettes sont inventoriées mais explicitement différées après le premier raccord public-entry.

## Raccord minimal retenu

```text
Shell
  -> GensShellModuleLaunchV1.startModuleSession("capture")
  -> GensCaptureV1.startModuleSession()
  -> référence legacy Capture139 déjà capturée
  -> lancement historique inchangé
```

Mécanisme retenu :
1. charger `assets/gensrpg/capture/entry-v1.js` comme entrée publique ;
2. l'entrée expose `GensCaptureV1` ;
3. l'entrée possède le provider public et son guard `activeModule()==="capture"` ;
4. Capture139 fournit uniquement sa référence stable legacy via installation/binding explicite ;
5. l'enregistrement `GensShellModuleLaunchV1.register("capture", ...)` quitte Capture139 et devient responsabilité de l'entrée Capture ;
6. aucun fallback concurrent ;
7. Capture139 reste le seul propriétaire de l'initialisation de session durant ce micro-lot.

Ce raccord place la frontière publique au bon endroit sans créer de seconde autorité.

## Dettes différées après le premier raccord

Ne pas modifier dans le premier runtime seam :
- `gameStyle="dungeon"` ;
- `isDungeonMode()` dans `normalizeGameParticipants()` ;
- `gensCapturePregameMode()` / `gensPureCaptureSheetMode()` ;
- `ensureBaseGameProfile()` ;
- `saveActiveEnemies()` / `updateDungeonExploreButtons()` ;
- Capture138 ;
- UI Dungeon/Capture historique ;
- Combat Dynamique ;
- Exploration.

## TDD RED sélectionné

Le prochain lot runtime commencera par une sentinelle RED exigeant :
- `assets/gensrpg/capture/entry-v1.js` chargé par le vrai index ;
- `GensCaptureV1` comme API publique ;
- provider Capture possédé par cette entrée ;
- binding explicite de la référence stable Capture139 ;
- absence d'enregistrement provider Capture directement dans Capture139 ;
- un seul enregistrement Capture au total ;
- Shell final toujours routing-only ;
- parité Capture historique/public provider ;
- Dungeon/Survival/PvP non régressés ;
- aucune intégration Combat/Exploration dans ce seam.
## Validation technique GREEN

HEAD validé :
`8c8134329f122cb441f39ee70532f7c0ac48d258`.

Triple CI :
- Architecture + Browser `37099872746` — SUCCESS ;
- Firefox `37099872733` — SUCCESS ;
- Tactical Dock `37099872732` — SUCCESS.

Preuves notables de la batterie navigateur :
- Monster Capture actuel par le vrai Shell — SUCCESS ;
- provider public Capture S3 — SUCCESS ;
- composition Capture complète — SUCCESS ;
- victoire/reprise Capture — SUCCESS ;
- non-interférence des quatre modules — SUCCESS.

Décision :
**PRÉ-AUDIT CAPTURE PUBLIC-ENTRY OWNERSHIP TECHNIQUEMENT GREEN**.

Aucun runtime n'a été modifié. Le seam retenu reste :
`Shell -> GensCaptureV1 -> référence stable Capture139`.

Checkpoint final prévu après la CI de cette clôture documentaire :
`checkpoint/gensrpg-phase9-capture-public-entry-ownership-preaudit-green-2026-10-03`.
## Critère de sortie

Le pré-audit sera GREEN uniquement si le fichier exact permet de documenter :
1. le propriétaire Capture139 réel et sa capture de référence ;
2. les fonctions privées nécessaires à son lancement ;
3. les dépendances Dungeon encore actives au moment du démarrage ;
4. le raccord minimal vers `capture/entry-v1.js` ;
5. les invariants de parité et teardown nécessaires ;
6. le RED isolé qui prouvera l'absence de vraie entrée Capture avant modification.

Aucun runtime n'est modifié dans ce pré-audit.
