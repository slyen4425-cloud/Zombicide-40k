# GenSrpG — Phase 12 / D8, pré-extraction (15 octobre 2026)

- Gouvernance §25 : base `20048a1b1059c0c2ad31df72d17c399065a1da49` triple CI GREEN ; checkpoint de départ `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15` ; branche `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- Métadonnées §26 : `index.html` D7 GREEN = 7 729 678 octets / Git blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`.
- Fichier transmis jusque-là : `b5.zip` contient index D6, 7 745 413 octets / blob `b5271e44dc4c14834a7725a869fb3c12386f2437`, **incompatible** avec D8.
- Copie exacte demandée : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/index.html` ; télécharger, compresser et joindre ; la vérification locale de l'empreinte avant usage est obligatoire.
- Périmètre futur limité à un script inline Dungeon actif, à cartographier exclusivement après réception du ZIP. Conserver le corps JS bit-à-bit, son chargement classique synchrone et son ordre de dépendances. Aucune réforme du gameplay ni des quatre modes.
- Invariants : réversibilité D8→D7→D6→D5→D4→D3→D2→D1 ; nouvelle sentinelle, manifest owner et tests navigateur, triple CI même SHA avant GREEN. Production main et laboratoires intacts.
- **Statut : EN ATTENTE DU ZIP SOURCE EXACT / NON GREEN**. Aucun runtime ou index modifié par le seul lancement de D8.

## Source certifiée, candidat D8 fixé

- **Source §26 reçue et certifiée :** `c1.zip` / `index.html(11).txt`, 7 729 678 octets, Git blob `6e1cb9b82126409b633306b0e77a7e45badb0f79` = index D7 du checkpoint, sans dérive.
- **Propriétaire D8 unique sélectionné :** script actif `dungeonCore201Stability`, 13 990 octets, Git blob `7edf731fd1aa209ec96490fb8e2cb7af04afd627`; domaine Dungeon ; raccord combat via l'unique Bridge Tactical existant, sans mutation de Capture, Survie, PvP ou Shell.
- **Cible verrouillée :** `assets/gensrpg/dungeon/core201-stability-v1.js`, script classique et synchrone à sa position historique, sans changement d'un seul octet du JS. `index.html` attendu 7 715 741 octets, Git blob `f56dc5bbb368b176509ab16477bd4b24dd000497`, soit 13 937 octets nets retirés.
- **Risques et garde-fous :** ordre du chargement autour de Core200 et Core211, état runtime/sauvegarde Dungeon, panneaux d'ennemis, appel Bridge. Verrouillage du graphe des 101 fichiers atteignables, SHA de toute la chaîne de rollback D8→D1, syntaxe Node, tests navigateur et trois CI sur un SHA unique.
- **Statut : D8 NON GREEN**, publication/extraction contrôlée à faire sur la branche dédiée ; aucun checkpoint final avant tests et triple CI SUCCESS.
