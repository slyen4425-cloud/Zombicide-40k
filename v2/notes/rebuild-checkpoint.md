# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours RPG protégé par ses régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Rôle appareil MJ, panneau MJ, ergonomie mobile combat, audio RPG et stockage abstrait déjà présents.
- Monster Capture est un mode autonome : aucun état gameplay mutable n’est partagé avec RPG, Survie ou PVP.
- Monster Capture réutilisera en revanche la base technique neutre de déplacement spatial et World Builder : grille, pathfinding, portes/passages, obstacles/couverture, géométrie/graphes de salles et interactions de carte génériques.
- Le futur combat Capture sera un runtime dédié : pas de `turnSequence` RPG, pas de timeline D100 RPG. La cible est une exploration plus libre et un combat dynamique, à affiner plus tard.
- Bootstrap global Capture interdit : initialisation seulement à l’ouverture du mode.
- Bibliothèque Capture en cours de nettoyage : IDs canoniques uniques, alias legacy préservés, doublons connus fusionnés au niveau migration uniquement, familles générées legacy mises en quarantaine.
- Stockage Capture V2 exclusivement sous `gensrpg:v2:capture:*`; anciennes clés legacy en lecture seule pour migration.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success

## Dernière étape terminée

Contrats fonctionnels Monster Capture avant création du runtime :
- nouveau fichier `v2/docs/capture-gameplay-contracts.json` ;
- taux de capture propre à chaque espèce conservé comme exigence ;
- bonus de capture sous 30 % PV conservé, mais multiplicateur exact laissé volontairement `pending` tant qu’il n’est pas retrouvé ou redéfini ;
- objets de capture par niveau/qualité prévus dans une bibliothèque Capture dédiée, jamais comme équipement RPG ;
- équipe active limitée à 6, réserve illimitée par défaut et débordement des nouvelles captures vers la réserve ;
- chaque créature possédée reste une instance distincte ; aucune fusion automatique de captures réelles lors de migration ;
- capacités avec charges et/ou coûts conservées ; charges stockées par instance de créature ; valeurs exactes legacy laissées `pending` tant qu’elles ne sont pas confirmées ;
- biomes, pourcentages d’apparition, tags élément/type et rareté restent des contrats du mode ;
- combats VS IA et VS joueurs restent prévus ;
- futur combat dynamique obligatoire comme direction, avec mouvement/positionnement, portée, esquive/placement et changement de créature, sans figer encore le timing temps réel ;
- toute valeur legacy non retrouvée suit la règle `do_not_guess` ;
- nouveau test `v2/tests/capture-gameplay-contracts.test.mjs` verrouille ces décisions et interdit toute réutilisation accidentelle du moteur de tours RPG.

Commits de l’étape :
- contrats gameplay Capture : `4c13f3f5fa01e4d2bdac9d61274a35cea23d3bd9`
- régression contrats gameplay : `ef5a2d8accaead8a2df650701584fcecc0fdc347`

CI fonctionnelle de l’étape : `34679477548` success.

## Priorités ouvertes

1. définir les premiers contrats de `v2/src/modes/capture/` sans encore construire le combat dynamique complet ;
2. brancher Capture sur le socle spatial/World Builder neutre existant tout en gardant son état et son stockage séparés ;
3. poursuivre l’audit des assets Capture, objets de capture et capacités exactes si des traces legacy supplémentaires sont retrouvées ;
4. poursuivre ensuite l’audit legacy systématique hors Capture : PWA/cache, import/export, audio, assets, tests et UI cachées.
