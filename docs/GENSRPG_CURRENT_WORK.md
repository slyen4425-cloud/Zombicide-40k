# GenSrpG — point de reprise LIVE

Date : 13 octobre 2026. **Phase 12 en cours ; D1, D2 et D3 sont GREEN. D4 n'est pas ouvert.**

## Dernier jalon GREEN — D3 Dungeon MJ72

- **Checkpoint GREEN :** `checkpoint/gensrpg-phase12-dungeon-mj72-d3-green-2026-10-13` — SHA `2ec9e6dc5f13e9ea19234f6167641f6ccfd61dbb`, testé intégralement.
- **Branche du lot :** `work/gensrpg-phase12-dungeon-mj72-d3-extraction-2026-10-13`. Départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-mj72-d3-extraction-2026-10-13` à `370da67fc163576c8e1a78f8b01e5beaf9236d64`, déjà triple CI GREEN. L'état documentaire post-GREEN reste sur la branche, sans déplacement du checkpoint validé.
- **Source exacte §26 :** ZIP utilisateur `ar.zip` / `index.html(4).txt`, 7 863 589 octets, Git blob `e5f8895495f969597a6c209fcc29afd66b7a0636`.
- **Livraison D3 :** `dungeonMj72_2Script` — 27 511 octets, Git blob `8304087b15bbbf5f71c22b7f8c916e0a78b1b905` — déplacé à l'identique vers `assets/gensrpg/dungeon/mj72-scene-v1.js`. Chargement synchrone classique, même emplacement parser ; aucun moteur, fonction ou gameplay modifié.
- **Index après D3 :** 7 836 124 octets, Git blob **`972f0e0be12fac14427853fbcd7abe5233eb5a8c`**. Reconstitution D3 → D2 → D1 → source originale byte-exact couverte par les sentinelles.
- **Triple CI sur le SHA GREEN :** [Architecture / Chromium 38460988097](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988097) SUCCESS (356 contrôles structurels + navigateur), [Firefox 38460988091](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988091) SUCCESS et [Tactical 38460988049](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988049) SUCCESS.
- **Workflow d'application contrôlée :** [38459404192](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38459404192), SUCCESS ; commit initial `7a2242ab825b95707b671207106c73d216cfaf5f`.
- Rapport : `docs/GENSRPG_PHASE12_DUNGEON_MJ72_D3_EXTRACTION_2026-10-13.md`.

## Bilan Phase 12

- D1 Core01 GREEN : checkpoint `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13`, extraction 22 768 octets.
- D2 Core051 GREEN : checkpoint `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13`, extraction 47 962 octets.
- D3 MJ72 GREEN : checkpoint ci-dessus, extraction 27 511 octets.
- **Total : 98 241 octets de JS externalisés ; 98 080 octets nets retirés de l'index initial** (7 934 204 → 7 836 124 octets). **Phase 12 globale non terminée.**

## Suite : D4 (pas encore commencé)

- Ne pas débuter sur une ancienne copie d'index. Appliquer d'abord §26 : demander au propriétaire l'**index après D3**, lien permanent certifié : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/2ec9e6dc5f13e9ea19234f6167641f6ccfd61dbb/index.html`, ZIP à joindre. Vérifier **7 836 124 octets** et blob **`972f0e0be12fac14427853fbcd7abe5233eb5a8c`** avant toute lecture ou transformation de ce fichier.
- Cartographier alors **un seul propriétaire actif** cohérent (Dungeon ou autre selon frontières), préserver l'ordre de chargement, les globals lexicaux et le comportement.
- Créer avant toute modification D4 son **checkpoint de départ §25** au dernier SHA triple CI GREEN approprié, puis **sa branche unique** ; documenter propriétaire, risque, invariants et sentinelles.
- Exiger tests réels browser + Architecture/Chromium, Firefox et Tactical SUCCESS **au même SHA** avant tout checkpoint D4 GREEN. Pas d'accumulation de micro-audits ni d'extraction de scripts désactivés.

## Invariants intangibles

- `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Laboratoires **combat** et **exploration** indépendants ; aucun de leurs fichiers modifié. Les 32 images historiques Survie restent en place.
- Survie, Dungeon, Capture, PvP (chantier non-jouable), Tactical, Shell et Core gardent leurs responsabilités. Aucune refonte du gameplay ou de la persistance pendant l'externalisation.
- Lecture obligatoire avant toute reprise : `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`, puis ce fichier.

Historique détaillé précédent archivé dans `docs/history/GENSRPG_CURRENT_WORK_PRE_D3_GREEN_2026-10-13.md` ; historique antérieur dans `docs/history/GENSRPG_CURRENT_WORK_HISTORY_PRE_D1_2026-10-13.md`.
