# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

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
