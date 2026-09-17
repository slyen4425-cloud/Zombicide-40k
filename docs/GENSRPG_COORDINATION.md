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
- Chantier courant : restauration contrôlée du Dock Tactical sur la chaîne directrice post-PWA.
- Branche : `work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17`.
- Base : checkpoint vert preview/PWA post-Talent.
- Checkpoint de base : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17`.
- SHA de base : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Propriétaires verrouillés pendant ce lot : cycle de rendu de l'UI Tactical canonique et raccord du Dock V111 à ce cycle.
- Candidat technique Dock : `ce1fb0491ffe9c82f3a59f7791a3b74abc8dae20`.
- Checkpoint cible : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17` après revalidation du SHA documentaire final.
- Combat 4L reste suspendu jusqu'à ce checkpoint.

### Talent — intégré et checkpoint vert
- Branche d'intégration : `work/gensrpg-integrate-talent-after-4k-2026-09-17`.
- Checkpoint : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`.
- SHA : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Cause : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel` alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.
- Correction : retrait de cette autorité de visibilité du renderer Talent.
- Caractérisation rouge effectuée avant correction sur la base 4K.
- Validation finale : Talent dédié + architecture/Chromium-preview + Firefox verts.
- L'ancienne branche Agent 1 n'a pas été fusionnée en bloc.

### Preview/PWA — intégré et checkpoint vert
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
- Checkpoint final : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17`.
- SHA final : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Limite : ce lot prouve et corrige une course de **preview/PWA** ; il ne prouve pas à lui seul que le symptôme Chrome Android réel en production avait exactement cette cause.

### Régression de composition détectée par l'utilisateur — Dock Tactical
- Le checkpoint preview/PWA était vert techniquement mais ne contenait pas le jalon Dock Tactical issu d'une ligne parallèle antérieure.
- L'utilisateur a constaté l'absence des commandes flottantes `Attaquer / Fin du tour / Capacité`.
- Audit : Talent et preview/PWA n'ont pas supprimé le Dock ; la chaîne directrice n'avait simplement jamais intégré le jalon Dock vert `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`.
- Classification : **omission de composition entre branches vertes**.
- Conséquence : Combat 4L stoppé immédiatement ; aucune correction 4L n'a été appliquée.

### Dock Tactical — restauration contrôlée sur la base post-PWA
- Branche : `work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17`.
- Base exacte : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Ancien jalon utilisateur : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` — `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` — validation utilisateur « parfait ras tout fonctionne très bien ».
- Tests permanents reportés avant runtime : contrat canonique, vrai rendu Tactical Chromium/Firefox et fixture mobile.
- SHA de caractérisation rouge : `c3e792da5f2b7b8e6ec346ce16c87e17b406725e`.
- Run rouge attendu : `35257199026`.
- Propriétaire retenu : `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js` reste l'unique renderer Tactical ; il expose un hook explicite `onAfterRender()`.
- Consommateur : V111 s'abonne avec `U.onAfterRender(()=>maintain(rt))` au lieu de capturer/remplacer `U.render`.
- Aucun `MutationObserver` global n'est réactivé ; aucun nouveau timer/retry n'est ajouté ; aucune règle de combat n'est modifiée.
- Commit propriétaire : `efd966a4e8eee210db90f674a6dd05fd1d430fe4`.
- Writer temporaire borné supprimé ; absent du diff net final.
- Candidat technique propre : `ce1fb0491ffe9c82f3a59f7791a3b74abc8dae20`.
- CI technique : Dock contrat + Chromium + Firefox success (`35257375684`), architecture + Chromium/preview success (`35257375692`), Firefox général success (`35257375764`).
- Les documents doivent maintenant être revalidés sur leur SHA final avant création du checkpoint cible.

### Combat directeur suspendu proprement
- Combat 4K est checkpoint vert sur `c672726b69aa5895d252e2f31084c20740bcc699`.
- Inventaire après 4K : `startCombat` = 4 — définition historique + alias + `cell` + `ambush`.
- Prochain lot combat prévu : **4L `ambush` uniquement**.
- Une branche 4L avait été ouverte depuis l'ancien checkpoint, mais aucun runtime 4L n'a été modifié avant le signalement Dock.
- Cette branche ne doit pas être reprise comme base.
- 4L redémarrera depuis le nouveau checkpoint Dock post-PWA final.
- `cell` reste hors périmètre de 4L.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## 6. Ordre d'intégration décidé

Ordre actuel :

1. Combat 4K — fermé vert ;
2. Talent post-4K — intégré et fermé vert ;
3. preview/PWA post-Talent — intégré et fermé vert ;
4. Dock Tactical — restauration de composition sur la chaîne directrice, candidat technique vert ;
5. Combat 4L — `ambush` uniquement, seulement après checkpoint Dock post-PWA.

Ne pas fusionner les anciennes branches agents ou jalons parallèles en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

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
