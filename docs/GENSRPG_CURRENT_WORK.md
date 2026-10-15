# GenSrpG — Point de reprise LIVE (15 octobre 2026)

**Phase 12 en cours : D1–D7 GREEN ; D8 Core201 certifié et préparé, NON GREEN (application et CI en attente).**

## Chantier actuel : D8, alléger index.html / Dungeon

- **Branche exclusive** : `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- **Checkpoint de départ §25** : `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15`, sur SHA **`20048a1b1059c0c2ad31df72d17c399065a1da49`** (exact dernier checkpoint D7 GREEN).
- **Dernier checkpoint final GREEN :** `checkpoint/gensrpg-phase12-dungeon-core214-d7-green-2026-10-15`, sur SHA `20048a1b1059c0c2ad31df72d17c399065a1da49`.
- **D7 triple CI confirmée** : [Architecture 38763178917](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178917), [Firefox 38763178876](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178876), [Tactical 38763178850](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178850), toutes SUCCESS sur SHA `20048a1b1059c0c2ad31df72d17c399065a1da49`.
- **Source requise §26 :** `index.html` au [permalink exact D7](https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/index.html), métadonnées Git vérifiées, **7 729 678 octets**, blob **`6e1cb9b82126409b633306b0e77a7e45badb0f79`**. Demander téléchargement et ZIP à l'utilisateur ; vérifier la copie contre ce blob. `b5.zip` est l'index D6 et ne peut pas servir pour D8.
- **Périmètre autorisé :** repérage d'un **seul propriétaire Dungeon inline encore actif**, puis extraction physique byte-identique en JS externe, au même emplacement et même ordre de chargement. **L'identité et la taille du prochain bloc restent à déterminer** après lecture locale de la source exacte ; ne pas présumer d'un Core215 ni d'un autre propriétaire.
- **Risques/protections :** aucun nouvel owner, effet de bord, script async/defer, wrapper ou règle gameplay ; conserver les chemins historiques Dungeon, navigation, fiche héros, parties/sauvegardes, Tactical Bridge, quatre modes séparés, 32 images Survie historiques et labos isolés. Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- **Tests obligatoires :** empreintes source/cible byte-exact, test de syntaxe, rollback D8→D7→D6→D5→D4→D3→D2→D1, sentinel d'owner et graphe runtime, CI Architecture/Chromium + Firefox + Tactical GREEN sur le même SHA et checkpoint final §25 uniquement après.
- **Source §26 reçue et certifiée :** `c1.zip` / `index.html(11).txt`, 7 729 678 octets, Git blob `6e1cb9b82126409b633306b0e77a7e45badb0f79` = index D7 du checkpoint, sans dérive.
- **Propriétaire D8 unique sélectionné :** script actif `dungeonCore201Stability`, 13 990 octets, Git blob `7edf731fd1aa209ec96490fb8e2cb7af04afd627`; domaine Dungeon ; raccord combat via l'unique Bridge Tactical existant, sans mutation de Capture, Survie, PvP ou Shell.
- **Cible verrouillée :** `assets/gensrpg/dungeon/core201-stability-v1.js`, script classique et synchrone à sa position historique, sans changement d'un seul octet du JS. `index.html` attendu 7 715 741 octets, Git blob `f56dc5bbb368b176509ab16477bd4b24dd000497`, soit 13 937 octets nets retirés.
- **Risques et garde-fous :** ordre du chargement autour de Core200 et Core211, état runtime/sauvegarde Dungeon, panneaux d'ennemis, appel Bridge. Verrouillage du graphe des 101 fichiers atteignables, SHA de toute la chaîne de rollback D8→D1, syntaxe Node, tests navigateur et trois CI sur un SHA unique.
- **Statut : D8 NON GREEN**, publication/extraction contrôlée à faire sur la branche dédiée ; aucun checkpoint final avant tests et triple CI SUCCESS.
- **Prochaine action :** appliquer via workflow contrôlé verrouillé par blob, vérifier rétrocompatibilité et CI Architecture/Chromium + Firefox + Tactical, puis seulement clore GREEN.
- Historique : [rapport D7](https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/docs/GENSRPG_PHASE12_DUNGEON_CORE214_D7_EXTRACTION_2026-10-15.md), charte `docs/GENSRPG_CHARTE.md`, policy `docs/GENSRPG_CHECKPOINT_POLICY.md`, roadmap `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.

## Résultat validé D7

- Core214 (`dungeonCore214SingleAuthority`) : 15 795 octets JS déplacés sans transformation vers `assets/gensrpg/dungeon/core214-single-authority-v1.js`, blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88` ; index obtenu 7 729 678 octets / blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`. Rollback exact validé.
- **Bilan D1–D7 :** 204 908 octets de JS externalisés ; 204 526 octets nets retirés d'index.html. Phase 12 non terminée ; le nombre de lots restants n'est pas déterminé.
- La clôture documentaire sur la branche D7 au commit `54941629850f391b91aed4365ae2ea89e1d5d446` n'a touché que les documents ; D8 repart volontairement du dernier **checkpoint code triple CI GREEN** `20048a1b1059c0c2ad31df72d17c399065a1da49`, et les informations documentaires vérifiées D7 sont reprises ici.

