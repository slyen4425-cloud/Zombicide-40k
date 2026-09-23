# GenSrpG — Phase 5 / pré-audit goMenu Core 0.23

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core023-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core023-preaudit-2026-09-23` ;
- base documentaire GREEN :
  `44db719503ca3ab697f65d4ba3da93c929733935` ;
- dernier checkpoint runtime GREEN :
  `checkpoint/gensrpg-phase5-gomenu-core030-retirement-green-2026-09-23`,
  SHA `32d2c00200bf148e2c764166a3c07e4ae05bc919` ;
- runtime inchangé :
  `index.html` taille `8171079`,
  blob `6a9392e667881f2087e4df931645cada4201cb3c` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Aucun runtime, gameplay, asset ou stockage n'est modifié dans ce pré-audit.

## Chaîne goMenu de départ

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore200Rebuild`

Dernier propriétaire :
`dungeonCore200Rebuild`.

## Responsabilité exacte Core 0.23

Core 0.23 n'est pas un wrapper transitif pur.

Son interception `goMenu` :
1. capture le propriétaire précédent via `oldGo023` ;
2. délègue d'abord à `oldGo023` ;
3. après retour, teste `window.DungeonCore01?.active` ;
4. si Dungeon est encore actif :
   - remet `body.style.overflow` à vide ;
   - ferme `specialDiceModal` ;
   - ferme `dc01Modal` ;
   - rappelle `DungeonCore01.show()`.

Le même script possède aussi d'autres responsabilités réelles, notamment la garde
`DungeonCore01.openHero`, la synchronisation loot et de la logique IA.
Ces responsabilités sont hors cible et doivent rester intactes.

## Shadowing réel

Core 2.00 est le dernier propriétaire de `goMenu`.

Sur le chemin nominal :
`active200 && isDungeonMode()`

Core 2.00 retourne directement `show()` et ne délègue pas.
Core 0.23 n'est donc pas exécuté sur ce chemin Dungeon nominal.

Mais hors Dungeon, Core 2.00 délègue à la chaîne précédente.
Core 0.23 peut alors encore exécuter son post-traitement si
`DungeonCore01.active` reste vrai.

Comme Core 2.00 remplace l'objet public `window.DungeonCore01` et définit son
getter `active` sur `active200`, le risque exact à caractériser est :

`active200 === true` alors que la navigation courante n'est plus Dungeon.

## Couverture existante et limite

Les E2E déjà GREEN prouvent :
- Dungeon fiche héros -> `goMenu` -> map Dungeon ;
- Capture active + vieille sauvegarde Dungeon -> `goMenu` -> Hub Capture ;
- Survie fiche héros -> `goMenu` -> menu Survie ;
- absence de vol Capture par une simple sauvegarde Dungeon persistante.

Ils vérifient aussi qu'après un retour Dungeon :
- `specialDiceModal` n'est pas ouverte ;
- `dc01Modal` n'est pas ouverte.

Mais le scénario courant ne force pas ces anciennes couches à être ouvertes
avant l'appel `goMenu`.
Il ne prouve donc pas encore que le nettoyage historique Core 0.23 est
totalement redondant.

La sentinelle quatre modules traverse les familles sans lancer une vraie session
Dungeon active ; elle ne couvre pas non plus à elle seule la combinaison
`active200=true` + changement réel de module.

## Décision du pré-audit

**Aucun retrait Core 0.23 autorisé dans ce lot.**

Le candidat reste plausible car Core 2.00 court-circuite le chemin Dungeon
nominal, mais le rôle post-délégation doit être caractérisé avant TDD de retrait.

## Prochain micro-lot recommandé

**Phase 5 — caractérisation E2E de la responsabilité goMenu Core 0.23.**

Objectifs :
1. partir d'une vraie session Dungeon active ;
2. exercer le vrai retour fiche -> map ;
3. caractériser un vrai changement de module/session après Dungeon actif sans
   fabriquer artificiellement l'état attendu ;
4. vérifier que Capture/Survie ne peuvent jamais être réouverts puis recouverts
   par Dungeon via le post-traitement Core 0.23 ;
5. caractériser, par un chemin UI réel si disponible, la fermeture des anciennes
   modales que Core 0.23 prétend nettoyer ;
6. conserver Builder, Tactical, Save/Quit/Resume et non-interférence GREEN.

Seulement si cette caractérisation démontre que Core 0.23 n'a plus d'effet
nécessaire :
- créer une sentinelle TDD RED exigeant la chaîne sans Core 0.23 ;
- retirer uniquement sa capture `oldGo023` et son affectation
  `window.goMenu` ;
- conserver toutes ses autres responsabilités.

## Interdictions

- aucun changement `index.html` dans ce pré-audit ;
- aucun retrait Core 0.23 ;
- aucune modification Capture/Core 2.00 ;
- aucune correction détection ennemie ou embuscade ;
- aucun wrapper, observer, timer/retry ou monkey patch supplémentaire ;
- aucun merge sur `main`.


## Validation finale

SHA validé :
`b1f3f790f41c4204a925cbd37aba744ac172bfb0`.

Triple CI :
- Architecture + navigateur complet `35851158253` — SUCCESS ;
- Firefox `35851158424` — SUCCESS ;
- Tactical Dock `35851158340` — SUCCESS.

Checkpoint GREEN :
`checkpoint/gensrpg-phase5-gomenu-core023-preaudit-green-2026-09-23`.

Conclusion :
le pré-audit est GREEN et ne modifie aucun runtime.
Le prochain lot est uniquement la caractérisation E2E de la responsabilité
post-délégation Core 0.23.
