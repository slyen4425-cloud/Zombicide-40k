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
- décider de l’ordre d’intégration ;
- créer les checkpoints verts ;
- maintenir les documents de reprise ;
- décider quand une version peut être proposée au test utilisateur ;
- ne jamais modifier `main` pendant la restructuration tant que la charte l’interdit.

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

Tant qu’un lot est actif, son propriétaire critique est verrouillé pour les autres agents.

Avant de lancer un nouvel agent, le coordinateur vérifie qu’il n’entre pas en conflit avec :
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
- Chantier courant : intégration contrôlée du correctif Talent après Combat 4K.
- Branche : `work/gensrpg-integrate-talent-after-4k-2026-09-17`.
- Base : checkpoint vert Combat 4K.
- Checkpoint 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`.
- SHA 4K : `c672726b69aa5895d252e2f31084c20740bcc699`.
- Propriétaire verrouillé : visibilité de la section Talent dans la fiche héros native.
- Candidat technique Talent : `e6d03dba0ba225eb3b35625d783cf58011ea22c0`, vert régression Talent + architecture/Chromium-preview + Firefox.
- Checkpoint cible : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` après revalidation du SHA documentaire final.

### Combat directeur suspendu proprement
- Combat 4K est officiellement checkpoint vert sur `c672726b69aa5895d252e2f31084c20740bcc699`.
- Inventaire après 4K : `startCombat` = 4 — définition historique + alias + `cell` + `ambush`.
- Prochain lot combat prévu : **4L `ambush` uniquement**.
- 4L ne doit pas démarrer avant fermeture des intégrations Agent 1 en cours.
- `cell` reste hors périmètre de 4L.

### Agent 1 — Talent : audité et en cours d’intégration contrôlée
- Branche agent auditée : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`.
- Checkpoint agent : `checkpoint/gensrpg-hero-sheet-talent-flash-green-2026-09-17`.
- SHA agent : `410d63b4800e298dad277b8ce153b7726bd5ab7c`.
- Cause confirmée : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel` alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.
- La branche agent entière n'a pas été fusionnée.
- La sentinelle a d'abord été reportée sur la base 4K et a reproduit le défaut en rouge — run `35250002420`.
- Correction post-4K : commit `f34da9391730bc8c83a6d166feeb8efdcff421a1`.
- Diff net post-4K : `index.html` + test Talent + workflow lecture seule uniquement.
- Aucun Observer, timer, retry ou wrapper de réparation ajouté.

### Agent 1 — Chrome/PWA : audité, intégration différée dans un lot séparé
- Branche agent auditée : `work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`.
- Checkpoint agent : `checkpoint/gensrpg-chrome-white-screen-green-2026-09-17`.
- SHA agent : `369d70edc7cb4506d368171e6a6fff6ad89b9766`.
- Résultat retenu : problème reproductible dans `preview.html` lorsqu'un cache PWA GenSrpG préexistant peut répondre avant que sa suppression asynchrone soit terminée.
- Correction agent : attendre explicitement la suppression des caches `gensrpg-cache-*` avant le `fetch('index.html')`.
- Aucune modification gameplay ou `index.html` dans ce lot agent.
- Limite : ce résultat est un durcissement preview/PWA ; il ne prouve pas à lui seul la cause du symptôme Chrome Android réel en production.
- Règle d’intégration : ne rien reporter avant checkpoint Talent ; repartir ensuite du checkpoint Talent, caractériser en rouge, puis n'intégrer que `preview.html` + test/workflow si l'équivalence est confirmée.

### Jalon UI protégé
- Dock Tactical `Attaquer / Fin du tour / Capacité`.
- Checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17`.
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`.
- Validation utilisateur : « parfait ras tout fonctionne très bien ».
- Toute intégration Chrome/PWA doit repasser la sentinelle dock.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## 6. Ordre d’intégration décidé

Ordre obligatoire actuel :

1. Combat 4K — fermé vert ;
2. intégration Talent post-4K — chantier courant ;
3. durcissement preview/PWA Chrome — lot séparé après checkpoint Talent ;
4. reprise Combat 4L `ambush` uniquement.

Ne pas fusionner les anciennes branches agents en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

## 7. Compte rendu obligatoire d’un agent

À la fin de son lot, un agent doit fournir :
- cause exacte ;
- branche ;
- SHA final ;
- fichiers modifiés ;
- tests ajoutés/modifiés ;
- résultats CI ;
- risques ou limites ;
- confirmation qu’il n’a pas touché aux systèmes hors périmètre ;
- checkpoint éventuel.

Le coordinateur ne considère jamais un travail intégré simplement parce qu’un agent dit qu’il est terminé : il vérifie le dépôt et les tests.

## 8. Règle de succession

Quand un nouveau fil devient directeur, l’ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l’unique autorité de coordination après avoir vérifié les quatre documents de reprise et l’état GitHub réel.
