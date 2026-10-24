# GenSrpG — Phase 4 Storage — Economy Session

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-storage-economy-session-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-economy-session-2026-09-20`.
- Base exacte : `b5ae8be05e0b5cf616781cefd0aa22b5ace2eec6`.
- Dernier GREEN : `checkpoint/gensrpg-phase4-storage-next-audit-11-green-2026-09-20`.
- Production gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Mission

Raccorder uniquement le transport JSON de la famille dynamique :

`gensrpg_dungeon_session_eco_160_<profileId>`

au service Core existant `GensStorageV1`, sans changer son propriétaire métier,
sa clé, son schéma, ses règles, ses consommateurs ni l'ordre des effets UI.

Audit source :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_11.md`.

## Propriétaire et accès ciblés

Propriétaire unique :
`dungeonEconomy160`.

Accès à migrer :
- lecture : `JSON.parse(localStorage.getItem(key) || "{}")` ;
- écriture : `localStorage.setItem(key, JSON.stringify(rest))`.

Cible :
- lecture : `GensStorageV1.readJson(localStorage,key,{})` ;
- écriture : `GensStorageV1.writeJson(localStorage,key,rest)`.

Aucun `removeItem`.

## Contrat lecture

Le propriétaire `window.dungeonSessionEco160` conserve :

- `String(activeGameProfileId() || "dungeon")` pour l'identifiant ;
- le préfixe historique `gensrpg_dungeon_session_eco_160_` ;
- les defaults `{chests:0, merchantPasses:0}` ;
- le même `try/catch` autour du transport ;
- `Object.assign(d, valeur)` ;
- le retour `{key,...d}` ;
- aucune écriture pendant la lecture.

Absence, chaîne vide, JSON invalide, `null` et erreur de lecture gardent les defaults.
La sémantique native `Object.assign` sur objets/tableaux/chaînes reste inchangée.

Une erreur de `activeGameProfileId()` reste hors du catch et se propage.

Le comportement legacy d'une propriété `key` déjà persistée est conservé :
à cause de `{key,...d}`, cette valeur peut remplacer la clé calculée.

## Contrat écriture

Le propriétaire `window.saveDungeonSessionEco160(d)` conserve :

- `if (!d?.key) return` ;
- `const {key,...rest}=d` ;
- utilisation de la clé portée par l'objet ;
- aucun recalcul du profil actif ;
- aucune mutation de l'argument ;
- retour `undefined` ;
- propagation des erreurs de sérialisation et d'écriture.

Un objet lu sous le profil A puis sauvegardé après passage au profil B reste écrit
sous A.

## Consommateurs inchangés

Les lecteurs et writers métier restent dans `dungeonEconomy160`, notamment :
- coffre / fouille ;
- UI de recherche ;
- ajout coffre MJ ;
- disponibilité / ouverture marchand ;
- activation marchand MJ ;
- événement marchand ;
- rendu boutons Economy.

Aucune règle de compteur, chance, condition, loot, marchand ou UI n'est déplacée.

## TDD

Avant raccord runtime :

1. `tests/gens_phase4_storage_economy_session_characterization_v1.test.cjs`
   reste la caractérisation du vrai propriétaire historique ;
2. ajouter une parité qui applique seulement les deux remplacements de transport
   en mémoire au vrai bloc puis rejoue exactement le même contrat ;
3. ajouter une garde propriétaire qui exige 0 accès directs et exactement
   1 lecture + 1 écriture via `GensStorageV1` ;
4. la garde propriétaire doit être RED avant le raccord ;
5. aucune assertion fonctionnelle existante ne doit être affaiblie.

Après raccord :
- caractérisation réelle GREEN ;
- parité Core GREEN ;
- garde propriétaire GREEN ;
- manifestes/empreintes réalignés uniquement si rendus obsolètes ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.

## Frontières strictes

Hors périmètre :
- Economy Rules déjà migré ;
- inventaire héros `key(heroId)` ;
- Pending Trap / Special Branch ;
- gameplay-by-profile ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats ;
- Tactical mixed state ;
- Runtime Repair ;
- autres modules ;
- bootstrap ;
- assets ;
- navigation.

Aucun nouvel observer, listener global, timer/retry, wrapper ou monkey-patch.

## Source index.html

Base :
- taille `8 174 580` octets ;
- blob `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

La règle 26 s'applique avant toute modification du fichier exact.
GitHub reste l'autorité pour SHA, branches, diff et CI.

## Critère de sortie

Le lot est GREEN uniquement si :
- les deux transports directs ont disparu ;
- les deux appels Core sont les seuls remplacements fonctionnels du propriétaire ;
- la parité du vrai propriétaire reste identique ;
- le manifeste Storage n'avance que du nombre d'accès réellement migrés ;
- aucune autre responsabilité Economy/Dungeon n'est modifiée ;
- les trois validations requises sont SUCCESS ;
- un checkpoint final dédié est créé ;
- `main` reste inchangé.

## Implémentation réalisée

Le micro-raccord runtime est appliqué sans autre changement fonctionnel du propriétaire :
- `JSON.parse(localStorage.getItem(key)||"{}")` -> `GensStorageV1.readJson(localStorage,key,{})` ;
- `localStorage.setItem(key,JSON.stringify(rest))` -> `GensStorageV1.writeJson(localStorage,key,rest)`.

Empreinte exacte :
- source : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054` ;
- cible : `1545aba502777d9fb76decdcee90a89c7cf3f971` ;
- taille : `8 174 580` octets avant/après.

Le diff runtime est strictement limité à deux lignes du bloc `dungeonEconomy160`.
Les accès Economy Rules déjà raccordés au Core et l'écriture inventaire héros du
même bloc sont inchangés.

## Résultat de parité ciblée

Le contrat du vrai propriétaire a été rejoué avant/après substitution :
- 13 cas de lecture/fusion ;
- 7 variantes/fallbacks d'identifiant de profil ;
- lecture sans écriture ;
- no-op sans clé ;
- round-trip et champs inconnus ;
- isolation A/B et sauvegarde après changement de profil ;
- comportement legacy d'une propriété `key` persistée ;
- erreurs de lecture/profil/sérialisation/écriture ;
- MJ coffre, MJ marchand et ouverture marchand ;
- interruption des effets UI en cas d'échec d'écriture.

Résultat : parité legacy/Core **GREEN** sur cette caractérisation ciblée.

## Cartographie après raccord

Manifeste direct Phase 2 :
- total `185` ;
- résolus `120` ;
- non résolus `65` ;
- clés directes `20`.

Dungeon : `153 / 103 / 50 / 12`.

La famille `gensrpg_dungeon_session_eco_160_` quitte le manifeste des accès directs.
Aucun accès non résolu n'est reclassé artificiellement.

## État de validation

HEAD documenté au moment de cette note :
`ecc6b58a87ffd5b3f51aa4e35f784fad1030d485`.

La validation finale Architecture + navigateur complet, Firefox et Tactical Dock
reste obligatoire avant checkpoint GREEN. Aucun résultat GREEN n'est anticipé ici.

## Validation fonctionnelle GREEN

HEAD fonctionnel :
`d627d2143885e3084075017891a7408e60ccb4c4`.

Runs :
- Architecture + navigateur complet `35532444858` — SUCCESS ;
- Firefox `35532444849` — SUCCESS ;
- Tactical Dock `35532444882` — SUCCESS.

Le navigateur complet a repassé les sentinelles Survie, Dungeon après Survie,
Builder, Config objet, fiche RPG, authored cache/traps, Save & Quit/reprise,
PvP, Capture, non-interférence, murs, preview et resolver d'assets.

Cette fermeture documentaire doit elle-même repasser les trois workflows avant
création de `checkpoint/gensrpg-phase4-storage-economy-session-green-2026-09-20`.
