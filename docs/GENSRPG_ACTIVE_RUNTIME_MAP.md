# GenSrpG — Carte du runtime réellement actif

Date : 2026-09-15
Base production auditée : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663` (V16.78.114.11)
Branche d'audit : `audit/gensrpg-module-architecture-2026-09-15`

## Objectif

Documenter le chemin réellement exécuté en production avant tout refactor.

Point essentiel : le fichier `index.html` du dépôt n'est pas, à lui seul, la composition finale de GitHub Pages. Le workflow `.github/workflows/main.yml` reconstruit `_site/index.html`, y injecte des scripts supplémentaires, puis le module `gens-mobile-combat-performance-16781022.js` charge dynamiquement une autre chaîne Tactical.

Toute sentinelle d'architecture doit donc raisonner sur trois niveaux :

1. source `index.html` ;
2. composition Pages construite par la CI ;
3. scripts chargés dynamiquement au runtime.

## 1. Source `index.html`

Le `index.html` correspondant à la base V16.78.114.11 reste un monolithe d'environ 8,2 Mo.

Les scripts externes directement présents dans la source sont :

1. `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
2. `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`
3. `assets/dungeon/dungeon-core-316.js`
4. `assets/dungeon/dungeon-core-317.js`
5. `assets/gensrpg/gens-mobile-combat-performance-16781022.js`

Le document contient également un très grand nombre de scripts inline historiques. Le titre HTML `GenSrpG V16.78.11` est obsolète et ne doit pas être utilisé comme autorité de version : le SHA Git et les versions des modules chargés font foi.

### Risque

Lire uniquement `index.html` donne une vision incomplète du runtime publié, car la CI injecte d'autres modules avant le déploiement.

## 2. Composition ajoutée par GitHub Pages

Le workflow `.github/workflows/main.yml` copie la source dans `_site/`, puis ajoute plusieurs modules s'ils ne sont pas déjà présents.

Modules injectés ou garantis par le build, dans l'ordre déclaré :

1. `assets/dungeon/dungeon-core-318.js`
2. `assets/dungeon/dungeon-large-room-support-167834.js`
3. `assets/dungeon/dungeon-room-creator-100.js`
4. `assets/dungeon/dungeon-room-creator-v2-167819.js`
5. `assets/dungeon/dungeon-room-creator-feedback-167821.js`
6. `assets/dungeon/dungeon-world-builder-167821.js`
7. `assets/dungeon/dungeon-room-runtime-167822.js`
8. `assets/dungeon/dungeon-world-runtime-167823.js`
9. `assets/dungeon/dungeon-zone-content-167824.js`
10. `assets/dungeon/dungeon-authored-runtime-167839.js`
11. `assets/dungeon/dungeon-authored-cache-visual-167852.js`
12. `assets/dungeon/dungeon-source-render-stability-167877.js`
13. `assets/dungeon/dungeon-equipment-ui.js`
14. `assets/dungeon/dungeon-equipment-hotfix-167817.js`
15. `assets/dungeon/dungeon-set-editor-167818.js`
16. `assets/gensrpg/gens-world-summary-167820.js`
17. `assets/gensrpg/gens-rpg-stats-clean-167874.js`
18. `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js`
19. `assets/gensrpg/gens-mobile-combat-performance-16781022.js`

Le workflow retire d'abord toute occurrence existante du tag `gens-mobile-combat-performance-16781022.js` dans le HTML construit, puis le réinjecte en dernier. Il est donc volontairement la dernière couche statique du runtime Pages.

### Conséquence architecturale

La composition effective de production dépend aujourd'hui du workflow de déploiement. La CI est donc, de fait, un bootstrapper partiel du runtime.

À terme, cette responsabilité devra devenir explicite dans un `RuntimeBootstrap` versionné et testé plutôt que rester dispersée entre `index.html`, le workflow et des loaders dynamiques.

## 3. Loader `gens-mobile-combat-performance-16781022.js`

Ce fichier a actuellement deux familles de responsabilités.

### Performance

- cache de valeurs dérivées ;
- invalidation des caches ;
- remplacement des animations D6/D100 ;
- wrappers autour de fonctions de stats, équipement, sauvegarde et dégâts ;
- réinstallation différée par timers.

### Bootstrap Tactical

Il charge dynamiquement, dans cet ordre :

1. `gens-rpg-tactical-combat-v2.js`
2. `gens-rpg-tactical-combat-v2-adapter.js`
3. `gens-rpg-tactical-combat-v2-rules.js`
4. `gens-rpg-tactical-combat-v2-integration.js`
5. `gens-rpg-tactical-combat-v2-ui.js`
6. `gens-rpg-tactical-combat-v2-bridge.js`
7. `gens-survival-mode-isolation-1678104.js`

Après chargement, il relance encore l'installation de l'isolation Survie et du bridge Tactical immédiatement puis à plusieurs délais.

### Dette confirmée

Un fichier de performance possède donc aujourd'hui une partie de la composition générale du runtime et du routage de mode. Cette responsabilité devra être extraite sans changer l'ordre effectif de chargement lors du premier jalon de consolidation.

## 4. Chaîne dynamique Tactical V108 → V114.11

`gens-rpg-tactical-combat-v2-integration.js` charge ensuite la chaîne historique suivante :

1. V108 — `gens-rpg-tactical-combat-v2-polish-1678108.js`
2. V109 — `gens-rpg-tactical-combat-v2-polish-1678109.js`
3. V110 — `gens-rpg-tactical-combat-v2-stats-1678110.js`
4. V111 — `gens-rpg-tactical-runtime-fixes-1678111.js`
5. V112 — `gens-rpg-tactical-combat-coherence-1678112.js`
6. V113 / V114.10 — `gens-rpg-tactical-runtime-authority-1678113.js`
7. V114.11 UX — `gens-rpg-tactical-visual-dice-16781142.js`

La protection V114.11 remplace temporairement `MutationObserver` pendant l'évaluation de cette chaîne afin de rendre inertes les observations de `document.body` / `document.documentElement`, puis restaure le constructeur natif.

Les installations V108, V109, V111, V112 et V113 passent aussi par un garde qui bloque les observers globaux mais laisse les observers locaux Tactical fonctionner.

Le module V114.1 qui utilisait un observer global + heartbeat n'est volontairement plus installé.

## 5. Autorités actuellement observées

### Navigation / fiche héros / Save & Quit

Autorité attendue et restaurée : runtime Dungeon natif.

Tactical ne doit pas réafficher le Dungeon, masquer la fiche héros, posséder la navigation globale ou relancer un renderer après `Save & Quit`.

### Combat Tactical

Le moteur V2, son adapter, rules, UI, bridge puis les couches V108→V114.11 sont encore tous présents dans la chaîne active. Plusieurs responsabilités historiques restent donc superposées malgré les garde-fous V114.11.

### Stats

`gens-rpg-stats-clean-167874.js` est injecté avant la couche de performance/Tactical. Le snapshot Tactical V110 consomme les valeurs canoniques mais conserve encore au moins un ancien raccord pour `physicalDamageBonus`.

### Survie

`gens-survival-mode-isolation-1678104.js` est chargé dynamiquement par le loader Tactical/performance et réinstallé avec le bridge. Cette dépendance de composition doit être supprimée à terme : l'isolation Survie ne doit pas dépendre du bootstrap d'un combat Dungeon.

## 6. Différence entre fichier source et production

Invariant à retenir pour les prochains tests :

`index.html source != _site/index.html construit != runtime après chargements dynamiques`

Un test qui inspecte uniquement la source peut donc être vert alors que la production charge une autorité supplémentaire plus tard.

Les tests d'architecture doivent couvrir le chemin final construit et, lorsque nécessaire, le chargement navigateur réel.

## 7. Sentinelles à ajouter avant le premier refactor

### Composition

- vérifier l'ordre final des scripts de `_site/index.html` ;
- vérifier que la couche performance/Tactical n'est présente qu'une fois ;
- vérifier qu'aucun nouveau loader dynamique non documenté n'apparaît ;
- vérifier que V114.1 reste absent du runtime ;
- comparer automatiquement la liste des scripts source, injectés et dynamiques à une allowlist documentée.

### Frontières

- Tactical ne peut pas observer `body` / `html` ;
- Tactical ne peut pas modifier fiche héros, accueil ou Save & Quit hors combat ;
- quitter le Dungeon empêche tout callback Tactical tardif de reprendre l'UI ;
- Survie ne reçoit pas de wrapper Dungeon/Tactical ;
- un seul propriétaire décide du démarrage d'un combat ;
- un seul propriétaire calcule les participants ;
- tout timer/retry UI doit être borné ou nettoyable.

### Règles

- Force canonique -> règle RPG -> bonus dégâts -> snapshot Tactical doit être testé par le vrai chemin ;
- `armorZeroBlockChance` doit être une règle unique configurable et migrée ;
- l'UI doit afficher le détail retourné par le moteur plutôt que recalculer les dégâts.

## 8. Ordre immédiat après cette cartographie

1. ajouter une sentinelle de dette architecturale qui empêche l'apparition de nouveaux observers/listeners/timers/wrappers globaux hors allowlist historique ;
2. ajouter une sentinelle de composition du runtime Pages ;
3. ajouter les tests de frontière UI V114.11 sur le vrai chemin ;
4. ajouter le test réel Force -> snapshot -> dégâts ;
5. seulement ensuite extraire le bootstrap hors du module de performance, sans changer le comportement ni l'ordre de chargement.

## Statut

Cartographie active documentée. Aucun runtime de production n'est modifié par ce document.