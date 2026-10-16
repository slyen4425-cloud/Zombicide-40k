# GenSrpG — Point de reprise LIVE (16 octobre 2026)

**Phase 12 ouverte : D1–D8 GREEN. D9 non ouvert.**

## Dernier lot validé : D8 Dungeon Core201 Stability

- **Branche dédiée D8 :** `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- **Base D8 et checkpoint de départ §25 :** `20048a1b1059c0c2ad31df72d17c399065a1da49`, `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15` (D7 GREEN).
- **Source exacte §26 reçue :** ZIP utilisateur `c1.zip` / `index.html(11).txt`, **7 729 678 octets**, Git blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`, vérifiée conforme au checkpoint D7.
- **Code déplacé byte-identique :** script inline unique `dungeonCore201Stability`, **13 990 octets**, Git blob `7edf731fd1aa209ec96490fb8e2cb7af04afd627`, vers `assets/gensrpg/dungeon/core201-stability-v1.js` ; script classique et synchrone à sa position initiale. Aucun changement de gameplay ou de propriétaire.
- **Index D8 actuel :** 7 715 741 octets, blob `f56dc5bbb368b176509ab16477bd4b24dd000497`, soit 13 937 octets nets retirés par D8. Retour D8→D7→D6→D5→D4→D3→D2→D1 byte-exact protégé, manifeste de 101 propriétaires atteignables.
- **Application contrôlée :** [workflow 38801893284](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38801893284) SUCCESS ; commit moteur `773fa7301980325c70acd336e267dd056e4a6273`.
- **GREEN officiel §25 :** trois CI [Architecture/Chromium 38803573910](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573910), [Firefox 38803573894](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573894), [Tactical 38803573930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573930) **SUCCESS au même commit `dd3f127041a78b9e7539ab1735cb188557a50ccc`** (contrats statiques, tests Chromium, Firefox et Tactical).
- **Checkpoint final D8 GREEN :** `checkpoint/gensrpg-phase12-dungeon-core201-d8-green-2026-10-16`, vérifié pointant exactement vers le SHA CI `dd3f127041a78b9e7539ab1735cb188557a50ccc`. La branche D8 a ensuite reçu des mises à jour de documentation seulement ; ne pas confondre HEAD documentaire et checkpoint de code GREEN.
- **Production `main` figée** : `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucun changement de combat, d'exploration, de Survie, de Capture, de PvP, ni des deux dépôts laboratoires. Les 32 assets historiques de Survie restent en place.

## Bilan et prochaine action

- **D1–D8 GREEN : 218 898 octets de JS externalisés ; 218 463 octets nets retirés d'`index.html`** (taille actuelle : 7 715 741 octets). Phase 12 encore ouverte ; nombre de lots restants non encore établi.
- **D9 n'est pas ouvert** : futur lot strictement isolé. Selon §25, créer un nouveau checkpoint de départ sur le dernier SHA GREEN, puis branche de travail distincte.
- **Procédure §26 obligatoire avant d'inspecter le prochain inline :** faire télécharger au besoin l'[index.html D8 exact au checkpoint GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/dd3f127041a78b9e7539ab1735cb188557a50ccc/index.html), longueur 7 715 741 octets / blob `f56dc5bbb368b176509ab16477bd4b24dd000497` ; vérifier la copie reçue avant tout usage. Les ZIP D7 et précédents sont périmés pour D9.
- Pour D9 : cartographier un propriétaire actif et isolé avant modification ; documenter cross-domain, ordre de chargement, sauvegardes, tests et rollback. Aucun changement de jeu et aucun nouveau checkpoint GREEN sans triple CI SUCCESS au même SHA.
- Références de reprise : `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`, [rapport D8](https://github.com/slyen4425-cloud/Zombicide-40k/blob/dd3f127041a78b9e7539ab1735cb188557a50ccc/docs/GENSRPG_PHASE12_D8_SCOPING_2026-10-15.md).
