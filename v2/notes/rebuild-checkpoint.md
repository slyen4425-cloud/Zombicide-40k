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
- Sécurité d’interface MJ : le panneau MJ exige `gmFullControl=true` et un appareil explicitement désigné MJ.
- Rôle appareil MJ persistant localement : le téléphone mémorise `gm` ou `player` dans son propre `localStorage`. La règle de partie et le rôle du téléphone restent séparés ; un autre téléphone ne récupère pas ce rôle automatiquement.
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
- persistance locale du rôle appareil MJ : `34673462295` success

## Dernière étape terminée

Persistance locale du rôle du téléphone/appareil MJ :
- nouveau module `v2/src/modes/rpg/dungeon-device-role.js` ;
- valeur stockée sous `gensrpg.v2.dungeon.deviceRole` avec seulement deux valeurs reconnues : `gm` et `player` ;
- toute valeur absente/invalide retombe sur `player`, donc le comportement sûr reste joueur par défaut ;
- lecture/écriture protégées contre un stockage indisponible ou refusé ;
- `rpg-page.js` utilise maintenant `dungeonIsGameMasterDevice=null` comme mode auto : dans ce cas il restaure le rôle local mémorisé au montage ;
- une valeur explicite `true/false` passée par un futur flux réseau/session continue de prendre priorité sur le stockage local ;
- `setDungeonGameMasterDevice()` met désormais à jour à la fois le rôle courant et sa persistance locale ;
- le panneau MJ continue d’exiger en plus `gmFullControl=true` : mémoriser le téléphone MJ ne change aucune règle de combat à lui seul ;
- régression dédiée sur normalisation, sauvegarde/restauration, valeurs invalides et branchement réel dans `rpg-page.js`.

Commits de l’étape :
- stockage local rôle appareil : `53888557ceca51b011cb855562282914522695df`
- restauration/persistance dans la page RPG : `7559f022ec6907253c4bc5a66d4f9be9a0638466`
- régression : `72e598c966178938f882b826e4dd3bfc2cab8f9c`

CI finale : `34673462295` success.

## Priorités ouvertes

1. ajouter un choix clair dans le flux de lancement/connexion de partie pour marquer ce téléphone `MJ` ou `Joueur`, en utilisant le stockage local déjà prêt ;
2. améliorer ensuite l’ergonomie mobile du bloc combat réel (timeline, ressources, actions, panneau MJ) sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
