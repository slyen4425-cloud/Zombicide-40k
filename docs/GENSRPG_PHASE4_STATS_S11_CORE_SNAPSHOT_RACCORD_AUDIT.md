# GenSrpG — Phase 4 Core Stats — S11 raccord Core Snapshot → Tactical

Date : 2026-09-21

- Branche :
  `work/gensrpg-phase4-stats-s11-core-snapshot-raccord-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s11-core-snapshot-raccord-2026-09-21`.
- Base :
  `8ead920b56dcebc16c78ada38fa1481476bc9cc2`.
- SHA technique validé avant documentation :
  `dd0492108e188a28125ca3f5ecce5fcbc3bea7d3`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet

Raccorder réellement les services Core Stats S3-S7 au snapshot Tactical V110,
sans modifier les formules de gameplay ni déplacer la résolution combat.

Chaîne obtenue :

`S3 Value Engine -> S4 Hero Values -> S5 Modifier Provider -> S6 Derived Values -> S7 Snapshot -> Stats runtime adapter -> V110 session envelope -> Tactical`.

## Autorité obtenue

Le propriétaire runtime Stats `GensCleanRpgStats167874` expose désormais
`coreSnapshot(hero)`.

Cette façade collecte explicitement les sources runtime existantes puis délègue
les calculs aux services Core déjà extraits :

- S3 : valeurs et effets ;
- S4 : valeurs héros ;
- S5 : modificateurs Equipment / Skills / Challenge ;
- S6 : dérivées ;
- S7 : snapshot immutable.

V110 consomme ensuite ce snapshot Core.

## Relectures Dungeon supprimées de V110

Les six relectures redondantes suivantes ne sont plus effectuées par V110 :

- `dungeonPhysicalDamageBonus` ;
- `dungeonMagicDamageBonus` ;
- `dungeonMaxMana` ;
- `dungeonCriticalChance` ;
- `dungeonDodgeChance` ;
- `dungeonMagicResistance`.

Les champs correspondants viennent de `core.derived`.

## Enveloppe session conservée dans V110

S7 reste pur et n'absorbe pas :

- HP courant ;
- mana courant ;
- résistances de session ;
- règles combat ;
- timestamp/version Tactical ;
- mutation PV ;
- état de tour.

V110 reste propriétaire de cette enveloppe Tactical.

## Valeurs canoniques

`canonical[]` et `values{}` viennent désormais du snapshot Core.

Movement, Defense et Armor conservent leur sémantique existante via les valeurs
canoniques, avec les fallbacks historiques de V110 uniquement là où ils restent
nécessaires.

## Initiative volontairement exclue du raccord dérivé

La caractérisation a prouvé que `S6.derived.initiative` peut intégrer un effet
cible `initiative` que V110 historique n'applique pas lorsque
`values.initiative` existe.

Le raccord S11 conserve donc :

`initiative = values.initiative ?? dungeonDerivedInitiative()`.

Aucune migration de l'initiative dérivée n'est faite dans ce lot.

## Ordre de chargement

Les services suivants sont désormais production-reachable et chargés avant le
propriétaire Stats :

1. `stats-normalization-v1.js`
2. `stats-value-engine-v1.js`
3. `stats-hero-values-v1.js`
4. `stats-modifier-provider-v1.js`
5. `stats-derived-values-v1.js`
6. `stats-snapshot-v1.js`
7. `gens-rpg-stats-clean-167874.js`

Pages et `preview.html` utilisent le même ordre.

Le Service Worker précache désormais S3-S7 et utilise une nouvelle clé de cache
pour ce raccord.

## Cartographie mise à jour

Les cinq services S3-S7 passent de `Phase 4 inert` à
`Phase 4 connected`.

Le graphe production-reachable passe de 68 à 73 fichiers.

Les documents/tests Phase 2 ont été réalignés sur ce changement d'architecture :

- graphe runtime ;
- propriétaires runtime ;
- side effects ;
- timers ;
- stockage ;
- fichiers non atteignables ;
- composition complète Capture.

Les cinq nouveaux services Core n'ajoutent aucun timer, observer, stockage ou
side effect autre que leur API publique attendue.

## Parité et sentinelles

La batterie valide notamment :

- Force canonique -> Tactical ;
- cache snapshot V110 ;
- snapshot S7 immutable ;
- S7 -> V110 canonical/values ;
- physicalDamageBonus ;
- magicDamageBonus ;
- maxMana ;
- crit ;
- dodge ;
- magicResistance ;
- Armure S9 ;
- Toucher/Défense/Esquive S10 ;
- frontière dégâts S11 ;
- correction application unique du bonus mêlée ;
- composition Pages/preview ;
- Capture pleine composition ;
- graphe et propriétaires Phase 2.

La parité S11 confirme également que les six helpers Dungeon migrés ne sont plus
relus par V110.

## Correctif dégâts S11 préservé

Le raccord conserve le contrat déjà GREEN :

- preview Tactical garde la puissance scalée ;
- Adapter transporte `meta.rpgDamageBonus` ;
- V114.11 applique le bonus canonique mêlée physique exactement une fois ;
- distance et magie ne changent pas ;
- armure/résistance/critique restent inchangés.

## Fichiers gameplay/runtime modifiés

- `assets/gensrpg/gens-rpg-stats-clean-167874.js`
- `assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js`
- `.github/workflows/main.yml`
- `preview.html`
- `service-worker.js`

Le gros `index.html` n'a pas été modifié.
Son blob vérifié reste :

`5b9b9ae780f735eadef049afeb10acf0b57441fe`.

## Interdictions respectées

Aucun nouveau :

- MutationObserver ;
- timer/retry ;
- wrapper runtime ;
- monkey patch ;
- moteur parallèle ;
- accès stockage Core Stats ;
- mutation HP Core.

Aucune formule Hit / Dodge / Armor / Resistance / Crit / dégâts n'est modifiée
par le raccord.

## Validation technique avant documentation

Sur `dd0492108e188a28125ca3f5ecce5fcbc3bea7d3` :

- Architecture + navigateur complet : `35602684576` — SUCCESS ;
- Firefox : `35602684564` — SUCCESS ;
- Tactical Dock : `35602684558` — SUCCESS.

## Clôture

Le présent commit documentaire change le SHA final.

Conformément à la charte, le checkpoint GREEN S11 ne peut être créé qu'après
SUCCESS des trois batteries sur le SHA documentaire exact.

Après ce GREEN :
1. figer le checkpoint S11 ;
2. ouvrir uniquement le prochain lot prévu par la roadmap Phase 4 ;
3. ne pas modifier `main`.
