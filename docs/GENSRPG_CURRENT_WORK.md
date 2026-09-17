# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — intégration contrôlée du correctif Talent après Combat 4K

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-integrate-talent-after-4k-2026-09-17`.
- Base exacte : checkpoint vert Combat 4K `c672726b69aa5895d252e2f31084c20740bcc699`.
- Checkpoint 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## Combat 4K fermé vert

Le lot 4K a migré uniquement l'entrée Runtime 2.00 `manual` vers `GensRpgTacticalCombatV2Bridge.requestCombat(...)` après caractérisation permanente.

Checkpoint vert :

`checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`

SHA exact :

`c672726b69aa5895d252e2f31084c20740bcc699`

Inventaire après 4K :

- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 4 — définition historique, alias, `cell`, `ambush`.

Ne pas chercher à réduire ces compteurs artificiellement. Le prochain lot combat reste **4L — `ambush` uniquement**, mais il est suspendu le temps de fermer les intégrations Agent 1.

## Audit Agent 1 — Talent

Branche auditée :

`work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`

Checkpoint agent :

`checkpoint/gensrpg-hero-sheet-talent-flash-green-2026-09-17`

SHA agent :

`410d63b4800e298dad277b8ce153b7726bd5ab7c`

Cause confirmée : conflit d'autorité visuelle dans la fiche héros native.

- `renderDungeonSkillTree()` rend le contenu Talent ;
- `applyDungeonSheetTabs()` est le propriétaire canonique de la visibilité des sections ;
- l'ancien renderer Talent forçait également `#dungeonSkillTreePanel` visible, puis les onglets le remasquaient sur `character`, provoquant le flash.

La correction agent a été jugée compatible avec la charte, mais sa branche entière n'a pas été fusionnée car elle partait d'un checkpoint Combat 4F ancien.

## Intégration Talent post-4K — caractérisation avant correction

Le test permanent a été reporté seul sur la base 4K :

`tests/gens_hero_sheet_talent_flash_v11411.test.cjs`

Workflow lecture seule :

`.github/workflows/gensrpg-hero-sheet-talent-flash-post4k.yml`

La caractérisation a été lancée avant toute modification runtime sur le SHA :

`fb2b292db00d05a255a947b86834896518ece906`

Run rouge attendu : `35250002420`.

Le test a reproduit le conflit sur la base post-4K et a échoué avant correction.

## Correction Talent post-4K

Correction strictement soustractive dans `renderDungeonSkillTree()` :

- suppression de la récupération de `#dungeonSkillTreePanel` ;
- suppression de son écriture `style.display` ;
- conservation du rendu Talent ;
- conservation du comportement `#zombicideSkillPanel` ;
- `applyDungeonSheetTabs()` reste seul propriétaire de la visibilité Talent.

Commit runtime :

`f34da9391730bc8c83a6d166feeb8efdcff421a1`

Aucun Observer, timer, retry, wrapper de réparation ou second renderer n'a été ajouté.

Le workflow temporaire utilisé uniquement pour modifier chirurgicalement le gros `index.html` a été retiré. Il ne fait pas partie du diff net.

## Diff net 4K → candidat Talent

Le diff net est limité à trois fichiers :

1. `index.html` — 2 lignes ajoutées / 2 supprimées dans le propriétaire Talent ;
2. `tests/gens_hero_sheet_talent_flash_v11411.test.cjs` ;
3. `.github/workflows/gensrpg-hero-sheet-talent-flash-post4k.yml`.

Aucun fichier combat, V113, Bridge, dock, déplacement, XP, stats, sauvegarde ou gameplay n'est modifié par ce lot.

## Validation technique Talent

Candidat technique propre avant documentation :

`e6d03dba0ba225eb3b35625d783cf58011ea22c0`

Validations vertes sur ce SHA exact :

- régression Talent dédiée — success ;
- architecture + Chromium/preview — success ;
- Firefox — success.

Les présents documents créent maintenant le SHA final documentaire. Ce nouveau SHA doit être revalidé intégralement avant création du checkpoint vert.

Checkpoint cible :

`checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`

## Travail Agent 1 Chrome/PWA — audité mais pas encore intégré

Branche auditée :

`work/gensrpg-chrome-white-screen-diagnostic-2026-09-17`

Checkpoint agent :

`checkpoint/gensrpg-chrome-white-screen-green-2026-09-17`

SHA agent :

`369d70edc7cb4506d368171e6a6fff6ad89b9766`

Le travail prouve un problème de course dans **`preview.html`** avec un cache PWA `gensrpg-cache-*` préexistant : la suppression du cache était lancée mais non attendue avant le `fetch('index.html')`.

Ce travail est validé comme **durcissement preview/PWA**, mais ne doit pas être présenté comme preuve que le symptôme Chrome Android réel en production avait exactement cette cause.

Il sera intégré dans un **lot séparé**, uniquement après checkpoint vert du lot Talent, avec nouvelle caractérisation sur la base post-Talent.

## Suite après checkpoint Talent

1. créer une branche propre depuis le checkpoint Talent final ;
2. caractériser le scénario stale-cache Chromium/Firefox avant correction ;
3. si le rouge est reproduit, intégrer uniquement l'attente de suppression des caches dans `preview.html` ;
4. revalider architecture, Chromium/preview, Firefox et le dock Tactical ;
5. créer un checkpoint vert séparé ;
6. reprendre ensuite Combat 4L `ambush` uniquement.

## Jalon UI utilisateur protégé

Dock Tactical `Attaquer / Fin du tour / Capacité` :

- checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` ;
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` ;
- validation utilisateur : « parfait ras tout fonctionne très bien ».

Ne pas casser ce jalon.

## Jalons directeurs verts précédents

- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Combat 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17` — `b8f5b14f0651479165d35545f3a22db6df8d391f`.
- Combat 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Combat 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.
