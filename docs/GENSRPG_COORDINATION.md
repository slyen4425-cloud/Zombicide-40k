# GenSrpG — Coordination des fils et agents

Ce document complète `GENSRPG_CHARTE.md`, `GENSRPG_RESTRUCTURATION_ROADMAP.md` et `GENSRPG_CURRENT_WORK.md`.

Objectif : permettre de reprendre GenSrpG dans un autre fil sans perdre la hiérarchie entre le fil directeur et les agents parallèles.

## 1. Rôle unique du fil directeur

Un seul fil à la fois porte le rôle **COORDINATEUR / FIL DIRECTEUR**.

Il est seul responsable de :
- choisir le checkpoint vert de référence ;
- ouvrir les lots suivants ;
- attribuer les missions aux agents ;
- empêcher deux agents de modifier le même propriétaire critique ;
- contrôler branche, SHA, diff et tests des agents ;
- décider de l'ordre d'intégration ;
- créer les checkpoints verts ;
- maintenir les documents de reprise ;
- décider quand une version peut être proposée au test utilisateur ;
- ne jamais modifier `main` pendant la restructuration tant que la charte l'interdit.

Les autres fils sont des **AGENTS EXÉCUTANTS**. Ils ne deviennent jamais coordinateurs par défaut et ne fusionnent pas leurs travaux entre eux.

## 2. Procédure de reprise dans un nouveau fil directeur

Lire dans cet ordre :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `docs/GENSRPG_CURRENT_WORK.md`
4. `docs/GENSRPG_COORDINATION.md`

Puis vérifier :
- le SHA exact de `main` ;
- le dernier checkpoint vert ;
- les branches agents encore actives ;
- les propriétaires critiques déjà réservés ;
- les résultats agents non encore intégrés.

## 3. Règle agent

Chaque agent doit avoir :
- une branche dédiée ;
- une mission unique ;
- un périmètre déclaré ;
- un propriétaire principal ;
- une liste explicite de systèmes interdits ;
- des tests avant correction ;
- un SHA final et un compte rendu.

Règle absolue : **1 agent = 1 branche = 1 périmètre = 1 checkpoint éventuel**.

Deux agents ne doivent jamais modifier le même propriétaire critique en parallèle.

## 4. Verrous de coordination

Tant qu'un lot est actif, son propriétaire critique est verrouillé pour les autres agents.

Avant de lancer un nouvel agent, le coordinateur vérifie qu'il n'entre pas en conflit avec :
- navigation / fiche héros ;
- stats / XP / progression ;
- combat Tactical ;
- déclenchement combat Dungeon ;
- déplacement Dungeon ;
- sauvegarde / reprise ;
- inventaire / équipement / sets ;
- shell / `index.html` si le même bloc est concerné.

## 5. État de coordination — 2026-09-17

### Fil directeur
- Rôle : **COORDINATEUR actif**.
- Chantier courant : Combat **4L — `ambush` Runtime 2.00 uniquement**.
- Branche : `work/gensrpg-combat-callsite-migration-4l-ambush-entry-post-dock-2026-09-17`.
- Base exacte : checkpoint Dock post-PWA vert.
- Checkpoint de base : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17`.
- SHA de base : `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Propriétaires verrouillés pendant 4L : callsite ambush Runtime 2.00 et préparation Bridge associée.
- `cell` est explicitement hors périmètre.
- Candidat technique 4L : `600a6d1d48c684f3f2aad3ae341a8c8cfa61a3ff`.
- Checkpoint cible : `checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17` après revalidation du SHA documentaire final.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

### Talent — intégré et checkpoint vert
- checkpoint : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` ;
- SHA : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- correction : retrait de l'autorité de visibilité Talent de `renderDungeonSkillTree()` ; `applyDungeonSheetTabs()` reste propriétaire.
- validation : test Talent dédié + architecture/Chromium-preview + Firefox verts.

### Preview/PWA — intégré et checkpoint vert
- checkpoint : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` ;
- SHA : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- caractérisation rouge : `59b027209ca23b3b741fc5ae89910ba21051550f`, run `35250790568`.
- correction : suppression attendue des caches GenSrpG avant le fetch source de `preview.html`.
- limite : durcissement preview/PWA, pas preuve autonome du symptôme Android production.

### Dock Tactical — composition restaurée et checkpoint vert
- cause du signalement utilisateur : omission de composition entre lignes vertes, pas suppression par Talent/PWA.
- branche propre : `work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17`.
- caractérisation rouge : `c3e792da5f2b7b8e6ec346ce16c87e17b406725e`, run `35257199026`.
- correction : UI Tactical canonique expose `onAfterRender()` ; V111 s'abonne au hook sans wrapper `render()` ni Observer global.
- commit propriétaire : `efd966a4e8eee210db90f674a6dd05fd1d430fe4`.
- checkpoint final : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17`.
- SHA final : `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- validations finales : Dock `35257681260`, architecture/Chromium-preview `35257681298`, Firefox `35257681447` — success.

### Combat 4L — caractérisation

Ancien callsite Runtime 2.00 :

`startCombat(live.map(e=>String(e.id)),'ambush')`

La caractérisation a démontré que Runtime 2.00 fournissait le seed complet de `liveEnemies()`, tandis qu'un passage mécanique par `requestCombat(... reason:'ambush')` activait `prepareV113Detection()` et pouvait réduire ce seed via `detectionPairs()` selon vision/LOS.

- test : `tests/gens_core200_ambush_entry_characterization_lot4l.test.cjs` ;
- SHA : `231d7313a85832050fd7f4b63c1ca9fc69b2b33c` ;
- résultat : architecture/Chromium-preview, Firefox et Dock verts ;
- conclusion : remplacement mécanique interdit.

### Combat 4L — contrat cible rouge

- test : `tests/gens_core200_ambush_bridge_contract_lot4l.test.cjs` ;
- SHA : `bc6ec271602396c6a021c5398a18ed3c0b8b23e9` ;
- run architecture : `35258543144` ;
- rouge attendu confirmé à l'étape inventaire combat.

Contrat retenu : `preserveEnemyIds:true` saute seulement l'intersection préalable `detectionPairs()` pour un seed déjà sélectionné ; `V113.selectCombatants()` reste appelé.

### Combat 4L — correction et candidat technique

Commit runtime : `17966476d88c122e5711192b48f857bab29deceb`.

Modifications runtime strictes :
1. Bridge : `options.preserveEnemyIds===true` court-circuite uniquement `prepareV113Detection()` ;
2. Runtime 2.00 : le bouton ambush appelle `requestCombat()` avec `entry:'dc200AmbushAction'` et `preserveEnemyIds:true`.

Les autres embuscades ne passent pas ce flag et conservent la préparation V113 existante.

Le writer temporaire borné a été supprimé et est absent du diff net.

Candidat technique : `600a6d1d48c684f3f2aad3ae341a8c8cfa61a3ff`.

Inventaire après migration :
- `dc200StartCombat` = 1 ;
- `openDungeonCombatSetup` = 1 ;
- `launchCombat200` = 2 ;
- `startCombat` = 3 — définition historique + alias + `cell`.

CI technique sur `600a6d1d...` :
- architecture + Chromium/preview — success, run `35258869825` ;
- Firefox général — success, run `35258869882` ;
- Dock contrat + Chromium + Firefox — success, run `35258869773`.

Les documents créent désormais le SHA final documentaire, qui doit être revalidé avant checkpoint.

### Prochain lot après checkpoint 4L

Combat **4M — `cell` uniquement**.

Il devra partir du checkpoint 4L final vert et caractériser avant toute correction :
- sélection de la cible ;
- renforts de proximité ;
- `reinforcementRange` ;
- popup `⚔️ COMBAT ENGAGÉ` ;
- ensemble final d'ennemis transmis au lanceur.

Aucun remplacement mécanique de `startCombat([String(target.id)],'cell')` n'est autorisé.

## 6. Ordre d'intégration décidé

Ordre actuel :
1. Combat 4K — fermé vert ;
2. Talent post-4K — intégré et fermé vert ;
3. preview/PWA post-Talent — intégré et fermé vert ;
4. Dock Tactical post-PWA — intégré et fermé vert ;
5. Combat 4L `ambush` — candidat technique vert, clôture documentaire en cours ;
6. Combat 4M `cell` — seulement après checkpoint 4L.

Ne pas fusionner les anciennes branches agents ou lignes parallèles en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

## 7. Compte rendu obligatoire d'un agent

À la fin de son lot, un agent doit fournir :
- cause exacte ;
- branche ;
- SHA final ;
- fichiers modifiés ;
- tests ajoutés/modifiés ;
- résultats CI ;
- risques ou limites ;
- confirmation qu'il n'a pas touché aux systèmes hors périmètre ;
- checkpoint éventuel.

Le coordinateur ne considère jamais un travail intégré simplement parce qu'un agent dit qu'il est terminé : il vérifie le dépôt et les tests.

## 8. Règle de succession

Quand un nouveau fil devient directeur, l'ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l'unique autorité de coordination après avoir vérifié les quatre documents de reprise et l'état GitHub réel.
