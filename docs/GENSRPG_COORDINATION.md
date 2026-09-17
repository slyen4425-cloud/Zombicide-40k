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
- Rôle : **COORDINATEUR actif**
- Chantier directeur : fermeture du lot combat 4I, échec de furtivité Runtime 2.00
- Branche : `work/gensrpg-combat-callsite-migration-4i-2026-09-17`
- Base : checkpoint vert 4H
- Checkpoint vert 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17`
- SHA 4H : `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`
- Propriétaire verrouillé : ancien déclenchement combat Core/Runtime 2.00 autour de `startCombat`
- Le prochain lot ne peut démarrer qu’après création du checkpoint vert 4I sur un SHA entièrement revalidé.

### Agent 1 — ancien travail Talent
- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Mission : diagnostic/correction ciblée du flash/disparition Talent de la fiche héros.
- Statut : annoncé terminé par l’utilisateur ; **non intégré** tant que branche, SHA, diff et tests n’ont pas été vérifiés par le coordinateur.

### Agent 1 — diagnostic Chrome actif
- Branche : `work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`
- Base : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Mission : diagnostiquer l’écran blanc/figé observé sous Chrome Android alors que le même jalon fonctionne sous Firefox.
- Interdictions : aucun gameplay, aucun observer/timer/retry global, aucune modification du propriétaire combat 4I, aucun `main`.
- Statut : séparé du fil directeur ; résultat à rapporter avant toute intégration.

### Jalon UI séparé validé utilisateur
- Dock Tactical `Attaquer / Fin du tour / Capacité`
- Checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17`
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Validation utilisateur : « parfait ras tout fonctionne très bien »
- Ce jalon reste séparé des lots combat tant que le coordinateur n’a pas décidé de son intégration.

### Production sûre
- `main` : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` reste gelé pendant la restructuration.

## 6. Compte rendu obligatoire d’un agent

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

## 7. Règle de succession

Quand un nouveau fil devient directeur, l’ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l’unique autorité de coordination après avoir vérifié les quatre documents de reprise et l’état GitHub réel.