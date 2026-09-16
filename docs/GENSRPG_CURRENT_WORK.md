# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — latence / double autorité des portraits héros Dungeon

- Branche de travail : `work/gensrpg-hero-art-latency-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-hero-art-latency-2026-09-16`
- Base exacte : `61ab53fddaf4254a7c61c0d3556b45d1b2f94ae8`
- Dernier checkpoint vert technique : `checkpoint/gensrpg-xp-latency-green-2026-09-16`
- Checkpoint vert cible : `checkpoint/gensrpg-hero-art-latency-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Jalon précédent figé — XP manuel

Le chantier XP est fermé et figé sur `checkpoint/gensrpg-xp-latency-green-2026-09-16`, SHA `61ab53fddaf4254a7c61c0d3556b45d1b2f94ae8`.

La correction a sorti Progression de l'attente de la chaîne Tactical et de ses retries différés, sans modifier les formules XP/niveau. Le bouton `+ XP` Dungeon utilise désormais l'autorité Progression extraite dès son chargement navigateur.

## Périmètre déclaré du chantier portrait

- Module concerné : Dungeon / fiche héros et représentation visuelle du héros.
- Propriétaire canonique : données du héros déjà préparées dans `CHARS` puis renderer normal de fiche / plateau.
- Systèmes existants réutilisés : `ensureDungeonHeroes()`, `openChar -> current -> render`, champs d'art déjà présents sur `CHARS`.
- Fonction des anciens PNG `dng_aldren.png`, `dng_lyra.png`, `dng_brom.png` : fallback uniquement lorsqu'aucun art configuré n'existe.
- Fonctions protégées non modifiées : stats, progression/XP, combat, mouvement, inventaire, sauvegarde, navigation, règles de gameplay.
- Risque inter-module : faible ; le chantier retire des autorités visuelles concurrentes et n'ajoute aucun moteur ni renderer global.

## Symptôme manuel

Lors d'un changement de héros, le portrait correct pouvait apparaître avec retard. Exemple observé : Aldren restait brièvement affiché avant que l'image de Lyra prenne sa place. Un avatar personnalisé pouvait également être remplacé temporairement par le PNG intégré du héros.

## Cause caractérisée

Le rendu canonique principal n'était pas en faute : `openChar()` fixe le héros courant avant `render()`, qui lit déjà l'image du héros courant.

Le retard venait de plusieurs anciennes couches Hero Art qui tentaient encore de reprendre l'autorité après le rendu canonique :

1. `gens-dungeon-sheet-art-stability-167899.js` forçait ses propres PNG, wrappait le cycle de fiche et utilisait des retries différés ;
2. `gens-dungeon-hero-ingame-art-167898.js` pouvait réécrire plusieurs champs d'art dans `CHARS`, wrapper `openChar/render`, observer le DOM globalement et réessayer ensuite ;
3. `gens-dungeon-ingame-hero-art-167898.js` hard-pinait encore `image/avatar`, wrappait DungeonCore et réessayait son installation ;
4. `gens-dungeon-hero-art-repair-167874.js` pouvait encore réinjecter les PNG intégrés dans les données ou réparations visuelles.

Ces couches formaient plusieurs sources de vérité concurrentes : le renderer normal affichait d'abord l'art du héros sélectionné, puis un ancien réparateur pouvait imposer un art intégré avant qu'une couche suivante rétablisse finalement l'art configuré.

## Preuve rouge avant correction

Workflow dédié : `GenSrpG hero art latency sentinel`, premier run rouge `35122515038`.

La caractérisation échouait sur la présence des retries différés de la couche de fiche, avant toute correction.

Un run intermédiaire `35122991980` a ensuite validé les trois nouveaux contrats portrait et n'a échoué que sur un ancien garde statique qui trouvait le nom d'un module Stats dans un commentaire du bridge ; cette référence documentaire parasite a été retirée sans changement fonctionnel.

## Correction appliquée

Correction soustractive conforme à la charte :

- `gens-dungeon-sheet-art-stability-167899.js` devient un helper ponctuel piloté par les données canoniques ; plus de wrapper de fiche, plus de retry, plus d'observer, aucune mutation de `CHARS` ;
- `gens-dungeon-hero-ingame-art-167898.js` ne modifie plus `CHARS`, ne wrappe plus `openChar/render`, n'observe plus le DOM global et ne réessaie plus de reprendre l'autorité ;
- `gens-dungeon-ingame-hero-art-167898.js` ne hard-pine plus `image/avatar`, ne wrappe plus DungeonCore et ne possède plus de retry ;
- `gens-dungeon-hero-art-repair-167874.js` ne modifie plus les données d'art du héros et ses réparations visuelles consultent l'art canonique déjà choisi ;
- l'art configuré/personnalisé du héros est prioritaire ; les PNG Aldren/Lyra/Brom restent uniquement des fallbacks si aucun art n'est défini ;
- aucun nouveau renderer, observer, timer, heartbeat ou système d'assets n'a été ajouté ;
- aucune règle de gameplay n'a changé.

Le bridge historique `gens-dungeon-hero-art-repair-167874.js` conserve encore son mécanisme de scheduling/retry général pour d'autres responsabilités legacy hors portrait. Ce chantier ne l'élargit pas : il retire seulement sa capacité à muter l'art canonique, de sorte que ces retries ne peuvent plus provoquer le rebond Aldren/Lyra. Le nettoyage global de ce bridge reste un chantier de restructuration distinct.

## Sentinelles portrait

- `tests/gens_hero_art_custom_authority_v11411.test.cjs`
- `tests/gens_single_hero_sheet_art_authority_v11411.test.cjs`
- `tests/gens_hero_sheet_art_runtime_v11411.test.cjs`
- `tests/gens_dungeon_hero_art_repair_v167874.test.cjs`
- `tests/gens_v167898_guard.test.cjs`
- `tests/gens_v167899_ui_sheet_guard.test.cjs`
- `.github/workflows/gensrpg-hero-art-latency.yml`

Le test cible reproduit un cas Lyra avec art personnalisé alors que le noeud image contient initialement Aldren. Après réparation, l'image doit directement devenir l'art canonique de Lyra, avec au plus une écriture de `src`, sans timer de rattrapage, sans mutation de `CHARS` et sans passage intermédiaire par le PNG intégré.

## Validation du candidat avant documentation finale

Candidat code/tests : `ee0490b98672876de2806c659ceeb475144e040b`.

- Hero Art latency sentinel : run `35123099734` — success ;
- Architecture complète + navigateur Chromium : run `35123099466` — success ;
- Firefox : run `35123099844` — success.

Après ce commit documentaire, ces validations doivent repasser sur le SHA final avant création du checkpoint vert.

## Prochaine étape

Ne pas ouvrir un nouveau chantier fonctionnel avant contrôle manuel ciblé de ce checkpoint :

- bouton `+ XP` immédiatement réactif sur la fiche Dungeon, avec franchissement de niveau et point de caractéristique ;
- passage Aldren -> Lyra -> Brom avec le bon portrait immédiatement ;
- si un héros possède un art personnalisé, cet art reste prioritaire sur le PNG intégré.

Après validation manuelle, reprendre la feuille de route de restructuration au prochain petit jalon sûr, sans mélanger un nouveau correctif gameplay avec ce chantier.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
