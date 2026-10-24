# GenSrpG — Phase 5 / contrat public de retour écran module

Date : 2026-09-23

## Base sûre

- Branche :
  `work/gensrpg-phase5-module-screen-return-contract-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-screen-return-contract-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-final-boundary-preaudit-green-2026-09-23`
- SHA de base :
  `79af020a1e589dc4cc8cc9325db5b91da21ae123`
- Runtime :
  taille `8170961`, blob `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## Problème architectural

Le pré-audit précédent a établi que les deux propriétaires `goMenu` restants
portent encore de vraies responsabilités module-owned :

`captureFix139 -> dungeonCore200Rebuild`.

- Capture possède le retour vers sa vue de jeu / Hub.
- Dungeon possède le retour vers sa vue d'exploration / map.
- Le Shell doit devenir l'unique propriétaire du routage général sans absorber
  ces décisions internes.

Un retrait direct de l'un de ces propriétaires est donc interdit.

## Contrat créé

Nouveau contrat pur :

`assets/gensrpg/shell/module-screen-return-contract-v1.json`

Opération sémantique :

`returnToPrimaryView`

Fournisseurs déclarés :

- `survival`
- `dungeon`
- `capture`
- `pvp`

Tactical est volontairement exclu : il reste un sous-système de combat et non
une destination de navigation générale.

## Répartition d'autorité

### Shell

Le Shell :

- sélectionne uniquement le module actif depuis l'état de routage public ;
- consomme le contrat public de retour écran ;
- ne reçoit aucun identifiant DOM privé ;
- ne lit aucun état runtime privé du module ;
- n'embarque aucune règle gameplay.

### Module actif

Le module actif :

- décide lui-même quelle est sa vue principale ;
- ne peut modifier que son UI propriétaire ;
- conserve ses règles, son état et ses écrans privés ;
- expose uniquement le contrat public convenu.

## Déclarations module

Les contrats Phase 3 de Survival, Dungeon, Capture et PvP déclarent désormais :

`publicEntries.moduleScreenReturn`

avec :

- contrat :
  `assets/gensrpg/shell/module-screen-return-contract-v1.json`
- opération :
  `returnToPrimaryView`
- statut :
  `declared-not-loaded`
- ownership :
  `module-owned-primary-view`

Les `entry-v1.js` restent inertes et non chargés par la production.

## TDD

Sentinelle :

`tests/gens_phase5_module_screen_return_contract_v1.test.cjs`

Le cycle RED a été observé avant implémentation :
- workflow Architecture `35899395632` ;
- échec attendu uniquement sur
  « Verrouiller le contrat pur de retour écran module Phase 5 ».

Après implémentation, le SHA technique
`be8312ccf6cdc6e196a6bc7ca5549dc822cb71f9` est GREEN :

- Architecture + navigateur complet :
  `35899613671` — SUCCESS ;
- Firefox :
  `35899613568` — SUCCESS ;
- Tactical Dock :
  `35899613739` — SUCCESS.

## Invariants

- `index.html` reste byte-identique.
- Aucun `window.goMenu` n'est ajouté, retiré ou modifié.
- Aucun wrapper global n'est ajouté.
- Aucun observer, timer, retry ou polling n'est ajouté.
- Aucun gameplay n'est déplacé.
- Aucun état privé Capture/Dungeon/Survival/PvP n'est exposé au Shell.
- Aucun raccord runtime n'est effectué dans ce lot.

## Résultat

Le contrat public nécessaire au futur raccord Shell existe maintenant sous
forme pure, déclarative et non chargée.

Le prochain lot autorisable est un **pré-audit de raccord runtime** :
identifier comment le Shell pourra appeler ce contrat et comment Capture /
Dungeon pourront fournir leur implémentation owner-local sans recréer une
chaîne de wrappers globaux.

Ce prochain lot ne doit pas modifier le runtime sans appliquer la règle 26
et travailler depuis l'`index.html` exact du checkpoint GREEN courant.
