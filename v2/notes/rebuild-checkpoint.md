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

## Dernière étape terminée

Fuite branchée dans la vraie vue Donjon :
- nouveau module `v2/src/modes/rpg/dungeon-combat-flee-ui.js` ;
- bouton lisible `🏃 Fuir` uniquement pendant un vrai `dungeon-room-combat` en phase `turn` ;
- le clic appelle exclusivement `fleeDungeonCombat()` : aucune seconde logique de fuite n’est recréée dans l’interface ;
- après fuite, le résultat `phase:'fled'` est propagé aux callbacks avec `kind:'combat-flee'`, mais le combat actif de la page est remis à `null` afin de fermer réellement le bloc combat ;
- les `heroRuntimes` renvoyés par le runtime sont resynchronisés immédiatement, donc dégâts/ressources/KO des participants restent conservés ;
- le `roomRuntime` persistant reste l’autorité pour les ennemis, donc leurs dégâts temporaires de combat ne sont pas enregistrés ;
- la réconciliation victoire/défaite n’est jamais appelée pour cette sortie ; aucun loot, aucune clé boss et aucun ennemi vaincu artificiellement ;
- régression `rpg-dungeon-combat-flee-ui.test.mjs` : bouton seulement sur combat actif Donjon, fermeture du combat actif, propagation `combat-flee`, resynchronisation héros + salle.

Commits de l’étape :
- contrôle UI fuite : `659ee46f85df68fa3f87e993a4518d8a91db7e8c`
- montage page Donjon : `e631714efe643c4e72298eee2ab122a7c9b8bfbd`
- régression UI : `e2334508dc098c92c041ac1f9f3718e870881451`

CI finale : `34658702948` success.

## Priorités ouvertes

1. vérifier/raccorder `combat direct OFF / MJ contrôle total` contre le legacy ;
2. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
3. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
4. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
