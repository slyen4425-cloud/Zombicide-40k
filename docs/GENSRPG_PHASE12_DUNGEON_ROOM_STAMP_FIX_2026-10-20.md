# GenSrpG / Phase 12 — Correction Dungeon Core200 : salle des ennemis (GREEN)

**20 octobre 2026 — correctif physique isolé, navigateur et sentinelles CI verts ; la Phase 12 globale reste ouverte.**

## Gouvernance conforme aux §§12–26 de la charte

- **Code de départ GREEN** : R15 `checkpoint/gensrpg-phase12-r15-builders-character-entity-editors-green-2026-10-20` SHA `95740b6353a116c7e66b5d1095338b81d8b223bf`. START créé **avant toute mutation** `checkpoint/gensrpg-start-phase12-dungeon-room-stamp-fix-2026-10-20` sur le même SHA ; branche isolée `work/gensrpg-phase12-dungeon-room-stamp-fix-2026-10-20`. Dernier diagnostic d'autorité antérieur : `checkpoint/gensrpg-phase12-dungeon-authority-trace-green-2026-10-20`.
- **§26** : `index.html` **non modifié**, R15 1 729 855 octets, Git blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` ; copie exacte reconstruite du ZIP utilisateur R13 et transformateurs R14/R15, vérifiée par CI sur GitHub.
- **Unique propriétaire du changement fonctionnel** : `assets/gensrpg/dungeon/core200-rebuild-v1.js` ; base blob `5649ae0af69064dde72e6ea28b8dbefd105cb527`, nouveau blob `5158facb6cb1246cb892a396cf35ffdc0ea4bf70`. Le service worker `service-worker.js` a seulement vu son cache versionné (blob résultant `4b3a1881ad97b0db17a74b212be645fb9ba28190`) pour éviter de servir l'ancien JS PWA.
- **Checkpoint final GREEN** : `checkpoint/gensrpg-phase12-dungeon-room-stamp-fix-green-2026-10-20`, exactement au commit CI `6850f39e9b93462d7346618aafe151111fedc4aa`. Créé après vérification des statuts `success` et de l'identité du HEAD, `main` inchangée. Les commits documentaires postérieurs ne déplacent pas ce pointeur.

## Défaut reproduit : générer en salle 0 alors que l'on entre en salle 1

Chemin **réel** Playwright : accueil Survie → Aventure RPG → Dungeon → clic Jouer → rechargement complet volontaire `forceReload155` → sélection du même univers → Nouvelle partie → trois héros natifs (Aldren, Lyra, Brom) → Explorer. Le test utilise les **paramètres existants de poids des rencontres** pour garantir le type « ennemi » sans injecter d'instance, ni modifier PV/IA/dégâts.

Avant correction, le guerrier squelette natif de 5 PV existait bien dans `loadActiveEnemies()`, mais il était marqué `dungeonRoom: 0`, tandis que `loadDungeonState().room: 1` ; `dungeonLivingEnemies()` renvoyait donc `[]` et le bouton Combat n'apparaissait pas.

Une sonde de lecture sur les écritures **réelles** `localStorage.setItem` a prouvé le chemin précis :
1. `core200-rebuild-v1.js` → `explore()` → `createRoom()` → `dungeonEncounter()` → `trackSpawnedEnemyInstances()` → `saveActiveEnemies()` **avant** que le nouveau numéro de salle soit publié (donc stamp 0).
2. Seulement après `createRoom`, `saveRt(x)` synchronisait `gensrpg_dungeon_runtime_v2` → `syncLegacy(x)` → `saveDungeonState` avec `room: 1`.
3. Les réécritures ultérieures des ennemis ne modifiaient pas le marquage initial 0. Le filtre des ennemis vivants était correct et ne devait pas être retouché.

**Correction soustractive de chronologie :** le propriétaire Core200 appelle maintenant son propre `saveRt(x)` **immédiatement après avoir choisi/activé `targetRoom` et avant `createRoom(x.room,kind)`**. Le même service de synchronisation déjà autoritaire est réutilisé ; aucun état ni fallback concurrent n'est ajouté. La sauvegarde finale après génération demeure. Pas de changement à `trackSpawnedEnemyInstances`, `dungeonEncounter`, `dungeonLivingEnemies`, stats, règles de jeu, génération d'ennemis ni bridge Tactical.

## Preuves automatisées GREEN sur le même SHA

[Run GitHub Actions **39441132599**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39441132599) : un job complet SUCCESS sur `6850f39e9b93462d7346618aafe151111fedc4aa` :
- Charte : comparaison `index.html` blob R15, zéro modification des autres assets runtime, vérification syntaxique Core200 ; PWA cache versionné.
- Historiques : Builders R15 (54 globals et rollback exact), cartographie scripts/owner, sentinelle active session Tactical ; seule adaptation des attentes PWA R15 pour autoriser le suffixe cache sans affaiblir l'exigence de pré-cache du module.
- **Chromium + Firefox** : le même chemin utilisateur natif est suivi ; la salle legacy et runtime valent **1**, le même squelette de 5 PV est présent dans la liste active **ET** dans `dungeonLivingEnemies`, son `dungeonRoom` vaut **1**, pas de doublon ni erreur JavaScript, le bandeau affiche l'ennemi vivant et **« ⚔️ ENGAGER LE COMBAT · 1 ENNEMI »** est actif. Les scripts Core 3.03 restent le dernier propriétaire de l'entrée de rendu après démarrage.
- Pas de test tactile Android/PWA installée réalisé ; le cache est **préparé** mais pas testé hors ligne sur appareil.

## Risque distinct détecté et mis en quarantaine — entrée Tactical

Un essai plus large, uniquement dans la branche de travail, a fait apparaître qu'après fermeture de la fenêtre d'effet via son bouton OK et clic de **« ENGAGER LE COMBAT »**, le modal `dungeonCombatModal` ne s'ouvrait pas dans Chromium (run [39440916071](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39440916071)). La fonction de rendu observée après activation du bridge différait du propriétaire Core3.03 mesuré au repos ; l'absence de combat n'est **pas résolue** par le marquage de salle. Pour respecter « un lot = une responsabilité », ce scénario a été retiré de la sentinelle **du correctif salle** ; son échec reste documenté ici, et doit être investigué sur **une autre branche/START** (activation/délégation Tactical, overlay, session, vrai tour IA). Ne pas déclarer le combat ni la reprise GREEN avec ce rapport.

**Périmètre final :** un seul module Dungeon modifié + cache SW + adaptation de test/outils d'historique + CI et docs. `main` demeure gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`, laboratoires et 32 images historiques Survie intacts ; aucune fusion et aucune publication. **Phase 12 toujours OUVERTE.**
