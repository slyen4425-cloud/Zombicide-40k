# GenSrpG — Phase 5 / startConfiguredGame — pré-audit chaîne restante

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-startconfiguredgame-remaining-chain-preaudit-2026-09-22` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-startconfiguredgame-remaining-chain-preaudit-2026-09-22` ;
- base exacte :
  `b93576ac281309354f99ddad4e0898e760e88f2c` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-startconfiguredgame-capture131-retirement-green-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime, gameplay, asset ou `index.html` n'a été modifié dans ce pré-audit.

## État de départ

Après retrait du wrapper transitif `captureFix131`, la chaîne
`startConfiguredGame` contient cinq propriétaires actifs :

1. `captureFix135`
2. `captureFix138`
3. `captureFix139`
4. `gensDungeonCore01Js`
5. `dungeonCore200Rebuild`

Dernier propriétaire :
`dungeonCore200Rebuild`.

## Sentinelle

`tests/gens_phase5_startconfiguredgame_remaining_chain_preaudit_v1.test.cjs`.

Elle verrouille :
- les 5 affectations actuelles ;
- l'ordre exact de la chaîne ;
- les domaines Capture/Dungeon des propriétaires ;
- le contrat Shell Phase 3 ;
- l'inertie des points d'entrée Phase 3 ;
- l'absence de nouveau wrapper purement transitif supprimable immédiatement.

## Classification des cinq propriétaires

### captureFix135 — Capture / pré-lancement

Responsabilités observées :
- gestion du mode pregame Capture ;
- remise à zéro / préparation d'état Capture ;
- sauvegarde du world state Capture ;
- délégation vers le propriétaire précédent.

Verdict :
**logique Capture réelle**.

Ce wrapper ne peut pas être retiré comme `captureFix131` sans déplacer
explicitement ses effets dans une entrée publique Capture testée.

### captureFix138 — Capture / transition post-lancement

Responsabilités observées :
- détection du contexte Capture ;
- restauration/rendu du Hub Capture ;
- transition UI post-lancement ;
- délai historique `setTimeout`.

Verdict :
**logique Capture/UI réelle**.

Cette couche reste une dette de frontière Phase 5, mais elle n'est pas un no-op.

### captureFix139 — Capture / entrée de lancement dédiée

Responsabilités observées :
- route Capture dédiée ;
- délégation uniquement hors Capture ;
- activation de session ;
- initialisation du monde Capture et participants.

Verdict :
**meilleur candidat actuel pour devenir l'entrée publique Capture**.

Sa logique doit rester propriété Capture ; le futur Shell ne doit pas l'absorber.

### gensDungeonCore01Js — Dungeon / entrée native

Responsabilités observées :
- test d'éligibilité Dungeon ;
- entrée dans le runtime Dungeon ;
- délégation hors contexte.

Verdict :
**logique Dungeon réelle**.

### dungeonCore200Rebuild — Dungeon / interception finale

Responsabilités observées :
- interception finale Dungeon ;
- exclusion explicite de Capture ;
- délégation hors Dungeon ;
- dernier propriétaire actuel de `startConfiguredGame`.

Verdict :
**logique Dungeon réelle + dette d'autorité globale**.

Ce bloc ne doit pas être supprimé avant qu'une entrée publique Dungeon et une
autorité Shell explicites soient prouvées.

## Conclusion architecturale

Contrairement à `captureFix131`, **aucun des cinq propriétaires restants n'est
un wrapper transitif pur**.

Donc le prochain mouvement ne doit pas être une suppression opportuniste.

La roadmap Phase 5 exige :
- une seule autorité Shell pour la navigation ;
- retrait de l'autorité globale des modules sur les vues qu'ils ne possèdent pas.

Le contrat Phase 3 du Shell prévoit déjà :
- `active module/session routing` ;
- `global screen transitions` ;
- consommation de `module public entry contracts`.

Les contrats Capture/Dungeon restent actuellement inertes et ne fournissent
encore aucune entrée publique runtime raccordée.

## Prochain micro-lot recommandé

**Phase 5 — pré-audit du contrat public de lancement Capture.**

Pourquoi Capture en premier :
- les trois couches Capture sont contiguës dans la chaîne ;
- `captureFix139` constitue déjà la route dédiée Capture ;
- `captureFix135` et `captureFix138` encadrent cette route avec du pré/post
  lancement ;
- leur regroupement futur derrière une seule entrée publique Capture réduirait
  l'autorité globale sans déplacer le gameplay dans le Shell.

Le prochain lot doit rester **pré-audit / contrat uniquement** et déterminer :
1. les préconditions exactes de `captureFix135/138/139` ;
2. les effets avant/après lancement à préserver ;
3. le contrat public minimal d'entrée Capture ;
4. comment le Shell pourra appeler ce contrat sans lire l'état privé Capture ;
5. la séquence TDD permettant ensuite de retirer une affectation globale à la
   fois.

Interdictions du prochain lot :
- ne pas connecter encore `assets/gensrpg/shell/entry-v1.js` ;
- ne pas déplacer le gameplay Capture dans le Shell ;
- ne pas supprimer `captureFix135/138/139` pendant le pré-audit ;
- ne pas modifier Dungeon ;
- aucun wrapper/observer/retry de compatibilité.

## Validation technique avant clôture documentaire

SHA :
`711c896cd06f2f84e40b2a2f4ccd224d14c0f9ea`.

CI :
- Architecture + navigateur complet :
  `35816713522` — SUCCESS ;
- Firefox :
  `35816713549` — SUCCESS ;
- Tactical Dock :
  `35816713524` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Dungeon après Survie ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- non-interférence des quatre modules ;
- Preview ;
- assets ;
- Equipment.

## Validation finale obligatoire

La clôture documentaire change le SHA.

Avant checkpoint GREEN :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock

doivent repasser SUCCESS sur le même SHA documentaire final.

Aucun merge sur `main`.
