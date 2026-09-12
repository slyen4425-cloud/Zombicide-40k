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
- Lancement RPG : avant d’ouvrir l’espace RPG, l’appareil affiche maintenant un choix explicite `Ce téléphone est MJ` / `Ce téléphone est Joueur`. Le rôle mémorisé est indiqué et le choix sélectionné est sauvegardé localement avant le montage de la page RPG.
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

## Dernière étape terminée

Choix explicite du rôle du téléphone dans le flux de lancement RPG :
- nouveau module `v2/src/modes/rpg/dungeon-device-role-launch-ui.js` ;
- à l’ouverture du mode RPG, la page RPG n’est plus montée immédiatement : l’utilisateur choisit d’abord `📱 Ce téléphone est MJ` ou `🎮 Ce téléphone est Joueur` ;
- le rôle local déjà mémorisé est lu et affiché avec `Rôle mémorisé`, sans imposer silencieusement ce rôle ;
- le clic sauvegarde `gm` ou `player` via le module de persistance existant puis monte `mountRpgPage()` avec `dungeonIsGameMasterDevice` explicite ;
- le choix ne modifie pas `gmFullControl` : rôle appareil et règle de partie restent indépendants ;
- un téléphone Joueur reste donc sans panneau MJ même si le monde est configuré en MJ total ;
- la régression vérifie les deux choix, le rôle mémorisé et le fait que `app.js` passe bien le rôle explicite à la page RPG.

Commits de l’étape :
- UI de choix du rôle : `8c121bb04d1cb632b4c436dfff8bfe2dd94e0e39`
- branchement dans le lancement RPG : `cd1193d534d86eb1dbd74785d33ebda4ae332e01`
- régression : `66b3bec821cba172500fcc1f3813eb4d772c345b`

CI finale : `34673652441` success.

## Priorités ouvertes

1. améliorer maintenant l’ergonomie mobile du bloc combat réel (timeline, ressources, actions, consommables et panneau MJ) sans toucher à l’autorité moteur ;
2. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
3. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
