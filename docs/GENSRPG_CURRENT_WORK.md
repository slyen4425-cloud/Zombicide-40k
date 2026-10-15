# GenSrpG — Point de reprise LIVE (15 octobre 2026)

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
