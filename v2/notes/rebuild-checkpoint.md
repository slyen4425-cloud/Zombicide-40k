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
- Fuite combat : runtime dédié prêt ; les héros participants gardent leur état de combat, les héros dans d’autres salles restent intacts et les ennemis reviennent à leur état persistant de salle sans défaite/loot artificiels.
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

## Dernière étape terminée

Runtime de fuite raccordé au vrai modèle de combat Donjon :
- nouveau module `v2/src/modes/rpg/dungeon-combat-flee-runtime.js` ;
- la fuite n’est possible que pendant un vrai `dungeon-room-combat` actif ;
- les héros qui participaient au combat récupèrent leur état courant du `combatState` : dégâts/ressources/KO sont donc conservés ;
- les héros absents du combat, notamment ceux situés dans une autre salle, ne sont pas modifiés ;
- le `roomRuntime` n’est pas réconcilié avec les dégâts infligés aux ennemis : leurs PV/états reviennent donc exactement à l’état persistant de la salle avant le combat ;
- aucun ennemi n’est marqué vaincu, aucun loot n’est créé/attribué et aucune clé de boss ne peut être obtenue par fuite ;
- le combat passe en `phase:'fled'`, sans vainqueur ni acteur actif, et journalise `combat-fled` ;
- une deuxième tentative de fuite sur ce combat déjà fermé est refusée ;
- régression dédiée : héros A conserve ses dégâts, héros B dans une autre salle reste inchangé, ennemi repasse de 2 PV combat à 10 PV persistants, sans `defeated` ni `lootClaimed`.

Commits de l’étape :
- runtime fuite : `d94aa55f81799c4d9836e924427c6e188be15a25`
- régression fuite : `eab89f7a86cbf4b018987c45a156054b5ae5f9de`

CI finale : `34658436096` success.

## Priorités ouvertes

1. brancher maintenant la fuite dans la vraie vue Donjon : bouton `Fuir`, fermeture propre du bloc combat et propagation des héros mis à jour sans passer par la réconciliation victoire/défaite ;
2. vérifier/raccorder `combat direct OFF / MJ contrôle total` contre le legacy ;
3. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
4. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
5. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
