# GenSrpG — Phase 12 / R07 — trois sons magiques (données uniquement)

**Date : 18 octobre 2026. R07 GREEN technique certifié sur `17a1def7a514478fec08025f354a4a1b17aa14f5`, checkpoint immuable `checkpoint/gensrpg-phase12-r07-magic-audio-data-green-2026-10-18`.** Acceptation utilisateur des sons en attente.

## Source et périmètre exacts (§§25–26)

- **START** `checkpoint/gensrpg-start-phase12-r07-magic-audio-data-2026-10-18` depuis `77a70778e0a82a9ca94c8b62d60865a4ed8b5f14`. Branche exclusive `work/gensrpg-phase12-r07-magic-audio-data-2026-10-18`. Source fournie `d3.zip/index.html(3).txt`, **2 643 155 octets**, Git blob `12fc91df4ee4c7989a172baa96f9790da6dc57f7`, strictement l'état R06 validé.
- **Un seul propriétaire de données Core partagé** : les trois URL audio MP3 historiques `electricityLong`, `magicCrunch` et `magicWind` contenues dans la déclaration `GENSRPG_MAGIC_SOUNDS`, **425 476 octets de corps d'origine**. Pas d'algorithme, de combat, de rendu, de sonothèque opérationnelle ni de règle de jeu déplacés.
- Nouveau fichier `assets/gensrpg/core/legacy-magic-sounds-v1.js` **425 484 octets**, blob `a09e21c0da7439ccda5a6aaa246096950e1b261b`. `GENSRPG_MAGIC_SOUNDS` est relié à `GensRpgLegacyMagicSoundsR07` par chargement classique synchrone avant l'ancien bloc mixte. Aucune affectation `window` ajoutée ; les trois MP3 et leurs valeurs sont byte-identiques à celles de la source approuvée.
- `index.html` après extraction : **2 217 805 octets**, Git blob `aca31c540d61c81e1504d3b915b034b372103b5b` (**–425 350 octets**). R07→R06 reconstitué bit pour bit via `tools/gensrpg_phase12_r07_magic_audio_extract_apply.py`, puis anciens checkpoints Dungeon restaurés uniquement dans les sentinelles historiques. Cache PWA versionné, registre des propriétaires passé de 125 à 126 sans seconde autorité.
- Publication physique contrôlée par [workflow 39113331438](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39113331438) : **SUCCESS** ; commit runtime initial `65747672eeb240eca9118b8c67cfe3291e3fcc16`. Les commits ultérieurs raccordent strictement les sentinelles historiques et les graphes de chargement, sans modifier le nouveau bloc audio ni `index.html`.

## Certification sur un seul SHA

| Workflow | Run GitHub | État sur `17a1def7a514478fec08025f354a4a1b17aa14f5` |
|---|---|---|
| Source R07 / rollback byte-exact | [39114167621](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167621) | SUCCESS |
| Firefox | [39114167552](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167552) | SUCCESS |
| Tactical | [39114167595](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167595) | SUCCESS |
| Architecture + Chromium | [39114167672](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167672) | SUCCESS — 361 contrôles statiques et 64 étapes navigateur |

Le checkpoint `checkpoint/gensrpg-phase12-r07-magic-audio-data-green-2026-10-18` pointe exactement sur le commit `17a1def7a514478fec08025f354a4a1b17aa14f5`. Les états CI rouges des commits intermédiaires étaient des assertions historiques à raccorder au nouveau chargement ; ils ne sont pas dissimulés, et leurs corrections n'ont pas modifié la logique du jeu.

## Gate utilisateur et suite bornée

- **Preview immuable :** [ouvrir R07](https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/17a1def7a514478fec08025f354a4a1b17aa14f5/preview.html). Contrôle manuel recommandé : sons électriques, impact/crunch, vent et fonctions de jeu qui les déclenchent.
- La CI garantit les assertions automatiques et le vrai navigateur, pas l'écoute manuelle du résultat sonore. **Ne pas inscrire de validation utilisateur avant son retour.**
- Avant d'inspecter/modifier à nouveau le grand `index.html`, obtenir via §26 le ZIP exact de [l'index R07 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/17a1def7a514478fec08025f354a4a1b17aa14f5/index.html), **2 217 805 octets / blob `aca31c540d61c81e1504d3b915b034b372103b5b`**. Nouveau START §25 et borne de propriétaire avant un éventuel R08. Ne pas multiplier les micro-lots ni extraire le grand monolithe inter-domaines comme un faux module unique. **Phase 12 n'est pas déclarée terminée.**
- `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Les quatre modes, sauvegardes, PWA, PvP non jouable, deux laboratoires et 32 images Survie historiques restent intacts.

Cette mise à jour documentaire est postérieure au checkpoint GREEN et n'est pas un nouveau SHA de certification.
