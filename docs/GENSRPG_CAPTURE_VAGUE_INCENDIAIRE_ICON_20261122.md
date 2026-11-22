# Capture V2 — Vague incendiaire, icône Boule de feu — 22 novembre 2026

## Périmètre
- Source immuable de départ: `7b0231691f2510978c3616402a779e51349a2a41`, checkpoint `checkpoint/gensrpg-start-vague-icon-capture-source-20261122`.
- Branche temporaire: `work/gensrpg-vague-icon-capture-source-20261122`; autorité du Combat: `slyen4425-cloud/GenSrpg_labo_combat_dynamique` `main@34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0` (PR #378).
- Le transfert canonique `data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json` a uniquement son `presentation.visual.icon.assetId` changé en `pack:capture:icon-skill-fireball-01`.
- Le bundle est repris depuis Combat à un SHA exact, sans duplication des données ou nouveaux assets. Le moteur Combat, le sprite et le gameplay restent sous l'autorité du Labo.
- La référence Exploration `main@de86b04f35f96df3783f1f953c7f138bc44a28f8` et son certificat CI `45012201761` restent *strictement inchangés* (ponts et escaliers nettoyés).
- Préserver Root Shell, service worker, la PWA installée, PNJ/objets, sauvegardes, Donjon, Survie et les modifications de Capture déjà validées.
- Lab Combat PR #378: CI GREEN `45011273821`; publication Pages du merge `34c17c15` à vérifier séparément avec la CI de `main`.
- Gate: tests Capture V2, provenance, effet affiché dans bundle concret et publisher Pages + HTTPS sur SHA final, puis publication PWA via pin de source immuable séparé.
