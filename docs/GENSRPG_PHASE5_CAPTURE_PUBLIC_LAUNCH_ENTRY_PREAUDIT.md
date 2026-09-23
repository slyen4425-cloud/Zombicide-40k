# GenSrpG — Phase 5 / Capture public launch-entry — pré-audit

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-capture-public-launch-entry-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-capture-public-launch-entry-preaudit-2026-09-23` ;
- base exacte :
  `d519ae79f925b8be8c873f6c1f8c05d001427cb7` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-startconfiguredgame-remaining-chain-preaudit-green-2026-09-23` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime, gameplay, asset ou `index.html` n'a été modifié dans ce pré-audit.

## Objet

Préparer une future entrée publique Capture consommable par le Shell sans que le
Shell lise ni modifie l'état privé Capture.

Le pré-audit porte sur les trois affectations Capture encore présentes dans la
chaîne `startConfiguredGame` :

1. `captureFix135`
2. `captureFix138`
3. `captureFix139`

## Sentinelle

`tests/gens_phase5_capture_public_launch_entry_preaudit_v1.test.cjs`.

La sentinelle vérifie :
- les trois blocs restent actifs et Capture-owned ;
- le Shell Phase 3 reste inert ;
- l'entrée Capture Phase 3 reste inerte ;
- le Shell cible consomme des `module public entry contracts` ;
- les règles Capture ne migrent pas dans le Shell ;
- la chaîne globale reste actuellement à 5 propriétaires.

## Caractérisation

### captureFix135 — pré-lancement historique

Effets observés :
- détection de `gensCapturePregameMode()` ;
- mutations de reset jour/tour/round Capture ;
- sauvegarde du world state Capture ;
- délégation au propriétaire précédent.

### captureFix138 — transition post-lancement historique

Effets observés :
- `isCaptureContext138()` ;
- rendu/restauration du Hub Capture ;
- nettoyage/transition UI ;
- délai historique via `setTimeout`.

### captureFix139 — entrée Capture dédiée

Effets observés :
- intercepte Capture avant délégation ;
- délègue uniquement hors Capture ;
- validation participants/starter ;
- activation session ;
- initialisation monde Capture ;
- ordre de tour ;
- entrée dans le monde Capture.

Verdict :
`captureFix139` est le meilleur noyau actuel d'une future entrée publique Capture.

## Preuve de shadowing

La sentinelle établit la chaîne effective :

- `captureFix139` est le wrapper externe Capture ;
- en contexte Capture, il intercepte avant d'appeler `captureFix138` et
  `captureFix135` ;
- hors Capture, il délègue ;
- dans ces contextes délégués, les branches Capture spécifiques de
  `captureFix138` et `captureFix135` ne s'activent pas.

En particulier :

- la condition spécifique de `captureFix135`,
  `gensCapturePregameMode() === true`, est couverte par le prédicat Capture
  externe ;
- donc dans la chaîne réelle, son effet Capture est shadowé par
  `captureFix139`.

Cette preuve ne signifie pas encore que `captureFix138` peut être retiré :
son cas doit être ré-audité séparément après le premier retrait.

## Frontière publique Capture proposée

Propriétaire :
`capture`.

Consommateur futur :
`shell`.

Forme minimale visée :
- une entrée async Capture-owned ;
- le Shell fournit uniquement la décision de routage/module ;
- aucune structure privée Capture n'est passée par le Shell ;
- Capture garde :
  - état de pré-game ;
  - validation participants/starter ;
  - initialisation monde ;
  - état de session Capture ;
  - transition Hub/UI Capture ;
- le contrat de retour conserve d'abord les sémantiques observables actuelles
  tant qu'un résultat explicite n'a pas été caractérisé.

Statut de ce lot :
**descriptif uniquement** — aucune entrée runtime nouvelle n'est connectée.

## Premier micro-lot runtime sélectionné

**Retrait de la seule affectation `startConfiguredGame` de `captureFix135`.**

Motif :
- sa branche Capture est shadowée dans la chaîne effective par
  `captureFix139` ;
- le lot peut rester strictement soustractif ;
- les quatre propriétaires restants restent :
  `captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

TDD obligatoire avant modification runtime :
- RED exigeant 4 affectations ;
- absence d'affectation `startConfiguredGame` dans `captureFix135` ;
- bloc `captureFix135` conservé pour ses autres responsabilités ;
- `captureFix138/139` inchangés ;
- propriétaires Dungeon inchangés ;
- lancement Survie/Dungeon/Capture/PvP et non-interférence couverts.

Après ce retrait :
**ré-audit obligatoire de `captureFix138` avant tout second retrait Capture.**

## Validation technique avant clôture documentaire

SHA :
`36283aa784dcd124f2b1af5dacebe5c5fe48e3b0`.

CI :
- Architecture + navigateur complet :
  `35817855015` — SUCCESS ;
- Firefox :
  `35817855090` — SUCCESS ;
- Tactical Dock :
  `35817855009` — SUCCESS.

## Validation finale obligatoire

La clôture documentaire change le SHA.

Avant checkpoint GREEN :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock

doivent repasser SUCCESS sur le même SHA documentaire final.

Aucun merge sur `main`.
