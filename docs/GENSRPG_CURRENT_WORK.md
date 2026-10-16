# GenSrpG — CURRENT_WORK LIVE (16 octobre 2026)

**Phase12 : D1–D9 GREEN ; audit remaining-inline documenté ; lot R01 PWA ouvert en préflight, NON GREEN. D10 Core203 NON ouvert.**

## Lot actif R01 — manifeste PWA dynamique (734 440 octets)

- **Base runtime certifiée D9 GREEN** : `83d6683896cdb58a63f98cf2fc3e360c23423f76` / `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16`, Architecture [38867846431](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846431), Firefox [38867846444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846444), Tactical [38867846636](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846636) SUCCESS au même SHA.
- **Base de documents** : `d26f4a3219d34aac229c0ee71a0f489915c83129` (audit de sortie, documentation uniquement, même index D9). **Checkpoint de départ §25** : `checkpoint/gensrpg-start-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16` sur ce SHA. **Branche unique R01** : `work/gensrpg-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16`.
- **Source à recevoir §26 AVANT toute extraction runtime** : [index.html D9 exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/83d6683896cdb58a63f98cf2fc3e360c23423f76/index.html), **7 703 979 octets**, Git blob `fce949665fea47a2aa2a535ede7289b06936f986`. Demander ZIP de cette version ; `c2.zip` est la source D8, pas le ZIP D9 requis.
- **Propriétaire unique visé** : IIFE anonyme de manifeste PWA `734 440 octets` / blob `778e3acf2f77b3c7680bf70a0c6a846b84826235`. Destination `assets/gensrpg/shell/pwa-manifest-dynamic-v1.js`. Projection sans exécution : index `6 969 593 octets`, blob `caf31c121d926b7b76b9bb05688fab8f2839814e`, gain net `734 386` octets.
- **Invariants** : script classique synchrone au même ordre ; conserver `Blob` et `gensManifestLink.href`, les deux PNG inline PWA pendant R01 et les manifestes statique/dynamique séparés ; pas de changement Shell, moteurs, sauvegardes ni comportements smartphone/PWA.
- **Préflight** : source JS et test de caractérisation piné ; aucun code de jeu ni fichier `index.html` modifié à ce stade. Tests obligatoires : preuve réversible R01→D9→D1, PWA lien/installation/cache, architecture/Chromium, Firefox, Tactical sur un même SHA avant GREEN.
- **Risques** : source HTML ~7 Mo §26, manifeste dynamique prioritaire sur statique et différence d'icônes, imports PWA, anciennes sentinelles index et graph.
- **Prochaine action :** recevoir le ZIP D9 à partir du permalink §26, le vérifier et alors seulement appliquer et valider R01. Ne pas ouvrir R02/Core203 avant R01 GREEN.
- **Rapports** : `docs/GENSRPG_PHASE12_R01_PWA_MANIFEST_2026-10-16.md`, `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md`. La charte §§25–26 reste impérative ; `main` `e8681f9823573ced8aec59c8ddc47a72b02bc663` et les labos ne changent pas.

## Bilan

D1–D9 : **230 719 octets JS externalisés**, **230 225 octets nets retirés** ; index actuel 7 703 979 octets. Sortie Phase12 pilotée par catégories A/B/C et **17 enveloppes indicatives**, estimation 12–20 lots réels non garantie. Priorité aux grands scripts anonymes, pas aux dizaines de petits blocs Dungeon numérotés.
