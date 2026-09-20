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
