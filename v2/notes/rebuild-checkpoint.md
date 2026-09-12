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

## Dernière étape terminée

Amélioration mobile ciblée du vrai bloc combat Donjon :
- nouveau fichier `v2/src/ui/dungeon-combat-mobile.css`, chargé après `app.css` pour rester isolé du moteur et des autres écrans ;
- timeline tactile horizontale avec `scroll-snap-type:x proximity`, inertie mobile et éléments de tour avec cible tactile minimale ;
- combattant actif mieux distingué visuellement sans modifier son état ;
- actions de compétence, consommables et panneau MJ deviennent des blocs visuels distincts et lisibles ;
- boutons de combat/MJ avec hauteur minimale 46 px sur bureau compact et 48 px sur téléphone ;
- champs `select/input` de combat portés à 48 px sur petit écran ;
- fuite empilée proprement sur mobile ;
- boutons MJ disposés en 2 colonnes sur téléphone standard puis 1 colonne sous 390 px ;
- journal et cartes de combattants compactés sans supprimer d’information ;
- aucune logique de timeline, PV, ciblage, objets, fuite ou commandes MJ n’a été modifiée ;
- régression dédiée `rpg-dungeon-combat-mobile-css.test.mjs` vérifiant le chargement de la feuille dédiée et les garde-fous mobile essentiels.

Commits de l’étape :
- chargement de la feuille dédiée : `612c30a080da79ae8aacd6bdb06ce6a692a7ee6b`
- ergonomie mobile combat : `0494f2f36f858bd655c067a35bd46828997c4cd5`
- régression CSS : `ea592fc2490457bd9728ed5c3207306f6ff5eeb8`

CI finale : `34677838395` success.

## Priorités ouvertes

1. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
2. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées ;
3. continuer les améliorations visuelles mobile seulement après vérification sur vrai téléphone, sans déplacer l’autorité moteur dans l’interface.
