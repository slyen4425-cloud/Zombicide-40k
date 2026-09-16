# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — régression éditeur de statistiques

- Branche de travail : `work/gensrpg-stats-editor-regression-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-stats-editor-regression-2026-09-16`
- Base exacte : `8d35fc5bbff9d30ee146d72c8ab7e34c68d16d90`
- Dernier checkpoint vert utilisateur : `checkpoint/gensrpg-wall-zoom-damage-display-green-2026-09-16`
- Checkpoint vert cible : `checkpoint/gensrpg-stats-editor-regression-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Symptôme manuel

Dans Réglages RPG > Statistiques, seuls les anciens interrupteurs/cases à cocher restaient visibles. Les paramètres détaillés d'une stat et les effets configurables avaient disparu de l'interface finale, empêchant par exemple d'ajouter un effet `Dégâts mêlée` ou `Dégâts distance` à Force.

## Cause caractérisée

Le moteur et les données n'avaient pas perdu les paramètres. Deux rendus coexistaient encore :

1. `index.html` possède l'ancien fallback natif qui remplit `#rpgStatsList` avec une simple liste de cases à cocher ;
2. `assets/gensrpg/gens-rpg-stats-clean-167874.js` possède le renderer canonique riche : nom, icône, valeur par défaut, min/max, description, activation et effets configurables.

En plus, `gens-dungeon-hero-art-repair-167874.js` et `gens-stat-upgrade-policy-167898.js` participaient tous deux au cycle `renderRpgUniverseEditor` avec des retries périodiques. Le bridge Hero Art pouvait donc entrer dans une chaîne de wrappers qui n'avait aucune raison architecturale d'exister.

## Correction appliquée

Correction minimale conforme à la charte :

- `gens-rpg-stats-clean-167874.js` reste le renderer canonique complet ;
- `gens-stat-upgrade-policy-167898.js` reste uniquement un décorateur des cartes canoniques (coût/verrouillage), sans remplacer `#rpgStatsList` ;
- `gens-dungeon-hero-art-repair-167874.js` ne wrappe plus `renderRpgUniverseEditor` ni `saveRpgUniverseStats` ; il reste limité à ses responsabilités visuelles et non-Stats ;
- aucune règle de gameplay, formule de stat, effet existant ou valeur de combat n'a été changée ;
- aucun nouvel observer, renderer ou timer n'a été ajouté.

## Preuve rouge avant correction

Workflow dédié : `GenSrpG stats editor authority`, run `35114858851`.

- caractérisation de l'état historique : verte ;
- contrat cible « autorité finale unique » : rouge avant correction.

## Sentinelles permanentes

- `tests/gens_stats_editor_authority_characterization_v11411.test.cjs`
- `tests/gens_stats_editor_single_authority_v11411.test.cjs`
- `tests/gens_stats_editor_browser_v11411.test.cjs`
- `.github/workflows/gensrpg-stats-editor-authority.yml`

Le test navigateur mobile Chromium reproduit explicitement l'ancien rendu à cases, charge ensuite les modules réels Stats / Policy / Hero Art, puis vérifie que l'éditeur riche reste final après plus de 3 secondes, au-delà des anciennes fenêtres de retry. Il vérifie également que les cibles `damage:melee`, `damage:ranged` et `hit:ranged` sont encore disponibles via `Ajouter un effet`.

## Validation avant commit documentaire final

Candidat code/tests : `7d95b403ff2d329a808b7d22c3df84d35b274748`.

- autorité Stats statique : verte ;
- navigateur Stats : vert ;
- architecture globale : verte sur ses sentinelles statiques ;
- Chromium global/preview et Firefox doivent être verts sur le SHA final contenant ce document avant création du checkpoint vert.

## Chantier suivant déjà identifié mais séparé

Ne pas mélanger avec ce correctif. Une fois l'éditeur Stats validé manuellement, reprendre séparément :

- latence XP manuel → popup de niveau ;
- latence changement de héros → portrait correct (ex. Aldren visible brièvement avant Lyra).

Créer un nouveau checkpoint de départ avant toute modification de ces latences.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
