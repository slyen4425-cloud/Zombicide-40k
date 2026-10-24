# GenSrpG — Phase 2 — Préparation de l'extraction Phase 3 / 4

Date : 2026-09-18

Base de préparation :
- checkpoint GREEN précédent : `checkpoint/gensrpg-capture-start-routing-green-2026-09-18`
- blob runtime `index.html` cartographié : `3a3db76d12ae511f6293e8ff25d124616731a08b`
- branche de cartographie : `work/gensrpg-phase2-runtime-cartography-resume-2026-09-18`

## Règle

Ce document prépare l'ordre des travaux. Il **n'autorise aucun déplacement de gameplay dans la Phase 2**.

Chaque extraction future doit conserver le comportement, retirer l'ancienne autorité active seulement après validation, et ne pas laisser de wrapper global permanent.

## État réel de l'arborescence cible

Présent aujourd'hui :
- `assets/gensrpg/core/` : contient uniquement `runtime-bootstrap-v1.js` ;
- `assets/gensrpg/dungeon/` : contient uniquement `progression-runtime-v1.js`, actuellement hors graphe de production.

Aucun fichier actuellement présent dans :
- `assets/gensrpg/shell/`
- `assets/gensrpg/survival/`
- `assets/gensrpg/tactical/`
- `assets/gensrpg/capture/`
- `assets/gensrpg/pvp/`
- `assets/gensrpg/builders/`

Conclusion : la Phase 3 doit d'abord créer les **contrats et points d'entrée**, sans changer la composition ou le comportement production.

## Preuves Phase 2 utilisées pour l'ordre d'extraction

- 65 fichiers JS externes atteignables en production, tous avec propriétaire documenté.
- 130 blocs inline identifiés : 120 actifs, 10 désactivés.
- 438 globals inline distincts, 773 affectations explicites, 123 globals multi-propriétaires.
- 16 hotspots de responsabilité stratifiée documentés.
- timers :
  - externe : 148 syntaxes `setTimeout`, 1 `setInterval` ;
  - inline actif : 146 syntaxes `setTimeout`, 1 `setInterval` ;
  - 13 sources externes comportent un vrai mécanisme de bootstrap/réinstallation différée ;
  - 4 blocs inline sont explicitement classés bootstrap/réassertion ;
  - seuls deux `setInterval` actifs : retry marchand borné et watchdog IA inline permanent.
- stockage direct :
  - 221 accès statiquement observables ;
  - 147 résolus vers 30 clés/familles de clés ;
  - 74 accès dynamiques conservés comme dette cartographiée ;
  - Dungeon concentre 176 accès.
- 7 fichiers physiques restent hors graphe de production :
  - 4 tests/docs uniquement ;
  - 3 encore mis en cache/référencés historiquement mais non exécutés.

## Phase 3 — premier jalon recommandé

Créer uniquement la structure et les contrats :

1. `core/` — contrats services communs ;
2. `shell/` — contrat navigation/session ;
3. `survival/` — point d'entrée module ;
4. `dungeon/` — point d'entrée module, sans reprendre le runtime legacy ;
5. `tactical/` — contrat moteur/adapter/UI/bridge ;
6. `capture/` — point d'entrée autonome futur ;
7. `pvp/` — point d'entrée placeholder/module ;
8. `builders/` — contrat éditeurs.

Conditions :
- aucune modification du load graph de production dans ce premier lot ;
- aucun déplacement de fonction existante ;
- aucun fallback inter-module ;
- tests de contrats de dossiers/points d'entrée avant tout raccord.

## Phase 4 — ordre d'extraction obligatoire

### 1. Resolver d'assets

Propriétaires actuels principaux :
- inline `dungeonGithubArts164`
- inline `dungeonArtRenderFix165`
- inline `dungeonDirectImageBinding166`
- bridges visuels externes Dungeon
- résolutions Tactical/UI dédiées

But :
- créer un service Core strictement générique ;
- laisser les catalogues et chemins propres à chaque module dans leur module ;
- aucun fallback Dungeon → Survie/Capture.

Risque : **moyen**, car plusieurs couches visuelles historiques restent actives.

### 2. Stockage / migrations

Preuve :
- 221 accès directs cartographiés ;
- 30 clés/familles résolues ;
- 74 accès dynamiques ;
- `gensrpg_dungeon_runtime_v2` est partagé par de nombreuses couches Dungeon.

But :
- créer une API Core de stockage/migration ;
- préserver exactement les clés existantes au premier déplacement ;
- traiter les fabriques de clés dynamiques explicitement ;
- aucune migration de format dans le même lot que le déplacement.

Risque : **élevé**. Ne pas commencer avant que les clés dynamiques du sous-périmètre choisi soient caractérisées.

### 3. Moteur de stats

Propriétaire canonique actuel :
- `assets/gensrpg/gens-rpg-stats-clean-167874.js`

Couches associées :
- hero editor dynamique ;
- policy de coût/upgrade ;
- equipment stat cleanup ;
- snapshot Tactical.

But :
- Core Stats unique ;
- garder les décorateurs UI hors moteur ;
- ne pas réintroduire de retry/observer pour compenser le déplacement.

Risque : **moyen**, sentinelles stats/Tactical déjà fortes.

### 4. Inventaire / équipement / sets

Propriétaires actuels :
- `assets/dungeon/dungeon-core-316.js`
- `gens-equipment-stat-cleanup-1678102.js`
- UI/Builders équipement et sets.

But :
- séparer modèle commun d'inventaire/équipement des éditeurs Builders et règles Dungeon ;
- conserver les bonus/sets et leur cache sans double calcul.

Risque : **moyen à élevé** à cause de la frontière Core/Builders/Dungeon.

### 5. Dés

Propriétaires actuels :
- performance/animation : `gens-mobile-combat-performance-16781022.js`
- résolution visible Tactical : `gens-rpg-tactical-visual-dice-16781142.js`
- D100/RP Dungeon inline : `dungeonCore073RpDice`

But :
- séparer génération/résultat, animation et intégration de module ;
- conserver D6/D100 et les explications existantes.

Risque : **moyen**, tests navigateur et performance déjà disponibles.

### 6. Progression / XP

Propriétaires actifs actuels :
- progression Dungeon inline autour de `dungeonCore044HeroProgression`, level-up et récompenses ;
- le fichier `assets/gensrpg/dungeon/progression-runtime-v1.js` existe mais **n'est pas chargé en production** et ne doit pas devenir autorité par simple réutilisation.

But :
- extraire depuis le propriétaire actif réellement validé ;
- réutiliser un fichier hors graphe uniquement après comparaison contractuelle, jamais comme raccourci.

Risque : **moyen**.

### 7. Bus d'événements / utilitaires communs

À faire en dernier parmi les services communs.

Raison :
- listeners document/window, timers, wrappers et événements sont encore très stratifiés ;
- créer un bus trop tôt risquerait de devenir une seconde autorité de réparation.

But :
- contrats explicites seulement pour événements réellement partagés ;
- aucun MutationObserver global ou heartbeat pour masquer un raccord incomplet.

Risque : **élevé** si entrepris avant les services précédents.

## Hotspots à ne pas déplacer en Phase 4 comme « service commun »

Ils appartiennent encore à leurs modules et seront traités plus tard :
- `renderDungeonCombatRound` / timeline / IA → Dungeon/Tactical, phases 7–8 ;
- `captureRenderBattleLive` / capacités Capture → Phase 9 ;
- `startConfiguredGame` / navigation → Shell, Phase 5 ;
- victoire Dungeon / popup victoire → Dungeon/Tactical ;
- sélection participants partagée → frontière Shell/module à consolider avant extraction.

## Critère de départ Phase 3

La Phase 2 peut être fermée seulement si :
- tous les manifests/sentinelles Phase 2 passent ;
- navigateur complet, Firefox et Tactical Dock restent GREEN ;
- `GENSRPG_CURRENT_WORK.md` référence le checkpoint final Phase 2 ;
- aucun changement runtime supplémentaire n'est introduit dans la fermeture documentaire.
