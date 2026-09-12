# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Créateur de salle : portes, interactions, jets réutilisables, tentatives persistantes et obstacles/couverture configurables sans saisie d’ID technique.
- Combat tactique : mouvement, portée, LOS, murs/portes, équipement, couverture directionnelle et portée d’entraide.
- Statuts persistants : recomposition ordonnée par source pour `add`, `subtract`, `multiply`, `percent` et `set`, avec conservation des changements externes de la statistique pendant la durée des statuts et compatibilité des sauvegardes V2 antérieures.
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
- Lancement RPG : avant d’ouvrir l’espace RPG, l’appareil affiche maintenant un choix explicite `Ce téléphone est MJ` / `Ce téléphone est Joueur`. Le rôle mémorisé est indiqué et le choix sélectionné est sauvegardé localement avant le montage de la page RPG.
- Ergonomie mobile combat : feuille de style dédiée au bloc de combat Donjon réel, sans changement moteur. Timeline horizontale tactile avec snap, cartes/action zones mieux séparées, cible tactile minimale 46–48 px, consommables/fuite et panneau MJ adaptés aux petits écrans, et boutons MJ réorganisés en 2 colonnes puis 1 colonne sous 390 px.
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
- choix du rôle téléphone au lancement RPG : `34673652441` success
- ergonomie mobile du bloc combat réel : `34677838395` success
- statuts persistants non additifs + dérive externe : `34678647180` success

## Dernière étape terminée

Extension sûre des statuts persistants non additifs :
- le moteur conserve une base sous-jacente par statistique affectée ;
- chaque source persistante possède un ordre stable et est rejouée dans cet ordre ;
- les opérations `add`, `subtract`, `multiply`, `percent` et `set` peuvent coexister et expirer indépendamment ;
- avant ajout ou expiration, le moteur compare la valeur courante à la valeur théorique des statuts actifs et reporte toute dérive externe sur la base : une progression, un équipement ou une autre modification légitime de la statistique n’est donc pas effacée ;
- la disparition d’un `set` révèle correctement la base actualisée avant de rejouer les sources plus récentes ;
- les anciens statuts V2 sérialisés avec `appliedDelta` sont migrés à la volée ;
- le fallback des toutes premières sauvegardes V2 à rollback absolu reste lisible ;
- nouvelle régression `rpg-status-nonadditive.test.mjs` couvrant `multiply`, `percent`, `set`, ordre d’expiration, restauration de base et migration ;
- l’ancienne régression `rpg-initiative-status.test.mjs` a volontairement bloqué une première implémentation qui perdait les changements externes de stat ; la correction finale la fait repasser.

Commits de l’étape :
- première recomposition ordonnée : `fd7a8d9a6f0945bfa8cf2580be455a469ca12188`
- régression non additive : `a08f18c86b2e1d118b85338cbd170f25759b5ac6`
- conservation de la dérive externe : `6e2c9d0095d0236cf0b726762184ab4df8af7caa`

CI finale : `34678647180` success.

## Priorités ouvertes

1. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées ;
2. continuer les améliorations visuelles mobile seulement après vérification sur vrai téléphone, sans déplacer l’autorité moteur dans l’interface.
