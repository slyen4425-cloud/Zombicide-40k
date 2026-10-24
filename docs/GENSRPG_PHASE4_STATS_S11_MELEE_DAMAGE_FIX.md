# GenSrpG — Phase 4 Core Stats — S11 correctif double application dégâts mêlée

Date : 2026-09-21

- Branche :
  `work/gensrpg-phase4-stats-s11-melee-damage-double-application-fix-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s11-melee-damage-double-application-fix-2026-09-21`.
- Base exacte :
  `bb5844329f1e2e394ff2788168cc83e7e8eb38ac`.
- Checkpoint précédent :
  `checkpoint/gensrpg-phase4-stats-s11-damage-boundary-characterized-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Défaut reproduit

La caractérisation S11 a prouvé un doublon dans le chemin mêlée physique réel :

1. arme brute = 5 ;
2. `applyDungeonCombatScaling` ajoute le bonus canonique physique +3 ;
3. l'Adapter transporte alors `attack.power = 8` ;
4. V110 relit le même +3 dans
   `snapshot.derived.physicalDamageBonus` ;
5. V114.11 ajoutait ce +3 à `attack.power` ;
6. résultat avant correctif : 11 brut, puis 9 après armure 2.

Le chemin direct du test historique V114.11 ne reproduisait pas cette double
frontière car il construisait une attaque avec `power=5` sans passer par
l'Adapter réel.

## Propriétaire exact

Le runtime Dungeon existant expose déjà la provenance dans
`effectiveAttackStats()` :

`st.rpgDamageBonus`.

Aucune modification du gros `index.html` n'est nécessaire.

## TDD RED

Test :
`tests/gens_phase4_stats_s11_melee_damage_double_application_fix_v1.test.cjs`.

Commits :
- test RED : `8533d748ab1408296a36cdccf289b0be9615b1a9` ;
- branchement CI : `2d68b3c7f7f944355a3b3681ebb9365c6ffef96d`.

Run Architecture :
`35597056337` — FAILURE attendu.

Échec exact :
`Adapter must transport the canonical damage bonus already embedded in power`
avec `undefined !== 3`.

Le RED ne provenait donc ni d'une syntaxe de test ni d'une autre sentinelle.

## Correctif

### Adapter

Commit :
`b76ee9fa140bc811ced53db940a2577929773155`.

Fichier :
`assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js`.

L'Adapter transporte désormais :
`attack.meta.rpgDamageBonus`.

Ce champ indique le bonus RPG canonique déjà incorporé dans `attack.power`.

Le `power` Tactical reste inchangé afin de ne pas casser preview/AI ni les
autres bonus déjà composés par `effectiveAttackStats`.

### Résolveur V114.11

Commit :
`22cb5c19fe5cd26c3515481a835e07cb018ff151`.

Fichier :
`assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js`.

Pour la mêlée physique uniquement :
- `attackPower` reste la puissance totale transmise par l'Adapter ;
- le montant `attack.meta.rpgDamageBonus` déjà incorporé est soustrait de la
  base expliquée ;
- le bonus canonique courant du snapshot est ajouté une seule fois.

Exemple corrigé :
`attack.power 8 - bonus incorporé 3 = base 5`,
puis `base 5 + bonus snapshot 3 = 8 brut`,
puis `8 - armure 2 = 6 final`.

Cette forme permet aussi de remplacer proprement un bonus incorporé ancien par
la valeur canonique courante du snapshot si celui-ci a été rafraîchi.

## Sémantiques explicitement conservées

- Distance physique : inchangée.
  Le bonus déjà composé dans `attack.power` reste utilisé tel quel et V114.11
  n'ajoute pas le bonus mêlée du snapshot.
- Magie : inchangée.
  Le bonus magique déjà composé reste dans `attack.power` ; la branche
  non-physique V114.11 ne l'ajoute pas une seconde fois.
- Armure/floor S9 : inchangé.
- Résistances S8 : inchangées.
- Toucher/Défense/Esquive S10 : inchangés.
- Critique : inchangé.
- Mutation PV : reste Tactical.
- Dungeon classique : `applyDungeonCombatScaling` n'a pas été modifié.
- `index.html` : non modifié.

## Sentinelles après correction

La caractérisation S11 a été mise à jour au nouvel état au commit :
`d265b569dd085bde9f6c71bddad3042934ab1f36`.

Sur ce SHA technique :
- Architecture + test S11 : `35597196183` — SUCCESS ;
- navigateur complet dans le même run — SUCCESS ;
- Firefox : `35597196186` — SUCCESS ;
- Tactical Dock : `35597196182` — SUCCESS.

Le test anti-doublon verrouille :
- arme brute 5 ;
- bonus canonique 3 ;
- preview `attack.power=8` conservée ;
- base expliquée V114.11 = 5 ;
- bonus stat = 3 ;
- brut = 8 ;
- armure = 2 ;
- final = 6 ;
- distance physique inchangée ;
- magie inchangée.

## Frontière d'architecture

Ce lot ne crée aucun nouveau moteur.

Il corrige uniquement la frontière entre :
- Adapter Tactical, qui sait ce qui est déjà incorporé à la puissance ;
- V114.11, qui reste propriétaire du calcul physique final ;
- snapshot Stats, qui reste fournisseur du bonus canonique.

## Étape suivante

Après validation du SHA documentaire final et checkpoint GREEN :
1. reprendre S11 frontière dégâts depuis ce correctif ;
2. comparer le snapshot V110 aux snapshots/derivées Core S6/S7 ;
3. retirer uniquement les relectures Dungeon démontrées redondantes ;
4. conserver Tactical propriétaire de arme/type/résistance/armure/critique/PV ;
5. ne passer à S12 qu'après fermeture complète de S11.
