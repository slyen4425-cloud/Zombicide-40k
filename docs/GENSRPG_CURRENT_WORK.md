# GenSrpG — Point de reprise LIVE (15 octobre 2026)

**Phase 12 en cours : D1–D6 GREEN ; D7 Core214 publié, CI finale en attente (NON GREEN).**

## D7 — extraction Dungeon Core214 Single Authority

- Base triple CI GREEN : `ac1e3c8be76732bdc7f389d0d9258cf283d65a84`, Architecture [38757922080](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38757922080), Firefox [38757921764](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38757921764), Tactical [38757921660](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38757921660), toutes SUCCESS au même SHA.
- Dernier checkpoint GREEN : `checkpoint/gensrpg-phase12-dungeon-core213-d6-green-2026-10-15` (SHA `4b93ee9f8ceb9850097421b54db8c43a8df2862a`). Les documents D6 ont ensuite été mis à jour sans changement de runtime sur la base `ac1e3c8be76732bdc7f389d0d9258cf283d65a84` (elle aussi triple CI GREEN).
- Checkpoint §25 départ : `checkpoint/gensrpg-start-phase12-dungeon-core214-d7-extraction-2026-10-15`, SHA `ac1e3c8be76732bdc7f389d0d9258cf283d65a84`.
- Branche dédiée : `work/gensrpg-phase12-dungeon-core214-d7-extraction-2026-10-15` ; aucune autre branche/modification concurrente autorisée pendant ce lot.
- §26 source : ZIP utilisateur `b5.zip`, entrée `index.html(10).txt`, **7 745 413 octets**, blob Git `b5271e44dc4c14834a7725a869fb3c12386f2437` vérifié — copie exacte du dernier index D6 GREEN.
- Propriétaire unique : `dungeonCore214SingleAuthority`, domaine Dungeon, `crossDomains=[]`; IIFE classique de **15 795 octets**, blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88`. Responsabilités conservées sans évolution : rendu des pions, équipement/combat natif, post-render, cohérence de la scène.
- Cible proposée : `assets/gensrpg/dungeon/core214-single-authority-v1.js`, script classique synchrone à la même position. Index cible **7 729 678 octets**, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79` (**15 735 octets nets retirés**).
- Préserver sans modification : gameplay, chaînes de wrappers Dungeon Core01, combat Tactical/Bridge, héroïne/fiche héros, stockage/session, Capture/Survie/PvP, 32 images Survie, services partagés, `main` gelée.
- Risque principal : ce propriétaire fait partie des derniers wrappers/renders actifs. Conserver strictement ordre parser, globals, effets existants, liens avec Core213, sans les recréer ni changer leurs sémantiques.
- Tests nécessaires : source et JS identifiés par SHA Git, syntaxe Node, restauration byte-identique D7→D6→D1, vérification du chargement/owner, CI Architecture/Chromium + Firefox + Tactical **SUCCESS au même SHA**.
- **Application contrôlée SUCCESS** : [run 38761613784](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38761613784), SHA moteur `821d2c3f91c2f238fc223c8dd73ff1cebac6181b`. Index 7 729 678 octets, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`, JS Core214 blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88`.
- **NON GREEN** : attendre triple CI complète Architecture/Chromium, Firefox, Tactical même SHA avec sentinelle D7 permanente. Ensuite seulement checkpoint final §25. Ne pas ouvrir D8. Voir `docs/GENSRPG_PHASE12_DUNGEON_CORE214_D7_EXTRACTION_2026-10-15.md`.

## Historique D6 GREEN (ne pas confondre avec D7)

**Phase 12 en cours : D1–D6 GREEN. D7 non ouvert.**

## Dernier lot validé — D6 Dungeon Core213 Stability

- Branche du lot D6 : `work/gensrpg-phase12-dungeon-core213-d6-extraction-2026-10-15`.
- Base D6 : `db64f0aa2334d75c556fb9a122f5da51271419ec`; checkpoint §25 de départ : `checkpoint/gensrpg-start-phase12-dungeon-core213-d6-extraction-2026-10-15`.
- **GREEN final : `4b93ee9f8ceb9850097421b54db8c43a8df2862a`**, triple CI Architecture/Chromium, Firefox, Tactical **SUCCESS sur ce même SHA** : [Architecture/Chromium 38658003954](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658003954), [Firefox 38658003956](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658003956), [Tactical 38658004148](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658004148).
- **Checkpoint D6 GREEN : `checkpoint/gensrpg-phase12-dungeon-core213-d6-green-2026-10-15`** sur ce SHA.
- Source D6 §26 : `b3.zip`, index D5 (7 762 879 octets, blob `2ad1961efb9733037b7753ffd4a308baa1b00b64`).
- Propriétaire Dungeon `dungeonCore213Stability` externalisé byte-identique : 17 519 octets vers `assets/gensrpg/dungeon/core213-stability-v1.js` ; index D6 **7 745 413 octets**, Git blob **`b5271e44dc4c14834a7725a869fb3c12386f2437`**.
- Rollback exact D6→D5→D4→D3→D2→D1 couvert ; aucune modification de gameplay, de `main`, des labos ni des assets Survie. Voir `docs/GENSRPG_PHASE12_DUNGEON_CORE213_D6_EXTRACTION_2026-10-15.md`.

## Bilan et prochain chantier

- D1–D6 GREEN : **189 113 octets JS externalisés**, **188 791 octets nets retirés**, index actuel **7 745 413 octets**. La Phase 12 globale n'est pas terminée.
- Le ZIP utilisateur **`b4.zip` / `index.html(9).txt`**, reçu à la reprise, fait **7 780 333 octets**, blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43` : il correspond exactement à l'ancien **index D4**, et non au D6. Ne pas utiliser comme source d'extraction D7.
- **Prochaine action** : cartographier le prochain propriétaire inline *à partir de l'index D6 exact* (§26) ; déclarer périmètre/propriétaire/risques/tests ; créer checkpoint de départ §25 et branche D7 dédiés ; extraction uniquement ensuite et triple CI finale avant GREEN.
- Lien de référence source D6 à remettre à l'utilisateur : https://github.com/slyen4425-cloud/Zombicide-40k/blob/4b93ee9f8ceb9850097421b54db8c43a8df2862a/index.html . Télécharger cet `index.html` précis et le transmettre compressé en ZIP si une prochaine extraction exige sa lecture.
- Aucun D7 n'a été ouvert : ne pas inventer d'état intermédiaire ni réutiliser un index périmé.

## Invariants et règles

`main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; labos combat/exploration isolés ; 32 assets Survie historiques non migrés ; pas de multi-autorité ni nouveau gameplay. Lire `docs/GENSRPG_CHARTE.md` §§25–26, `docs/GENSRPG_CHECKPOINT_POLICY.md` et `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.

Précédent point de reprise : `docs/history/GENSRPG_CURRENT_WORK_PRE_D6_2026-10-15.md`.
