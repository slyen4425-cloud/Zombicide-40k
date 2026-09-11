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
- Actions héros : compétences réelles du runtime héros (base + équipement + sets + formes), `prepareSkillAction()` / `resolveAndAdvance()`, coûts/cooldowns/jets/effets du moteur existant.
- Tours ennemis : automatiques sur la même timeline avec `chooseCreatureAction()` + `chooseAiTarget()`, compétence bestiaire réelle, résolution D100/effets identique et fin de tour automatique.
- Présentation combat : timeline, KO, PV/ressources, journal moteur et ciblage vivant dans la vraie vue Donjon.
- Consommables de combat : runtime + UI réelle branchés au même `combatState` et au vrai inventaire héros ; quantité, cible valide, consommation unique, effets génériques et progression de timeline sont visibles/raccordés.
- Fuite combat : runtime + bouton réel dans la vue Donjon ; les héros participants gardent leur état, les héros dans d’autres salles restent intacts, les ennemis reviennent à leur état persistant et le bloc combat est fermé sans passer par une fausse victoire/défaite.
- Contrôle du combat : `interaction.directCombat` et `interaction.gmFullControl` sont maintenant réellement appliqués dans la vue Donjon. Direct OFF masque les actions héros automatiques/consommables ; MJ total bloque aussi l’avancement automatique des tours ennemis et laisse la timeline en attente de contrôle manuel.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique et cleanup.
- Stockage cloud réel différé ; import/export manuel reste le filet de sécurité.

## Jalons CI récents validés

- transitions World Builder dans vue Donjon : `34650608938` success
- déplacements individuels multi-héros : `34651007333` success
- vue Donjon multi-héros : `34651410540` success
- démarrage combat réel depuis runtime de salle : `34651712990` success
- entrée du combat réel dans vue Donjon : `34652076626` success
- réconciliation fin de combat Donjon : `34653003698` success
- réconciliation automatique à `phase=ended` : `34653443496` success
- actions/compétences réelles héros : `34653973093` success
- tours ennemis automatiques : `34655064237` success
- renderer présentation combat réelle : `34655892468` success
- renderer intégré dans vraie vue Donjon : `34656592813` success
- contrats de cible `enemy/ally/self/any` : `34656913323` success
- changement de compétence => cibles recalculées en direct : `34657477226` success
- runtime consommables combat Donjon : `34657796799` success
- UI consommables combat Donjon : `34658191700` success
- runtime fuite combat Donjon : `34658436096` success
- UI fuite combat Donjon : `34658702948` success
- configuration combat direct / MJ : `34658933290` success
- application combat direct / MJ dans vraie vue Donjon : `34659348809` success

## Dernière étape terminée

Application réelle de `combatInteractionPolicy()` dans la vue Donjon :
- `dungeon-gameplay-view.js` lit désormais la politique centrale au rendu et au moment des actions ;
- `directCombat=false` retire les contrôles de compétence du héros actif et les remplace par un message clair ;
- l’événement de clic compétence possède aussi un garde d’autorité : même si un ancien bouton restait présent, l’action serait refusée ;
- `dungeon-combat-item-ui.js` ne monte plus les consommables lorsque les actions héros automatiques sont désactivées ;
- `gmFullControl=true` empêche `runAutomaticEnemyTurns()` d’appeler `advanceDungeonEnemyTurns()` : le tour ennemi reste donc réellement en attente dans le même `combatState`, sans auto-pass ni faux changement de timeline ;
- la vue indique explicitement `MJ contrôle total : tour ennemi en attente d’une résolution manuelle` au lieu du message de résolution automatique ;
- aucune logique de calcul n’a été déplacée dans l’UI ; la politique ne fait qu’autoriser/interdire les chemins automatiques existants ;
- régression `rpg-dungeon-combat-control-view.test.mjs` : Direct OFF masque compétence/consommables, MJ total affiche l’attente manuelle et n’annonce plus de résolution automatique.

Commits de l’étape :
- politique appliquée dans vue Donjon : `17c1ebf4880071f4fcc6dc46c7dde5cbc59bfffb`
- consommables soumis à la même politique : `135922304ceaf6e2969ef47a19d04cd82709d229`
- régression vue : `661c06b15794ecdfc9802dae1f52b32c25c5cfb5`

CI finale : `34659348809` success.

## Priorités ouvertes

1. ajouter les contrôles manuels `MJ contrôle total` sur le même `combatState` : modification PV/ressources, KO/réactivation, passage manuel du tour et résolution de jets sans créer de second moteur ;
2. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
