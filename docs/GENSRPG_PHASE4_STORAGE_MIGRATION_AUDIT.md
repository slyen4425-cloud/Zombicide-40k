# GenSrpG — Phase 4 — Audit stockage / migrations

Date : 2026-09-19

Branche :
`work/gensrpg-phase4-storage-migrations-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-migrations-2026-09-19`

Base :
`9467429b7f195a24ec138cded7231f60b47ba5a4`
(`checkpoint/gensrpg-phase4-asset-resolver-complete-green-2026-09-19`)

Blob runtime audité :
`ff11682d74be7921a591a9b76080eaf337c071be`.

## Découverte de périmètre

Le manifeste Phase 2 `GENSRPG_PHASE2_STORAGE_OWNERS.json` reste utile pour les fichiers externes et les blocs inline identifiés, mais sa sentinelle ne scanne que les blocs inline possédant un `id`.

Le runtime courant contient :
- 142 scripts inline au total ;
- 130 avec `id` ;
- 12 anonymes ;
- 3 scripts anonymes possèdent des accès `localStorage` ;
- ces trois scripts totalisent 201 accès directs supplémentaires : 139 + 38 + 24.

Conséquence : les 221 accès du manifeste Phase 2 ne suffisent pas, à eux seuls, pour définir le périmètre d’extraction stockage Phase 4.

## Propriétaire transversal identifié

Le script inline anonyme d’ordre 5 possède actuellement le stockage d’assets IndexedDB :
- `GENSRPG_IDB_MIGRATION_FLAG = gensrpg_idb_assets_migrated_v1` ;
- DB `GenSrpG_Assets`, version 1 ;
- store `assets` ;
- références `idbasset:` ;
- ouverture DB, put/get, cache ;
- externalisation des data URLs ;
- migration `gensrpgMigrateLocalImagesToIndexedDb()` ;
- export/import des assets IndexedDB ;
- bootstrap de migration.

Cette responsabilité est transversale : elle traite notamment équipements personnalisés, héros personnalisés, ennemis personnalisés et entités partagées.

## Deux autres propriétaires anonymes à ne pas mélanger

### Script anonyme 6

Il possède une partie sauvegarde/import/export/synchronisation et :
- appelle `gensrpgImportIndexedAssets()` ;
- retire le flag de migration après import ;
- contient un monkey-patch historique `Storage.prototype.setItem` pour la gestion quota.

Ce bloc est mixte. Il ne doit pas être absorbé d’un coup dans le service Core.

### Script anonyme 7

Il mélange version d’application / PWA / mise à jour et 24 accès localStorage.

Il n’appartient pas au premier sous-lot Core stockage.

## Migrations qui restent au module Dungeon

`dungeonCore051ExplorationPolish` :
- migration/normalisation des anciennes aventures et défis ;
- responsabilité métier Dungeon.

`dungeonCore083MovementBalance` :
- migration versionnée des anciennes valeurs de mouvement ;
- responsabilité gameplay/profil Dungeon.

Ces migrations ne doivent pas être centralisées simplement parce qu’elles écrivent dans le stockage.

## Premier sous-lot recommandé

**Core IndexedDB asset storage primitives**, sans migration de format.

À extraire progressivement du propriétaire anonyme 5 :
- constantes DB/store/prefix ;
- open ;
- put/get ;
- cache/load ;
- résolution/externalisation de références ;
- export/import brut des assets.

À laisser temporairement chez le propriétaire historique :
- `gensrpgMigrateLocalImagesToIndexedDb()` ;
- `gensrpgBootstrapIndexedStorage()` et ses refresh UI ;
- import/export global de sauvegarde du script anonyme 6 ;
- monkey-patch quota ;
- migrations Dungeon.

Raison : la roadmap interdit de mélanger déplacement de l’API et migration de format dans le même lot.

## Tests requis avant extraction

1. RED prouvant que les primitives IndexedDB appartiennent encore au script anonyme 5 ;
2. test navigateur vrai IndexedDB : put -> get -> export/import ;
3. conservation exacte de DB `GenSrpG_Assets`, version 1, store `assets`, prefix `idbasset:` ;
4. migration flag inchangé et migration encore possédée par le legacy pendant le premier sous-lot ;
5. Save & Quit / reprise et import/export globaux inchangés ;
6. Architecture + navigateur complet + Firefox + Tactical Dock.

Aucun runtime n’est modifié dans cet audit.
