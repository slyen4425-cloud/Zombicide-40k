# GenSrpG — Phase 12 R08 : extraction de la bibliothèque partagée capacités / compétences

**Date : 18 octobre 2026. GREEN technique sur le SHA `f458f0dce79a6bf0034c69bca36313f671d51fc4` ; retour utilisateur favorable reçu (« Pour moi ça a l'air ok »).**

## §25 / §26 : base, source, périmètre

- Dernier code GREEN R07 accepté manuellement : `17a1def7a514478fec08025f354a4ed8b5f14`. START R08 créé sur cette base : `checkpoint/gensrpg-start-phase12-r08-shared-ability-skill-catalog-2026-10-18`, branche `work/gensrpg-phase12-r08-shared-ability-skill-catalog-2026-10-18`.
- Fichier transmis : `d6.zip` / `index.html(4).txt` ; 2 217 805 octets et Git blob `aca31c540d61c81e1504d3b915b034b372103b5b`, vérifié exact R07 GREEN.
- Extraction : **57 fonctions originales** de bibliothèque et éditeur des capacités/compétences, conservées intactes, sous propriétaire Builders `assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js` (86 082 octets ; blob `f3f650679799d1e6c8e6b6bcd76a6a0963a02f66`). Le listener Escape reste à sa position initiale dans l'ancien script. Chargement classique synchrone, aucune règle de combat réécrite. Cache PWA, carte des propriétaires, chargements et rollback bit-exact raccordés.
- Nouvel `index.html` : **2 131 805 octets**, blob `6eeed45a0a12085c1b107ee6c24b49040277ca54` (**–86 000 octets**). Projet sans modification de `main`, des deux laboratoires et des 32 images historiques Survie.

## Certification finale technique

Checkpoint **`checkpoint/gensrpg-phase12-r08-shared-ability-skill-catalog-green-2026-10-18`**, pointant exactement sur `f458f0dce79a6bf0034c69bca36313f671d51fc4`.

| Suite | GitHub Actions | Résultat |
|---|---|---|
| Source R08 et rollback R08 → R07 | [39124302271](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39124302271) | SUCCESS |
| Firefox | [39124302189](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39124302189) | SUCCESS |
| Tactical | [39124302217](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39124302217) | SUCCESS |
| Architecture + Chromium | [39124302194](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39124302194) | SUCCESS, 361 étapes statiques et 64 étapes navigateur |

Les échecs précédents de Chromium provenaient de constructions de pages partielles dans les **fixtures de test** Capture, auxquelles manquait l'import synchrone de la bibliothèque R08. Les derniers correctifs n'ont changé que ces tests (notamment la composition du provider module-launch S3), sans changement de logique de jeu. Le SHA ci-dessus a passé les suites complètes.

## Retour manuel utilisateur et suite

- [Preview R08 immuable](https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/f458f0dce79a6bf0034c69bca36313f671d51fc4/preview.html). Tester affichage/édition des capacités et compétences, bibliothèques Survie/RPG/Créature/Dresseur/Compagnon, sauvegarde, touche Escape, pré-game Capture et passage entre modes.
- **Retour reçu le 18 octobre 2026 : « Pour moi ça a l'air ok ».** Il s'agit d'un retour de validation favorable sans anomalie signalée ; nous ne prétendons pas que chaque scénario de la liste a été personnellement vérifié. **R08 est clos ; Phase 12 reste ouverte.**
- Pour toute future intervention sur le HTML, respecter §26 : [fichier exact R08 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/f458f0dce79a6bf0034c69bca36313f671d51fc4/index.html) en ZIP utilisateur, attendu 2 131 805 octets et blob `6eeed45a0a12085c1b107ee6c24b49040277ca54`. Nouveau START §25 obligatoire pour tout R09. `main` reste gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Ce document est un commit de suivi **postérieur** au checkpoint exact. Le checkpoint n'a pas été déplacé.

## Contrôle complémentaire sur le HEAD documentaire

Sur le SHA `88534c2fdc6cc6fd3b5273a27f6b46e66e252bb5` : préflight R08 [39127401450](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39127401450), Firefox [39127401417](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39127401417), Tactical [39127401468](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39127401468), Architecture/Chromium [39127401414](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39127401414) : **tous SUCCESS**, 361 contrôles statiques et 64 étapes navigateur. Comparaison de `f458f0dc` à `88534c2f` : exclusivement les deux documents de suivi, **aucun changement de code de production**. Le checkpoint immuable continue de pointer sur le SHA initialement certifié `f458f0dce79a6bf0034c69bca36313f671d51fc4`.
