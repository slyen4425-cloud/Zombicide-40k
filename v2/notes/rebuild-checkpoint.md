# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Créateur de salle : portes, interactions, jets réutilisables, tentatives persistantes et obstacles/couverture configurables sans saisie d’ID technique.
- Combat tactique : mouvement, portée, LOS, murs/portes, équipement, couverture directionnelle et portée d’entraide.
- Statuts persistants : rollback par delta/source pour éviter que plusieurs bonus/malus sur la même stat se détruisent entre eux.
- Donjon multi-héros : `heroLocations`, focus individuel, transitions séparées, retour arrière et réutilisation de l’instance de salle sans respawn.
- World Builder : passages authored jouables depuis la vue Donjon, avec objets requis et conditions.
- Quêtes/événements/PNJ/alliés/loot : raccordés au vrai `roomRuntime`, sans second runtime parallèle.
- Combat Donjon réel : ennemis actifs de la salle + héros réellement présents/proches, vrai `combatState`, fin de combat réconciliée automatiquement vers salle/héros/loot/boss-key.
- Actions héros : compétences réelles du runtime héros (base + équipement + sets + formes), coûts/cooldowns/jets/effets du moteur existant.
- Tours ennemis : automatiques sur la même timeline sauf en `MJ contrôle total`.
- Présentation combat : timeline, KO, PV/ressources, journal moteur, ciblage vivant, consommables et fuite dans la vraie vue Donjon.
- Contrôle du combat : `interaction.directCombat` et `interaction.gmFullControl` sont appliqués dans la vraie vue Donjon. Direct OFF masque les actions héros automatiques/consommables ; MJ total bloque aussi les tours ennemis automatiques.
- Runtime MJ manuel : opérations dédiées sur le même `combatState` pour modifier une ressource, mettre KO/réactiver, effectuer un jet manuel et passer le tour via les fonctions moteur existantes.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique et cleanup.
- Stockage cloud réel différé ; import/export manuel reste le filet de sécurité.

## Jalons CI récents validés

- actions/compétences réelles héros : `34653973093` success
- tours ennemis automatiques : `34655064237` success
- renderer intégré dans vraie vue Donjon : `34656592813` success
- contrats de cible `enemy/ally/self/any` : `34656913323` success
- consommables combat Donjon : `34658191700` success
- fuite combat Donjon : `34658702948` success
- configuration combat direct / MJ : `34658933290` success
- application combat direct / MJ dans vraie vue Donjon : `34659348809` success
- runtime contrôles manuels MJ : `34672484172` success

## Dernière étape terminée

Runtime de contrôle manuel MJ ajouté dans `v2/src/modes/rpg/dungeon-combat-gm-runtime.js` :
- toutes les commandes sont refusées si `gmFullControl` n’est pas activé ;
- `gmSetCombatResource()` modifie une ressource d’un combattant directement dans le vrai `combatState`, avec clamp `0..max` quand un max existe ;
- `gmSetCombatKo()` permet au MJ de poser ou retirer un KO sans créer de second système de victoire/défaite ; la timeline reste sous contrôle manuel ;
- `gmRollCombatCheck()` utilise le vrai `resolveCheck()` D100 et peut utiliser la stat réelle de l’acteur ;
- `gmAdvanceCombatTurn()` passe par `endActiveTurn()` afin de conserver statuts de fin de tour, cooldowns et règle de défaite existante ;
- chaque intervention MJ est journalisée (`gm-resource-set`, `gm-combatant-ko`, `gm-combatant-reactivated`, `gm-check`, `gm-turn-advanced`) dans le journal du même combat ;
- régression dédiée : modification PV, KO puis réactivation, jet D100 déterministe avec stat, passage manuel du héros à l’ennemi, et refus complet hors mode MJ.

Commits de l’étape :
- runtime MJ manuel : `41355339eccb7b2dfe1f6d6b3abf4783469f3ea8`
- régression : `fcf77a9572604f2b7c5934236fc08cd66329b291`

CI finale : `34672484172` success.

## Priorités ouvertes

1. brancher maintenant ces contrôles manuels dans la vraie vue Donjon quand `gmFullControl=true` : combattant, ressource/PV, KO/réactivation, jet manuel et bouton de passage de tour ;
2. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
