# GenSrpG — CURRENT_WORK officiel (20 octobre 2026)

## Phase 12 — Dungeon → Tactical : vrai premier tour (START / NON GREEN)

- **Dernier GREEN :** `checkpoint/gensrpg-phase12-dungeon-tactical-handoff-green-2026-10-20`, SHA exact `d35a0a5fd8228863c87a2da130fb1cc46a84679d`, [CI 39468714263](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39468714263) SUCCESS Chromium/Firefox sur **ouverture effective** de Tactical ; dégâts, AI, victoire et reprise NON testés à ce checkpoint.
- **§25 START créé AVANT toute modification :** `checkpoint/gensrpg-start-phase12-dungeon-tactical-first-turn-2026-10-20` au SHA `d35a0a5fd8228863c87a2da130fb1cc46a84679d` ; branche dédiée `work/gensrpg-phase12-dungeon-tactical-first-turn-2026-10-20` issue exactement de ce SHA.
- **§26 index.html** : code exact R15 inchangé, 1 729 855 octets, Git blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` ([lien permanent](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html)). Pas de lecture ni mutation du gros HTML via l'API.
- **Objectif du lot** : sur le *vrai parcours UI* du profil Dungeon, création de salle 1 et squelette réels, ouverture de Tactical, cliquer réellement sur une commande de héros, constater état moteur, une action de l'IA et changement de tour, puis vérifier le retour et résultat si atteignable. **Ne jamais fabriquer d'ennemi, de dégâts, d'attaque ni de jets**.
- **Propriétaires** : Dungeon déclenche l'affrontement ; Tactical V2 engine, UI/adapter gèrent le tour, actions, IA, dommages ; Core stats/dice restent leur source de vérité ; bridge route le résultat vers Dungeon. Ne pas ajouter de façade parallèle, wrapper global, hook persisté ni second système de combat.
- **Fonctions protégées** : Core200 spawn et positions, Tactical chargeur/lazy S3–S7, stats/d100, sauvegardes, victoires/XP/loot, Shell, Survie/Capture/PvP, service worker, `main`, laboratoires et assets. Risques : UI interactive (z-index, overlays), séquences de tour, synchronisation états UI/moteur, garde anti-doublon d'IA, persistance.
- **Tests prévus** : Playwright Chromium/Firefox sur vraie UI, capture de `getBattle()` avant/après chaque action et logs moteur, preuves par variation d'état et journal de jeu. Les tests historiques/architecture R10–R15 et sentinelles Core200/Tactical restent requis. Si le premier tour échoue, diagnostiquer et ouvrir un correctif propriétaire documenté avant de modifier les règles. Ne certifier que les comportements observés.
- **Prochaine étape** : lire l'UI Tactical existante, écrire un test réel de tour, CI exact-SHA, documenter les résultats (GREEN ciblé ou RED), sans publication. Phase12 globale reste ouverte.
- **Production** : `main` SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` gelé ; aucune fusion, aucun changement du laboratoire Combat/Exploration ni des assets Survie.

Charte `docs/GENSRPG_CHARTE.md` §§1–5, 12–26 ; `docs/GENSRPG_CHECKPOINT_POLICY.md`.
