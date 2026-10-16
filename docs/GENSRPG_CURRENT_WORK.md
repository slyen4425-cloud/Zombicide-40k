# GenSrpG — CURRENT_WORK officiel (16 octobre 2026)

**Phase12 : D1–D9 GREEN, R01 GREEN, R02 GREEN, R03 Shell Hub Family UI GREEN (technique/CI). Phase12 globale toujours OUVERTE.** Aucun chantier suivant ouvert. Ne pas reprendre D10/Core203 mécaniquement.

## Dernier checkpoint GREEN du code

- **Checkpoint R03 §25** : `checkpoint/gensrpg-phase12-r03-shell-hub-family-ui-extraction-green-2026-10-16`, commit exact `afab707dad385450fdf296f7b2b6b41da376929b` ([source du checkpoint](https://github.com/slyen4425-cloud/Zombicide-40k/blob/afab707dad385450fdf296f7b2b6b41da376929b/index.html)).
- **Branche R03 retenue** : `work/gensrpg-phase12-r03-shell-hub-family-ui-extraction-2026-10-16` ; un commit documentaire de clôture peut être au-dessus du code GREEN, sans changer les blobs du runtime.
- **Base du chantier** : `e8700f10aca7d4f3b9c85aa3cd4dc11aae6530ab` ; checkpoint de départ `checkpoint/gensrpg-start-phase12-r03-shell-hub-family-ui-extraction-2026-10-16` sur ce SHA, après R02 code GREEN `b5f923fa0426467827c12696ad9a4a02f24e3b6f`.
- **Source exacte §26 R03** : ZIP utilisateur `c6.zip` / `index.html(15).txt`, 2 869 485 octets, Git blob `062c4cd37634f504cc75ce3329d6e69e19b5f547`. C'est **R02** ; ne pas réutiliser pour modifier le futur index après R03.

## R03 : fonctions Shell Hub déplacées — aucune refonte métier

- Propriétaire : Shell / présentation Hub. Six fonctions transférées sans réécriture : `renderGensRpgUniverseCards`, `renderGensSurvivalUniverseCards`, `renderGensFamilyGamesIfVisible`, `openGensFamily`, `gensFamilyForProfileId`, `renderGensGameHomeLight`.
- Destination : `assets/gensrpg/shell/legacy-hub-family-ui-v1.js`, **6 651 octets**, Git blob `e45f3b4e419a10b030c47bc921bded1ec0dc723b` ; script classique synchrone au même endroit parser, sans propriétaire global supplémentaire.
- **Nouvel index physique** : **2 862 906 octets**, Git blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b` ; gain net **6 579 octets HTML** par rapport à R02. Corps du monolithe réduit d'environ 6,65 Ko mais contient encore plusieurs domaines.
- Rollback déterministe **R03→R02→R01** et tests des vues historiques : vérifiés, sans modifier les moteurs ou la logique métier. Pré-cache du nouveau module dans `service-worker.js`, version de cache actualisée, manifeste propriétaire actualisé.
- Fonctions et états **hors périmètre** : `newGame`, `resumeGame`, `startConfiguredGame`, `openGensBuiltInGame`, sauvegardes, IndexedDB, moteurs des quatre modes, scripts Tactical. 32 visuels Survie historiques inchangés.

## Tests et CI confirmés au SHA unique R03

- **Application contrôlée** : [run 38942880813](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38942880813) SUCCESS (transfert, JS syntaxique, valeurs byte-exactes, rollback).
- **CI Architecture/Chromium et navigateurs** : [38946742376](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742376) SUCCESS (inclut test de la frontière Shell R03, restauration et sentinelles navigateur).
- **Firefox** : [38946742392](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742392) SUCCESS.
- **Tactical Chromium/Firefox** : [38946742410](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742410) SUCCESS.
- Toutes ces CI finales portent le **même commit `afab707dad385450fdf296f7b2b6b41da376929b`** ; les six checks GitHub de ce SHA sont SUCCESS.
- **Limite explicite** : tests Chromium/Firefox automatisés, mais **aucune installation Android manuelle, aucun essai sur appareil réel hors ligne et aucune validation utilisateur ciblée R03 attestés**. GREEN ici = jalon de code/CI, pas publication `main` ni promesse de parité Android observée.

## Reprise suivante et garde-fous

- Bornage R03–R07 restant : séparer code Shell, Survie, Dungeon, Capture, stockage/éditeurs **par propriétaires prouvés** dans le monolithe historique (environ 1,26 Mo avant R03), pas en externalisant tout en un moteur fictif ni en reprenant les 80 petits Core Dungeon.
- Pour la prochaine modification de `index.html`, appliquer §26 sur le **nouveau SHA R03 GREEN** : [index exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/afab707dad385450fdf296f7b2b6b41da376929b/index.html) ; demander le ZIP du nouvel index seulement si l'accès à son contenu exact est indispensable.
- Préserver `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`, les laboratoires combat/exploration, les quatre modules et les sauvegardes. Branches R02 concurrentes archivées dans leur historique sans fusion.
- Détails : `docs/GENSRPG_PHASE12_R03_SHELL_HUB_FAMILY_UI_2026-10-16.md`, `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md`.
