# CHANTIER ACTIF — PHASE 12 / D3 Dungeon MJ72 Scene (13 octobre 2026)

**État D3 : extraction physique publiée, triple CI en attente sur un SHA commun.**

- Application contrôlée [38459404192](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38459404192) : SUCCESS ; commit runtime exact [7a2242a](https://github.com/slyen4425-cloud/Zombicide-40k/commit/7a2242ab825b95707b671207106c73d216cfaf5f).
- Index final : 7 836 124 octets, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`. Module externe MJ72 : 27 511 octets, blob `8304087b15bbbf5f71c22b7f8c916e0a78b1b905`. Code inchangé, chargement classique à sa place.
- Gate : **NE PAS** créer D3 GREEN avant Architecture/Chromium, Firefox, Tactical SUCCESS sur le même SHA final. Les documentations sont distinctes des commits runtime.
- Prochaine action : analyse des trois CI et correction strictement ciblée des sentinelles de cartographie/snapshots si besoin.

- **Base GREEN :** `370da67fc163576c8e1a78f8b01e5beaf9236d64` ; triple CI Architecture/Chromium [38431606561](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38431606561), Firefox [38431606505](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38431606505) et Tactical [38431606512](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38431606512), toutes SUCCESS sur le même SHA. Dernier checkpoint D2 GREEN : `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13` sur `06c3608f36d020ac4f470de4dbe4ca272da3b897`.
- **Checkpoint de départ D3 :** `checkpoint/gensrpg-start-phase12-dungeon-mj72-d3-extraction-2026-10-13` à `370da67fc163576c8e1a78f8b01e5beaf9236d64`.
- **Branche dédiée D3 :** `work/gensrpg-phase12-dungeon-mj72-d3-extraction-2026-10-13`, depuis exactement cette base. Aucun autre lot ouvert par la présente reprise.
- **Preuve source §26 :** ZIP utilisateur `ar.zip`, entrée `index.html(4).txt` : 7 863 589 octets, blob Git `e5f8895495f969597a6c209fcc29afd66b7a0636`, copie exacte de l'index sur le SHA de départ.
- **Propriétaire ciblé :** bloc actif classique `<script id="dungeonMj72_2Script">`, propriétaire Dungeon (scene state, helpers rareté/contenu, éléments de scène), sans `crossDomains` dans `docs/GENSRPG_PHASE2_INLINE_OWNERS.json`.
- **Mouvement prévu :** 27 511 octets de JavaScript, blob `8304087b15bbbf5f71c22b7f8c916e0a78b1b905`, vers `assets/gensrpg/dungeon/mj72-scene-v1.js`, avec tag `<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>` au même emplacement parser, code inchangé et script classique conservé. Index attendu 7 836 124 octets, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`.
- **Risque principal :** déclarations `const` / fonctions top-level et dépendances entre scripts classiques ; protéger la portée globale lexicale et l'ordre d'exécution, éviter `type=module`, IIFE ou chargement différé. Aucun changement comportemental.
- **Invariants :** `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`, Survie, Capture, PvP, Tactical, Core et Shell inchangés, deux laboratoires intacts, 32 images historiques Survie intactes.
- **Validation :** reconstruction octet exacte D3 → D2 → D1, JS syntaxique, manifeste propriétaires, graphe de scripts, tests navigateur Dungeon/Survie/Capture/PvP/Tactical et triple CI sur même SHA. **D3 non GREEN avant la CI complète.**
- **État :** D3 extrait et publié, validations complètes en cours ; pas encore de checkpoint GREEN.

---

# GenSrpG — point de reprise LIVE

Date : 13 octobre 2026. **Phase 12 en cours — D1 et D2 GREEN.** Aucun D3 ouvert.

## Dernier checkpoint GREEN : D2 Dungeon Core051

- **Checkpoint :** `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13`.
- **SHA testé :** `06c3608f36d020ac4f470de4dbe4ca272da3b897`.
- **Branche du lot D2 :** `work/gensrpg-phase12-dungeon-core051-extraction-2026-10-13`, départ `checkpoint/gensrpg-start-phase12-dungeon-core051-extraction-2026-10-13` depuis `11813ebc8d40ba976041f0be78d698cf2314b2dc`.
- **Preuve source §26 :** ZIP utilisateur `a3.zip`, copie exacte de l'index de départ D2 (7 911 489 octets, blob `2921ebadacf6f660e815d9ff7712e44cd765fbdd`).
- **Livraison D2 :** `dungeonCore051ExplorationPolish` extrait sans modifier son JS vers `assets/gensrpg/dungeon/core051-exploration-polish-v1.js` (47 962 octets ; blob `d7ec321ffa05b8749de5d7bf9e8264e55b24f919`). L'index actif passe à **7 863 589 octets**, blob Git `e5f8895495f969597a6c209fcc29afd66b7a0636`. Les deux extractions D2 puis D1 restent reconstructibles octet par octet.
- **Triple CI D2 sur le même SHA** : [Architecture/Chromium 38428721362](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721362) SUCCESS (356 sentinelles structurelles + navigateur) ; [Firefox 38428721028](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721028) SUCCESS ; [Tactical 38428721250](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721250) SUCCESS.
- **Rapport complet :** `docs/GENSRPG_PHASE12_DUNGEON_CORE051_EXTRACTION_2026-10-13.md`. La dernière mise à jour documentaire est postérieure au checkpoint GREEN et n'en altère pas le code testé.

## Checkpoint précédent : D1 Dungeon Core01

- `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13` au SHA `5d8d0d37982ac2987bd4c72326de28318a4687c6`.
- `assets/gensrpg/dungeon/core01-session-ui-v1.js` : 22 768 octets déplacés et validés.
- **Après D1 + D2 :** 70 730 octets de JS déplacés hors de l'index ; **70 615 octets nets retirés**. Phase 12 globale toujours ouverte.

## Prochaine étape — lot D3

- **D3 non commencé et aucun propriétaire choisi** : sélectionner un bloc cohérent et autonome, sans multiplications de micro-audits.
- **§25 :** avant tout changement D3, créer un nouveau checkpoint de départ au dernier SHA GREEN puis une branche dédiée.
- **§26 :** demander l'**index exact après D2** à l'utilisateur depuis `https://github.com/slyen4425-cloud/Zombicide-40k/blob/06c3608f36d020ac4f470de4dbe4ca272da3b897/index.html`, ZIP à recevoir, vérifier taille **7 863 589 octets** et blob `e5f8895495f969597a6c209fcc29afd66b7a0636` avant toute analyse ou modification de son contenu.
- Tests nécessaires : reconstruction exact des anciens index, graphe propriétaires, tests vrai navigateur et CI triple même SHA ; pas de livraison D3 GREEN prématurée.

## Invariants stricts

- `main` demeure gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Les laboratoires combat et exploration sont indépendants, sans modification ni migration de leurs assets.
- Les 32 images historiques Survie `assets/img_*` restent en place ; pas de migration générale.
- Survie, Dungeon, Capture et PvP ont leurs responsabilités séparées ; PvP gameplay non commencé ; Shell seul maître de la navigation, Core des services communs.
- Pas de changement de gameplay, de sauvegarde, de PWA ni d'autorité globale dans le cadre des extractions.
- Avant reprise : lire `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` et ce fichier.

Historique de reprise conservé dans `docs/history/GENSRPG_CURRENT_WORK_HISTORY_PRE_D1_2026-10-13.md` ; rapport D1 : `docs/GENSRPG_PHASE12_DUNGEON_CORE01_EXTRACTION_2026-10-13.md`.
