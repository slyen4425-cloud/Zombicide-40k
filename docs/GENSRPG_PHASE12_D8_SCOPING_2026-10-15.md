# GenSrpG — Phase 12 / D8, pré-extraction (15 octobre 2026)

- Gouvernance §25 : base `20048a1b1059c0c2ad31df72d17c399065a1da49` triple CI GREEN ; checkpoint de départ `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15` ; branche `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- Métadonnées §26 : `index.html` D7 GREEN = 7 729 678 octets / Git blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`.
- Fichier transmis jusque-là : `b5.zip` contient index D6, 7 745 413 octets / blob `b5271e44dc4c14834a7725a869fb3c12386f2437`, **incompatible** avec D8.
- Copie exacte demandée : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/20048a1b1059c0c2ad31df72d17c399065a1da49/index.html` ; télécharger, compresser et joindre ; la vérification locale de l'empreinte avant usage est obligatoire.
- Périmètre futur limité à un script inline Dungeon actif, à cartographier exclusivement après réception du ZIP. Conserver le corps JS bit-à-bit, son chargement classique synchrone et son ordre de dépendances. Aucune réforme du gameplay ni des quatre modes.
- Invariants : réversibilité D8→D7→D6→D5→D4→D3→D2→D1 ; nouvelle sentinelle, manifest owner et tests navigateur, triple CI même SHA avant GREEN. Production main et laboratoires intacts.
- **Statut : EN ATTENTE DU ZIP SOURCE EXACT / NON GREEN**. Aucun runtime ou index modifié par le seul lancement de D8.
