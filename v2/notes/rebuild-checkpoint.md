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
- Contrats de cible combat : `enemy`, `ally`, `self` et `any` sont maintenant validés par le runtime avant toute dépense de ressource/charge/cooldown ; une cible KO reste invalide.
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

## Dernière étape terminée

Validation générique des cibles de compétence avant résolution :
- `targeting-engine.js` expose maintenant `normalizeTargetKind()`, `validSkillTargets()` et `validateSkillTarget()` pour les quatre contrats `enemy`, `ally`, `self`, `any`;
- `validCombatTargets()` et `validatePlayerTarget()` restent compatibles et délèguent au contrat `enemy` existant ;
- `prepareSkillAction()` valide désormais toutes les compétences avant `consumeSkillUse()`, donc une mauvaise cible ne dépense ni ressource, ni charge, ni cooldown ;
- `self` accepte uniquement l’acteur courant ; `ally` accepte un allié vivant distinct de soi ; `enemy` conserve les règles de cible adverse et le contrôle spatial/tactique existant ; `any` accepte toute cible vivante, y compris soi-même ;
- si aucune cible n’est fournie, le runtime choisit la première cible valide selon le contrat au lieu de supposer uniquement `self` ;
- une cible KO reste refusée pour tous les contrats ;
- régression dédiée dans `rpg-turn-runtime.test.mjs` : self correct/incorrect, ally correct/self/ennemi, cible par défaut, any sur héros/allié/ennemi, et refus d’un allié KO.

Commits de l’étape :
- ciblage générique : `8778136dec83934fe84c3338805e100562715453`
- enforcement runtime : `cd6e9fc5c6b30fd2c781f28bb04e2ef9007e5d5e`
- régression contrats de cible : `95d2e39b547ac801d82c12b81fb1930aac7ff965`

CI finale : `34656913323` success.

## Priorités ouvertes

1. raccorder maintenant le filtre de cibles `enemy/ally/self/any` à la vraie UI Donjon pour que le menu ne propose que les cibles valides de la compétence sélectionnée ;
2. vérifier/raccorder les consommables de combat ;
3. vérifier/raccorder la fuite puis `combat direct OFF / MJ contrôle total` contre le legacy ;
4. améliorer ensuite l’ergonomie mobile du bloc combat sans toucher à l’autorité moteur ;
5. étendre si besoin les statuts non additifs (`multiply`, `percent`, `set`) avec recomposition ordonnée ;
6. poursuivre l’audit legacy systématique : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture et UI cachées.
