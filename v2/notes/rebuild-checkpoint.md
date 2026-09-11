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
- Ciblage UI vivant : changer la compétence du vrai combat Donjon recalcule immédiatement le menu Cible à partir de `validSkillTargets()` ; le sélecteur se désactive si aucune cible valide n’existe.
- Consommables de combat : nouveau runtime dédié raccordé au même `combatState` et au vrai inventaire héros ; consommation unique, effets génériques existants, ciblage `self/ally/enemy/any`, journal moteur et progression de timeline configurable.
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
- runtime consommables combat Donjon : `34657796799` success

## Dernière étape terminée

Runtime de consommables branché sur le vrai combat Donjon, sans second moteur :
- nouveau module `v2/src/modes/rpg/dungeon-combat-item-runtime.js`;
- `dungeonHeroCombatItems()` lit directement l’inventaire du héros dont c’est réellement le tour ;
- les objets `consumable` et `scroll` sont utilisables en combat par défaut, sauf `data.combatUsable=false`; tout autre type peut être explicitement autorisé avec `data.combatUsable=true`;
- les conditions existantes passent par `canUseItem()` et les effets passent par `useInventoryItem()` / `applyEffect()` : aucune seconde logique d’objet ou d’effet n’est créée ;
- la cible est data-driven via `data.targetKind` ou `data.target`, avec les mêmes contrats `self/ally/enemy/any` que les compétences ;
- une cible invalide ne consomme rien ; un objet consommé retire exactement une unité du vrai inventaire héros ;
- l’état cible est modifié directement dans le vrai `combatState`, puis la règle de KO/défaite existante est réévaluée ;
- un événement moteur `item-used` est ajouté au journal avec objet, cible, effets, audio/event éventuels ;
- par défaut un consommable termine le tour et avance la timeline existante ; `data.consumeTurn=false` permet explicitement un objet sans consommation de tour ;
- régression dédiée : potion self soigne 4 PV, décrémente 2→1 et passe au héros suivant ; cible alliée invalide ne consomme rien ; bandage ally soigne l’allié, se consomme et conserve le tour quand `consumeTurn=false`; un matériau ordinaire n’apparaît pas comme action de combat.

Commits de l’étape :
- runtime consommables : `4b41c7bc0f2805e0da07e71d7efbe49b1bde9d31`
- régression consommables : `e27474112af2a248ab1e9269b71c02d70db2879e`

CI finale : `34657796799` success.

## Priorités ouvertes

1. brancher maintenant ces consommables dans la vraie vue Donjon : menu Objet + cible valide + bouton Utiliser, avec rafraîchissement immédiat des quantités ;
2. vérifier/raccorder la fuite puis `combat direct OFF / MJ contrôle total` contre le legacy ;
3. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
4. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
5. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
