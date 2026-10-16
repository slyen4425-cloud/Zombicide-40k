# GenSrpG — Point de reprise LIVE (16 octobre 2026)

**Phase 12 en cours : D1–D8 GREEN. D9 ouvert / pré-extraction seulement, NON GREEN.**

## Lot courant D9 — sélectionner un propriétaire Dungeon inline actif

- **Branche de travail dédiée §25 :** `work/gensrpg-phase12-dungeon-d9-extraction-2026-10-16` ; aucun autre mode, laboratoire ou branche de production concerné.
- **Base D9 :** SHA `dd3f127041a78b9e7539ab1735cb188557a50ccc` — SHA exact du dernier checkpoint GREEN D8 `checkpoint/gensrpg-phase12-dungeon-core201-d8-green-2026-10-16` ; Architecture/Chromium [38803573910](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573910), Firefox [38803573894](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573894), Tactical [38803573930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573930) **SUCCESS sur le même SHA**.
- **Checkpoint de départ D9 §25 :** `checkpoint/gensrpg-start-phase12-dungeon-d9-extraction-2026-10-16`, sur le SHA D8 GREEN `dd3f127041a78b9e7539ab1735cb188557a50ccc`, créé avant toute modification.
- **Source indispensable §26 :** [`index.html` exact après D8](https://github.com/slyen4425-cloud/Zombicide-40k/blob/dd3f127041a78b9e7539ab1735cb188557a50ccc/index.html), **7 715 741 octets**, Git blob **`f56dc5bbb368b176509ab16477bd4b24dd000497`** (métadonnées Git vérifiées). Demander à l'utilisateur de télécharger ce lien, compresser en ZIP et le joindre. Vérifier ensuite l'empreinte avant de lire/modifier. Les ZIP `c1.zip`, `b5.zip`, etc., sont des états antérieurs.
- **Périmètre et propriétaire :** un seul script JavaScript inline actif du domaine Dungeon, **identifié et certifié : `dungeonCore202ContentDensity`** (11 821 octets / blob `364673f3dd35bfa8be7f378152f775656c9243e2`), source utilisateur `c2.zip` byte-identique à D8. Destination prévue `assets/gensrpg/dungeon/core202-content-density-v1.js`. Après réception, cartographier propriétaire et domaines croisés, position, dépendances, API globales, effets de bord, chargement et usages avant sélection. Aucune extraction sans validation du contenu exact.
- **Invariants :** transfert physique octet pour octet en fichier JS externe synchrone à position parser identique ; aucun remaniement gameplay, combat, stats, navigation, sauvegardes, Shell ou modules Survie/Capture/PvP/Tactical. 32 assets Survie historiques immobiles, laboratoires combat/exploration isolés, `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucune double autorité.
- **Tests exigés :** SHA Git source et corps JS, node --check, restauration byte-identique D9→D8→D7→D6→D5→D4→D3→D2→D1, graphe de chargement, manifest de propriétaires, sentinelles et éventuels appels inter-modules, Architecture/Chromium + Firefox + Tactical SUCCESS sur un même SHA. Checkpoint final D9 GREEN interdit avant ces critères.
- **Risques connus :** gros `index.html` : lecture via connecteur GitHub interdite par §26 ; propriétaires Dungeon historiques actifs, callbacks/ordre parser, sessions et vieux points d'entrée Tactical. Éviter tout wrapper additionnel ou refonte pendant cette extraction.
- **Prochaine action :** script d'application contrôlée et sentinelle autorité `gens_authored_core202_boundary_v11411.test.cjs` préservant les exceptions pour les mondes authored ; migration byte-exacte et rollback, puis CI Architecture/Chromium, Firefox, Tactical au même SHA. D9 NON GREEN, aucune modification de runtime encore réalisée.
- Rapport D9 : `docs/GENSRPG_PHASE12_D9_SCOPING_2026-10-16.md`.

## Dernier jalon clos : D8 Dungeon Core201 Stability

- Source `c1.zip` validée pour D8 (index D7 **7 729 678 octets**, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`).
- Bloc Dungeon `dungeonCore201Stability` déplacé **byte-identique**, **13 990 octets** vers `assets/gensrpg/dungeon/core201-stability-v1.js`, blob `7edf731fd1aa209ec96490fb8e2cb7af04afd627`.
- Index actuel **7 715 741 octets** (blob `f56dc5bbb368b176509ab16477bd4b24dd000497`). Rollback D8→D1 confirmé.
- Checkpoint GREEN `checkpoint/gensrpg-phase12-dungeon-core201-d8-green-2026-10-16` au SHA `dd3f127041a78b9e7539ab1735cb188557a50ccc`. Documentation D8 clôturée sur branche précédente dans `docs/GENSRPG_PHASE12_D8_SCOPING_2026-10-15.md`.
- **Cumul Phase 12 D1–D8 : 218 898 octets JS externalisés ; 218 463 octets nets retirés de l'index initial**. Phase 12 non terminée, nombre de lots restants inconnu.
- Règles : `docs/GENSRPG_CHARTE.md` §§25–26, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
