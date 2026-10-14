# GenSrpG — Point de reprise LIVE / Phase 12 D5 (14 octobre 2026)

**D5 extrait physiquement et publié ; validation triple CI EN COURS, pas encore GREEN.** D1 à D4 GREEN. Phase 12 non terminée.

## Autorité et gouvernance

- **Base triple CI GREEN :** `00022b60a5b9dea8bc8bc281a7705d94b31ff09a` ; Architecture/Chromium [38572114746](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38572114746), Firefox [38572114803](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38572114803), Tactical [38572114885](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38572114885), toutes SUCCESS.
- Dernier checkpoint de lot : `checkpoint/gensrpg-phase12-dungeon-core200-d4-green-2026-10-14` au SHA `be7f159a189d1f14579707ba67eb024be4238487`. Les mises à jour D4 documentaires testées sont présentes dans la base D5.
- **Checkpoint de départ §25 D5 :** `checkpoint/gensrpg-start-phase12-dungeon-core211-d5-extraction-2026-10-14` sur `00022b60a5b9dea8bc8bc281a7705d94b31ff09a`.
- **Branche dédiée D5 :** `work/gensrpg-phase12-dungeon-core211-d5-extraction-2026-10-14` initialisée au SHA exact de départ.

## Source §26 et lot unique

- ZIP utilisateur `b1.zip` / `index.html(6).txt` **vérifié** : 7 780 333 octets, Git blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`, correspond exactement au checkpoint D4.
- Propriétaire **actif et exclusif Dungeon** : `dungeonCore211Consolidation` (owners historique : domain dungeon, status active, crossDomains vide). Les 10 scripts désactivés restent à leur place.
- **Mouvement appliqué :** 17 511 octets de JS (blob `bba60d921df20a114b489e17f9222e0c4f310871`) vers `assets/gensrpg/dungeon/core211-consolidation-v1.js`, sans changement de code ; remplacer uniquement le tag inline par `<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>`, synchronisme et position inchangés.
- Index effectivement publié : **7 762 879 octets**, blob `2ad1961efb9733037b7753ffd4a308baa1b00b64` ; baisse nette **17 454 octets**.
- [Workflow contrôlé D5 38581987594](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38581987594) **SUCCESS** ; commit applicatif `a039172e51efec5fa48b4b6d2fd4ced556473471`. Preuves octet exact, tests historiques et composition d'application ont réussi. Néanmoins, triple CI finale obligatoire sur un même nouveau HEAD.
- Risques : ordre des IIFE Dungeon, état sauvegardé, chargement du JS externe, globales et événements, retour mode, compatibilité de Capture/Survie/PvP et Tactical. Aucun comportement ou gameplay modifié.

## Validation nécessaire

- Comparaison octet par octet et reconstruction complète D5→D4→D3→D2→D1.
- Source JS valide, graphe de chargement, manifest propriétaire, tests historiques et vrais navigateurs.
- Triple CI Architecture/Chromium, Firefox et Tactical **SUCCESS sur le même SHA final** avant tout checkpoint D5 GREEN.
- Pas de D6 avant checkpoint D5 final et nouvel index §26 certifié.

## Invariants

- `main` immuable `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun fichier modifié dans les laboratoires Combat/Exploration ; 32 images Survie historiques inchangées.
- Pas de migration de contenu, de persistance, de PWA ou de gameplay ; PvP reste architectural et non jouable.
- Respect intégral de `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
- Historique D4 conservé en `docs/history/GENSRPG_CURRENT_WORK_PRE_D5_2026-10-14.md`.
