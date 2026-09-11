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
- Présentation combat : `combat-presentation-ui.js` est maintenant réellement monté dans la vue Donjon active : timeline, KO, PV/ressources et journal moteur remplacent le résumé minimal, sans déplacer la logique hors du moteur.
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

## Dernière étape terminée

Intégration du renderer de combat dans la vraie vue Donjon :
- `dungeon-gameplay-view.js` importe maintenant `renderCombatPresentation()`;
- pendant un combat réel actif, le vieux résumé `Participants : ...` est remplacé par la timeline réelle, les cartes de combattants, leurs PV/ressources et le journal moteur;
- l’acteur actif et les KO sont lus directement depuis `combat.order`, `combat.activeActorId` et `combat.actors`;
- les contrôles réels héros (compétence + cible + bouton d’action) restent montés à côté de cette présentation et continuent de muter le même `combatState`;
- les tours IA automatiques, la réconciliation de fin de combat et le loot ne changent pas de runtime;
- régression d’intégration dédiée : Lyra à 7/8 PV, Squelette KO à 0/6, journal avec jet 42 + effet Dégâts, contrôle `Utiliser la compétence` toujours présent, ancien résumé minimal absent.

Commits de l’étape :
- intégration renderer dans vue Donjon : `ed47701ffead782f3bf0f030af58e7dd4803194c`
- régression intégration : `ca330a91214739120455a26a9ce88a294d9a012f`

CI finale : `34656592813` success.

## Priorités ouvertes

1. vérifier et raccorder les règles d’actions restantes contre le legacy : cibles ally/self/any, consommables, fuite, combat direct OFF / MJ contrôle total ;
2. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
