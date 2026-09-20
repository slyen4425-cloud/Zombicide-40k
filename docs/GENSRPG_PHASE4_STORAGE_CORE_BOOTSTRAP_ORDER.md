# GenSrpG — Phase 4 — Core Storage Bootstrap Order

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-core-bootstrap-order-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-core-bootstrap-order-2026-09-20`

Base exacte :
`38e047185b225de30c2e8a0cebe59adbc9c76ceb`
(`checkpoint/gensrpg-phase4-storage-inline-audit-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objectif unique

Rendre `assets/gensrpg/core/storage-v1.js` disponible avant :
- les accès stockage inline historiques de `index.html` ;
- `Dungeon Large Room Support` ;
sans migrer aucune clé métier dans ce lot.

## Source exacte

Le `index.html` fourni par Sylvain a été vérifié avant modification :
- taille : `8 174 560` octets ;
- blob Git : `ff11682d74be7921a591a9b76080eaf337c071be`.

La modification du gros fichier a été appliquée par un workflow temporaire sécurisé :
- vérification obligatoire du blob exact avant écriture ;
- remplacement impossible si l'ancre QRCode n'est pas unique ;
- une seule balise ajoutée ;
- `git diff --check` avant commit.

Commit du micro-diff :
`2ddc2b8dcdb81ad6b0aa3a962cf898d73d57381c`

Diff fonctionnel exact :
une seule ligne ajoutée après QRCode :
`<script src="assets/gensrpg/core/storage-v1.js"></script>`

Aucun autre contenu de `index.html` n'a été modifié par ce commit.

## Composition Pages

Le fallback de `.github/workflows/main.yml` conserve le service Core dans la liste des modules mais le place avant Large Room Support.

Comme la balise existe désormais déjà dans le `index.html` source, le garde :
`if tag not in html`
empêche une seconde injection.

Si la balise source disparaissait accidentellement, l'ordre fallback resterait :
Core Storage → Dungeon Core → Large Room Support.

## Preview

`preview.html` charge le `index.html` source.
La ligne Core Storage a donc été retirée de sa liste de tags additionnels afin d'éviter un double chargement.

Large Room Support reste ajouté ensuite à la composition preview.

## Tests

`tests/gens_phase4_storage_inline_audit_v1.test.cjs`
est avancé pour vérifier l'état post-bootstrap.

Nouveau garde :
`tests/gens_phase4_storage_bootstrap_order_v1.test.cjs`

Il verrouille :
- exactement une balise Core Storage dans `index.html` ;
- Core Storage avant le premier accès inline de stockage cartographié ;
- fallback Pages Core Storage avant Large Room Support ;
- injection Pages sans doublon ;
- aucune deuxième balise Core Storage dans la liste additionnelle de preview ;
- composition simulée Pages avec Core Storage unique et antérieur à Large Room Support.

## Hors périmètre

- aucune migration de clé métier ;
- aucun changement de format ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun changement Stats/Tactical/gameplay ;
- aucun wrapper/fallback concurrent ;
- aucun observer/timer/retry ;
- aucun merge sur `main`.

## Suite après GREEN

Revenir au candidat JSON identifié dans l'audit inline :
`gensrpg_capture_progress_v2_<profileId>`

Avant raccord :
- caractériser exactement parité read/write/fallback ;
- confirmer toutes les écritures Capture existantes ;
- ouvrir un nouveau lot homogène ;
- conserver Capture comme propriétaire métier et Core Storage comme seul transport JSON.

