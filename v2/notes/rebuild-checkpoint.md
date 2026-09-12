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
- Sécurité d’interface MJ : le panneau MJ est désormais doublement conditionné. `gmFullControl=true` active les règles manuelles de la partie, mais le panneau n’est rendu/monté que sur un appareil explicitement marqué `dungeonIsGameMasterDevice=true`. Un téléphone joueur ne reçoit donc pas le panneau même si la partie est en MJ total.
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
- restriction panneau MJ au seul appareil MJ : `34673262305` success

## Dernière étape terminée

Restriction du panneau `MJ contrôle total` au téléphone/appareil désigné MJ :
- `gmFullControl` reste une règle de partie : elle coupe les automatismes et autorise les commandes manuelles côté moteur ;
- le droit d’afficher/utiliser le panneau n’est plus déduit de ce drapeau global ;
- `dungeon-combat-gm-ui.js` exige maintenant `isGameMasterDevice=true` en plus du mode MJ total ;
- par défaut `isGameMasterDevice=false`, donc un appareil joueur n’affiche aucun contrôle MJ ;
- `rpg-page.js` accepte `dungeonIsGameMasterDevice=false`, le transmet au panneau, et expose `setDungeonGameMasterDevice()` / `getDungeonGameMasterDevice()` afin que l’appareil puisse être désigné ou retiré comme MJ sans changer les règles de combat ;
- la régression vérifie qu’un univers en `gmFullControl=true` n’affiche malgré tout rien sur un appareil joueur, puis affiche le panneau uniquement quand `isGameMasterDevice=true` ;
- aucune logique moteur de PV, KO, jets ou timeline n’a été déplacée.

Commits de l’étape :
- restriction du panneau au rôle appareil MJ : `7a433fc8f47314b8dd3eda146da9707affbb7508`
- régression appareil joueur/MJ : `9b26d7df3a5dd1757a73945c4495a9ca43a9f7c8`
- propagation du rôle appareil dans la page RPG : `63a6b81709c183c549ab0ce76ef248b5e1d1eaba`

CI finale : `34673262305` success.

## Priorités ouvertes

1. définir proprement le mécanisme de désignation/persistance de l’appareil MJ (session locale, profil ou future synchro multi-appareils) avant la vraie couche réseau/synchronisation ;
2. améliorer ensuite l’ergonomie mobile du bloc combat réel (timeline, ressources, actions, panneau MJ) sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
