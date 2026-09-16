# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — latence XP manuel de la fiche héros

- Branche de travail : `work/gensrpg-xp-portrait-latency-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-xp-portrait-latency-2026-09-16`
- Base exacte : `84344017659cc909ded580bc39d0c8d103deb5df`
- Dernier checkpoint vert validé utilisateur : `checkpoint/gensrpg-stats-editor-regression-green-2026-09-16`
- Checkpoint vert cible : `checkpoint/gensrpg-xp-latency-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Périmètre déclaré

- Module concerné : Dungeon / fiche héros.
- Propriétaire : `assets/gensrpg/dungeon/progression-runtime-v1.js` pour l'action XP manuelle ; les formules restent dans les fonctions canoniques historiques de progression.
- Systèmes réutilisés : `changeXP`, `dungeonSyncProgressionForState`, `dungeonHandleLevelUp071`, sauvegarde et rendu existants.
- Fonctions protégées non modifiées : formule XP/niveau, attribution des points de caractéristiques/compétences, récompenses de combat, Tactical, stats, inventaire, dégâts, sauvegardes persistantes.
- Risque inter-module : faible ; hors Dungeon, `changeXP` continue de déléguer au handler historique.

## Symptôme manuel

Sur la fiche héros Dungeon, le bouton `+` d'XP pouvait répondre avec retard et, pendant le chantier précédent, ne plus produire immédiatement le cycle complet XP -> niveau. Le comportement attendu est que le clic déclenche immédiatement l'autorité Dungeon et, lors d'un franchissement de seuil, le même cycle canonique de level-up que les gains d'XP normaux.

## Cause caractérisée

Le moteur de progression extrait existait déjà et son test unitaire était correct. Le défaut venait du raccord de chargement :

1. `progression-runtime-v1.js` était placé dans la même chaîne de chargement que toute la pile Tactical V2 et l'isolation Survie ;
2. son `install()` n'était appelé qu'une fois cette chaîne terminée ;
3. le bootstrap réessayait ensuite Progression avec les fenêtres historiques `250 / 1200 / 3000 ms` destinées aux anciens raccords Tactical/Survie.

Avant installation, le bouton HTML `+` appelait encore le `changeXP` historique du monolithe. Ce handler ne possédait pas le cycle complet du runtime extrait. Le raccord utilisateur dépendait donc du moment où la pile Tactical finissait de se charger, alors que l'XP manuel n'a aucune raison de dépendre de Tactical.

## Preuve rouge avant correction

Workflow dédié : `GenSrpG XP latency sentinel`, run `35121633599`.

Le test cible échouait exactement sur l'absence d'un propriétaire Progression disponible indépendamment de la chaîne Tactical.

## Correction appliquée

Correction minimale et soustractive conforme à la charte :

- `progression-runtime-v1.js` s'installe une seule fois dès son chargement navigateur ;
- `runtime-bootstrap-v1.js` déclare Progression comme prérequis explicite avant le démarrage de la chaîne Tactical ;
- Progression a été retiré de la liste `files` Tactical/Survie ;
- Progression a été retiré des retries `250 / 1200 / 3000 ms` ;
- les retries historiques encore nécessaires à Survival/Tactical restent inchangés ;
- aucune formule XP/niveau, valeur, récompense, point de caractéristique, popup ou règle de gameplay n'a été modifiée ;
- aucun observer, interval, heartbeat ou nouveau retry n'a été ajouté.

## Sentinelles

- `tests/gens_progression_bootstrap_decoupling_v11411.test.cjs`
- `tests/gens_manual_xp_progression_runtime_v1.test.cjs`
- `tests/gens_runtime_bootstrap_v1.test.cjs`
- `tests/gens_progression_authority_characterization_v11411.test.cjs`
- `tests/gens_manual_xp_statpoints_characterization_v11411.test.cjs`
- `.github/workflows/gensrpg-xp-latency.yml`

Le nouveau test traverse le raccord réel d'autorité : chargement du module Progression -> installation immédiate de `changeXP` -> clic logique `+1 XP` sur Lyra à 9 XP -> 10 XP -> niveau 2 -> 1 point de caractéristique -> callback level-up -> sauvegarde -> rendu, sans passage par le handler legacy Dungeon.

## Validation du candidat avant documentation finale

Candidat code/tests : `7131ed6e78e17697691b8e7040a37d5e56052dfd`.

- XP latency sentinel : run `35122001990` — success ;
- architecture complète + navigateur : run `35122001994` — success ;
- Firefox : run `35122002007` — success.

Après ce commit documentaire, ces validations doivent repasser sur le SHA final avant création du checkpoint vert.

## Chantier suivant — portrait héros, strictement séparé

Ne pas mélanger avec XP. Après création du checkpoint XP vert, ouvrir un nouveau checkpoint/une nouvelle branche pour le retard de portrait lors d'un changement de héros.

Diagnostic déjà établi sans modification : le rendu canonique `openChar -> current -> render -> CHARS[current].image` choisit déjà le bon héros immédiatement, y compris l'avatar personnalisé fourni par `ensureDungeonHeroes()`. En revanche plusieurs anciens modules Hero Art continuent à réécrire des arts par défaut, wrapper `openChar/render`, utiliser des retries et, pour l'un d'eux, un `MutationObserver` global. Le chantier portrait devra caractériser précisément ces doubles autorités puis les retirer de façon soustractive, sans recréer un renderer de fiche.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
