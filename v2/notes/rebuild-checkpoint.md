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
- Contrôle du combat : la configuration V2 possède maintenant les deux drapeaux `interaction.directCombat` et `interaction.gmFullControl`, avec une politique centrale `combatInteractionPolicy()` ; les anciens univers sans ces champs migrent vers les valeurs sûres `directCombat:true / gmFullControl:false`.
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

## Dernière étape terminée

Fondation data-driven de `combat direct OFF / MJ contrôle total` :
- `defaultCombatConfig()` expose maintenant `interaction.directCombat=true` et `interaction.gmFullControl=false` ;
- `ensureCombatConfig()` migre automatiquement les anciens univers qui n’avaient pas ces champs ;
- `combatInteractionPolicy()` devient l’autorité centrale pour savoir si les actions joueur automatiques, les tours ennemis automatiques et les contrôles manuels MJ doivent être actifs ;
- avec `directCombat=false`, les actions joueur automatiques sont coupées mais les tours ennemis restent automatiques tant que le MJ total n’est pas actif ;
- avec `gmFullControl=true`, les actions joueur automatiques et les tours ennemis automatiques sont tous deux coupés, et le mode de contrôles manuels est activé ;
- l’éditeur de règles de combat affiche maintenant les deux bascules lisibles `Combat direct des héros` et `MJ contrôle total` ;
- régression `rpg-combat-control-config.test.mjs` : valeurs par défaut, migration legacy, comportement direct OFF et priorité du MJ total.

Commits de l’étape :
- config/éditeur/politique : `94087e491b89d255f335dc5f497ea49fdfe0e03e`
- régression : `0a38e13fe43637ef6e5087e299244498c08a0024`

CI finale : `34658933290` success.

## Priorités ouvertes

1. brancher `combatInteractionPolicy()` dans la vraie vue Donjon : `directCombat OFF` doit désactiver les actions héros, et `MJ contrôle total` doit empêcher les tours ennemis automatiques ;
2. ajouter ensuite les contrôles manuels MJ sur le même `combatState` (PV/KO/jets/tour) sans second moteur ;
3. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
4. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
5. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
