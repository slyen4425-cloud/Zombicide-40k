# GenSrpG — Phase 4 — Service Core stockage JSON

Date : 2026-09-19

Branche :
`work/gensrpg-phase4-storage-core-service-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-core-service-2026-09-19`

Base :
`151e714c1373748ee6a42a03a8ec7fb44aded8c9`
(`checkpoint/gensrpg-phase4-storage-builder-audit-green-2026-09-19`)

## But du jalon

Créer uniquement la mécanique générique de lecture/écriture JSON nécessaire aux futurs raccords de stockage, sans déplacer encore un seul consommateur production.

Fichier :
`assets/gensrpg/core/storage-v1.js`

Global explicite lorsqu'il est chargé :
`GensStorageV1`

## API

- `readJson(storage, key, fallback)`
- `writeJson(storage, key, value)`
- `create(storage)` pour obtenir les deux opérations liées à un adaptateur précis.

Le stockage est injecté explicitement. Le service ne lit pas `window.localStorage` par lui-même.

## Sémantique verrouillée

Lecture :
- clé absente -> fallback fourni par l'appelant ;
- chaîne vide -> fallback ;
- JSON invalide -> fallback ;
- valeur JSON `null` -> fallback ;
- valeur JSON valide -> valeur parsée ;
- erreur de lecture de l'adaptateur -> fallback.

Écriture :
- sérialisation avec `JSON.stringify` ;
- `setItem` avec le nom de clé fourni ;
- retour de la valeur originale ;
- erreurs de sérialisation ou d'écriture propagées, jamais masquées.

## Frontière

Le service ne connaît aucune :
- clé `gensrpg_*` ;
- structure Room / Graph / Hero ;
- version de schéma métier ;
- règle de migration ;
- normalisation métier ;
- UI, DOM, observer, listener, timer ou gameplay.

Les normalizers et versions de schéma restent chez leurs propriétaires de module.

## Migrations

Aucune migration de format dans ce jalon.

Les migrations versionnées seront définies plus tard, après raccord GREEN de consommateurs précis et à partir de fixtures d'anciennes données. Le service générique ne doit pas inventer de migration en avance.

## Production

Ce premier jalon reste volontairement hors graphe de production. Il ne doit être ajouté ni à la composition Pages, ni à `preview.html`, ni au service worker.

Le prochain lot, seulement après checkpoint GREEN, raccordera `DungeonRoomCreator100` sur sa clé historique `gensrpg_dungeon_custom_rooms_v1`.

## Validation fonctionnelle

Commit :
`6f4a66a7b24e285d1ef62fc1f2b8d3d1cf22947e`

- Architecture + navigateur complet : run `35469487437` — SUCCESS
- Firefox : run `35469487438` — SUCCESS
- Tactical Dock : run `35469487439` — SUCCESS

Le service reste hors production. Le prochain lot pourra uniquement raccorder `DungeonRoomCreator100` après création du checkpoint GREEN de ce jalon.
