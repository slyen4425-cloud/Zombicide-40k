# GenSrpG — Point de reprise LIVE (15 octobre 2026)

**Phase 12 en cours : D1–D5 GREEN ; D6 ouvert, NON GREEN.**

## D6 Dungeon Core213 — chantier actif

- Base triple CI GREEN : `db64f0aa2334d75c556fb9a122f5da51271419ec`, [Architecture/Chromium 38631963956](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38631963956), [Firefox 38631963759](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38631963759), [Tactical 38631963716](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38631963716), toutes SUCCESS même SHA.
- Dernier checkpoint validé : `checkpoint/gensrpg-phase12-dungeon-core211-d5-green-2026-10-14` (SHA `50715c1b150fbd8d9829b90d88a983e6550ff63d`).
- **Checkpoint de départ D6 §25 :** `checkpoint/gensrpg-start-phase12-dungeon-core213-d6-extraction-2026-10-15` sur `db64f0aa2334d75c556fb9a122f5da51271419ec`.
- **Branche dédiée D6 :** `work/gensrpg-phase12-dungeon-core213-d6-extraction-2026-10-15`. D5 terminé, aucun autre propriétaire affecté dans D6.
- Source exacte §26 : ZIP utilisateur **`b3.zip` / `index.html(8).txt`**, **7 762 879 octets**, blob Git `2ad1961efb9733037b7753ffd4a308baa1b00b64`, correspondance D5 vérifiée contre la source et le checkpoint.
- Propriétaire : **`dungeonCore213Stability`**, script actif, `primaryDomain=dungeon`, `crossDomains=[]`, IIFE classique. Responsabilité : stabilisation combat/coffres/pions/énigmes.
- Mouvement prévu : **17 519 octets JS** (blob `af4bf724315180becd80833af251504130751ad3`) vers `assets/gensrpg/dungeon/core213-stability-v1.js`. Remplacer une unique balise inline par `<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>` au même emplacement, sans réécrire le code ni différer le chargement.
- Index attendu : **7 745 413 octets** (blob `b5271e44dc4c14834a7725a869fb3c12386f2437`), soit **17 466 octets nets** retirés.
- Risque : l'ancien IIFE comprend un arrêt de propagation d'événement déjà présent inline ; préserver strictement son occurrence (empreinte verrouillée), aucun privilège global ni nouveau mécanisme. Dungeon, Capture, Survie, Tactical, Shell/PvP, stockage et session restent identiques.
- Preuves prévues : rollback exact D6→D5→D4→D3→D2→D1 ; syntaxe Node ; ordre d'exécution ; cartographie owner + effets préexistants ; CI complète Architecture/Chromium, Firefox, Tactical **au même SHA** avant tout checkpoint D6 GREEN.
- **État :** D6 préparé, application physique non encore terminée et pas de checkpoint D6 GREEN. Ne pas commencer D7 avant clôture §25 et nouvelle source §26.

## Bilan précédent

D1–D5 GREEN : 171 594 octets de JS externalisés, 171 325 octets nets retirés, index à 7 762 879 octets.
Rapport D5 : `docs/GENSRPG_PHASE12_DUNGEON_CORE211_D5_EXTRACTION_2026-10-14.md`.

## Invariants et règles

`main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; labos combat/exploration isolés ; 32 assets Survie historiques non migrés ; pas de multi-autorité ni de nouveau gameplay. Lire la Charte §§25–26, Checkpoint Policy et Roadmap.

Ancien point de reprise : `docs/history/GENSRPG_CURRENT_WORK_PRE_D6_2026-10-15.md`.
