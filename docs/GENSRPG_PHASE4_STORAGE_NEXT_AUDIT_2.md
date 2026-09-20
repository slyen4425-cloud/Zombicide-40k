# GenSrpG — Phase 4 — Audit stockage suivant 2

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-2-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-2-2026-09-20`

Base exacte :
`3dcbc7e3954e607fd3db933dc41240b8dbe02641`
(`checkpoint/gensrpg-phase4-storage-world-summary-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## État de départ

Après le raccord World Summary :
- accès directs : 213 ;
- accès résolus : 143 ;
- accès dynamiques/non résolus : 70 ;
- clés/familles directes résolues : 28 ;
- Shell : 3 accès directs, 0 dynamique ;
- Builders : aucun accès direct cartographié.

## Objectif

Choisir le prochain sous-périmètre stockage minimal sans :
- toucher `gensrpg_dungeon_runtime_v2` ;
- anticiper le futur chantier Stats ;
- mêler stockage et Tactical ;
- modifier `index.html` sans appliquer la règle 26 ;
- introduire de nouveau wrapper, observer, timer ou retry.

## Candidats externes examinés

### 1. `gensrpg_dungeon_primary_selection_v167833`

Cette clé JSON est cohérente et partagée par :
- `dungeon-world-session-bridge-167832.js` ;
- `dungeon-large-room-support-167834.js` ;
- `dungeon-authored-bootstrap-167849.js` ;
- `dungeon-authored-action-fix-167857.js`.

Elle comporte des lecteurs et un writer explicites, sans migration de schéma apparente.

Blocage actuel :
`dungeon-large-room-support-167834.js` est chargé AVANT
`assets/gensrpg/core/storage-v1.js`
dans GitHub Pages et `preview.html`.

Conclusion :
ce candidat n'est pas un simple raccord stockage. Le migrer correctement exige d'abord de modifier et valider l'ordre de composition Pages/preview. Il est différé dans ce lot d'audit.

### 2. Room Runtime / World Runtime / Authored Runtime

Fichiers examinés :
- `dungeon-room-runtime-167822.js` ;
- `dungeon-world-runtime-167823.js` ;
- `dungeon-authored-event-cells-167877.js` ;
- `dungeon-authored-runtime-167839.js`.

Ils utilisent des helpers JSON locaux qui servent aussi directement :
`gensrpg_dungeon_runtime_v2`.

La consigne actuelle interdit d'attaquer cette clé sans audit dédié.

Conclusion :
ne pas migrer leur helper générique maintenant, car cela déplacerait implicitement le stockage runtime Dungeon interdit.

### 3. Core Stats

`assets/gensrpg/gens-rpg-stats-clean-167874.js`
contient encore une persistance dynamique de héros via
`R.key(hero)`.

Ce fichier est l'autorité Core Stats et le moteur de stats est précisément le service Phase 4 suivant après stockage.

Conclusion :
ne pas mélanger cette persistance au lot stockage actuel. La traiter avec le futur lot Stats/état héros après audit dédié.

### 4. Tactical Adapter

`gens-rpg-tactical-combat-v2-adapter.js` :
- lit `gensrpg_dungeon_runtime_v2` ;
- écrit aussi un état héros via une clé dynamique `rt.key(id)`.

Conclusion :
hors périmètre stockage minimal ; mélange Dungeon runtime + état héros + Tactical.

### 5. Runtime Repair V106

`gens-rpg-runtime-repair-1678106.js` mélange :
- JSON de profils ;
- profil actif scalaire ;
- famille de session scalaire ;
- réparation/dédoublonnage de profils.

`GensStorageV1` est actuellement un service JSON, pas une abstraction générique de valeurs scalaires.

Conclusion :
ne pas forcer ce fichier dans le Core JSON actuel.

## Décision

Aucun candidat externe restant n'est aussi sûr et isolé que les raccords précédents sans ouvrir un deuxième sujet architectural.

Le prochain audit minimal doit donc revenir aux accès inline restants et sélectionner une clé JSON autonome qui :
- ne touche pas `gensrpg_dungeon_runtime_v2` ;
- ne dépend pas de Stats/Tactical ;
- ne demande pas une migration de schéma ;
- peut conserver exactement ses fallbacks et son propriétaire métier.

Ces accès étant dans le gros `index.html`, leur inspection exacte doit appliquer la règle 26 de la charte.

## Prochaine action

Demander à Sylvain le `index.html` exact du checkpoint :
`3dcbc7e3954e607fd3db933dc41240b8dbe02641`

Lien :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/3dcbc7e3954e607fd3db933dc41240b8dbe02641/index.html`

Après réception du ZIP :
1. vérifier taille/cohérence et correspondance avec le SHA demandé ;
2. inspecter uniquement les candidats inline de stockage ;
3. choisir une clé/famille minimale ;
4. ouvrir ensuite un NOUVEAU sous-lot de raccord depuis le checkpoint d'audit GREEN ;
5. ne jamais modifier `index.html` dans le lot d'audit lui-même.
