# GenSrpG Phase 12 — R12 : extraction contrôlée Dungeon RPG règles + progression + talents

Date 19 octobre 2026. **R12 GREEN certifié** sur le commit `0426ebe0ed619851c3c8ca9ed60afc33e39807ae` : 7/7 CI succès, checkpoint final créé. Phase 12 globale encore ouverte.

## START et source

- R11 GREEN certifié : `checkpoint/gensrpg-phase12-r11-disabled-script-retirement-green-2026-10-19` → `9f56f7c7f4576179663f816949159097e981329d`.
- START §25 sur le même SHA **avant la modification** : `checkpoint/gensrpg-start-phase12-r12-dungeon-rpg-rules-talents-2026-10-19` ; branche `work/gensrpg-phase12-r12-dungeon-rpg-rules-talents-2026-10-19`.
- Source §26 : l'archive `E1.zip` initiale R10 a été vérifiée par Git blob `b8ef8dcb497cad94c91094ed008136a5d9800155`, puis transformation R11 déterministe identique à l'outil certifié ; obtenu `index.html` de 1 934 253 octets / blob `f257bd9e193648dc62cd8a40d510831debfe045a`. Aucun HTML GitHub tronqué utilisé.
- Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucun merge vers `main` ni laboratoire.

## Frontière vérifiée avant extraction

- Parse TypeScript/JavaScript de l'anonyme n°22 (704 020 octets) : zéro erreur, fonctions déclarées au premier niveau identifiées à positions UTF-16 exactes.
- **36 fonctions** des règles RPG et progression Dungeon ; **15 fonctions** de définition des talents et slots ; **45 fonctions** d'édition/exécution des talents. **96 fonctions au total ; 70 586 octets de déclarations**.
- Toutes les fonctions sélectionnées sont uniques dans le monolithe, sans duplication de noms. Déclarations seules, pas de constantes/variables, listeners ou initialisations transportés.
- La bibliothèque de capacités générique Builders (14 fonctions incluant `openAbilityLibrary`, `renderAbilityLibrary`, `editAbilityLibraryEntry`), les fonctions de config/asset Dungeon adjacentes et les autres modes sont **délibérément exclus**.
- Propriétaire cible **Dungeon** : `assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js` chargé en script classique synchrone immédiatement avant le grand bloc ; aucune nouvelle autorité Core.

## Résultat attendu et gardes non négociables

- Index attendu après application : **1 863 745 octets**, Git blob **`b0d0c73292e4374fc4f23e86edffad5c1b39a7b6`** (–70 508 octets de HTML).
- Module attendu : **71 155 octets**, Git blob **`82c847234e75adbfe33ef70ca8f58fa1ebdc381d`**.
- La différence de taille du module et la réduction du HTML provient uniquement de l'en-tête, des séparateurs et du hook : les corps des 96 fonctions restent **byte-identiques**.
- Garanties : source et sorties Git hashes, 96 noms et frontières, VM JavaScript parse, ordre parser, sortie R12→R11 byte-exacte, pré-cache + version PWA, registre de propriétaire unique, sentinelles historiques et CI des quatre modules.
- La transformation s'effectue **sur le runner GitHub**, qui dispose du fichier exact ; le connecteur GitHub ne transporte pas l'énorme `index.html`.
- Après application, mettre à jour les sentinelles de composition uniquement selon les changements démontrés, puis Architecture+Chromium, Firefox, Tactical et rollback. Pas de checkpoint final si CI rouge.

Phase 12 EXIT reste ouverte après R12 : le code inline restant conserve des responsabilités multi-domaines.

## Résultat définitif — certification GREEN (19 octobre 2026)

- **SHA de code, source et tests certifiés** : [`0426ebe0ed619851c3c8ca9ed60afc33e39807ae`](https://github.com/slyen4425-cloud/Zombicide-40k/commit/0426ebe0ed619851c3c8ca9ed60afc33e39807ae).
- **7/7 checks SUCCESS sur ce même SHA** : `architecture-sentinels`, `browser-sentinel`, `dock-firefox`, `dock-chromium`, `dock-contract`, `firefox-wall-zoom`, `dungeon-rpg-rollback`. Quatre familles CI couvertes : Architecture+Chromium, Firefox, Tactical et rollback R12→R09.
- **Checkpoint final GREEN** : [`checkpoint/gensrpg-phase12-r12-dungeon-rpg-rules-talents-green-2026-10-19`](https://github.com/slyen4425-cloud/Zombicide-40k/tree/checkpoint/gensrpg-phase12-r12-dungeon-rpg-rules-talents-green-2026-10-19), pointant exactement vers `0426ebe0ed619851c3c8ca9ed60afc33e39807ae`, créé seulement après tous les succès.
- **Sorties runtime vérifiées** : `index.html` 1 863 745 octets / Git blob `b0d0c73292e4374fc4f23e86edffad5c1b39a7b6`; `assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js` 71 155 octets / Git blob `82c847234e75adbfe33ef70ca8f58fa1ebdc381d`. Gain HTML –70 508 octets ; 96 déclarations Dungeon originales à l'octet.
- **Adaptation des sentinelles, sans changer les règles** : restauration de la chaîne R12→R11→R10→R09, comptage du nouvel owner dans les manifestes et sentinelles Core Stats S6/S10/S11, Dice et composition ; les fonctions sont lues depuis leur fichier réel et les tests de résultats restent obligatoires. Le succès `browser-sentinel` a été observé sur le SHA exact.
- **Contrôle de périmètre** : aucun changement dans `main` (SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`), Capture/Survie/PvP/Combat Tactical restent exclus du lot, pas de fusion et aucun des laboratoires externes modifié. Aucun test manuel de gameplay non réalisé n'est revendiqué.
- **Reprise** : checkpoint R12 GREEN ci-dessus. Aucun nouveau lot sans checkpoint START §25 sur son vrai SHA de base, puis nouvelle vérification source §26. **Phase 12 EXIT non encore certifiée**.
