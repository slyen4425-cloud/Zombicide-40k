# GenSrpG — Phase 2 — Cartographie réelle du runtime

Date : 2026-09-18

Base :
`checkpoint/gensrpg-phase1-complete-green-2026-09-18`

SHA de base :
`04cce98e79252a791bd7130fe6993f00916fa5dc`

Branche :
`work/gensrpg-phase2-runtime-cartography-2026-09-18`

## Règle de ce document

Cette cartographie décrit ce qui est **présent**, **chargé** et **installé** sans modifier le runtime.

Un fichier non chargé n'est pas automatiquement supprimable.  
Un mécanisme présent dans le code n'est pas automatiquement actif : l'appel d'installation doit être vérifié.

## 1. Entrées JS réellement chargées par index.html

Scripts tiers :
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`

Scripts locaux directs :
1. `assets/dungeon/dungeon-core-316.js`
2. `assets/dungeon/dungeon-core-317.js`
3. `assets/gensrpg/gens-mobile-combat-performance-16781022.js`

Aucun autre chemin local `.js` n'est directement référencé dans le HTML actuel.

## 2. Graphe de chargement externe actif

### Niveau 0 — index.html

`index.html`
- charge `dungeon-core-316.js`
- charge `dungeon-core-317.js`
- charge `gens-mobile-combat-performance-16781022.js`

### Niveau 1 — entrée architecture/performance

`gens-mobile-combat-performance-16781022.js`
- optimise les animations D6/D100 ;
- met en cache plusieurs valeurs combat ;
- wrappe plusieurs fonctions d'invalidation ;
- appelle `reinstall()` avec retries 250 ms / 1200 ms ;
- charge dynamiquement :
  - `assets/gensrpg/core/runtime-bootstrap-v1.js`

Cette responsabilité est **mixte** : performance combat + bootstrap runtime.

### Niveau 2 — RuntimeBootstrap

`assets/gensrpg/core/runtime-bootstrap-v1.js` charge, dans l'ordre :

1. `gens-rpg-tactical-combat-v2.js`
2. `gens-rpg-tactical-combat-v2-adapter.js`
3. `gens-rpg-tactical-combat-v2-rules.js`
4. `gens-rpg-tactical-combat-v2-integration.js`
5. `gens-rpg-tactical-combat-v2-ui.js`
6. `gens-rpg-tactical-combat-v2-bridge.js`
7. `gens-survival-mode-isolation-1678104.js`

Puis `finalize()` réinstalle guard/Bridge immédiatement et après 250 / 1200 / 3000 ms.

### Niveau 3 — chaîne Tactical historique encore réellement chargée

`gens-rpg-tactical-combat-v2-integration.js` charge :

1. `gens-rpg-tactical-visual-dice-16781142.js`
2. `gens-rpg-tactical-runtime-authority-1678113.js`
3. `gens-rpg-tactical-combat-coherence-1678112.js`
4. `gens-rpg-tactical-runtime-fixes-1678111.js`
5. `gens-rpg-tactical-combat-v2-stats-1678110.js`
6. `gens-rpg-tactical-combat-v2-polish-1678109.js`
7. `gens-rpg-tactical-combat-v2-polish-1678108.js`

Le nom historique V108/V109/V110/V111/V112/V113 ne signifie donc pas « legacy inactif » : ces fichiers sont encore chargés dans le runtime courant.

`gens-rpg-tactical-combat-v2-bridge.js` charge en plus :
- `gens-rpg-runtime-repair-1678106.js`

Aucun de ces fichiers de niveau 3 ne charge ensuite d'autre fichier JS GenSrpG/Dungeon.

## 3. Ensemble externe actif identifié

19 fichiers locaux appartiennent au graphe de chargement courant :

### Dungeon
- `assets/dungeon/dungeon-core-316.js`
- `assets/dungeon/dungeon-core-317.js`

### Core / bootstrap / frontière
- `assets/gensrpg/gens-mobile-combat-performance-16781022.js`
- `assets/gensrpg/core/runtime-bootstrap-v1.js`
- `assets/gensrpg/gens-survival-mode-isolation-1678104.js`

### Tactical
- `assets/gensrpg/gens-rpg-tactical-combat-v2.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js`
- `assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js`
- `assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js`
- `assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js`
- `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js`
- `assets/gensrpg/gens-rpg-runtime-repair-1678106.js`

## 4. Fichiers présents mais non chargés par le graphe courant

53 fichiers JS existent sous `assets/gensrpg` / `assets/dungeon` sans appartenir au graphe de chargement identifié.

### Dungeon — non chargés par le graphe courant

- `assets/dungeon/dungeon-authored-action-fix-167857.js`
- `assets/dungeon/dungeon-authored-bootstrap-167849.js`
- `assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js`
- `assets/dungeon/dungeon-authored-cache-guard-167849.js`
- `assets/dungeon/dungeon-authored-cache-ux-167853.js`
- `assets/dungeon/dungeon-authored-cache-visual-167852.js`
- `assets/dungeon/dungeon-authored-event-cells-167877.js`
- `assets/dungeon/dungeon-authored-final-exit-167875.js`
- `assets/dungeon/dungeon-authored-return-persist-167862.js`
- `assets/dungeon/dungeon-authored-runtime-167839.js`
- `assets/dungeon/dungeon-cache-editor-stability-167851.js`
- `assets/dungeon/dungeon-core-318.js`
- `assets/dungeon/dungeon-equipment-hotfix-167817.js`
- `assets/dungeon/dungeon-equipment-ui.js`
- `assets/dungeon/dungeon-event-runtime-fix-167878.js`
- `assets/dungeon/dungeon-exact-trap-runtime-167845.js`
- `assets/dungeon/dungeon-grid-display-recovery-167856.js`
- `assets/dungeon/dungeon-large-room-support-167834.js`
- `assets/dungeon/dungeon-random-library-content-167832.js`
- `assets/dungeon/dungeon-room-content-ui-167831.js`
- `assets/dungeon/dungeon-room-creator-100.js`
- `assets/dungeon/dungeon-room-creator-feedback-167821.js`
- `assets/dungeon/dungeon-room-creator-v2-167819.js`
- `assets/dungeon/dungeon-room-grid-capture-167830.js`
- `assets/dungeon/dungeon-room-runtime-167822.js`
- `assets/dungeon/dungeon-room-template-content-167828.js`
- `assets/dungeon/dungeon-room-visual-config-167826.js`
- `assets/dungeon/dungeon-room-visual-hotfix-167827.js`
- `assets/dungeon/dungeon-secondary-branch-content-fix-167860.js`
- `assets/dungeon/dungeon-set-editor-167818.js`
- `assets/dungeon/dungeon-source-render-stability-167877.js`
- `assets/dungeon/dungeon-world-builder-167821.js`
- `assets/dungeon/dungeon-world-runtime-167823.js`
- `assets/dungeon/dungeon-world-session-bridge-167832.js`
- `assets/dungeon/dungeon-zone-content-167824.js`
- `assets/dungeon/dungeon-zone-links-167846.js`

### GenSrpG — non chargés par le graphe courant

- `assets/gensrpg/dungeon/progression-runtime-v1.js`
- `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js`
- `assets/gensrpg/gens-dungeon-hero-ingame-art-167898.js`
- `assets/gensrpg/gens-dungeon-ingame-hero-art-167898.js`
- `assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js`
- `assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js`
- `assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`
- `assets/gensrpg/gens-hero-editor-dynamic-167897.js`
- `assets/gensrpg/gens-multiplayer-entry-167831.js`
- `assets/gensrpg/gens-rpg-stats-clean-167874.js`
- `assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js`
- `assets/gensrpg/gens-rpg-tactical-session-guard-16781144.js`
- `assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js`
- `assets/gensrpg/gens-stat-manual-cost-167898.js`
- `assets/gensrpg/gens-stat-upgrade-policy-167898.js`
- `assets/gensrpg/gens-ui-recovery-167843.js`
- `assets/gensrpg/gens-world-summary-167820.js`

**Statut : NON CHARGÉ PAR LE GRAPHE COURANT**, pas « supprimable ».  
Avant suppression future, vérifier tests, tooling, documentation, Pages/preview et éventuels chargements hors `index.html`.

## 5. Runtime inline dans index.html

Le HTML contient environ **130 blocs `<script id=...>` identifiables**.

Première classification par préfixe/contenu :
- Dungeon : 104
- Capture : 19
- Core/Shell : 3
- Tactical/Dungeon : 3
- autre/croisé : 1

Environ 10 blocs sont explicitement marqués désactivés/remplacés par leur propre contenu court.

Conséquence : l'essentiel du runtime reste encore inline dans `index.html`. La présence des fichiers externes ne signifie pas que le découpage physique est déjà effectif.

## 5 bis. Partition logique des blocs inline actifs

Sur les 130 blocs inline identifiés :
- 120 sont exécutables dans le HTML actuel ;
- 10 sont explicitement marqués désactivés/remplacés.

Répartition des 120 blocs exécutables :
- Dungeon : **93**
- Capture : **19**
- bridge Tactical/Dungeon : **4**
- Shell : **2**
- Core/Dungeon bridge : **1**
- build marker : **1**

Aucun bloc exécutable ne reste sans domaine dans cette première passe de classification.

### Blocs explicitement désactivés

- `dungeonCore081TacticalMovementDisabled`
- `dungeonCore084MovementRuntimeFixDisabled`
- `dungeonCore086MovementStabilityDisabled`
- `dungeonCore087InteractionRulesDisabled`
- `dungeonCore087ChestGuardDisabled`
- `dungeonCore089TacticalInteractionsDisabled`
- `dungeonCore090MovementV2Disabled`
- `dungeonCore094EndTurnFinalDisabled`
- `dungeonCore095SoloTurnFinalDisabled`
- `dungeonCore097StabilityRollbackDisabled`

Ces blocs sont classés **legacy/inactif explicite** pour la cartographie actuelle.

## 6. MutationObserver — présence vs activation

### Inline

Quatre blocs contiennent la construction d'un `MutationObserver` :

- `dungeonCore028HeroExploreGuard`
  - observer réellement attaché ;
  - cible locale : `#sheet` ;
  - rôle : retirer d'anciens boutons Explorer de la fiche héros.

- `dungeonCore310PersistenceAndTokens`
  - observer réellement attaché ;
  - cible locale : `#dc047RoomBoard` ;
  - rôle : repeindre les tokens après reconstruction du board.

- `dungeonCore078FloorSets`
  - construit un observer mais aucun `.observe(...)` n'a été trouvé ;
  - état actuel : code présent, observer non attaché.

- `dungeonCore079MapPolish`
  - construit un observer mais aucun `.observe(...)` n'a été trouvé ;
  - état actuel : code présent, observer non attaché.

Aucun de ces quatre blocs inline n'attache actuellement un observer à `document.body` ou `document.documentElement`.

### Externe actif — dette forte

`assets/dungeon/dungeon-core-317.js`
- attache un `MutationObserver` à `document.documentElement` avec `childList:true, subtree:true` ;
- appelle `scheduleBackButton()` après mutations ;
- possède également un retry `setInterval` de 12 tentatives toutes les 250 ms pour réimposer les overrides marchand.

**Classification : dette architecturale active, forte priorité future.**

### Tactical V111

`gens-rpg-tactical-runtime-fixes-1678111.js` contient une fonction `observe()` capable d'observer `document.body`, mais :
- `install()` n'appelle pas `observe()` ;
- `installWithRetries()` ne fait que rappeler `install()` ;
- aucun callsite actif d'`observe()` n'a été trouvé dans ce fichier.

**Classification actuelle : code global dormant, non installé par le chemin actuel.**

## 7. Timers / retries remarquables

### Externes actifs

`gens-mobile-combat-performance-16781022.js`
- `reinstall()` : install immédiat + 250 ms + 1200 ms ;
- timers d'animation/watchdog D6/D100.

`runtime-bootstrap-v1.js`
- `finalize()` : apply immédiat + 250 ms + 1200 ms + 3000 ms.

`gens-survival-mode-isolation-1678104.js`
- install immédiat + 0 ms + 300 ms + 1300 ms.

`gens-rpg-tactical-runtime-fixes-1678111.js`
- `installWithRetries()` : 80 / 220 / 600 / 1200 / 2500 / 5000 ms.

`dungeon-core-317.js`
- retry marchand : `setInterval(...,250)`, limité à 12 tentatives.

### Inline

`dungeonCore029AiTurnFix`
- watchdog permanent `window.dc029AiWatchdog=setInterval(dc029KickAi,700)` ;
- son commentaire indique qu'il ne fait du travail que pendant un combat actif, mais l'intervalle lui-même reste installé.

**Classification : dette architecturale active à caractériser avant Phase 8.**

## 8. Wrappers / monkey-patches — zones à forte densité

Le scan statique trouve des marqueurs de wrapping dans de nombreux blocs inline.

Les concentrations les plus visibles :
- `gensrpgDungeonFlowFix171`
- `dungeonCore051ExplorationPolish`
- `dungeonCore211Consolidation`
- `dungeonCore201Stability`
- `dungeonCore045HeroCombatModule`
- `dungeonArtRenderFix165`
- `dungeonCore104Coherence`
- `dungeonCore213Stability`
- `dungeonCore098IsolatedMovement`
- `dungeonCore209TacticalSense`
- `dungeonCore053Stability`
- `rpgTurnTargetFlow157`
- `forceReload155`

Cette liste n'indique pas automatiquement une erreur ; elle indique les zones où la Phase 2 doit identifier le propriétaire final et les anciennes couches encore actives.

## 9. Propriétaires / classification première passe

| Élément actif | Propriétaire actuel probable | Classe cible | État |
| --- | --- | --- | --- |
| navigation racine / familles | Shell `index.html` | Shell | propriétaire déjà confirmé Phase 1 |
| `dungeon-core-316.js` | Dungeon contenu/équipement/sets | Dungeon + services Core à clarifier | actif |
| `dungeon-core-317.js` | Dungeon marchand + armure + navigation retour | Dungeon | actif, responsabilité trop large |
| mobile performance | performance dés/cache + loader | Core/Tactical à séparer du bootstrap | actif, mixte |
| runtime-bootstrap-v1 | chargement architecture | Core/Shell bootstrap | actif |
| Tactical V2 engine/rules | Tactical | Tactical | actif |
| Tactical adapter/integration/bridge | raccord Dungeon/Tactical | Tactical bridge/adapter | actif |
| Tactical UI | Tactical | Tactical | actif |
| V108–V114.11 | polish/stats/fixes/cohérence/autorité/dés | Tactical historique | actif malgré noms historiques |
| Survival isolation 104 | guard frontière Shell/Survie/Dungeon | Shell/Core boundary | actif, cross-cutting |
| runtime repair 106 | réparation compatibilité Tactical/RPG | Tactical/legacy bridge à préciser | actif |
| blocs Capture 128–162 | Capture inline | Capture | actifs, extraction future Phase 9 |
| blocs Dungeon Core historiques | Dungeon inline | Dungeon | actifs pour beaucoup, à cartographier par responsabilité |

## 9 bis. Densité de réécriture des globals inline

Le scan des 130 blocs inline identifiés trouve :
- **438 noms `window.*` distincts** explicitement assignés ;
- **773 affectations explicites `window.<nom> = ...`** au total.

Ces nombres mesurent la **densité de couches**, pas le nombre de bugs. Une même fonction peut être réassignée plusieurs fois dans un même bloc pour installer/restaurer un wrapper.

### Hotspots principaux

| Global | Affectations explicites | Dernière couche inline trouvée | Lecture architecturale |
| --- | ---: | --- | --- |
| `renderDungeonCombatRound` | 30 | `dungeonCore303TimelineRootFix` | hotspot Dungeon majeur ; Core 3.03 appelle explicitement `__dc214RenderCombat`, donc dernier wrapper != moteur de rendu sous-jacent |
| `captureRenderBattleLive` | 15 | `coreCombatPoolFix156` | hotspot Capture ; dernière couche ajoute le ciblage MJ par-dessus le renderer Capture précédent |
| `dc304DefeatExited` | 12 | à confirmer | état/flux défaite très stratifié |
| `dungeonRunAi156` | 12 | couche Dungeon tardive à confirmer | ancien axe timeline/IA fortement recouvert |
| `closeDungeonCombat` | 9 | `dungeonCore200Rebuild` | fermeture combat reprise par le runtime Dungeon reconstruit |
| `dungeonAdvanceTurn156` | 9 | `dungeonCore303TimelineRootFix` | timeline/tour encore stratifiés |
| `finishDungeonCombatVictory` | 9 | `dungeonCore212RenderVictory` | victoire composée de plusieurs couches |
| `captureBattleApplyAbility` | 8 | à confirmer | moteur capacités Capture stratifié |
| `openDungeonCombatVictoryPopup` | 8 | à confirmer | UI victoire stratifiée |
| `renderParticipantSelector` | 8 | à confirmer | sélection participants partagée/historique |
| `saveDungeonMj151` | 8 | à confirmer | état MJ stratifié |
| `startConfiguredGame` | 6 | `dungeonCore200Rebuild` | chemin de lancement commun recouvert par Capture puis Dungeon |
| `resumeGame` | 3 | `dungeonCore310PersistenceAndTokens` | reprise Dungeon finale déjà validée en Phase 1 |
| `openChar` | 3 | `dungeonCore028HeroExploreGuard` | fiche héros enveloppée pour garde UI |
| `DungeonCore01` | 2 | `dungeonCore200Rebuild` | API Dungeon remplacée, pas simplement étendue |

### Chaînes déjà caractérisées

#### `renderDungeonCombatRound`

La dernière couche inline est `dungeonCore303TimelineRootFix`, mais elle délègue explicitement au renderer conservé :

`dungeonCore303TimelineRootFix.render() -> window.__dc214RenderCombat()`

Puis elle applique la timeline/les tours et redevient la fonction globale `renderDungeonCombatRound`.

Conclusion actuelle :
- **dernier wrapper chargé** : Core 3.03 ;
- **renderer Dungeon sous-jacent conservé** : Core 2.14 ;
- responsabilité à séparer plus tard : rendu combat vs timeline/tour.

#### `captureRenderBattleLive`

La dernière couche inline est `coreCombatPoolFix156`.

Elle appelle d'abord le renderer Capture précédent, puis ajoute le ciblage MJ des créatures joueur pendant le tour d'un ennemi contrôlé par le MJ.

Conclusion actuelle :
- dernière couche chargée : `coreCombatPoolFix156` ;
- elle n'est pas le renderer Capture de base ;
- le renderer Capture réel reste une chaîne de wrappers 128 -> 144 avant cette couche.

#### `resumeGame`

La dernière couche inline est `dungeonCore310PersistenceAndTokens`.

Elle restaure le runtime Dungeon persistant puis délègue au `previousResume310` si le contexte Dungeon ne s'applique pas.

Conclusion actuelle :
- dernier wrapper Dungeon : Core 3.10 ;
- comportement réel Save & Quit / reprise déjà protégé par la sentinelle Phase 1.

#### `DungeonCore01`

Le premier objet global est installé par `gensDungeonCore01Js`, puis `dungeonCore200Rebuild` **remplace** l'API publique par un runtime reconstruit.

Conclusion actuelle :
- dernière API publique inline : `dungeonCore200Rebuild` ;
- les anciennes fonctions restent néanmoins capturées/utilisées dans plusieurs couches historiques.

#### `startConfiguredGame` — risque de frontière à caractériser

Affectations inline, dans l'ordre :
1. `captureFix131`
2. `captureFix135`
3. `captureFix138`
4. `captureFix139`
5. `gensDungeonCore01Js`
6. `dungeonCore200Rebuild`

`captureFix139` possède un chemin Capture dédié et délègue sinon à la fonction précédente.

Les deux couches Dungeon tardives enveloppent ensuite ce chemin commun. `dungeonCore200Rebuild` utilise :

`if(isDungeonMode?.()) return start(); else return startOutside200(...)`

Or le comportement Capture actuel conserve historiquement `gameStyle="dungeon"` et `isDungeonMode() === true`.

**Statut : risque de frontière détecté par cartographie, pas défaut fonctionnel déclaré.**

Avant toute correction, il faut exécuter une caractérisation avec la **composition complète de production**, car les sentinelles Capture Phase 1 utilisent volontairement un harnais réduit aux propriétaires nécessaires et ne suffisent pas, à elles seules, à prouver l'ordre complet des 130 blocs inline.

## 10. Points à approfondir avant critère de sortie Phase 2

1. établir pour chaque bloc inline actif sa responsabilité dominante ;
2. identifier les chaînes de wrappers par fonction protégée ;
3. dresser une table « fonction globale -> dernier propriétaire actif » ;
4. distinguer les timers nécessaires au gameplay des retries d'installation ;
5. vérifier les accès directs au stockage par domaine ;
6. confirmer les fichiers non chargés qui sont réellement legacy/inactifs versus tooling/tests ;
7. identifier les doublons de responsabilité encore actifs ;
8. préparer seulement ensuite l'ordre d'extraction Phase 3/4.

## 11. Interdiction de déduire trop tôt

Ce document ne recommande encore aucune suppression de fichier.

Les constats « non chargé », « code dormant » ou « responsabilité mixte » sont des résultats de cartographie, pas des autorisations de nettoyage.
