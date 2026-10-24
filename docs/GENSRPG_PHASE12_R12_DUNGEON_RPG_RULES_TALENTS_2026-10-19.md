# GenSrpG Phase 12 — R12 : extraction contrôlée Dungeon RPG règles + progression + talents

Date 19 octobre 2026. **Statut initial : candidat prouvé par AST, procédure d'application sous gardes ; ne pas annoncer GREEN avant quatre familles CI sur un SHA unique.**

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
