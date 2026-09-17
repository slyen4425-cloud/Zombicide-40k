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

Quand le fil directeur change, le nouveau fil doit lire dans cet ordre :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `docs/GENSRPG_CURRENT_WORK.md`
4. `docs/GENSRPG_COORDINATION.md`

Puis il doit vérifier :
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

Tant qu’un lot est actif, son propriétaire critique est considéré comme verrouillé pour les autres agents.

Avant de lancer un nouvel agent, le coordinateur vérifie qu’il n’entre pas en conflit avec :
- navigation / fiche héros ;
- stats / XP / progression ;
- combat Tactical ;
- déclenchement combat Dungeon ;
- déplacement Dungeon ;
- sauvegarde / reprise ;
- inventaire / équipement / sets ;
- shell / index.html si le même bloc est concerné.

## 5. État de coordination — 2026-09-17

### Fil directeur
- Rôle : **COORDINATEUR actif**
- Chantier directeur : poursuite de la restructuration combat après lot 4G
- Branche de travail suivante : `work/gensrpg-combat-callsite-migration-4h-2026-09-17`
- Base : checkpoint vert 4G
- Checkpoint vert 4G : `checkpoint/gensrpg-combat-callsite-migration-4g-green-2026-09-17`
- SHA 4G : `f97b345419d8ce855237cf47dc4dc83f07b10978`

### Agent 1
- Rôle : **AGENT EXÉCUTANT**
- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Base : checkpoint vert 4F `96043b4b04a069fc571aca38634df221341bb411`
- Mission : diagnostiquer puis, seulement si parfaitement identifié et dans le périmètre, corriger le flash/disparition des éléments Talent de la fiche héros.
- Interdictions : ne pas toucher au combat Tactical, dock, stats, XP, déplacement, sauvegarde, navigation globale ou `main`.
- Statut : séparé du fil directeur ; résultat à rapporter au coordinateur avant toute intégration.

### Jalon UI séparé validé utilisateur
- Dock Tactical `Attaquer / Fin du tour / Capacité`
- SHA testé : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Validation utilisateur : « parfait ras tout fonctionne très bien »
- Ce jalon reste séparé des lots combat tant que le coordinateur n’a pas décidé de son intégration.

### Production sûre
- `main` : V16.78.114.11
- SHA : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` reste gelé pendant la restructuration.

## 6. Compte rendu obligatoire d’un agent

À la fin de son lot, un agent doit fournir au coordinateur :
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

## 7. Règle de succession

Quand un nouveau fil devient directeur, l’ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l’unique autorité de coordination après avoir vérifié les quatre documents de reprise et l’état GitHub réel.
