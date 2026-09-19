# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Chantier courant prioritaire — Phase 4 / audit final resolver d’assets — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-final-audit-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-asset-resolver-final-audit-2026-09-19`

Base exacte :
`c050f4516b6c3f312047929495e5e6f270139545`
(`checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif

Auditer le reste du lot resolver d’assets contre la Phase 4 de la roadmap avant d’ouvrir un nouveau sous-lot runtime.

### Périmètre

- inventorier les dernières constructions de chemins d’assets actives dans `index.html` ;
- distinguer :
  - résolution d’entités dupliquée qui doit déléguer au Core ;
  - asset UI/tile exact appartenant légitimement au module Dungeon ;
- vérifier en priorité les couches héros tardives `dungeonCore213Stability` / `dungeonCore214SingleAuthority` et le bloc `dungeonCore055ExactAssets` ;
- ne modifier aucun runtime tant que la classification propriétaire n’est pas prouvée.

### Interdit

- aucun déplacement physique d’asset ;
- aucune migration de bloc 65 sans preuve de duplication de responsabilité ;
- aucune modification gameplay, mouvement, stockage, Tactical, Capture, Survie ou PvP ;
- aucun wrapper, observer, timer/retry ou fallback inter-module ;
- aucun merge sur `main`.

### Tests / sortie

Le lot d’audit doit produire une liste explicite :
1. chemins encore dupliqués à migrer ;
2. chemins exacts légitimes à conserver ;
3. sous-lot suivant minimal, s’il existe ;
4. si aucun resolver dupliqué ne reste, clôture du premier service Phase 4 et passage au service suivant de la roadmap : stockage / migrations.

### Résultat de l’audit

Audit dédié :
`docs/GENSRPG_PHASE4_ASSET_RESOLVER_FINAL_AUDIT.md`

Sentinelle :
`tests/gens_asset_resolver_final_audit_v1.test.cjs`

Classification prouvée :
- B.5 requis : mappings héros dupliqués dans Core 2.13 / 2.14 / 3.10 et fallbacks ennemi directs dans 3.09 / 3.10 ;
- B.6 requis : mapping logique des 8 loots `dloot_*` encore possédé par Core 0.23 ;
- bloc 65 : propriétaire de présentation Dungeon exact, pas un second resolver d’entités ; ne pas le migrer vers le Core partagé ;
- couches sols/portes/map : présentation Dungeon à traiter avec l’extraction du module/asset layout, pas comme logique commune.

Prochaine action après validation de cet audit :
1. checkpoint GREEN documentaire de l’audit ;
2. branche neuve B.5 depuis ce checkpoint ;
3. migrer uniquement les chemins d’entités des tokens tardifs vers les APIs Core existantes ;
4. B.6 séparé pour les loots ;
5. clôturer ensuite le resolver avant de passer à stockage/migrations.


## Chantier courant prioritaire — Phase 4 / resolver d’assets — 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-item-paths-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`

Base exacte :
`c4e32b99185b8908aa645ba7c6fcaf7a706fafbb`
(`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`)

Production `main` reste gelée sur V16.78.114.11 :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Objectif du lot

Phase 4, lot 1 conformément à la roadmap :
- extraire / consolider le resolver d’assets commun ;
- conserver exactement les chemins et résultats actuels ;
- supprimer l’ancienne autorité inline seulement après vrai raccord GREEN ;
- ne déplacer aucun asset physique dans ce premier lot.

### État source `index.html`

Le fichier fourni par l’utilisateur au blob `55453138449d07bde731ff6934acc442f56bae32` a été réconcilié avec l’unique correction fiche RPG validée.
Copie locale exacte reconstruite et vérifiée contre le checkpoint courant :
- taille : 8 175 814 octets ;
- blob Git : `d942934741ca200319de02116c4dd384722d39c7`.

### Propriétaires candidats à caractériser

Cartographie Phase 2 inline :
- bloc 30 : Dungeon GitHub-hosted art catalogue/binding ;
- bloc 31 : Dungeon art rendering compatibility and visual binding fixes ;
- bloc 32 : Dungeon direct image binding layer ;
- bloc 33 : Dungeon hero/item asset build marker and bindings ;
- bloc 65 : Dungeon exact assets.

Ces blocs sont des candidats, pas encore déclarés propriétaires uniques.

### Périmètre autorisé

- inventorier les fonctions/globales réellement utilisées pour résoudre héros, ennemis, objets, tuiles et UI ;
- identifier le vrai resolver et distinguer catalogue / consommateur / compatibilité ;
- créer le service Core dans `assets/gensrpg/core/` uniquement après caractérisation ;
- raccorder progressivement les consommateurs au service Core ;
- ajouter des sentinelles de résolution et de non-interférence.

### Interdit

- aucun déplacement physique de PNG/JPG/WebP ;
- aucun fallback inter-module nouveau ;
- aucune modification de gameplay, combat, mouvement ou événements ;
- aucune modification de la fiche héros ;
- aucun observer, timer/retry, wrapper global de réparation ou second resolver permanent ;
- aucun changement de `main`;
- ne pas toucher au lot événements d’Agent 1.

### Invariants

- un `artId` explicite reste prioritaire lorsqu’il l’est déjà ;
- les chemins Dungeon actuels restent identiques pendant l’extraction ;
- aucun asset Dungeon ne devient fallback Survie/Capture/PvP ;
- le resolver Core ne doit pas devenir propriétaire d’une règle de gameplay ;
- l’UI consomme un chemin résolu, elle ne recrée pas sa propre table concurrente.

### Tests requis avant GREEN

1. caractérisation des résolutions actuelles par vrai chemin ;
2. héros Dungeon : Aldren/Lyra/Brom ;
3. ennemis/boss Dungeon ;
4. objets avec `artId` ;
5. murs/portes/coffres/tuiles déjà couverts ;
6. fallback nominal existant uniquement là où il est aujourd’hui autorisé ;
7. Survie/Capture/PvP inchangés ;
8. Architecture + navigateur complet ;
9. Firefox ;
10. Tactical Dock.

### Coordination

Agent 1 travaille séparément sur les événements après déplacement.
Ne pas ouvrir le lot performance mouvement avant son diagnostic propriétaire.

### Jalon A — service pur hors production — GREEN

Checkpoint intermédiaire :
`checkpoint/gensrpg-phase4-asset-resolver-service-green-2026-09-19`

SHA :
`8a653e9939a1c66f56160bba8373b5593763a66e`

Résultat :
- `assets/gensrpg/core/asset-resolver-v1.js` créé comme service pur ;
- le service reste volontairement hors graphe production ;
- résolution Dungeon couverte pour créatures, héros built-in et objets built-in ;
- priorité d’un override explicite conservée ;
- aucun fallback implicite Dungeon vers Survie/Capture/PvP ;
- aucun DOM, stockage, observer, listener, timer ou gameplay dans le resolver ;
- garde Phase 2 mis à jour pour distinguer 72 fichiers historiques + 8 entrypoints Phase 3 + 1 service Phase 4 hors production ;
- graphe production inchangé à 65 fichiers atteignables.

Validation :
- Architecture + navigateur complet `35434977969` — SUCCESS ;
- Firefox `35434977895` — SUCCESS ;
- Tactical Dock `35434977920` — SUCCESS.

### Jalon B.1 — parité historique réelle figée — GREEN

Sentinelle navigateur :
`tests/gens_asset_resolver_browser_v1.test.cjs`

HEAD validé :
`a351d084d0feb45493ce330fec75f5138ecf39c1`

La vraie composition `preview.html` verrouille désormais avant migration :
- `dungeonAutoArtPath164('dng_skeleton')` -> `assets/dungeon/creatures/dng_skeleton.png` ;
- `gensDungeonCreatureArt165('dng_skeleton')` -> même chemin canonique ;
- héros built-in Aldren/Lyra/Brom -> chemins actuels inchangés ;
- objets built-in représentatifs -> chemins actuels inchangés ;
- collisions Survie (`walker`) et Capture (`braiseau`) -> aucune résolution Dungeon ;
- override ennemi explicite -> reste prioritaire sur le chemin canonique ;
- le resolver Core Phase 4 reste encore hors graphe production à ce sous-jalon.

Validation sur `a351d084d0feb45493ce330fec75f5138ecf39c1` :
- Architecture + navigateur complet `35435294480` — SUCCESS ;
- Firefox `35435294459` — SUCCESS ;
- Tactical Dock `35435294469` — SUCCESS.

### Jalon B.2 — raccord Core des chemins de créatures — GREEN

Commit runtime :
`7d0a38b94e60676b17eb9521c29f11018dff8456`

HEAD fonctionnel validé :
`cc1b6c729a9c96f929751db124783b4954a9169a`

Blob `index.html` :
- avant : `d942934741ca200319de02116c4dd384722d39c7` ;
- après : `286e427df42bc1a04cc981ecbdf90ecb4de547ab`.

Raccord appliqué :
- `assets/gensrpg/core/asset-resolver-v1.js` est chargé explicitement avant les anciens consommateurs Dungeon ;
- `dungeonAutoArtPath164()` délègue à `GensAssetResolverV1.dungeonCreaturePath()` ;
- le constructeur `artPath` du bloc V165 délègue au même propriétaire Core ;
- le constructeur `dungeonPath166` du bloc V166 délègue au même propriétaire Core ;
- `GENSRPG_DUNGEON_ASSET_ROOT_168` reste uniquement comme alias délégué à `GensAssetResolverV1.ROOTS.dungeon.creatures` ;
- le bloc `dungeonCore055ExactAssets` reste volontairement inchangé : il possède des assets UI exacts et n’appartient pas à ce sous-lot ;
- aucun asset physique déplacé ;
- aucun wrapper, observer, timer/retry, stockage ou gameplay ajouté ;
- les overrides personnalisés existants restent au-dessus du chemin canonique.

Cartographie réalignée :
- graphe production : 66 fichiers JS atteignables ;
- le resolver Core possède désormais un propriétaire runtime explicite `GenSrpG Core Assets` ;
- les 8 entrypoints Phase 3 restent inertes et hors production ;
- manifestes inline/timers/effets globaux/stockage/hors-graphe réalignés sans changer leurs dettes fonctionnelles ;
- le resolver n’ajoute aucun observer, timer, listener, stockage ou wrapper ; seule son API publique `GensAssetResolverV1` est exportée ;
- RED propriétaire obtenu avant correction : Architecture `35439183155`, échec au seul nouveau garde de raccord.

Validation sur `cc1b6c729a9c96f929751db124783b4954a9169a` :
- Architecture + navigateur complet `35439871786` — SUCCESS ;
- Firefox `35439871780` — SUCCESS ;
- Tactical Dock `35439871790` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Dungeon après Survie ;
- Builder Dungeon ;
- Config objet moderne ;
- fiche RPG sans flash Survie ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules ;
- preview ;
- parité réelle du resolver d’assets et priorité des overrides.

### Jalon B.3 — propriétaire chemins héros Dungeon — GREEN

Checkpoint de départ créé :
`checkpoint/gensrpg-phase4-asset-resolver-creature-paths-green-2026-09-19`
sur `88150851852f6e9e27e6c756a472cac3a58d1e1a`.

Caractérisation :
- `dungeonBuiltinHeroGithubArt168()` et `dungeonItems()` appartiennent au même gros script historique inline non identifié, pas au marqueur `dungeonHeroItemAssets168Marker` ;
- le marqueur bloc 33 reste seulement un alias de racine délégué ;
- ce sous-lot est limité aux héros ; les objets restent volontairement inchangés.

RED dédié :
- test `tests/gens_asset_resolver_hero_owner_v1.test.cjs` ;
- Architecture `35441301589` : échec uniquement sur la nouvelle étape d’autorité héros après succès des 82 étapes précédentes ;
- Firefox et Tactical Dock restent GREEN sur le même état RED.

Commits runtime :
- délégation héros : `a8e420df976a391e00438d7d6a2056fff46a48fe` ;
- ordre de chargement propriétaire : `8659cfeea3d07af6555ed5eef1e0cd628ef51a58`.

Blobs `index.html` :
- avant délégation héros : `286e427df42bc1a04cc981ecbdf90ecb4de547ab` ;
- après délégation : `04ca2b3803618694f8254e7b6a8fb103cfafa742` ;
- après raccord d’ordre de chargement : `ba47d9fb3b8aa1a2183e764455aae97e03965440`.

Raccord appliqué :
- `dungeonBuiltinHeroGithubArt168(id)` délègue maintenant à `GensAssetResolverV1.dungeonHeroPath(id)` ;
- la table héroïque historique dupliquée est retirée de ce helper ;
- `ensureDungeonHeroes()` conserve exactement la priorité existante `ov.avatar || githubArt || dungeonBuiltinPortrait(id)` ;
- le resolver Core est désormais chargé avant le gros script historique qui contient `dungeonBuiltinHeroGithubArt168()` et `dungeonItems()` ;
- l’ancien emplacement de chargement avant les blocs 30–32 est retiré, sans second chargement ;
- `dungeonItems()` et sa table `githubItemArts` ne sont pas modifiés ;
- aucun asset déplacé ;
- aucun gameplay, stockage, observer, timer/retry ou wrapper ajouté.

RED navigateur de load-order :
- Architecture + navigateur `35441536699` : statique GREEN, échec au vrai lancement Survie ;
- cause exacte : `dungeonBuiltinHeroGithubArt168()` était appelé avant le chargement du resolver, avec `GensAssetResolverV1 === undefined` ;
- Firefox `35441536658` et Tactical Dock `35441536713` restaient GREEN ;
- le garde statique `gens_asset_resolver_hero_owner_v1.test.cjs` verrouille désormais le chargement du Core avant le propriétaire historique héros/objets.

Validation finale du candidat sur `f7f7a2f456e2d3eb9f24bb910e7f8e6fc9cd08d0` :
- Architecture + navigateur complet `35441696020` — SUCCESS ;
- Firefox `35441695942` — SUCCESS ;
- Tactical Dock `35441695944` — SUCCESS.

Le navigateur complet valide notamment :
- isolation V114.11 ;
- lancement réel Survie ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet moderne ;
- fiche RPG ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Capture ;
- non-interférence quatre modules ;
- murs Tactical ;
- preview ;
- parité réelle du resolver d’assets.

Validation documentaire finale B.3 :
- HEAD `c4e32b99185b8908aa645ba7c6fcaf7a706fafbb` ;
- Architecture + navigateur complet `35446436225` — SUCCESS ;
- Firefox `35446436232` — SUCCESS ;
- Tactical Dock `35446436226` — SUCCESS.

Checkpoint B.3 créé :
`checkpoint/gensrpg-phase4-asset-resolver-hero-paths-green-2026-09-19`
sur `c4e32b99185b8908aa645ba7c6fcaf7a706fafbb`.

### Jalon B.4 — chemins objets built-in Dungeon — GREEN

Branche dédiée :
`work/gensrpg-phase4-asset-resolver-item-paths-2026-09-19`

Blob source exact `index.html` :
`ba47d9fb3b8aa1a2183e764455aae97e03965440`
(taille vérifiée localement : 8 175 684 octets).

Propriétaire réel :
- `dungeonItems()` dans le gros script historique héros/objets ;
- il possède encore une table locale `githubItemArts` de 13 objets ;
- il reconstruit encore `assets/dungeon/creatures/<fichier>` ;
- `GensAssetResolverV1.dungeonItemPath(id)` possède déjà la même table canonique dans le Core.

Invariant à préserver :
`image_data: ov.image_data || asset canonique || dungeonItemArt(...)`.

Périmètre B.4 :
- supprimer uniquement la table/concaténation d’asset dupliquée de `dungeonItems()` ;
- déléguer le chemin built-in à `GensAssetResolverV1.dungeonItemPath(it.id)` ;
- conserver la base gameplay des objets, les overrides, crop, équipements, loot et fallback SVG inchangés ;
- ne pas toucher au bloc 65, aux assets UI exacts ni déplacer de fichiers.

RED propriétaire B.4 :
- test `tests/gens_asset_resolver_item_owner_v1.test.cjs` ;
- Architecture `35446784367` : échec attendu uniquement sur l’étape 84 « autorité Core des chemins d’objets Dungeon » ;
- Firefox `35446784379` — SUCCESS ;
- Tactical Dock `35446784428` — SUCCESS.

Raccord runtime :
- commit `0e45d9659f99f03a8f3a52d631a21a6a6692421b` ;
- ancien blob `index.html` : `ba47d9fb3b8aa1a2183e764455aae97e03965440` ;
- nouveau blob : `388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9` ;
- table locale `githubItemArts` supprimée de `dungeonItems()` ;
- chemin built-in délégué à `GensAssetResolverV1.dungeonItemPath(it.id)` ;
- priorité conservée : `ov.image_data || canonicalArt || dungeonItemArt(...)` ;
- définitions gameplay, loot, crop, stockage et fallback généré inchangés ;
- workflow one-shot supprimé dans le même commit.

Cartographie :
- commit `f0a245a226953cb77254fff61c477bbb13ecdc5d` réaligne uniquement les quatre empreintes Phase 2 liées au blob ;
- le garde B.3 a été débarrassé de son ancienne assertion temporaire « objets encore historiques » au commit `1d40aabc13dc827fbd86166605570dc687a3a9f0` ; la responsabilité objets est désormais verrouillée par le garde B.4 dédié.

Validation finale du candidat `1d40aabc13dc827fbd86166605570dc687a3a9f0` :
- Architecture + navigateur complet `35446950829` — SUCCESS ;
- Firefox `35446950803` — SUCCESS ;
- Tactical Dock `35446950805` — SUCCESS.

Le navigateur Phase 4 confirme :
- chemins représentatifs longsword / potion / amulette inchangés ;
- override personnalisé ennemi toujours prioritaire ;
- override personnalisé objet toujours prioritaire ;
- Survie/Capture ne deviennent pas des fallbacks Dungeon ;
- non-interférence quatre modules, Save & Quit, authored, Builder, fiche RPG, murs et preview restent GREEN.

### Prochaine action

1. faire valider cette fermeture documentaire par Architecture + navigateur complet + Firefox + Tactical Dock ;
2. créer ensuite `checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19` sur le HEAD documentaire exact validé ;
3. depuis ce checkpoint, auditer le reste du lot assets contre la roadmap avant d’ouvrir un nouveau sous-lot ;
4. ne pas supposer que le bloc 65 doit être migré : confirmer d’abord s’il possède des assets UI exacts légitimes ou une résolution dupliquée ;
5. aucun changement de `main`.

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Chantier courant prioritaire — Fiche RPG / isolation Shell — 2026-09-19

Branche :
`work/gensrpg-rpg-sheet-shell-isolation-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-rpg-sheet-shell-isolation-2026-09-19`

Base exacte :
`7b8173f7ca949f4592cacd51610d1c11f953f829`

Dernier checkpoint GREEN :
`checkpoint/gensrpg-object-config-editor-green-2026-09-19`
sur le même SHA.

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

### Signalement utilisateur

En contexte RPG/Dungeon, à l'ouverture de la fiche personnage :
- une fiche ressemblant à la fiche Zombicide/Survie peut apparaître brièvement ;
- la fiche RPG correcte reprend ensuite l'affichage ;
- ce flash démontre qu'une ancienne autorité Survie/commune peut encore rendre avant le propriétaire RPG.

### Périmètre

Module concerné :
- Shell / fiche personnage en contexte Adventure RPG / Dungeon.

Responsabilité :
- ouverture et premier rendu de la fiche personnage ;
- choix du renderer selon le module actif.

Autorisé :
- caractériser le premier writer/renderer qui remplit ou affiche la fiche ;
- caractériser l'ordre réel des couches et événements ;
- retirer au propriétaire fautif son autorité en contexte RPG ;
- renforcer les sentinelles de frontière fiche Survie / fiche RPG.

Interdit :
- aucune modification des stats, progression, équipement, inventaire ou talents sauf preuve directe du propriétaire ;
- aucune modification Tactical ;
- aucune modification mouvement, coffre, événements ou détection ennemie ;
- aucun MutationObserver, heartbeat, polling, retry ou timer de réparation ;
- aucun second renderer de fiche ;
- aucune règle basée sur un simple délai d'affichage ;
- aucun changement sur `main`.

Propriétaire attendu par la charte :
- fiche personnage : Shell/module actif selon contexte, jamais Tactical.

### Résultat final — fiche RPG sans flash Survie

Correctif runtime propriétaire :
- commit `e105f9f0adad20bce43edae928f3412dfd61f1f7` ;
- fichier runtime : `index.html` ;
- ancien blob : `55453138449d07bde731ff6934acc442f56bae32` ;
- nouveau blob : `d942934741ca200319de02116c4dd384722d39c7` ;
- diff fonctionnel : **1 ligne**.

Correction :
- suppression du `setTimeout(...,0)` qui différait la préparation RPG au début de `render()` ;
- les propriétaires déjà existants `applyDungeonSheetIdentity()`, `renderDungeonHeroStats()`, `renderDungeonSkillTree()` et `updateDungeonSearchUi()` sont maintenant appelés synchroniquement ;
- aucune nouvelle fiche, aucun masque, aucun observer, aucun timer/retry ou renderer concurrent ajouté.

Preuve navigateur :
- le vrai bouton héros Dungeon appelle toujours le chemin natif `openChar()` ;
- à la sortie d'`openChar()`, le panneau `#zombicideSkillPanel` est déjà masqué ;
- `raf1` et `raf2` ne montrent jamais le panneau Survie/Zombicide ;
- les onglets Dungeon sont présents dans l'état final.

HEAD propre validé après retrait des workflows one-shot :
`86fe1c4b9c05359d668e48637bd4d7aa6a3d8e7a`

Validation :
- Architecture + navigateur complet `35433350018` — SUCCESS ;
- Firefox `35433350007` — SUCCESS ;
- Tactical Dock `35433350015` — SUCCESS.

Aucun changement sur `main`.

### Coordination après ce lot

Agent 1 travaille séparément sur :
- déclenchement tardif coffre après déplacement ;
- détection / ligne de vue ennemie après déplacement.

Ne pas ouvrir en parallèle un lot performance déplacement tant que ce diagnostic touche potentiellement le même propriétaire de fin de mouvement.

Prochaine action locale :
1. fermer ce lot avec checkpoint GREEN ;
2. attendre le résultat propriétaire d'Agent 1 avant tout chantier touchant la fin de mouvement ;
3. conserver la dette performance déplacement séparée et non modifiée.

### Diagnostic navigateur confirmé — flash Survie dans la fiche RPG

Sentinelle :
`tests/gens_rpg_sheet_survival_flash_browser_v11411.test.cjs`

Commit de caractérisation :
`edf99d16285d9a0dd7f7d8facdf188b56865bee6`

Résultat :
- le vrai bouton `#dc01Heroes .dc01Hero` ouvre la fiche par la fonction native `openChar()` ;
- `openChar()` rend `#sheet` visible immédiatement ;
- à la sortie de `openChar()`, en contexte `adventure` + profil `game_profile_dungeon_demo`, `#zombicideSkillPanel` reste visible alors que `#dungeonSheetTabs` est encore masqué ;
- cet état reste visible pendant plusieurs frames ;
- `renderDungeonAttributes()` n'arrive qu'environ 230 ms plus tard ;
- `renderDungeonHeroStats()` puis `renderDungeonSkillTree()` arrivent ensuite ;
- `renderDungeonSkillTree()` finit par masquer `#zombicideSkillPanel` ;
- `applyDungeonSheetTabs()` arrive environ 525 ms après l'entrée dans `openChar()` et installe finalement l'état RPG attendu.

Cartographie Phase 2 :
- dernier propriétaire global de `openChar` : bloc inline `dungeonCore028HeroExploreGuard` ;
- ordre inline : 38 ;
- domaine déclaré : Dungeon.

Modules externes contrôlés :
- `gens-rpg-stats-clean-167874.js` : décorateur/normalisation stats, ne possède pas l'ouverture de fiche ;
- `gens-stat-upgrade-policy-167898.js` : décorateur de progression/stat, ne possède pas `openChar` ;
- `gens-dungeon-hero-art-repair-167874.js` : réparation visuelle hors propriétaire de fiche ;
- `gens-hero-editor-dynamic-167897.js` : éditeur/décoration différée ;
- `gens-dungeon-ui-cleanup-1678100.js` : wrappe `openChar` uniquement pour programmer son nettoyage UI, sans installer l'état RPG ;
- les couches art de fiche V99/V102 sont déjà retirées/inertes selon les sentinelles existantes.

Conclusion :
- le flash utilisateur est reproduit et expliqué ;
- la correction doit viser le propriétaire inline natif de l'ouverture/visibilité de fiche, pas ajouter une couche de masquage externe ;
- aucun correctif runtime ne doit être écrit sans inspection du `index.html` exact.

### Correctif propriétaire appliqué — candidat à valider

Fichier exact fourni par l'utilisateur et vérifié :
- taille : `8 175 835` octets ;
- blob Git attendu/reçu : `55453138449d07bde731ff6934acc442f56bae32`.

Diagnostic confirmé dans `index.html` :
- `openChar()` rend `#sheet` visible avant le premier rendu ;
- `render()` différéait l'identité Dungeon avec `setTimeout(...,0)` ;
- pendant ce délai, le panneau `#zombicideSkillPanel` restait visible ;
- `renderDungeonSkillTree()` et `applyDungeonSheetTabs()` reprenaient ensuite l'autorité.

Correctif runtime :
- commit `e105f9f0adad20bce43edae928f3412dfd61f1f7` ;
- ancien blob `index.html` : `55453138449d07bde731ff6934acc442f56bae32` ;
- nouveau blob `index.html` : `d942934741ca200319de02116c4dd384722d39c7` ;
- changement fonctionnel : suppression du `setTimeout(...,0)` qui retardait l'identité RPG dans le propriétaire natif `render()` ;
- les mêmes fonctions existantes `applyDungeonSheetIdentity()`, `renderDungeonHeroStats()`, `renderDungeonSkillTree()` et `updateDungeonSearchUi()` sont appelées synchroniquement ;
- aucun nouveau renderer, masque, observer, wrapper, timer/retry, stockage ou règle de gameplay ajouté ;
- workflow one-shot supprimé dans le même commit.

Effet attendu :
- le même appel `openChar()` conserve l'ouverture de la fiche ;
- avant le premier paint, le renderer propriétaire a déjà masqué l'état Zombicide et posé l'identité Dungeon ;
- aucune autorité externe n'est ajoutée.

Validation automatique obtenue :
- HEAD candidat : `d35be1bd200aa17ba172d8cf8a8790790db7f2e9` ;
- Architecture + navigateur complet `35432531222` — SUCCESS ;
- Firefox `35432531231` — SUCCESS ;
- Tactical Dock `35432531226` — SUCCESS ;
- sentinelle `gens_rpg_sheet_survival_flash_browser_v11411.test.cjs` — SUCCESS ;
- Dungeon après Survie — SUCCESS ;
- Config objet — SUCCESS ;
- cache / retour / pièges authored — SUCCESS ;
- Save & Quit / reprise — SUCCESS ;
- Capture courant + composition complète — SUCCESS ;
- PvP — SUCCESS ;
- non-interférence quatre modules — SUCCESS ;
- murs / preview — SUCCESS.

Précision sur la sentinelle :
- le premier RED après correction venait de snapshots injectés au milieu du même appel JavaScript synchrone ;
- ces états internes ne peuvent pas être peints par le navigateur ;
- la sentinelle vérifie désormais les frontières réellement visibles : sortie de clic, `requestAnimationFrame` 1/2, `setTimeout(0)` et état final ;
- le panneau `#zombicideSkillPanel` est déjà masqué à chacune de ces frontières ;
- `openChar()` finit lui-même avec le panneau Zombicide masqué.

État :
- candidat automatiquement GREEN ;
- test utilisateur manuel requis avant checkpoint final ;
- aucun merge sur `main`.

### Règle 26 déclenchée

Le contenu exact de `index.html` est maintenant nécessaire pour inspecter le bloc `dungeonCore028HeroExploreGuard` et la chaîne native `openChar -> rendu Dungeon`.

SHA exact demandé :
`edf99d16285d9a0dd7f7d8facdf188b56865bee6`

Permalink :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/edf99d16285d9a0dd7f7d8facdf188b56865bee6/index.html`

Le fichier reçu doit être vérifié avant toute modification.
Aucun ancien `index.html` local ne doit être utilisé.

### Diagnostic obligatoire avant correction

1. traverser le vrai Shell vers Adventure -> Dungeon ;
2. ouvrir une vraie fiche héros ;
3. observer le DOM immédiatement au clic puis sur plusieurs frames ;
4. identifier les marqueurs Survie/Zombicide éventuellement présents avant le rendu RPG ;
5. identifier la fonction/fichier qui écrit ces marqueurs en premier ;
6. vérifier overlays, z-index, display, pointer-events et listeners avant toute réécriture ;
7. corriger uniquement l'autorité démontrée.

### Tests requis

- sentinelle navigateur du vrai chemin Dungeon -> fiche héros ;
- assertion qu'aucun marqueur exclusivement Survie/Zombicide n'apparaît, même transitoirement ;
- fiche RPG finale correcte ;
- ouverture/fermeture/réouverture stable ;
- Survie conserve sa propre fiche ;
- Save & Quit / reprise ;
- non-interférence quatre modules ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

### Règle 26

Si le diagnostic prouve que le premier renderer fautif est inline dans `index.html`, ne pas tenter de lire/modifier le gros HTML par répétition de connecteurs.
Résoudre le SHA exact, fournir le permalink `index.html` correspondant à l'utilisateur et demander le ZIP du fichier exact avant toute inspection/modification de contenu.

### Dettes suivantes, hors périmètre

1. déclenchement coffre / détection ennemie tardif ou absent ;
2. ralentissement entre déplacements.

## État opérationnel prioritaire — 2026-09-19

Ce bloc prime sur les sections historiques conservées plus bas.

### Lot Config objet — validation fonctionnelle terminée

Branche :
`work/gensrpg-object-config-editor-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-object-config-editor-2026-09-19`

Base exacte :
`3b7aba98d6d3bb87168a1853383c5c8093974a54`

HEAD fonctionnel validé :
`e4c3ec4e3a6fc205274ffa6ae9b41651e8e04cc1`

Corrections propriétaires validées :
- la variante par zone passe par le seul `DungeonRoomVisualConfig167826.openEditor()` public décoré par l'UI moderne ;
- l'état visuel « configuré » vient du même contenu persisté via `configured:true`, jamais d'un état UI temporaire ;
- une ancienne copie automatique V16.78.44 portant `templateLinked:true` est migrée une seule fois vers `inherit` par le propriétaire `DungeonZoneContent167824` ;
- une vraie variante de zone explicitement détachée reste indépendante et n'est jamais migrée ;
- sur tactile, `DungeonRoomGridCapture167830` bloque la peinture au contact mais n'ouvre la fiche qu'après la fin du geste ; le même appui ne peut plus tomber sur « Annuler » ;
- sur une case de coffre authored exact, l'action exacte reste l'autorité ; l'ancien contrôle générique ne doit pas masquer le contenu configuré.

Preuve navigateur réelle :
- ancien coffre V44 `common` / vide injecté comme copie `fixed + templateLinked:true` ;
- reconfiguration du modèle ;
- migration de la zone vers `inherit` ;
- contenu effectif repris depuis le modèle ;
- coffre effectif avec rareté/or/objets configurés ;
- geste tactile complet validé ;
- couleur persistante après fermeture/réouverture.

Validation CI sur `e4c3ec4e3a6fc205274ffa6ae9b41651e8e04cc1` :
- Architecture + navigateur complet `35429554196` — SUCCESS ;
- Firefox `35429554183` — SUCCESS ;
- Tactical Dock `35429554188` — SUCCESS.

Validation utilisateur :
- l'utilisateur a confirmé qu'une nouvelle pièce fonctionne ;
- l'utilisateur a confirmé que le défaut `common` / coffre vide concerne les anciennes salles déjà créées ;
- poursuite du développement autorisée le 2026-09-19.

### Dettes séparées conservées

Ne pas mélanger avec Config objet :
1. flash bref d'une fiche personnage Zombicide/Survie en contexte RPG — prochain lot prioritaire ;
2. déclenchement coffre / ligne de vue ennemie parfois tardif ou absent — lot événementiel séparé après la fiche ;
3. ralentissement entre déplacements — lot performance séparé.

### Prochaine action

1. valider ce commit documentaire ;
2. créer `checkpoint/gensrpg-object-config-editor-green-2026-09-19` sur le HEAD documentaire GREEN ;
3. créer `checkpoint/gensrpg-start-rpg-sheet-shell-isolation-2026-09-19` sur ce même SHA ;
4. ouvrir `work/gensrpg-rpg-sheet-shell-isolation-2026-09-19` ;
5. caractériser le premier renderer qui affiche une fiche Survie/Zombicide avant la fiche RPG ;
6. retirer cette autorité uniquement dans le contexte RPG ;
7. aucune modification de stats, inventaire, Tactical, déplacement ou gameplay sans preuve ;
8. si le propriétaire exact exige l'inspection de `index.html`, appliquer immédiatement la règle 26.

## Dernier checkpoint vert

Phase 2 — cartographie runtime complète GREEN :
`checkpoint/gensrpg-phase2-runtime-cartography-complete-green-2026-09-18`

SHA :
`557cc86681053c389ac85c43be87d130586cf502`

Validation finale :
- Architecture `35353714007` — SUCCESS ;
- navigateur complet dans ce run — SUCCESS ;
- Firefox `35353713978` — SUCCESS ;
- Tactical Dock `35353713979` — SUCCESS.

## Chantier courant

**Phase 3 — créer l'arborescence cible et les contrats sans déplacer le gameplay**

Branche :
`work/gensrpg-phase3-target-structure-contracts-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase3-target-structure-contracts-2026-09-18`

Base exacte :
`557cc86681053c389ac85c43be87d130586cf502`

## Périmètre actif Phase 3

Module concerné :
- architecture physique GenSrpG uniquement ;
- aucun runtime Survie/Dungeon/Tactical/Capture/PvP n'est déplacé dans ce premier lot.

Propriétaire du lot :
- structure/contrats de modules ;
- aucun nouveau propriétaire runtime actif.

Systèmes existants réutilisés comme autorité :
- cartographie Phase 2 des 65 fichiers externes atteignables ;
- cartographie des 130 blocs inline ;
- load graph Pages actuel ;
- sentinelles Phase 1/2 existantes.

Objectif :
- matérialiser les dossiers cibles `core/`, `shell/`, `survival/`, `dungeon/`, `tactical/`, `capture/`, `pvp/`, `builders/` ;
- préparer des contrats / points d'entrée **inertes** ;
- ne rien raccorder à la production dans ce premier lot ;
- préparer les extractions Phase 4 sans créer une deuxième autorité.

Interdictions :
- aucun changement de `index.html` ;
- aucun changement du load graph GitHub Pages / `preview.html` ;
- aucun déplacement ou copie de gameplay actif ;
- aucun auto-install ;
- aucun wrapper global ;
- aucun `MutationObserver`, timer/retry, listener global ou accès stockage dans les nouveaux points d'entrée ;
- aucun changement de règle, stat, dé, combat, navigation, sauvegarde, asset ou cache PWA ;
- aucune correction de la dette « détection ennemie hors embuscade » ;
- aucun changement sur `main`.

Fonctions / systèmes protégés :
- Shell : `openGensFamily`, `openGensBuiltInGame`, `startConfiguredGame`, `resumeGame` ;
- UI native / fiche héros ;
- stats, dés, calcul de touche, dégâts, armure, résistances ;
- inventaire / équipement / sets ;
- Save & Quit / reprise / stockage ;
- mouvement Dungeon ;
- entrée/sortie Tactical ;
- Capture ;
- PvP ;
- composition Pages et service worker.

Tests prévus :
1. vérifier l'existence des huit domaines cibles ;
2. vérifier que chaque nouveau point d'entrée est inerte et sans effet global ;
3. vérifier qu'aucun nouveau point d'entrée n'est chargé par `index.html`, `preview.html`, `.github/workflows/main.yml` ou RuntimeBootstrap ;
4. vérifier que les 65 fichiers externes du graphe production restent exactement inchangés ;
5. conserver toutes les sentinelles Architecture ;
6. navigateur complet ;
7. Firefox ;
8. Tactical Dock.

Risques :
- introduire accidentellement un second bootstrap ;
- faire entrer un squelette Phase 3 dans le runtime production ;
- créer un contrat qui empiète sur un propriétaire existant ;
- traiter trop tôt un service Phase 4.

Critère de sortie :
- structure cible matérialisée ;
- contrats/entrypoints inertes documentés et testés ;
- graphe runtime production inchangé ;
- aucun gameplay déplacé ;
- toute la CI reste GREEN ;
- checkpoint GREEN Phase 3 créé avant Phase 4.

## Prochaine action

1. créer les points d'entrée/contrats inertes des huit domaines ;
2. ajouter une sentinelle de structure et de non-chargement ;
3. vérifier le diff : aucun runtime existant modifié ;
4. relancer la CI complète ;
5. seulement après GREEN, fermer Phase 3.

## Historique — défauts fonctionnels découverts pendant la cartographie

Le correctif Capture précédent a supprimé la récursion du bloc 030.

Le défaut courant appartient désormais au propriétaire Core Stats :
`assets/gensrpg/gens-rpg-stats-clean-167874.js -> saveProfile(p)`.

Quand le profil actif est Base et que `p` est Dungeon, `saveProfile(p)` mélange `p.id` et l'ID actif dans la même recherche. Il trouve Base avant Dungeon et remplace donc Base par Dungeon.

Chaîne récursive prouvée :

```text
refreshCustomEquipmentIntoItems
→ gensCurrentContentFamily
→ getActiveGameProfile
→ loadGameProfiles
→ ensureBaseGameProfile
→ captureCurrentGameProfile(game_profile_zombicide_base)
→ currentAllHeroIds
→ applyCustomHeroesMulti
→ gensContentCompatible(hero)
→ gensCurrentContentFamily
→ ...
```

Le profil Capture et son dresseur sont seedés avant que le bootstrap canonique Base/Dungeon soit garanti. Le refresh équipement provoque alors une réentrée de `ensureBaseGameProfile()` avant sa persistance.

Preuve :
- commit caractérisation `8c25a0940374ff36ff6754a8bd4aa4d59cf51afb` ;
- 80 appels récursifs tracés ;
- watchdog avant retour de `refreshCustomEquipmentIntoItems()`.

## Périmètre du lot

Autorisé :
- corriger uniquement l'ordre/bootstrap des profils lié à `builtinMonsterCapture162` ;
- réutiliser le propriétaire canonique existant des profils ;
- conserver strictement les données et règles Capture actuelles ;
- adapter le test de caractérisation en sentinelle de non-récursion si nécessaire.

Interdit :
- aucun changement de gameplay Capture ;
- aucun nouveau système de profils ;
- aucun wrapper global ;
- aucun observer ;
- aucun timer/retry supplémentaire ;
- aucune correction de la dette de détection ennemie ;
- aucun changement sur `main`.

## Source index.html

Copie locale exacte déjà fournie et vérifiée :
- SHA de référence runtime : `95db8780eeecdd33a662fbe99c260ecec2cb24a0` ;
- blob `index.html` : `a515c3d34a1f5c4973159457090e4437a33c2630` ;
- taille : 8 175 610 octets.

Depuis ce SHA, les commits de cartographie ont modifié uniquement tests/docs. Le runtime `index.html` du checkpoint de départ est donc identique à cette copie vérifiée.

## Correctif minimal visé

Hypothèse à valider par test après modification :
- dans le seed profil de `ensureBuiltinMonsterCapture162()`, utiliser le chargeur canonique `loadGameProfiles()` au lieu du chargeur brut `loadGameProfilesRaw()` ;
- ainsi Base/Dungeon sont initialisés avant l'enregistrement du dresseur Capture et avant le refresh qui consulte la famille active.

Aucune autre modification runtime n'est autorisée tant que ce correctif minimal n'a pas été testé.

## Tests obligatoires

- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Critère de sortie

- plus aucune récursion au boot Capture à froid ;
- le scénario Pages complet atteint ses assertions gameplay ;
- toutes les sentinelles obligatoires restent GREEN ;
- checkpoint GREEN créé seulement après validation ;
- aucune fusion sur `main`.

## Résultat du correctif Capture

Correctif runtime appliqué :
- commit `e7701e47ff6e44c61f53d62c9d7464b540da49c6` ;
- diff runtime : **1 ligne** dans `builtinMonsterCapture162` ;
- `loadGameProfilesRaw()` -> `loadGameProfiles()`.

Effet confirmé :
- la récursion initiale du bloc 030 a disparu ;
- le boot traverse désormais les 119 blocs inline et atteint les modules Pages externes ;
- les gardes Architecture restent GREEN ;
- Firefox et Tactical Dock restent GREEN sur les commits de caractérisation.

## Nouveau défaut indépendant découvert

Le boot complet bloque ensuite dans le callback `DOMContentLoaded` du propriétaire Core Stats :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Trace prouvée :
1. stockage avant Stats : `Base, Dungeon, Capture` ;
2. `currentRpgProfile()` choisit le profil Dungeon alors que le profil actif reste Base ;
3. `saveProfile(p)` construit une liste d'identifiants contenant à la fois `p.id` (Dungeon) et `activeGameProfileId()` (Base) ;
4. `findIndex()` trouve donc Base en premier ;
5. le profil Dungeon remplace Base ;
6. stockage après sauvegarde : `Dungeon, Dungeon, Capture` ;
7. `loadGameProfiles()` tente alors de recréer Base via `ensureBaseGameProfile()` et retombe dans une récursion.

Preuve de caractérisation :
- commit test `ff7dcf501087bde42315eac18a529ae993c23c0e` ;
- trace stockage : `game_profile_zombicide_base,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9` puis `game_profile_dungeon_demo,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9`.

## Décision de périmètre

Ce défaut appartient au propriétaire **Core Stats / persistance de profil**, pas à `builtinMonsterCapture162`.

Conformément à la charte :
- ne pas élargir ce lot Capture ;
- conserver le correctif Capture d'une ligne ;
- ouvrir un chantier dédié pour `saveProfile(p)` du Core Stats ;
- aucun wrapper/observer/timer de réparation.

## Prochain chantier

**Correctif dédié — Core Stats saveProfile doit remplacer uniquement le profil demandé.**

Correctif attendu :
- `p.id` doit être l'autorité primaire pour le remplacement ;
- l'identifiant actif ne peut servir de fallback que si `p.id` est absent/non exploitable ;
- ne jamais écraser Base lorsqu'on sauvegarde Dungeon, ni l'inverse.

Tests obligatoires :
- reproduction directe Base actif + sauvegarde Dungeon ;
- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Prochaine action

1. créer le checkpoint de départ sur le SHA documentaire courant ;
2. créer une branche Core Stats dédiée ;
3. corriger `saveProfile(p)` au propriétaire ;
4. transformer la caractérisation en test de régression ciblé ;
5. relancer toute la CI avant tout checkpoint GREEN.

## Dette séparée

La détection ennemie hors embuscade reste un chantier de caractérisation fonctionnelle distinct ; elle n'est pas corrigée dans cette cartographie.


## Mise à jour opérationnelle — Core Stats validé, routage Capture à isoler

Correctif Core Stats :
- runtime `cf64814122e45ae1815a6ea8cf853043757acf0b` ;
- test de propriété de profil `535be759dc550c0c4768fd1c487e371046259d2d` ;
- `saveProfile(p)` remplace désormais prioritairement le profil portant `p.id`.

CI sur `535be759dc550c0c4768fd1c487e371046259d2d` :
- Architecture statique : SUCCESS ;
- Firefox : SUCCESS ;
- Tactical Dock : SUCCESS ;
- navigateur Pages complet : atteint désormais le lancement final Capture puis échoue sur un défaut ultérieur indépendant.

Le stockage reste correctement `Base, Dungeon, Capture` après l'installation Core Stats : la récursion de profils est supprimée.

Nouveau défaut caractérisé :
- contexte juste avant lancement : mode `capture`, famille `creature`, profil Capture actif ;
- `isDungeonMode() === true` reste attendu car Capture utilise le substrat Dungeon ;
- après `startConfiguredGame()` : `DungeonCore01` est affiché et `captureGameHub` reste masqué ;
- la couche tardive `dungeonCore200Rebuild` route actuellement tout `isDungeonMode()` vers son `start()`, ce qui intercepte Capture avant la chaîne dédiée de `captureFix139`.

Décision :
- ne pas élargir le lot Core Stats ;
- ouvrir un lot séparé de routage Capture/Dungeon ;
- ne pas modifier globalement `isDungeonMode()` ;
- ne pas recréer un chemin Capture ;
- corriger uniquement le guard du propriétaire tardif après caractérisation.

Prochaine action :
1. checkpoint de départ ;
2. branche dédiée routage Capture/Dungeon ;
3. test ciblé du guard final ;
4. correctif minimal ;
5. CI complète.


## Mise à jour opérationnelle — routage Capture/Dungeon GREEN

Lot dédié :
- branche : `work/gensrpg-capture-start-routing-2026-09-18` ;
- checkpoint de départ : `checkpoint/gensrpg-start-capture-dungeon-routing-2026-09-18` ;
- base du lot : `b15567342c1fbdeb33a7559187c3670ba3e184de`.

Correctif runtime :
- commit : `b601f507cab884c9a427cf523bf671d53fb075bb` ;
- propriétaire modifié : `dungeonCore200Rebuild` ;
- diff runtime : **1 ligne** dans `index.html` ;
- l'interception finale conserve Dungeon, mais délègue Capture à la chaîne dédiée `captureFix139` ;
- aucun changement global de `isDungeonMode()` ;
- aucun wrapper, observer, timer ou retry ajouté ;
- blob final `index.html` : `3a3db76d12ae511f6293e8ff25d124616731a08b`.

Sentinelles :
- test ciblé du propriétaire : `tests/gens_capture_start_routing_owner_v11411.test.cjs` ;
- inventaire Phase 2 mis à jour pour verrouiller « Dungeon oui / Capture non » ;
- sentinelle Save & Quit mise à jour avec le même contrat, sans modification du scénario navigateur.

Validation finale sur `301f2f814e35648bed22fe4fb0dd6580c5e68d80` :
- Architecture `35346984569` — SUCCESS ;
- navigateur Pages complet dans ce run — SUCCESS ;
- Firefox `35346984602` — SUCCESS ;
- Tactical Dock `35346984616` — SUCCESS.

Le navigateur complet valide désormais successivement :
- UI native ;
- Survie ;
- Save & Quit / reprise Dungeon ;
- PvP ;
- Monster Capture courant ;
- composition Pages complète Capture ;
- non-interférence des quatre modules ;
- rendu/preview navigateur prévus par la sentinelle.

Conclusion :
- la récursion initiale Capture est corrigée ;
- l'écrasement Base/Dungeon par Core Stats est corrigé ;
- le détournement final Capture vers Dungeon est corrigé ;
- les trois défauts fonctionnels découverts pendant la cartographie ont été traités dans des lots dédiés ;
- `main` reste gelé sur V16.78.114.11 `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Prochaine action après checkpoint GREEN

1. créer le checkpoint GREEN du lot routage Capture/Dungeon ;
2. repartir de ce checkpoint sur une branche neuve de poursuite Phase 2 ;
3. reprendre la cartographie runtime au point où la composition Pages complète était bloquée ;
4. conserver la dette « détection ennemie hors embuscade » dans un chantier fonctionnel séparé ;
5. ne rien fusionner sur `main` tant que la restructuration n'a pas atteint le jalon prévu par la roadmap.


## Reprise Phase 2 après correctifs GREEN

Les trois défauts qui bloquaient la composition Pages complète sont maintenant corrigés dans des lots séparés et validés :
- bootstrap à froid Capture ;
- persistance Core Stats Base/Dungeon ;
- routage final Capture/Dungeon.

La composition Pages complète est GREEN. La Phase 2 peut donc reprendre depuis le checkpoint :
`checkpoint/gensrpg-capture-start-routing-green-2026-09-18`.

Prochaine action opérationnelle :
1. inspecter le manifeste `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` ;
2. compléter l'inventaire de responsabilité des 120 blocs inline exécutables ;
3. renforcer les sentinelles de propriétaire sans toucher au runtime ;
4. mettre à jour `docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md` au fur et à mesure.


## Clôture opérationnelle Phase 2 — validation finale en cours

La cartographie réelle du runtime est complète.

Branche :
`work/gensrpg-phase2-runtime-cartography-resume-2026-09-18`

Base sûre du lot :
`checkpoint/gensrpg-capture-start-routing-green-2026-09-18`
SHA `8ce4f4cfec785aa48ca81942629a60589461090f`.

Le lot de reprise Phase 2 ne modifie **aucun fichier runtime** depuis cette base : uniquement docs, tests et workflow de sentinelles.

Livrables finaux :
- `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` — 65 fichiers externes atteignables ;
- `docs/GENSRPG_PHASE2_INLINE_OWNERS.json` — 130 blocs inline / 120 actifs / 10 désactivés ;
- `docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv` — 438 globals / 773 affectations / 123 multi-propriétaires ;
- `docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json` ;
- `docs/GENSRPG_PHASE2_STORAGE_OWNERS.json` ;
- `docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json` ;
- `docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json` ;
- `docs/GENSRPG_PHASE2_EXTRACTION_READINESS.md`.

Résultats principaux :
- timers externes : 148 `setTimeout`, 1 `setInterval` ;
- timers inline actifs : 146 `setTimeout`, 1 `setInterval` ;
- stockage direct : 221 accès, 147 résolus, 30 clés/familles, 74 dynamiques ;
- 7 fichiers physiques hors graphe : 4 tests/docs uniquement, 3 cache/workflows historiques non exécutés ;
- 16 hotspots de responsabilités stratifiées ;
- arborescence Phase 3 encore largement absente : ne pas prétendre qu'elle est déjà construite.

Dernier HEAD fonctionnellement validé avant les deux commits documentaires de fermeture :
`a58eab3d60357c7739d5ee03c1aa8887b07ee97b`

CI de référence :
- Architecture `35353401883` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35353401955` — SUCCESS ;
- Tactical Dock `35353402052` — SUCCESS.

Les commits documentaires de fermeture doivent repasser par la CI avant création du checkpoint GREEN final Phase 2.

### Prochaine action après validation documentaire

1. créer `checkpoint/gensrpg-phase2-runtime-cartography-complete-green-2026-09-18` sur le HEAD documentaire final validé ;
2. créer une branche neuve Phase 3 depuis ce checkpoint ;
3. mettre à jour ce fichier sur la branche Phase 3 avec le nouveau chantier ;
4. Phase 3 premier lot : structure + contrats + points d'entrée inertes uniquement ;
5. ne pas modifier le load graph production et ne déplacer aucun gameplay dans ce premier lot ;
6. ne rien fusionner sur `main`.

La dette « détection ennemie hors embuscade » reste un chantier fonctionnel séparé.


## Clôture Phase 3 — structure cible GREEN

Résultat du chantier :
- huit domaines cibles matérialisés ;
- huit `entry-v1.js` inertes ;
- huit `module-contract-v1.json` déclaratifs ;
- aucun placeholder chargé en production ;
- aucun runtime existant modifié ;
- aucun gameplay déplacé.

HEAD fonctionnel validé avant documentation finale :
`6efbf37786902bc96a5d0fffc56fbf78291a423b`

Validation :
- Architecture `35354649449` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35354649407` — SUCCESS ;
- Tactical Dock `35354649374` — SUCCESS.

Document de clôture :
`docs/GENSRPG_PHASE3_TARGET_STRUCTURE.md`

Validation documentaire finale :
- HEAD `a613fde6d67f20c9b75564faa1f416d98611f12a` ;
- Architecture `35354985029` — SUCCESS ;
- navigateur complet du même run — SUCCESS ;
- Firefox `35354985012` — SUCCESS ;
- Tactical Dock `35354985051` — SUCCESS.

### Prochaine action

1. créer `checkpoint/gensrpg-phase3-target-structure-green-2026-09-18` sur le HEAD documentaire final validé ;
2. ouvrir une branche Phase 4 dédiée au resolver d'assets depuis ce checkpoint ;
3. appliquer la règle 26 si le contenu exact de `index.html` est requis ;
4. ne rien fusionner sur `main`.

## Chantier correctif isolé — Dungeon Builder invisible dans l'éditeur Dungeon

Ce lot repart volontairement du dernier checkpoint Phase 3 entièrement GREEN afin de ne pas dépendre du lot Dungeon après Survie encore non clôturé.

Branche :
`work/gensrpg-dungeon-builder-visibility-clean-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-dungeon-builder-visibility-clean-2026-09-18`

Base exacte :
`080a45a904590a2b24a2cbc87b9c270913f427e6`
(`checkpoint/gensrpg-phase3-target-structure-green-2026-09-18`)

Production sûre inchangée :
- `main` : V16.78.114.11 ;
- SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Régression caractérisée

Le World Builder n'a pas été supprimé :
- `assets/dungeon/dungeon-world-builder-167821.js` reste le propriétaire du Builder ;
- `#drc300Launch` est créé dans `#drc100Launcher` ;
- `assets/dungeon/dungeon-room-creator-100.js` reste propriétaire de `#drc100Launcher`.

Cause historique exacte :
- commit d'introduction : `d2f102a7be11094cb89b488732e40c8c51cf9e5a` (V16.78.111) ;
- `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` a ajouté `#drc100Launcher` et `[data-drc100-launcher]` à `TAB_SELECTORS` ;
- `hideRuntimeTabs()` peut donc appliquer `display:none!important` au conteneur structurel du Builder ;
- ce fichier est cartographié Phase 2 comme `Tactical Historical Layer`, alors que le World Builder appartient au domaine `Dungeon Builders`.

### Périmètre déclaré

Autorisé :
- retirer uniquement l'autorité V111 sur le launcher structurel Builder/Room Creator ;
- ajouter une sentinelle owner-level ;
- ajouter une sentinelle navigateur du vrai chemin Éditeurs -> Dungeon -> Builder ;
- brancher la sentinelle à Architecture.

Interdit :
- modifier le World Builder ou le Room Creator ;
- modifier le Shell, `index.html`, la navigation, le mouvement, le stockage ou le gameplay ;
- ajouter wrapper, observer, timer/retry ou second launcher ;
- toucher au lot Dungeon après Survie.

### Tests requis

1. V111 ne doit plus écrire `display` ni `data-v111-hidden-tab` sur `#drc100Launcher` ;
2. les contrôles legacy runtime V111 peuvent continuer à être masqués pendant le runtime ;
3. vrai chemin navigateur Éditeurs -> Dungeon : Room Creator visible ;
4. vrai chemin navigateur Éditeurs -> Dungeon : bouton « CONSTRUIRE UN DONJON » visible ;
5. ouverture réelle de `#drc300Modal` ;
6. Architecture / navigateur complet ;
7. Firefox ;
8. Tactical Dock ;
9. aucune publication sur `main` avant GREEN.

### Prochaine action

Appliquer un correctif soustractif dans V111 uniquement, puis lancer les sentinelles.

### Audit de conformité charte — lot Builder isolé

Contrôle effectué après rappel utilisateur :
- le premier changement responsable est identifié : `d2f102a7be11094cb89b488732e40c8c51cf9e5a` (V16.78.111), qui introduit l'autorité Tactical sur `#drc100Launcher` ;
- le défaut est déjà présent dans le checkpoint Phase 3 GREEN `080a45a904590a2b24a2cbc87b9c270913f427e6` et dans `main` V16.78.114.11 ;
- le lot Builder précédent basé sur `deb87df...` est abandonné comme base de validation car il héritait du lot Dungeon-après-Survie non encore clôturé GREEN ;
- le présent lot repart de Phase 3 GREEN avec checkpoint propre avant toute modification runtime ;
- le correctif `a209e74a1a96abd6a8bfbb6351ebe3beb7475900` est soustractif : V111 perd uniquement les sélecteurs structurels Builder/Room Creator ;
- aucun nouveau launcher, wrapper, observer, timer, retry, système de navigation ou stockage n'est ajouté ;
- `index.html`, World Builder, Room Creator, Shell, mouvement, persistance et gameplay restent inchangés ;
- le vrai chemin navigateur Éditeurs -> Dungeon -> Builder est couvert par une sentinelle dédiée ;
- le test historique V111 verrouille désormais la frontière : Tactical ne peut plus écrire la visibilité du launcher Builder.

Diff depuis le checkpoint de départ :
- runtime : 1 fichier V111, 1 ligne d'autorité retirée + commentaire ajusté ;
- tests : 1 sentinelle navigateur ajoutée, 1 sentinelle V111 renforcée ;
- CI : 1 étape navigateur ajoutée ;
- documentation uniquement en complément.

État CI au moment de l'audit :
- base Phase 3 GREEN : Firefox et Tactical Dock repassés SUCCESS ;
- HEAD correctif `a209e74...` : Architecture en cours, Firefox/Tactical Dock en attente ;
- aucun checkpoint GREEN final ne doit être créé avant succès des trois validations requises et test utilisateur ciblé.

## Lot d'intégration — Builder GREEN + correction Dungeon après Survie

Objectif : réunir proprement deux corrections déjà caractérisées séparément avant d'ouvrir le chantier authored-runtime caches/pièges.

Branche :
`work/gensrpg-dungeon-integrated-fixes-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-dungeon-integrated-fixes-2026-09-18`

Base exacte :
`4f38720de29edb255f498d28b9e7013d181a0313`
(`checkpoint/gensrpg-dungeon-builder-visibility-green-2026-09-18`)

### Correctifs à intégrer

1. Builder GREEN déjà présent dans la base :
- Tactical V111 ne possède plus `#drc100Launcher` ;
- vrai chemin Éditeurs -> Dungeon -> World Builder validé.

2. Correction Dungeon après Survie à réintroduire depuis le lot précédent :
- `isCaptureContext138()` doit utiliser uniquement la famille canonique `creature` ;
- Core 2.09 doit utiliser `window.GensRpgTacticalCombatV2Bridge` pour le garde/appel d'embuscade ;
- empreintes Phase 2 doivent correspondre au blob `index.html` corrigé `917c1a38fa605d53de9a8a9f03b8b76a96b379e3`.

### Règles d'intégration

- ne pas reprendre les workflows one-shot de nettoyage ;
- ne pas reprendre les commits documentaires historiques du lot map ;
- ne pas modifier Builder, Room Creator, Tactical V111 au-delà du correctif déjà GREEN ;
- ne pas commencer caches/pièges avant validation de cette base commune ;
- aucun merge sur `main`.

### Validation requise

- Architecture statique ;
- vrai scénario navigateur Chromium Dungeon après Survie ;
- vrai scénario Builder ;
- Save & Quit / Capture / non-interférence ;
- Firefox ;
- Tactical Dock ;
- test utilisateur déjà acquis pour la grille et le Builder, à conserver comme validation manuelle de comportement.

### Prochaine action

Appliquer uniquement les deux corrections runtime du lot map sur la base Builder GREEN, réaligner les empreintes Phase 2, réintroduire la sentinelle Dungeon après Survie et valider l'ensemble.

## Chantier authored-runtime — caches, stabilité visuelle et pièges non aléatoires

Branche :
`work/gensrpg-authored-cache-trap-runtime-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-authored-cache-trap-runtime-2026-09-18`

Base exacte :
`3558831ed126e292278c867dd17491cabf0f29ad`
(`checkpoint/gensrpg-dungeon-integrated-fixes-green-2026-09-18`)

Production `main` reste inchangée sur V16.78.114.11.

### Signalements utilisateur

Dans un donjon construit via World Builder :
1. entrer dans une cache/sous-pièce peut empêcher de revenir vers la salle parente ;
2. le runtime peut demander de « lire »/réutiliser la cache alors qu'après entrée le retour vers la salle précédente doit être disponible ;
3. l'affichage authored paraît parfois instable ;
4. des pièges authored peuvent être visibles à certains moments puis disparaître ;
5. des pièges non placés dans le Builder peuvent apparaître ;
6. en mode donjon construit/authored, aucun piège ou contenu aléatoire ne doit être ajouté au-dessus des données authored.

### Périmètre initial autorisé

Diagnostic uniquement avant preuve :
- navigation cache -> sous-pièce -> salle parente ;
- persistance de l'origine/parent de branche ;
- rendu des cellules authored et des interactions ;
- application des pièges authored ;
- recherche de tout générateur/fallback aléatoire encore actif dans un World Builder authored.

Propriétaires candidats à confirmer :
- `dungeon-authored-runtime-167839.js` ;
- `dungeon-authored-cache-ux-167853.js` ;
- `dungeon-authored-cache-visual-167852.js` ;
- `dungeon-authored-branch-nav-cleanup-167863.js` ;
- `dungeon-source-render-stability-167877.js` ;
- `dungeon-exact-trap-runtime-167845.js` ;
- `dungeon-authored-event-cells-167877.js` ;
- World/Room/Zone runtime uniquement si la preuve remonte à leur contrat.

### Interdit avant preuve

- aucune rustine globale de navigation ;
- aucun reset global de Dungeon state ;
- aucun nouveau observer ;
- aucun timer/retry permanent ;
- aucun piège forcé par CSS ;
- aucune désactivation générale des événements du Dungeon classique ;
- ne pas modifier Tactical, Capture, Survie, Shell ou le Builder éditeur sauf preuve directe ;
- ne pas mélanger les trois symptômes si leurs propriétaires sont distincts.

### Invariants à protéger

- donjon authored = structure et contenu définis par les données du Builder ;
- cache liée = branche vers une sous-pièce précise, avec retour déterministe vers son parent ;
- une interaction déjà consommée ne doit pas redevenir une nouvelle entrée aléatoire ;
- pièges authored uniquement aux cellules/targets configurés ;
- aucun fallback random dans une zone authored valide ;
- état/rendu d'une salle déjà visitée doit rester stable au retour.

### Tests prévus

1. caractérisation cache parent -> sous-pièce -> retour parent ;
2. caractérisation retour après consommation/lecture de cache ;
3. re-render de la même zone authored sans changement de cellules ;
4. piège authored présent = stable après render/reload local ;
5. absence de piège authored = aucun piège généré ;
6. plusieurs retours/re-renders n'ajoutent aucun contenu aléatoire ;
7. tests existants authored cache/trap/runtime ;
8. Architecture, navigateur complet, Firefox, Tactical Dock avant GREEN.

### Prochaine action

Lire les propriétaires et tests authored existants, puis construire des reproductions ciblées avant toute correction.

### Diagnostic confirmé — conflit Core 2.02 / authored

Le vrai scénario navigateur a confirmé qu'un piège de scène non-authored survivait dans une zone World Builder malgré l'autorité `DungeonExactTrapRuntime167845`.

Cause exacte trouvée dans l'`index.html` vérifié :
- bloc inline `dungeonCore202ContentDensity` ;
- `ensureTrap202()` recréait un piège `dc202` dès que `last.kind === "trap"` ;
- la même couche pouvait aussi forcer une rencontre après deux salles sans combat et injecter une énigme selon sa cadence ;
- ces mécanismes sont légitimes pour le Dungeon généré, jamais pour un monde authored.

Correction exacte appliquée sur le blob source vérifié :
- ancien blob `917c1a38fa605d53de9a8a9f03b8b76a96b379e3` ;
- nouveau blob `55453138449d07bde731ff6934acc442f56bae32` ;
- Core 2.02 reconnaît désormais `last.authoredRuntime167839` ;
- en authored : aucune réparation/génération de rencontre, piège, énigme ou combat forcé ;
- seul `paintTrap202()` reste autorisé pour afficher un piège exact déjà détecté ;
- aucun changement pour le Dungeon généré classique.

Le patch du gros `index.html` a été appliqué par workflow one-shot avec vérification stricte des blobs avant/après, puis ce workflow s'est supprimé dans le même commit.

SHA du patch index :
`65fac9d803f71ecf7c8c3f82aa15a80861276d71`

La validation globale reste requise avant tout checkpoint GREEN.

## Chantier isolé — Édition pièce / Config objet moderne

Branche :
`work/gensrpg-object-config-editor-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-object-config-editor-2026-09-19`

Base exacte :
`3b7aba98d6d3bb87168a1853383c5c8093974a54`
(`checkpoint/gensrpg-authored-cache-trap-runtime-green-2026-09-19`)

### Signalement utilisateur

Dans Édition pièce -> Config objet :
- la première ouverture peut afficher l'UI moderne avec menus déroulants ;
- après sortie puis retour dans l'éditeur, l'ancienne UI peut réapparaître ;
- cette ancienne UI redemande des ID/références manuelles ;
- besoin UX : un objet déjà configuré doit rester visuellement distinct d'un objet seulement placé.

### Propriétaires identifiés à diagnostiquer

- `DungeonRoomTemplateContent167828` : propriétaire de la configuration directe sur le modèle de pièce ;
- `DungeonRoomContentUI167831` : couche UI moderne qui simplifie/remplace les champs par menus déroulants ;
- `DungeonRoomVisualConfig167826` : variante de configuration par instance de zone ;
- `DungeonRoomCreator100` : grille et cycle open/edit/save uniquement.

### Contraintes

- ne pas créer une deuxième UI de configuration ;
- ne pas ajouter MutationObserver, heartbeat, timer/retry permanent ou réparation globale ;
- ne pas modifier World Builder/runtime gameplay ;
- ne pas traiter ici événements, performance déplacement ou fiche Zombicide/RPG ;
- conserver les données et schémas existants ;
- la couleur "configuré" doit être dérivée de la configuration réellement persistée, pas d'un état UI temporaire.

### Hypothèse à prouver avant correction

`DungeonRoomContentUI167831.patch()` remplace `openEditor` une seule fois sur l'objet API courant.
Si un propriétaire chargé/réinstallé plus tard republie ou remplace `DungeonRoomTemplateContent167828.openEditor`, le flag `__dui167831Patched` reste posé sur l'API et la couche moderne ne reprend plus la nouvelle fonction. Le symptôme attendu est exactement : première ouverture moderne, puis après cycle éditeur retour à l'ancienne UI avec champs ID.

### Tests requis

1. vrai chemin navigateur : Éditeurs -> Dungeon -> Créateur de pièces ;
2. placer/configurer un objet via l'UI moderne ;
3. vérifier que l'objet configuré porte un état visuel distinct dérivé du contenu persisté ;
4. fermer puis rouvrir le créateur ;
5. rouvrir le même objet ;
6. vérifier que les menus déroulants modernes sont toujours présents et que les champs ID legacy ne réapparaissent pas ;
7. répéter au moins deux cycles ouverture/fermeture ;
8. Architecture, navigateur complet, Firefox, Tactical Dock avant GREEN.

### Prochaine action

Construire la reproduction navigateur exacte avant toute modification runtime.

### Diagnostic confirmé — Config objet

La reproduction navigateur réelle a distingué les deux surfaces :
- configuration directe du modèle : UI moderne présente avant et après fermeture/réouverture ;
- variante par zone : retour à l'ancien formulaire malgré `DungeonRoomContentUI167831.__dui167831Patched === true`.

Cause exacte :
- `DungeonRoomVisualConfig167826.activateCell()` appelait le `openEditor()` lexical historique ;
- cet appel contournait le `openEditor()` public volontairement décoré par `DungeonRoomContentUI167831` ;
- résultat : l'ancien textarea / saisie d'ID réapparaissait sur ce chemin.

Correction propriétaire :
- commit `59764a6312f326f04c879d12d90e6d66e1cc0d13` ;
- `activateCell()` délègue désormais au seul `DungeonRoomVisualConfig167826.openEditor()` public ;
- aucun wrapper, observer, timer/retry ou second éditeur ajouté.

### Indicateur visuel « configuré »

L'ancien indicateur se basait sur la simple existence d'une spec. Or `reconcileTemplate()` crée automatiquement une spec par défaut pour tout objet placé, donc « spec existe » ne signifiait pas « configuré par l'utilisateur ».

Correction :
- commit `c6153b0cc76711db23fb874071630b625be11574` ;
- les specs authored existantes portent désormais `configured:true/false` dans le même stockage de contenu ;
- une spec automatique créée depuis un objet placé reste `configured:false` ;
- une sauvegarde réelle via `configureElement()` écrit `configured:true` ;
- les classes `drt167828Configured` / `drv167826Configured` sont appliquées uniquement à `configured:true` ;
- l'état configuré utilise une teinte/contour vert nettement distincts ;
- fermeture/réouverture du Room Creator relit cet état depuis le contenu persisté ;
- le handler local Template délègue lui aussi au `openEditor()` public pour supprimer le dernier chemin de contournement potentiel.

Compatibilité :
- les anciennes specs sans champ `configured` sont normalisées en `false` ;
- leur gameplay/données restent conservés ;
- elles deviennent visuellement « configurées » après une nouvelle sauvegarde explicite dans l'éditeur moderne.

### Validation automatique candidate

SHA fonctionnel :
`c6153b0cc76711db23fb874071630b625be11574`

- Architecture + navigateur complet `35410257944` — SUCCESS ;
- Firefox `35410257942` — SUCCESS ;
- Tactical Dock `35410257970` — SUCCESS.

Le navigateur réel valide :
- UI moderne à la première ouverture ;
- fermeture/réouverture du Créateur ;
- UI moderne toujours présente ;
- variante par zone moderne ;
- aucun textarea legacy d'IDs visible ;
- objet par défaut non marqué configuré ;
- sauvegarde -> couleur configurée ;
- couleur/configuration persistante après fermeture/réouverture ;
- caches/pièges authored ;
- Save & Quit ;
- Capture ;
- PvP ;
- non-interférence.

### État du lot

Candidat automatiquement GREEN, en attente du test utilisateur réel avant création du checkpoint GREEN final.

Les trois autres dettes signalées restent séparées et non modifiées :
- déclenchement tardif coffre / ligne de vue ennemie ;
- ralentissement entre déplacements ;
- fiche Zombicide apparaissant brièvement en RPG.
