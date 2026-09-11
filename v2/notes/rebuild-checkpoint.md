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

## Dernière étape terminée

Raccord UI des consommables dans la vraie vue Donjon :
- nouveau module `v2/src/modes/rpg/dungeon-combat-item-ui.js` ;
- l’UI lit `dungeonHeroCombatItems()` directement depuis le héros dont c’est réellement le tour ;
- menu Objet avec nom/icône et quantité restante (`xN`) ;
- changement d’objet recalcule immédiatement la cible depuis `validSkillTargets()` selon `self/ally/enemy/any` ;
- bouton Utiliser désactivé s’il n’existe aucune cible valide ;
- l’utilisation appelle `useDungeonHeroCombatItem()` : inventaire réel et `combatState` réel sont mis à jour ensemble ;
- après utilisation, `rpg-page.js` resynchronise immédiatement héros + combat vers la vue Donjon, donc les quantités et la timeline se rafraîchissent sans état parallèle ;
- les callbacks externes reçoivent aussi le nouvel état avec `kind:'combat-item'` ;
- régression `rpg-dungeon-combat-item-ui.test.mjs` : potion x2, bandage, cible self/ally correcte et présence des contrôles lisibles.

Commits de l’étape :
- UI consommables : `85f7f331f1a9e584e4e5cb1f78e31e3672f89690`
- montage dans page Donjon : `f9e56733792306b5009444caa84cb4f2fdb53fe6`
- régression UI : `11d187d1681a86bd9dbfd6476a2b0ce616a130b0`

CI finale : `34658191700` success.

## Priorités ouvertes

1. vérifier/raccorder la fuite au vrai combat Donjon ;
2. vérifier/raccorder `combat direct OFF / MJ contrôle total` contre le legacy ;
3. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
4. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
5. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
