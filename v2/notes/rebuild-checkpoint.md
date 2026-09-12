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
- Contrôles MJ manuels : runtime et panneau réel dans la vue Donjon, sur le même `combatState`, pour modifier les ressources/PV, KO/réactiver, effectuer un jet manuel et passer le tour.
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
- panneau MJ manuel dans vraie vue Donjon : `34673068558` success

## Dernière étape terminée

Panneau `MJ contrôle total` branché dans la vraie vue Donjon :
- nouveau module `v2/src/modes/rpg/dungeon-combat-gm-ui.js` ;
- le panneau n’existe que lorsque `gmFullControl=true`, sur un vrai `dungeon-room-combat` actif ;
- sélection lisible du combattant (héros/ennemi, état KO et tour actif) ;
- sélection des ressources réellement présentes sur l’acteur, avec nom/icône data-driven et valeur courante ;
- bouton `Appliquer la ressource` qui appelle uniquement `gmSetCombatResource()` ;
- boutons `Mettre KO` et `Réactiver` qui appellent uniquement `gmSetCombatKo()` ;
- jet manuel configurable par stat, difficulté, dé et mode, via `gmRollCombatCheck()` ; résultat visible immédiatement (`jet / seuil / réussite-échec`) ;
- bouton `Passer le tour` via `gmAdvanceCombatTurn()`, donc fin de tour, cooldowns et statuts restent ceux du moteur ;
- chaque action réinjecte le nouveau `combatState` dans `dungeonView.setCombat()` puis propage `kind:'combat-gm'` ;
- aucune copie parallèle des PV, KO, jets ou timeline dans l’UI ;
- régression `rpg-dungeon-combat-gm-ui.test.mjs` : acteurs, ressources/PV, contrôles KO/réactivation, jet, passage de tour, absence du panneau hors MJ total, et montage réel dans `rpg-page.js`.

Commits de l’étape :
- panneau MJ : `bd2888cf99d6a4f06102ed0947495593d21e31ef`
- montage dans la page Donjon : `9fc0b8b5569558fcc95a281a9a06e570d3df9c94`
- régression UI/montage : `3b733e89d6beb9aba3e068759bedb6a56d559d8f`

CI finale : `34673068558` success.

## Priorités ouvertes

1. améliorer maintenant l’ergonomie mobile du bloc combat réel (timeline, ressources, actions, panneau MJ) sans toucher à l’autorité moteur ;
2. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
3. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
