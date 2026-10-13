# GenSrpG Phase 12 — D4 extraction physique Dungeon Core200

Date : 13 octobre 2026.

## Autorité et source certifiée

- Base D3 documentaire triple GREEN : `9fa3729d0ae4f3531d53221a9d1021277a1c7382`.
- Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-core200-d4-extraction-2026-10-13`.
- Branche dédiée : `work/gensrpg-phase12-dungeon-core200-d4-extraction-2026-10-13`. Production `main` gelée ; laboratoires isolés.
- Source §26, ZIP utilisateur `a4.zip`, `index.html(5).txt`, 7 836 124 octets, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`.
- Propriétaire `dungeonCore200Rebuild` (statut active, `primaryDomain=dungeon`, aucun `crossDomains`). Responsabilité : Dungeon Core 2.00, runtime et interception du départ Dungeon.

## Un lot / un propriétaire

- Extraire sans changement **55 842 octets** JS (Git blob `5649ae0af69064dde72e6ea28b8dbefd105cb527`) vers `assets/gensrpg/dungeon/core200-rebuild-v1.js`.
- Ne remplacer que la balise inline par une balise externe synchrone classique au même endroit, en conservant l'id ; jamais de module, defer, async ou nouveau wrapper.
- Index final attendu **7 780 333 octets**, blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43` ; 55 791 octets nets retirés.
- Chaîne de preuve : D4 → D3 → D2 → D1 → origine, sans réécrire les empreintes de base.
- Mettre à jour uniquement les compositions, owners, tests / snapshots de leur état physique ; conserver toutes les sentinelles.
- CI Architecture/Chromium, Firefox, Tactical SUCCESS même SHA requises **avant** tout checkpoint GREEN D4 ; aucune déclaration anticipée.
