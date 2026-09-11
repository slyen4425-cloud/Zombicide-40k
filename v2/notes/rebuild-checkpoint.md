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
- Présentation combat : `combat-presentation-ui.js` est monté dans la vue Donjon active : timeline, KO, PV/ressources et journal moteur, sans déplacer la logique hors du moteur.
- Contrats de cible combat : `enemy`, `ally`, `self` et `any` sont validés par le runtime avant toute dépense de ressource/charge/cooldown ; une cible KO reste invalide.
- Ciblage UI vivant : changer la compétence du vrai combat Donjon recalcule maintenant immédiatement le menu Cible à partir de `validSkillTargets()` ; le sélecteur se désactive si aucune cible valide n’existe.
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
- checkpoint actions héros : `34654041123` success
- tours ennemis automatiques : `34655064237` success
- renderer présentation combat réelle : `34655892468` success
- renderer intégré dans vraie vue Donjon : `34656592813` success
- contrats de cible `enemy/ally/self/any` : `34656913323` success
- helper UI filtre cibles de combat : `34657181700` success
- changement de compétence => cibles recalculées en direct : `34657477226` success

## Dernière étape terminée

Raccord vivant du menu Cible au combat Donjon réel :
- `combat-target-ui.js` conserve le contexte du `combatState` réel et expose `syncDungeonCombatTargetControls()` ;
- `installDungeonCombatTargetUi()` écoute le changement du vrai sélecteur `[data-dungeon-combat-skill]` et reconstruit immédiatement `[data-dungeon-combat-target]` ;
- `combat-presentation-ui.js`, déjà monté dans la vraie vue Donjon, fournit le contexte `universe + combat` au filtre puis programme une synchronisation juste après le rendu DOM ;
- aucune règle de ciblage n’est recopiée : les choix viennent toujours de `validSkillTargets()` ;
- `enemy`, `ally`, `self`, `any` changent donc réellement la liste affichée ; les KO sont retirés et un sélecteur sans cible devient désactivé ;
- régression `rpg-dungeon-combat-target-live.test.mjs` : Tir -> Squelette, Soin allié -> Aldren, Concentration -> Lyra, Pouvoir libre -> trois cibles vivantes, puis désactivation quand l’unique allié devient KO.

Commits de l’étape :
- binding vivant du sélecteur : `79217a4e815323f251932abdf079314560c43cb0`
- raccord via la présentation combat réelle : `719418723cac74b1ed9c176689a65b7070c65aa5`
- régression live : `5e0995ebc794aedc5fdf8e166bb4e7e76ee9fecb`

CI finale : `34657477226` success.

## Priorités ouvertes

1. vérifier/raccorder les consommables de combat ;
2. vérifier/raccorder la fuite puis `combat direct OFF / MJ contrôle total` contre le legacy ;
3. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
4. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
5. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
