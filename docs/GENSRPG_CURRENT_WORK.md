# GenSrpG — Point de reprise LIVE (16 octobre 2026)

**Phase 12 en cours : D1–D9 GREEN. D10 n'est pas ouvert.**

## Dernier lot validé — D9 Dungeon Core202 Content Density

- **Branche dédiée :** `work/gensrpg-phase12-dungeon-d9-extraction-2026-10-16`.
- **Base §25 :** D8 GREEN `dd3f127041a78b9e7539ab1735cb188557a50ccc` ; checkpoint de départ `checkpoint/gensrpg-start-phase12-dungeon-d9-extraction-2026-10-16`.
- **Source exacte §26 :** ZIP reçu `c2.zip` / `index.html(12).txt` ; 7 715 741 octets, blob `f56dc5bbb368b176509ab16477bd4b24dd000497`, certifié égal au checkpoint D8.
- **Extraction :** l'unique IIFE `dungeonCore202ContentDensity` (11 821 octets, blob `364673f3dd35bfa8be7f378152f775656c9243e2`) déplacée byte-identique vers `assets/gensrpg/dungeon/core202-content-density-v1.js`. Script classique synchrone au même emplacement de parseur, garde `authored202` des mondes personnalisés intacte, aucun changement de gameplay.
- **Index D9 :** **7 703 979 octets**, blob `fce949665fea47a2aa2a535ede7289b06936f986`, soit 11 762 octets nets retirés par D9 ; 102 propriétaires JS atteignables. Rollback byte-exact D9→D8→D7→D6→D5→D4→D3→D2→D1 testé.
- **Application contrôlée :** [workflow 38866855495](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38866855495) SUCCESS, commit moteur `9dcbecc29ea2c366c8d5a2e177902df8d89c5b08`.
- **GREEN FINAL sur le même SHA `83d6683896cdb58a63f98cf2fc3e360c23423f76` :** [Architecture/Chromium 38867846431](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846431), [Firefox 38867846444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846444), [Tactical 38867846636](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846636), toutes **SUCCESS**.
- **Checkpoint final §25 :** `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16`, confirmé pointant exactement au SHA triple CI GREEN `83d6683896cdb58a63f98cf2fc3e360c23423f76`. Des correctifs ont seulement ajusté les sentinelles d'inventaire des propriétaires et les vues historiques (sans changer le JS Core202). Les contrôles hérités restent stricts.
- **Rapport complet :** `docs/GENSRPG_PHASE12_D9_SCOPING_2026-10-16.md`.
- **Invariants :** production `main` gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun changement aux labos combat ou exploration, aux modes Capture, Survie, PvP, aux 32 images Survie historiques, ni à la logique Tactical ou aux sauvegardes.

## Bilan et prochaine action

- **D1–D9 GREEN : 230 719 octets de JS externalisés ; 230 225 octets nets retirés d'`index.html`.** Phase 12 toujours ouverte ; nombre de lots encore nécessaires indéterminé.
- **D10 non ouvert.** Appliquer §25 avant tout code : checkpoint de départ fondé sur le dernier SHA D9 GREEN, branche exclusive, périmètre unique.
- **Source obligatoire §26 pour D10 :** [index.html au SHA D9 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/83d6683896cdb58a63f98cf2fc3e360c23423f76/index.html), **7 703 979 octets**, blob `fce949665fea47a2aa2a535ede7289b06936f986`. Demander à l'utilisateur de télécharger et joindre cette copie compressée en ZIP pour identifier le prochain propriétaire inline. `c2.zip` est désormais périmé pour D10.
- Conserver l'ordre parser, les propriétaires et l'absence de changements fonctionnels ; triple CI au même SHA puis nouveau checkpoint final seulement après vérification. Références : `docs/GENSRPG_CHARTE.md` §§25–26, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
