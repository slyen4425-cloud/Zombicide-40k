# GenSrpG — Phase 4 — Audit stockage inline index.html

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-inline-audit-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-inline-audit-2026-09-20`

Base exacte :
`3e43e9220aeb762ee89edd39ad3d3f0fdd569b65`
(`checkpoint/gensrpg-phase4-storage-next-audit-2-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Fichier exact fourni par Sylvain

ZIP :
`index_work7.zip`

Le ZIP contient :
`index_work7.txt`

Le contenu est bien du HTML complet malgré l'extension `.txt`.

Vérification exacte :
- taille : `8 174 560` octets ;
- blob Git calculé : `ff11682d74be7921a591a9b76080eaf337c071be` ;
- blob Git du `index.html` au checkpoint demandé :
  `ff11682d74be7921a591a9b76080eaf337c071be`.

Conclusion :
le fichier fourni est byte-for-byte le `index.html` du checkpoint demandé.

## Constat principal

Le fichier source `index.html` ne charge pas directement :
`assets/gensrpg/core/storage-v1.js`.

Le workflow Pages injecte actuellement les modules externes juste avant `</body>`.
Dans cette liste :
1. `dungeon-core-318.js` ;
2. `dungeon-large-room-support-167834.js` ;
3. `assets/gensrpg/core/storage-v1.js` ;
4. puis les autres modules.

Donc :
- tous les scripts inline historiques du gros `index.html` sont parsés/exécutés avant le service Core stockage ;
- `Large Room Support` est lui aussi placé avant le service Core ;
- `preview.html` présente également Large Room Support avant Core storage.

Un raccord inline direct vers `GensStorageV1` dépendrait donc du timing d'exécution ou exigerait un fallback concurrent.
Ces deux solutions sont contraires à l'objectif de la restructuration.

## Candidat métier confirmé mais non migré

La famille :
`gensrpg_capture_progress_v2_<profileId>`

est un candidat futur propre :
- clé dynamique par profil ;
- valeur JSON objet ;
- lecteur central `captureCreatureProgressRules()` ;
- fallback objet `{}` fusionné avec les defaults Capture ;
- plusieurs writers réécrivent le même objet sérialisé ;
- aucun besoin de migration de format identifié dans cet audit.

Elle n'est PAS migrée ici, car le service Core n'est pas garanti disponible au moment où les scripts inline peuvent s'exécuter.

## Autres candidats inline

Les petits accès Dungeon dynamiques observés via `key(heroId)`, `key(id)`, etc. touchent l'état héros et doivent rester différés vers les lots Stats / état héros / Dungeon correspondants.

Les helpers Runtime / Authored qui accèdent à `gensrpg_dungeon_runtime_v2` restent exclus conformément à la charte.

## Décision d'architecture

Avant toute nouvelle migration inline, créer un lot homogène dédié :

**Phase 4 — Core Storage Bootstrap Order**

Objectif unique :
- rendre `storage-v1.js` disponible avant les scripts inline métier ;
- garantir également qu'il précède Large Room Support dans Pages et preview ;
- ne migrer aucune clé métier dans ce lot ;
- ne changer aucune règle gameplay ni format de stockage.

Approche attendue :
- ajouter la balise Core storage dans le `index.html` source à un emplacement de bootstrap sûr, avant les scripts applicatifs ;
- laisser le workflow Pages reconnaître la balise existante et ne pas la réinjecter en doublon ;
- déplacer `storage-v1.js` avant Large Room Support dans `preview.html` ;
- ajouter des gardes d'ordre/absence de doublon ;
- valider raw source + Pages composition + preview + batterie navigateur.

## Interdit dans l'audit courant

- aucune modification du `index.html` ;
- aucune migration de clé ;
- aucun fallback concurrent vers localStorage ;
- aucun wrapper métier ;
- aucun observer / heartbeat / retry ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun changement Stats/Tactical ;
- aucun merge sur `main`.

