# GenSrpG — Phase 6 / dépendance ensureDungeonEnemies du refresh partagé — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-custom-enemy-refresh-green-2026-09-25`
- SHA exact :
  `10cff9dcd25859eb27f5a9354d1c886647dfac4e`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-custom-enemy-dungeon-ensure-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-custom-enemy-dungeon-ensure-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Runtime exact de base

Métadonnées du checkpoint GREEN précédent :
- `index.html` : 8 170 472 octets ;
- blob Git : `2232d8c1d65121758646915080bd3c17be4d4cd6`.

Aucune modification runtime n'est autorisée pendant ce pré-audit.

## Dette inter-module retenue

Le micro-lot précédent a restauré le propriétaire natif unique
`refreshCustomEnemiesIntoZombieTypes()`
et retiré le wrapper global Dungeon V165.

La caractérisation validée a toutefois prouvé que ce propriétaire natif reste mixte et contient encore, dans cet ordre :

1. `applyBuiltinEnemyOverrides()` ;
2. nettoyage des entrées custom non `dungeonBuiltin` ;
3. `loadCustomEnemies()` + `customEnemyToZombieType()` ;
4. appel conditionnel à `ensureDungeonEnemies()`.

Le critère Phase 6 exige qu'un parcours Survie ne dépende plus de fonctions privées Dungeon.

Le présent micro-lot cible donc uniquement :
**la dépendance directe `ensureDungeonEnemies()` depuis `refreshCustomEnemiesIntoZombieTypes()`.**

## Pourquoi ce lot est séparé

`applyBuiltinEnemyOverrides()` reste lui aussi mixte et dépend de `dungeonEnemies()`, mais il n'est PAS modifié dans ce lot.

Objectif : retirer une dépendance privée à la fois et vérifier le vrai comportement.

Si `ensureDungeonEnemies()` est redondant grâce à la construction déjà effectuée par
`applyBuiltinEnemyOverrides()` et les chemins Dungeon actuels, le retrait doit être soustractif.

Si sa suppression fait réellement disparaître des ennemis Dungeon, le lot s'arrête :
- pas de wrapper global ;
- pas de duplication ;
- pas de rustine ;
- conception d'un adapter/hook Dungeon explicite dans un micro-lot distinct.

## Invariants à protéger

- aucun ennemi Survie ne disparaît ;
- aucun ennemi Dungeon builtin ne disparaît ;
- aucun ID, nom, stat, quantité ou art ne change ;
- les ennemis custom Survie restent publiés une seule fois ;
- les ennemis custom Dungeon restent disponibles ;
- les filtres `enemiesForMode(...)` conservent leur comportement ;
- les réserves/vagues Survie restent inchangées ;
- les arts Dungeon V164/V165/V166 restent inchangés ;
- aucun changement du stockage des ennemis ;
- aucun changement UI/éditeur ;
- aucun changement de gameplay.

## Hors périmètre

- ne pas déplacer `refreshCustomEnemiesIntoZombieTypes()` ;
- ne pas modifier `applyBuiltinEnemyOverrides()` ;
- ne pas modifier `dungeonEnemies()` ;
- ne pas modifier `customEnemyToZombieType()` ;
- ne pas modifier `loadCustomEnemies()` ;
- ne pas modifier les wrappers restants de `dungeonArtRenderFix165` ;
- ne pas modifier `dungeonDirectImageBinding166` ;
- ne pas modifier `openZombieRule` ;
- ne pas toucher Tactical/Capture/PvP ;
- ne pas modifier les règles de vagues déjà extraites.

## TDD obligatoire

Avant tout raccord runtime :

1. obtenir le `index.html` exact du HEAD courant selon Rule 26 ;
2. caractériser exactement le bloc natif et l'appel `ensureDungeonEnemies()` ;
3. créer une fixture navigateur qui retire uniquement cet appel ;
4. vérifier au minimum :
   - publication d'un ennemi custom Survie ;
   - publication/présence d'un ennemi custom Dungeon ;
   - présence des built-ins Dungeon ;
   - filtrage Survie/Dungeon ;
   - art Dungeon toujours correct ;
5. si la caractérisation est GREEN, ajouter une sentinelle RED statique exigeant que le propriétaire natif n'appelle plus `ensureDungeonEnemies()` ;
6. prouver que le RED est isolé ;
7. conserver Phase 6 #170 à #176 GREEN ;
8. seulement ensuite retirer l'appel exact dans le runtime ;
9. réaligner uniquement les empreintes/cartographies mécaniquement affectées ;
10. triple CI + preview + validation utilisateur avant checkpoint GREEN.

## Interdictions

- aucun wrapper global de compatibilité ;
- aucun polling/retry/heartbeat ;
- aucun `MutationObserver` global ;
- aucun `location.reload` ;
- aucune seconde source de vérité ;
- aucune duplication du catalogue ;
- aucune réécriture opportuniste.

## Rule 26

Le contenu exact du gros `index.html` est requis avant de figer le test de caractérisation.

Procédure :
1. résoudre le HEAD exact après ouverture documentaire ;
2. confirmer par métadonnées le blob/taille du runtime ;
3. fournir le permalink SHA exact à Sylvain ;
4. demander le ZIP exact de ce fichier ;
5. vérifier taille + blob ;
6. seulement ensuite inspecter et écrire le TDD.

Ne pas réutiliser `work29.zip` : il correspond à l'état antérieur au retrait du wrapper V165.

## Rule 26 — source exacte reçue et vérifiée

Sylvain a fourni `work30.zip`.

Contenu vérifié :
- fichier : `index.30.txt` ;
- taille : 8 170 472 octets ;
- blob Git : `2232d8c1d65121758646915080bd3c17be4d4cd6` ;
- correspond exactement au `index.html` du HEAD requis.

## Caractérisation exacte de la dépendance

Source native vérifiée :

`refreshCustomEnemiesIntoZombieTypes()` exécute actuellement :
1. `applyBuiltinEnemyOverrides()` ;
2. suppression des entrées custom non `dungeonBuiltin` ;
3. rechargement de `loadCustomEnemies()` via `customEnemyToZombieType()` ;
4. `if(typeof ensureDungeonEnemies==="function")ensureDungeonEnemies();`.

La source exacte de `applyBuiltinEnemyOverrides()` construit déjà :
`[...BASE_ZOMBIE_TYPES, ...dungeonEnemies()]`
et ajoute tout builtin Dungeon absent à `ZOMBIE_TYPES` lorsque `base.dungeonBuiltin` est vrai.

Donc, avant même l'appel final à `ensureDungeonEnemies()`, les built-ins Dungeon manquants sont déjà republiés par l'autorité précédente.

`ensureDungeonEnemies()` reste une vraie fonction Dungeon utilisée ailleurs, notamment via
`ensureDungeonContent()`. Le présent lot ne doit donc surtout PAS supprimer sa définition globale ; il cible seulement l'appel depuis le refresh partagé.

## Preuve navigateur de l'état cible — GREEN

Test :
`tests/gens_phase6_survival_custom_enemy_without_dungeon_ensure_browser_characterization_v1.test.cjs`.

La fixture retire uniquement :
`if(typeof ensureDungeonEnemies==="function")ensureDungeonEnemies();`

du propriétaire natif partagé et laisse tout le reste byte-identique.

Le scénario vérifie après deux refresh successifs :
- un ennemi custom Survie est présent exactement une fois ;
- un ennemi custom Dungeon est présent exactement une fois ;
- le filtre Survie n'expose aucun ennemi Dungeon ;
- le filtre Dungeon expose le custom Dungeon et les built-ins ;
- tous les IDs retournés par `dungeonEnemies()` sont déjà présents dans `ZOMBIE_TYPES` ;
- un override d'art Dungeon reste appliqué ;
- `enemyCardHtml` conserve cet art.

Workflow ciblé :
- run `36184402550` — SUCCESS.

Conclusion :
**l'appel `ensureDungeonEnemies()` dans `refreshCustomEnemiesIntoZombieTypes()` est redondant sur le runtime courant et peut être retiré sans retirer la fonction Dungeon elle-même.**

## Cible TDD

Le RED suivant doit exiger simultanément :
- propriétaire natif partagé toujours unique ;
- `applyBuiltinEnemyOverrides()` conservé ;
- `loadCustomEnemies()` conservé ;
- aucun appel `ensureDungeonEnemies` dans le corps de `refreshCustomEnemiesIntoZombieTypes()` ;
- définition `function ensureDungeonEnemies()` conservée ;
- `ensureDungeonContent()` conserve son appel à `ensureDungeonEnemies()` ;
- aucun changement de V164/V165/V166.

Le raccord runtime autorisé après RED est uniquement la suppression de la ligne conditionnelle déjà caractérisée.
