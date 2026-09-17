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
- Chantier courant : intégration contrôlée du durcissement preview/PWA après Talent.
- Branche : `work/gensrpg-integrate-preview-pwa-after-talent-2026-09-17`.
- Base : checkpoint vert Talent post-4K.
- Checkpoint Talent : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`.
- SHA Talent : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Propriétaire verrouillé : chargement de source dans `preview.html` face à un cache PWA GenSrpG préexistant.
- Candidat technique preview/PWA : `48f1f50261a88b71bce30fa520bffeeedaa9ff36`.
- Checkpoint cible : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` après revalidation du SHA documentaire final.

### Talent — intégré et checkpoint vert
- Branche d'intégration : `work/gensrpg-integrate-talent-after-4k-2026-09-17`.
- Checkpoint : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`.
- SHA : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Cause : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel` alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.
- Correction : retrait de cette autorité de visibilité du renderer Talent.
- Caractérisation rouge effectuée avant correction sur la base 4K.
- Validation finale : Talent dédié + architecture/Chromium-preview + Firefox verts.
- L'ancienne branche Agent 1 n'a pas été fusionnée en bloc.

### Preview/PWA — caractérisée puis corrigée sur base post-Talent
- Branche Agent 1 auditée : `work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`.
- Agent checkpoint : `checkpoint/gensrpg-chrome-white-screen-green-2026-09-17`.
- Agent SHA : `369d70edc7cb4506d368171e6a6fff6ad89b9766`.
- L'ancienne branche agent n'a pas été fusionnée en bloc.
- Test permanent reporté sur la base Talent : `tests/gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs`.
- Workflow lecture seule : `.github/workflows/gensrpg-preview-pwa-post-talent.yml`.
- Caractérisation rouge avant correction : SHA `59b027209ca23b3b741fc5ae89910ba21051550f`, run `35250790568`.
- Problème reproduit : avec un Service Worker/cache `gensrpg-cache-*` préexistant, la preview pouvait charger l'ancien `index.html` avant la fin de la suppression asynchrone du cache.
- Correction : attendre explicitement la suppression des caches GenSrpG avant `fetch('index.html')`.
- Commit correctif : `48f1f50261a88b71bce30fa520bffeeedaa9ff36`.
- Diff technique : `preview.html` +4 lignes, test dédié, workflow dédié uniquement.
- Validation technique sur ce SHA : PWA Chromium/Firefox success (`35253552569`), architecture + Chromium/preview success (`35253552456`), Firefox success (`35253552690`).
- Limite : ce lot prouve et corrige une course de **preview/PWA** ; il ne prouve pas à lui seul que le symptôme Chrome Android réel en production avait exactement cette cause.

### Combat directeur suspendu proprement
- Combat 4K est checkpoint vert sur `c672726b69aa5895d252e2f31084c20740bcc699`.
- Inventaire après 4K : `startCombat` = 4 — définition historique + alias + `cell` + `ambush`.
- Prochain lot combat prévu : **4L `ambush` uniquement**.
- 4L ne démarre qu'après checkpoint vert du lot preview/PWA.
- `cell` reste hors périmètre de 4L.

### Jalon UI protégé
- Dock Tactical `Attaquer / Fin du tour / Capacité`.
- Checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17`.
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`.
- Validation utilisateur : « parfait ras tout fonctionne très bien ».
- Toute intégration doit préserver ce jalon.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## 6. Ordre d'intégration décidé

Ordre actuel :

1. Combat 4K — fermé vert ;
2. Talent post-4K — intégré et fermé vert ;
3. preview/PWA post-Talent — candidat technique vert, fermeture documentaire en cours ;
4. Combat 4L — `ambush` uniquement, après checkpoint preview/PWA.

Ne pas fusionner les anciennes branches agents en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

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
