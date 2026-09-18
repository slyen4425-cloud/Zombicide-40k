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


## Chantier prioritaire utilisateur — Dungeon après Survie : état initial incohérent

Ce chantier **suspend le démarrage de la Phase 4** jusqu'à caractérisation/validation.

Branche :
`work/gensrpg-dungeon-after-survival-start-state-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-dungeon-after-survival-start-state-2026-09-18`

Base exacte :
`080a45a904590a2b24a2cbc87b9c270913f427e6`
(`checkpoint/gensrpg-phase3-target-structure-green-2026-09-18`)

Production sûre inchangée :
- `main` : V16.78.114.11 ;
- SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

### Scénario utilisateur à reproduire

Dans la preview Firefox du checkpoint Phase 3 :
1. lancer d'abord le mode Survie ;
2. revenir / recharger puis choisir Dungeon ;
3. démarrer une nouvelle partie Dungeon ;
4. état observé :
   - grille de déplacement absente ;
   - le jeu se comporte comme si le héros/groupe était déjà engagé dans une salle ;
   - une action de retour vers une salle précédente est proposée alors que la nouvelle partie ne devrait pas avoir cet historique ;
   - impossible de progresser normalement puisque la grille/mouvement manque ;
5. fermer/réouvrir ou recharger ne corrige pas l'état.

### Périmètre

Autorisé dans un premier temps :
- caractérisation navigateur du vrai chemin Survie -> Dungeon ;
- inspection des propriétaires Dungeon du démarrage, de la position spatiale et de la persistance ;
- comparaison nouvelle partie Dungeon seule vs nouvelle partie Dungeon après Survie ;
- caractérisation du stockage avant/après chaque transition.

Interdit avant preuve :
- aucune rustine de grille ;
- aucun reset global de stockage ;
- aucun nouveau wrapper, observer, timer/retry ;
- aucune modification de `isDungeonMode()` ;
- aucune réécriture du moteur de mouvement ;
- aucune modification de Save & Quit/reprise ;
- aucune modification des arts Survie ;
- aucune Phase 4 ;
- aucun changement sur `main`.

### Systèmes protégés

- Shell : `openGensFamily`, `openGensBuiltInGame`, `startConfiguredGame`, `resumeGame` ;
- autorité mouvement Dungeon / modèle spatial ;
- persistance Dungeon ;
- nouvelle partie / reprise ;
- Tactical ;
- Capture ;
- Survie.

### Tests exigés

1. reproduire le vrai scénario utilisateur dans Firefox/Chromium via le Shell/preview ;
2. contrôler le stockage et l'état spatial avant et après Survie ;
3. contrôler qu'une nouvelle partie Dungeon seule reste saine ;
4. contrôler grille/mouvement/entrée initiale et absence de faux retour ;
5. Save & Quit/reprise reste GREEN ;
6. non-interférence quatre modules ;
7. Architecture ;
8. Firefox ;
9. Tactical Dock.

### Dette séparée

Le défaut visuel Survie signalé simultanément (arts/images non liés) est enregistré mais **hors périmètre** de ce chantier. Il aura son propre lot.

### Prochaine action

Créer un test de caractérisation du vrai chemin Survie -> Dungeon. Si un défaut réel est prouvé, identifier le propriétaire exact avant toute correction.

## Avancement réel — Dungeon après Survie (2026-09-18, reprise fil)

Branche active :
`work/gensrpg-dungeon-after-survival-start-state-2026-09-18`

Checkpoint GREEN de départ :
`checkpoint/gensrpg-phase3-target-structure-green-2026-09-18`

Base du chantier :
`080a45a904590a2b24a2cbc87b9c270913f427e6`

HEAD constaté avant cette mise à jour :
`e2b86b50036921a2c29ee181e42b503ff2b960fd`

Correction fonctionnelle déjà appliquée :
- `d4678aa9656dbf1fcec2e9db5840409d6bef087f` — `isCaptureContext138()` utilise désormais uniquement la famille canonique `creature` pour le routage Capture ;
- le scénario navigateur confirme qu'un nouveau Dungeon après Survie revient à l'Entrée : `room = 0`, `last = null`, aucun faux contrôle de retour et surface de grille initiale présente.

Validation au HEAD `e2b86b5...` :
- Tactical Dock `35368031895` — SUCCESS ;
- Architecture statique du run `35368031844` — SUCCESS ;
- browser-sentinel du même run — FAILURE ;
- Firefox `35368031787` — encore en cours au dernier contrôle.

Cause exacte du RED navigateur :
- le scénario de persistance a généré une vraie embuscade en Salle 1, puis l'a rechargée avant que le Bridge Tactical dynamique ne soit disponible ;
- Core 2.09 contient depuis le commit `e473571bd80a5a61c9258c16e43d9472d5a395db` le garde non sûr `typeof GensRpgTacticalCombatV2Bridge?.requestCombat` ;
- sur un identifiant global non encore déclaré, cette expression lève `ReferenceError: GensRpgTacticalCombatV2Bridge is not defined` ;
- la détection Core 2.09 voisine utilise déjà la forme sûre `window.GensRpgTacticalCombatV2Bridge?.requestCombat`.

Règle 26 / gros `index.html` :
- le fichier utilisateur disponible `index_work_2.zip` correspond au blob historique `a515c3d34a1f5c4973159457090e4437a33c2630` (8 175 610 octets) ;
- le `index.html` du HEAD courant correspond au blob `f34363d426e6fa9c58cb14ca1dd0dabd9b794872` (8 175 614 octets) ;
- le fichier fourni n'est donc pas autorisé pour modifier le runtime courant.

### Correction Core 2.09 appliquée

Fichier utilisateur vérifié :
- taille : 8 175 614 octets ;
- blob Git : `f34363d426e6fa9c58cb14ca1dd0dabd9b794872` ;
- correspondance exacte avec le `index.html` du HEAD avant correction.

Commit correctif :
`0409947b1de743c152c99e67a3e90ffbcea866e6`

Modification strictement locale au propriétaire Core 2.09 :
- garde : `typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat` ;
- appel : `window.GensRpgTacticalCombatV2Bridge.requestCombat(...)` ;
- aucun changement de `enemyIds`, raison, délais 120/250 ms, persistance d'embuscade ou gameplay ;
- aucun wrapper, observer, timer supplémentaire ou nouveau système ;
- workflow one-shot supprimé dans le même commit ;
- test `gens_core209_ambush_direct_bridge_lot4f.test.cjs` passé dans le workflow one-shot `35370574692` — SUCCESS.

### Empreintes Phase 2 réalignées

Le correctif Core 2.09 change le blob `index.html` de :
- ancien : `f34363d426e6fa9c58cb14ca1dd0dabd9b794872` ;
- nouveau : `917c1a38fa605d53de9a8a9f03b8b76a96b379e3`.

Commit documentaire/test :
`a805e177eb742684024238e7dfe6f93859b569fd`

Fichiers réalignés uniquement sur cette nouvelle empreinte :
- `docs/GENSRPG_PHASE2_INLINE_OWNERS.json` ;
- `tests/gens_phase2_inline_global_last_owner_v11411.test.cjs` ;
- `docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv` ;
- `docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json`.

Le RED Architecture `35370641322` était uniquement ce décalage d'empreinte ; aucune nouvelle dérive fonctionnelle n'a été signalée avant cet arrêt de sentinelle.

### Prochaine action exacte

1. valider le HEAD contenant `0409947...` + les empreintes `a805e17...` via les sentinelles normales ;
2. vérifier le scénario Dungeon après Survie dans Chromium, Architecture, Firefox et Tactical Dock ;
3. vérifier Save & Quit/reprise et non-interférence via la batterie Architecture ;
4. créer un checkpoint GREEN seulement si toute la validation requise est verte ;
5. ne rien fusionner sur `main`.

