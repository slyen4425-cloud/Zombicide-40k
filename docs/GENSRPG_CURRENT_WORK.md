# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Dernier chantier validé

- Chantier : murs blancs au zoom + cohérence visuelle de l'explication des dégâts
- Branche de travail : `work/gensrpg-wall-zoom-damage-display-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-wall-zoom-damage-display-2026-09-16`
- Base du chantier : `0c396bf7c0879cfde9f0ffa7a6324eb4e9a11ffd`
- Checkpoint vert à créer sur le SHA final validé : `checkpoint/gensrpg-wall-zoom-damage-display-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Résultat du chantier

### Explication des dégâts

Le moteur de dégâts était correct. Seule la formule affichée pouvait réutiliser une ancienne valeur `rawDamage` et produire par exemple :

`Puissance arme 3 + bonus stat 1 = 3 brut`

L'affichage recalcule désormais le brut à partir des deux composantes réellement expliquées :

`Puissance arme 3 + bonus stat 1 = 4 brut`

puis applique l'armure et le nombre de touches. Le moteur de dégâts n'a pas été modifié.

### Murs blancs au zoom Firefox

Cause racine démontrée : `assets/dungeon/creatures/dng_wall_block.jpg` était un JPEG 256×256 physiquement tronqué. Il commençait correctement par JPEG SOI mais ne possédait aucun marqueur final EOI. Firefox remontait explicitement `Image corrupt or truncated` pendant le test de zoom fractionnaire.

Correction appliquée : ajout des deux octets JPEG EOI `FF D9` uniquement, sans recompression, sans changement de texture, de résolution ou de chemin.

Le renderer Tactical UI est revenu exactement à son état du checkpoint de départ : même asset canonique `dng_wall_block.jpg`, même CSS et même autorité murale unique. Les expérimentations PNG/compositing et leurs workflows temporaires ont été supprimés.

## Sentinelles permanentes ajoutées

- `tests/gens_damage_explanation_consistency_v11411.test.cjs`
- `tests/gens_wall_asset_integrity_v11411.test.cjs`
- `tests/gens_tactical_wall_zoom_firefox_v11411.test.cjs`
- `.github/workflows/gensrpg-firefox-wall-sentinel.yml`

Le test Firefox couvre les zooms fractionnaires `0.67 / 0.8 / 0.9 / 1 / 1.1 / 1.25 / 1.5 / 1.75` sur viewport mobile 412×915, DPR 2.625.

## Validation du candidat propre

Candidat avant cette mise à jour documentaire : `702d2ef9bc6a8117f9cef027b385b5ac4c1c2524`.

- Architecture : run `35095770379` — architecture verte ; Chromium natif, murs et preview verts.
- Firefox : run `35095770205` — intégrité JPEG verte, explication dégâts verte, zoom fractionnaire Firefox vert, aucune erreur `Image corrupt or truncated`.

La CI doit repasser une dernière fois sur le SHA contenant ce document avant création du checkpoint vert.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
