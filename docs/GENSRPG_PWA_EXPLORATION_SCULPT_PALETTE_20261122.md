# PWA Genesis RPG — raccorder l’éditeur Exploration 2,5D (#521)

Date : 22 novembre 2026.

## Périmètre et checkpoint
- Publication cible : PWA principale GenSRPG (module Monster InvoC / Capture V2), via l’unique `.github/workflows/main.yml`.
- Base de la PWA `main` : `acf2c3fdca108e19f6c7e4375ed3ace9be9f36c5`.
- Branche du lot : `work/pwa-exploration-sculpt521-publisher-20261122`; checkpoint conservé : `checkpoint/gensrpg-pwa-before-exploration-sculpt521-20261122`.
- Capture V2 source publiée avant : `27eff9c0f1632a3271ec85e5d4f6e9a841dc49cf`.
- Capture V2 source candidate : `58c16831ddd500e534bfb0e673b538cf8072b3d7`, modifications limitées au manifeste officiel `source-pins-v1.json` et à son test de provenance strict.
- Exploration source officielle : `a8d9f8bd61bee7a14ab4e71e6cedc85250457f5c` (CI main `45050483870` SUCCESS ; déploiement et HTTPS `45050483881` SUCCESS).
- Antécédent Exploration Capture V2 : `77bebb83ff176f49edff7ae49c03ba48c28202ca` ; ascendance `ahead`, sans divergence.
- Combat : `34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0` **inchangé** (CI `45016265619` SUCCESS).
- Assets visuels, prix, sauvegardes, moteur Combat, liaison multijoueur, navigation racine et service-worker source **inchangés**.

## Correction
- Un seul manifeste immuable Capture V2 sélectionne les laboratoires ; aucun moteur ou atlas recopié manuellement.
- Le test historique de la source Capture V2 est repointé sur le même SHA Exploration certifié et sur le run CI exact, sans alléger ses vérifications audio.
- Mise à jour de `tools/capture_v2_pages_preview_pin.json` : uniquement le SHA du candidat officiel.
- Extension bornée du garde de certification natif `tools/stage_capture_v2_pages_preview.mjs` : le nouveau SHA Exploration est autorisé **si et seulement si** le renderer garde le Git blob officiel `6c101756bdf9c58a9ae8cf3fe104e49575145748` et les invariants déjà testés.
- Objectif de l’intégration : familles personnalisées libres (sol/route/eau), variantes d’herbe, atelier 2,5D repliable sans commandes en double ; aucun changement du runtime de jeu en dehors de la source officielle Exploration.

## Gates avant GREEN
1. Tests et garde SHA sur la PR du publisher ; `stage_capture_v2_pages_preview.mjs` doit produire le site avec les deux SHA épinglés.
2. Tests Chromium du vrai chemin Capture V2 → Exploration, sauvegarde WorldDocument et retour ; contrôle du site assemblé sans duplication d’assets, budget Pages strict 900 Mio.
3. Fusion sur `main` seulement après CI réussie ; publication par workflow unique, contrôle du `publisherCommit` et des SHA Exploration/Combat dans la provenance publique HTTPS.
4. Pixel / PWA Android installée : validation manuelle de l’Atelier et des familles après mise à jour, sans effacer les sauvegardes.

## État
Candidat isolé, non publié tant que les gates GitHub main + HTTPS ne sont pas acquises. Les SHA antérieurs restent conservés par l’historique Git pour retour arrière.
