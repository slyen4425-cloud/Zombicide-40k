# GenSrpG — CURRENT_WORK officiel (19 octobre 2026)

## Phase 12 / R12 — Dungeon RPG règles, progression et talents (lot engagé, aucune production modifiée)

- **Dernier checkpoint GREEN** : `checkpoint/gensrpg-phase12-r11-disabled-script-retirement-green-2026-10-19` → `9f56f7c7f4576179663f816949159097e981329d`, 7/7 CI SUCCESS. R11 retire les 17 scripts inertes ; `index.html` 1 934 253 octets, blob `f257bd9e193648dc62cd8a40d510831debfe045a`.
- **START §25 fait avant le code** : `checkpoint/gensrpg-start-phase12-r12-dungeon-rpg-rules-talents-2026-10-19` → `9f56f7c7f4576179663f816949159097e981329d`. Branche dédiée `work/gensrpg-phase12-r12-dungeon-rpg-rules-talents-2026-10-19`.
- **Source §26 exacte** : `E1.zip` fourni par l'utilisateur (R10 Git blob `b8ef8dcb497cad94c91094ed008136a5d9800155`) ; application locale, byte-exacte et certifiée du retrait R11 ; source finale R11 1 934 253 octets / Git blob `f257bd9e193648dc62cd8a40d510831debfe045a`, identique au checkpoint GREEN. Ne pas lire une copie non certifiée du gros HTML depuis GitHub.
- **Périmètre R12 déclaré** : **Dungeon seul**, règles RPG, progression des personnages, configuration et talents Dungeon ; 96 fonctions top-level historiques réparties en trois groupes AST (36+15+45), **70 586 octets de corps source**. Déplacer des déclarations à l'octet sans modifier de comportement, conserver la position de chargement classique.
- **Exclusions strictes** : fonctions de bibliothèque de capacités générique / Builders, Core stats partagé, création de héros et équipement, runtime Capture, Survie, PvP, Combat Tactical, PWA hors entrée de pré-cache. Aucun nouveau moteur ni autorité concurrente.
- **Garde-fous** : source/hash strict R11, propriété unique `assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js`, reconstruction R12→R11 byte-identique puis R11→R10→R09, parse VM, position parser, pré-cache et version PWA, inventaires de chargement mis à jour seulement sur preuve, toutes CI Architecture + navigateur / Firefox / Tactical / rollback obligatoires sur SHA unique.
- **Statut** : audit AST local terminé, démarrage de l'extraction contrôlée à venir ; **aucun GREEN R12 revendiqué** avant CI et checkpoint. `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucun merge ni modification des deux labos.
- **Prochaine étape** : installer l'outil et la CI d'application contrôlée, effectuer l'extraction sous gardes, corriger les sentinelles historiques selon les changements strictement démontrés, certifier ou revenir au START.

Charte : `docs/GENSRPG_CHARTE.md` §§9, 13, 18, 25, 26. Rapport R11 : `docs/GENSRPG_PHASE12_R11_DISABLED_SCRIPT_RETIREMENT_2026-10-19.md`.
