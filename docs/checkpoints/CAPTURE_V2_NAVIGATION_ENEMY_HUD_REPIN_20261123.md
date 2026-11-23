# Checkpoint Capture V2 — réconciliation Exploration Autoriser + Combat HUD

**Base source immuable** : `63a82024504c6deec63f40f090d03760492609d8`, source déjà épinglée par le Publisher PWA `main@d641d41be4c88cfffe582745e68fef2ca45e14cc`.

## Périmètre unique de transport
- Combat unique `GenSrpg_labo_combat_dynamique/main@0543103891b5777fff108cb12a1ae55a519544d9`, Laboratory CI `45223872730` SUCCESS. Inclut Vipfer Mue tranchante +200 DEF 8 s avec sprite persistant et volet repliable de capacités adverses.
- Exploration unique `laboratoire_dynamique_exploration-/main@b0f52e23bea6e9eaf359fc7faf206c13386bdb4a`, CI `45260398784` et Pages `45260398731` **à confirmer GREEN avant toute promotion**. Inclut les passages automatiques et visuels, onglet Passages déplacé, pinceau textures carré, escaliers profil, Navigation Interdire/Autoriser/Normal, chemins de pente invisibles en jeu, correction de stabilité de smoke.
- **Pas** de nouvelle bibliothèque, moteur, SHAs de médias, service worker, Shell, Donjon, Survie, PvP ou stockage. Source unique via `assets/gensrpg/capture-v2/source-pins-v1.json` et `tools/stage_capture_v2_labs.mjs`.
- Tests de sources existants ajustés pour les deux SHAs exactes. Une source candidate non certifiée **ne doit pas** devenir une publication PWA.
- La traversée de l'eau sans support sécurisé et l'édition libre des points pied/sommet de l'escalier restent ouvertes (#530 et #525 Exploration).

## Publication et arrêt
1. Confirmer les deux runs Exploration du SHA EXACT GREEN et provenance Pages HTTPS, Combat run certifié.
2. Exécuter tests de la source candidate (hors main) puis une PR publisher PWA basée **sur le main PWA le plus récent**.
3. Ajuster les sentinelles Publisher de provenance (le renderer officiel a changé à cause de l'affichage invisible des corridors), sans supprimer les sentinelles anciennes.
4. PR publisher : CI, navigateur PC/mobile, poids, build Pages, puis fusion main et contrôle HTTPS. PWA installée sur Android reste à tester séparément.
5. Ne PAS fusionner l'ancienne PR PWA #631, dont la branche `mergeable_state:dirty` provient d'une source Exploration obsolète; le nouveau repin remplace son objectif sans perdre les portails.

**État à l'ouverture : source candidate en construction, non publiée.**
