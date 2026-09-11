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
- Présentation combat : nouveau renderer lecture seule `combat-presentation-ui.js` pour timeline, KO, ressources/PV et journal moteur, sans déplacer de logique de combat dans l’UI.
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

## Dernière étape terminée

Préparation de la présentation complète du vrai combat, sans toucher à la logique moteur :
- nouveau fichier `v2/src/modes/rpg/combat-presentation-ui.js`;
- `combatResourceEntries()` lit directement les ressources présentes dans le vrai `actor.state.resources`, en respectant noms/icônes des définitions quand disponibles;
- `combatTimelineEntries()` dérive l’ordre, l’acteur actif et les KO du vrai `combat.order`/`combat.actors`;
- `combatJournalEntries()` transforme uniquement le log moteur existant (`action-resolved`, `combatant-ko`, `combat-ended`, `turn-begin`) en lignes lisibles;
- `renderCombatPresentation()` affiche cartes participants, PV/ressources, timeline active/KO et journal récent;
- aucun calcul de dégâts, KO, initiative, jet ou effet n’est refait dans ce module : il reste strictement présentationnel;
- régression dédiée : Lyra à 6/8 PV et 3/5 Mana, Squelette KO, journal avec jet 42 et effet Dégâts.

Commits de l’étape :
- renderer présentation : `a5a713c3e12596b8c24f64c673704d5af39d335c`
- régression présentation : `e53ae1ae9d41590a01b4fd686bb1670e4e0b2a83`

CI finale : `34655892468` success.

## Priorités ouvertes

1. intégrer `renderCombatPresentation()` directement dans la vraie vue Donjon active, en remplacement du résumé texte minimal actuel ;
2. vérifier les règles d’actions restantes contre le legacy : cibles ally/self/any, consommables, fuite, combat direct OFF / MJ contrôle total ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
