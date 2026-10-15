# GenSrpG — Point de reprise LIVE (15 octobre 2026)

**Phase 12 en cours : D1–D7 GREEN ; D8 ouvert au stade pré-extraction, NON GREEN (index exact requis §26).**

## Chantier actuel : D8, alléger index.html / Dungeon

- **Branche exclusive** : `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- **Checkpoint de départ §25** : `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15`, sur SHA **`20048a1b1059c0c2ad31df72d17c399065a1da49`** (exact dernier checkpoint D7 GREEN).
- **Dernier checkpoint final GREEN :** `checkpoint/gensrpg-phase12-dungeon-core214-d7-green-2026-10-15`, sur SHA `20048a1b1059c0c2ad31df72d17c399065a1da49`.
- **D7 triple CI confirmée** : [Architecture 38763178917](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178917), [Firefox 38763178876](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178876), [Tactical 38763178850](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178850), toutes SUCCESS sur SHA `20048a1b1059c0c2ad31df72d17c399065a1da49`.
- **Source requise §26 :** `index.html` au [permalink exact D7](https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/index.html), métadonnées Git vérifiées, **7 729 678 octets**, blob **`6e1cb9b82126409b633306b0e77a7e45badb0f79`**. Demander téléchargement et ZIP à l'utilisateur ; vérifier la copie contre ce blob. `b5.zip` est l'index D6 et ne peut pas servir pour D8.
- **Périmètre autorisé :** repérage d'un **seul propriétaire Dungeon inline encore actif**, puis extraction physique byte-identique en JS externe, au même emplacement et même ordre de chargement. **L'identité et la taille du prochain bloc restent à déterminer** après lecture locale de la source exacte ; ne pas présumer d'un Core215 ni d'un autre propriétaire.
- **Risques/protections :** aucun nouvel owner, effet de bord, script async/defer, wrapper ou règle gameplay ; conserver les chemins historiques Dungeon, navigation, fiche héros, parties/sauvegardes, Tactical Bridge, quatre modes séparés, 32 images Survie historiques et labos isolés. Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- **Tests obligatoires :** empreintes source/cible byte-exact, test de syntaxe, rollback D8→D7→D6→D5→D4→D3→D2→D1, sentinel d'owner et graphe runtime, CI Architecture/Chromium + Firefox + Tactical GREEN sur le même SHA et checkpoint final §25 uniquement après.
- **Prochaine action :** attendre le ZIP de l'index D7 exact demandé à l'utilisateur, valider l'empreinte Git, choisir un propriétaire actif isolé, documenter les contraintes exactes, préparer l'extraction et exécuter CI. **Aucune modification de `index.html` ou du runtime n'est autorisée avant cela.**
- Historique : [rapport D7](https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/docs/GENSRPG_PHASE12_DUNGEON_CORE214_D7_EXTRACTION_2026-10-15.md), charte `docs/GENSRPG_CHARTE.md`, policy `docs/GENSRPG_CHECKPOINT_POLICY.md`, roadmap `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.

## Résultat validé D7

- Core214 (`dungeonCore214SingleAuthority`) : 15 795 octets JS déplacés sans transformation vers `assets/gensrpg/dungeon/core214-single-authority-v1.js`, blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88` ; index obtenu 7 729 678 octets / blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`. Rollback exact validé.
- **Bilan D1–D7 :** 204 908 octets de JS externalisés ; 204 526 octets nets retirés d'index.html. Phase 12 non terminée ; le nombre de lots restants n'est pas déterminé.
- La clôture documentaire sur la branche D7 au commit `54941629850f391b91aed4365ae2ea89e1d5d446` n'a touché que les documents ; D8 repart volontairement du dernier **checkpoint code triple CI GREEN** `20048a1b1059c0c2ad31df72d17c399065a1da49`, et les informations documentaires vérifiées D7 sont reprises ici.

