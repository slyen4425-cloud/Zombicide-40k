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

## Application D4 physique — validée

- GitHub Actions [38470070484](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38470070484) : SUCCESS. Commit métier strictement externalisé `9697f21c05f3764c8d7fabffa618bd80f3395d7a`.
- Empreintes publiées : `index.html` 7 780 333 octets (`ca15dd7b483963d7bd0767b7b5baca915d17ec43`) et JS externe 55 842 octets (`5649ae0af69064dde72e6ea28b8dbefd105cb527`).
- Retour arrière D4→D3, D3→D2, D2→D1 vérifié dans les tests d'application contrôlée. Code Core200 byte-identique et domaine Dungeon exclusif.
- `tests/gens_phase12_dungeon_core200_extraction_v1.test.cjs` rejoint les sentinelles Architecture permanentes, de même que les preuves précédentes D2 et D3.
- Ne déclarer GREEN qu'après CI Architecture/Chromium, Firefox et Tactical SUCCESS sur un même SHA.

## Clôture officielle D4 — GREEN (14 octobre 2026)

- **Checkpoint GREEN** créé au SHA testé `be7f159a189d1f14579707ba67eb024be4238487` : `checkpoint/gensrpg-phase12-dungeon-core200-d4-green-2026-10-14`.
- Triple CI complète même SHA : Architecture/Chromium [38543038090](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038090) SUCCESS (356 contrôles structurels et 64 étapes de navigateur), Firefox [38543037973](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543037973) SUCCESS et Tactical [38543038142](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038142) SUCCESS.
- Intégrité du code : `index.html` 7 780 333 octets, Git blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`. Externe `core200-rebuild-v1.js` 55 842 octets, Git blob `5649ae0af69064dde72e6ea28b8dbefd105cb527`, contenu inchangé de la source ZIP certifiée `a4.zip`.
- L'adaptation des tests comptabilise explicitement les anciens callsites et les effets préexistants transférés hors du HTML sans nouvelle autorité ni suppression des verrouillages ; réversibilité contrôlée.
- La mise à jour documentaire sur branche D4 suit le checkpoint et **n'altère pas le commit runtime certifié**. Prochain lot D5 fermé jusqu'au nouveau ZIP de `index.html` au SHA D4 et à son propre checkpoint de départ.
