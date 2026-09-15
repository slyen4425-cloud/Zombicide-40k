# GenSrpG — Carte du runtime réellement actif

Date : 2026-09-15
Base production auditée : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663` (V16.78.114.11)
Branche de refonte courante : `work/gensrpg-runtime-bootstrap-extraction-2026-09-15`

## Objectif

Documenter le chemin réellement exécuté et chaque transfert d'autorité pendant la restructuration, sans confondre :

1. le `index.html` source ;
2. le `_site/index.html` construit par GitHub Pages ;
3. les scripts chargés dynamiquement au runtime.

Invariant :

`index.html source != _site/index.html construit != runtime après chargements dynamiques`

## Sauvegardes de référence

La base de production V16.78.114.11 est figée sur :

`backup/gensrpg-v16.78.114.11-architecture-baseline-2026-09-15`

Elle pointe directement sur le commit sûr `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Le gros `index.html` d'environ 8,2 Mo reste donc récupérable exactement, avec tous les autres fichiers correspondant à cette version.

Checkpoints de restructuration validés :

- `checkpoint/gensrpg-architecture-sentinels-green-2026-09-15`
- `checkpoint/gensrpg-force-snapshot-green-2026-09-15`
- `checkpoint/gensrpg-runtime-bootstrap-green-2026-09-15`

Le principe pour la suite est de créer un checkpoint après chaque jalon structurel vert plutôt que de dupliquer physiquement le HTML à chaque modification.

## 1. Source `index.html`

La source reste pour l'instant le monolithe historique. Ses scripts externes directs sont toujours :

1. `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
2. `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`
3. `assets/dungeon/dungeon-core-316.js`
4. `assets/dungeon/dungeon-core-317.js`
5. `assets/gensrpg/gens-mobile-combat-performance-16781022.js`

Le titre HTML `GenSrpG V16.78.11` est obsolète et n'est pas une autorité de version. Le SHA Git et la composition runtime testée font foi.

## 2. Composition GitHub Pages

Le workflow `.github/workflows/main.yml` reconstruit `_site/index.html` et garantit actuellement, dans cet ordre :

1. `dungeon-core-318.js`
2. `dungeon-large-room-support-167834.js`
3. `dungeon-room-creator-100.js`
4. `dungeon-room-creator-v2-167819.js`
5. `dungeon-room-creator-feedback-167821.js`
6. `dungeon-world-builder-167821.js`
7. `dungeon-room-runtime-167822.js`
8. `dungeon-world-runtime-167823.js`
9. `dungeon-zone-content-167824.js`
10. `dungeon-authored-runtime-167839.js`
11. `dungeon-authored-cache-visual-167852.js`
12. `dungeon-source-render-stability-167877.js`
13. `dungeon-equipment-ui.js`
14. `dungeon-equipment-hotfix-167817.js`
15. `dungeon-set-editor-167818.js`
16. `gens-world-summary-167820.js`
17. `gens-rpg-stats-clean-167874.js`
18. `gens-dungeon-hero-art-repair-167874.js`
19. `gens-mobile-combat-performance-16781022.js`

Le module performance reste temporairement la dernière entrée statique afin de ne pas modifier en même temps l'ordre du build et la composition dynamique.

## 3. Jalon validé — séparation Performance / Bootstrap

Avant le refactor, `gens-mobile-combat-performance-16781022.js` cumulait :

- cache et invalidation des valeurs ;
- dés rapides D6/D100 ;
- wrappers de performance ;
- chargement de Tactical V2 ;
- chargement de l'isolation Survie ;
- réinstallation du bridge Tactical et de l'isolation Survie.

Cette responsabilité de composition est désormais extraite sur la branche de refonte.

### `gens-mobile-combat-performance-16781022.js`

Il conserve uniquement :

- cache de valeurs dérivées ;
- invalidation ;
- dés rapides ;
- routage du renderer de dés Dungeon/Survie ;
- wrappers liés au hot-path de performance.

Il ne connaît plus les sept modules Tactical/Survie. Il effectue seulement un handoff idempotent vers :

`assets/gensrpg/core/runtime-bootstrap-v1.js`

### `core/runtime-bootstrap-v1.js`

Il est maintenant l'unique propriétaire autorisé de la composition dynamique de cette chaîne de transition :

1. `gens-rpg-tactical-combat-v2.js`
2. `gens-rpg-tactical-combat-v2-adapter.js`
3. `gens-rpg-tactical-combat-v2-rules.js`
4. `gens-rpg-tactical-combat-v2-integration.js`
5. `gens-rpg-tactical-combat-v2-ui.js`
6. `gens-rpg-tactical-combat-v2-bridge.js`
7. `gens-survival-mode-isolation-1678104.js`

Le refactor préserve volontairement :

- l'ordre historique ;
- `async=false` ;
- le garde `__gensTacticalV2Loader105` ;
- installation immédiate du bridge/isolation ;
- retries 250 / 1200 / 3000 ms.

Ce comportement est caractérisé par test avant toute future suppression des retries.

Le service worker met également `runtime-bootstrap-v1.js` en cache afin de conserver le fonctionnement PWA/hors ligne.

## 4. Chaîne Tactical V108 → V114.11 encore active

`gens-rpg-tactical-combat-v2-integration.js` conserve pour l'instant :

1. V108 — polish ;
2. V109 — polish ;
3. V110 — stats/snapshot ;
4. V111 — runtime fixes ;
5. V112 — combat coherence ;
6. V113 — runtime authority ;
7. V114.11 — visual dice / protection UI.

Cette chaîne reste une dette historique à consolider progressivement.

V114.11 continue de bloquer les `MutationObserver` globaux `body/html` pendant l'installation de ces couches, puis restaure le constructeur natif. V114.1 et V114.4 ne sont pas réintroduits dans la chaîne active.

## 5. Autorités caractérisées

### Navigation / fiche héros / Save & Quit

Autorité : runtime Dungeon natif.

Sentinelles vertes : Tactical ne doit pas reprendre l'accueil, la fiche héros, Save & Quit ou le renderer global après sortie du combat.

### Composition du runtime

Autorité de transition : `core/runtime-bootstrap-v1.js`.

Une sentinelle interdit désormais aux nouveaux modules d'introduire une deuxième injection cachée de scripts. Le bootstrap est l'unique exception explicitement autorisée.

### Performance mobile

Autorité : `gens-mobile-combat-performance-16781022.js`.

La séparation du bootstrap n'a pas modifié le profil des dés/cache dans les tests.

### Stats et Force

Le vrai chemin a été caractérisé :

`Force canonique -> effets configurés -> bridge Dungeon historique -> snapshot Tactical`

Cas testés :

- Force 20 avec `+1 dégâts physiques / 10 Force` -> bonus +2 dans le snapshot ;
- Force 30 -> bonus +3.

Le comportement est donc fonctionnel et doit être préservé pendant la suppression future du raccord global historique.

### Survie

L'isolation Survie n'est plus déclarée dans le fichier de performance ; sa composition appartient au RuntimeBootstrap de transition. À terme, le bootstrap de mode devra rendre son cycle de vie indépendant de Tactical Dungeon.

## 6. Sentinelles actives

La CI de restructuration vérifie désormais :

- composition source/build/runtime ;
- RuntimeBootstrap : ordre exact, idempotence et retries ;
- interdiction de toute nouvelle autorité globale GenSrpG hors allowlist ;
- performance mobile inchangée ;
- autorité UI Dungeon native ;
- vrai chemin Force canonique -> snapshot Tactical ;
- scénario navigateur Chromium V114.11.

Le jalon RuntimeBootstrap est vert sur le run GitHub Actions `35002978859`.

## 7. Prochain chantier

La prochaine consolidation doit porter sur les deux responsabilités qui se chevauchent le plus dans V108/V109/V111/V112/V113 :

1. **un seul propriétaire du démarrage de combat** ;
2. **un seul propriétaire du calcul des participants**.

Ordre prévu :

1. caractériser par tests qui prend actuellement chaque décision ;
2. figer les cas Dungeon (héros dans la salle, portée d'entraide, héros non encore entré, héros ailleurs/KO) ;
3. désigner une autorité unique ;
4. transformer les autres couches en délégation ou supprimer leur doublon ;
5. vérifier UI, navigation, performance, Force/snapshot et navigateur ;
6. créer un nouveau checkpoint avant le chantier suivant.

## Statut

Premier refactor structurel validé sur branche de travail. `main` reste sur V16.78.114.11 et n'a pas été modifié par la restructuration.