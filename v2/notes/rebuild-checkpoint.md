# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils de discussion. Il doit être mis à jour après chaque étape importante validée.

## État important au 2026-09-11

- Reconstruction V2 isolée de `main`; la version stable n'est pas remplacée.
- Séparation Survie / RPG conservée.
- Moteur RPG data-driven : stats, ressources, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles, événements.
- Combat D100/tours : identité de tour `turnSequence`, rejet des actions obsolètes `stale-turn`, résolution unique.
- Compétences : une seule autorité centrale dans `v2/src/core/skills.js`; suppression du chevauchement de cooldown/charges.
- Inventaire : remplacement propre des équipements multi-slot, sans slot fantôme.
- Bestiaire : ressources de créature bornées entre min et max au spawn.
- Combat tactique : portée, mouvement, ligne de vue, murs/portes, arme équipée.
- Perception/furtivité : vraie ligne de vue de salle, murs bloquants respectés.
- Ciblage joueur : sélection manuelle validée avant dépense de ressource/charge/cooldown.
- Ciblage IA : règles `nearest`, `weakest`, `random`, `varied`; mémoire de cible et anti-focus immédiat lorsque plusieurs cibles sont valides.
- Runtime ennemi : choix coordonné compétence + cible + mémoire.
- Alliés : transition par salle, durées `room` décrémentées uniquement dans la salle concernée.
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.

## Dernière étape codée

Préservation des métadonnées d'allié dans `createCombatState` afin que `allyKind`, `controlMode`, `ownerActorId`, `sourceKind` et `metadata` ne soient plus perdus lors de l'entrée en combat.

Commits de l'étape :
- moteur : `f468805ebf20a3c161cd915897a4604482e6df4a`
- test : `f3969e0cb2624a081edbcbef6ad794810322c454`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Points encore ouverts prioritaires

- auto-injection complète des alliés dans la session de combat;
- cohérence KO/active côté alliés;
- placement valide des alliés suiveurs à l'entrée d'une salle (éviter le même carreau pour tous);
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- couverture/obstacles et modificateurs d'équipement tactiques;
- lifecycle audio de salle et vrai playback frontend;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
