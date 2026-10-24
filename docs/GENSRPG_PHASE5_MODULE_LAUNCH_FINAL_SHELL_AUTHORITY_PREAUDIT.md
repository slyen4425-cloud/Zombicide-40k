# GenSrpG — Phase 5 / module-launch — pré-audit Autorité Shell finale

Date : 2026-09-24

## Base sûre

- Validation utilisateur S4 : OK.
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-s4-dungeon-provider-green-2026-09-24`.
- SHA :
  `3542e0661dc1006d19115f936147651d727c2301`.
- Runtime :
  - taille `8172529` octets ;
  - blob `696014056409dda9b6ef25ace58dfd9d5f9e2718`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-final-shell-authority-preaudit-2026-09-24`.
- Branche :
  `work/gensrpg-phase5-module-launch-final-shell-authority-preaudit-2026-09-24`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Contexte validé

Le registre `GensShellModuleLaunchV1` est chargé en production.

Providers publics validés :
- Survival ;
- Capture ;
- Dungeon.

PvP reste volontairement non raccordé : le placeholder Shell reste l'autorité produit.

Les cinq propriétaires historiques de `startConfiguredGame` sont toujours chargés :
`captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Cette conservation est volontaire : un retrait antérieur de `captureFix135` avait passé
la CI mais cassé de vrais parcours utilisateur. Le rollback permanent reste donc bloquant.

## Mission unique

Pré-auditer la transformation de `startConfiguredGame` en **propriétaire Shell final**
qui délègue aux providers publics déjà prouvés.

Ce lot ne modifie pas le runtime.

## Questions auxquelles le pré-audit doit répondre

1. Quel bloc possède actuellement la fonction native Shell et son callsite production ?
2. À quel moment les trois providers sont-ils tous disponibles ?
3. Le routeur public peut-il reproduire les trois chemins sans état privé module ?
4. Quel comportement exact doit rester pour PvP ?
5. Quel résultat doit produire le Shell lorsqu'un provider est absent ou refuse la demande ?
6. Le futur propriétaire Shell doit-il déléguer à un fallback legacy pendant une étape
   transitoire, ou cette solution créerait-elle une double autorité contraire à la charte ?
7. Quels E2E doivent passer avant de rendre la bascule GREEN ?
8. Après bascule, dans quel ordre les cinq anciennes affectations peuvent-elles être
   caractérisées et retirées une par une ?

Aucune réponse ne doit être déduite du simple ordre/shadowing statique.

## Invariants protégés

- providers Survival/Capture/Dungeon inchangés ;
- PvP placeholder inchangé ;
- cinq propriétaires historiques inchangés dans ce lot ;
- production `startConfiguredGame()` inchangée ;
- `gensShellActiveModuleV1()` reste l'unique resolver ;
- aucun état privé module dans le Shell ;
- aucun changement Tactical/Builder/Storage/Stats ;
- aucune règle gameplay déplacée ;
- aucun observer/timer/retry/polling.

## E2E de parité obligatoires

Avant toute future bascule :
- Survival historique + provider ;
- Dungeon historique + provider ;
- Dungeon map -> Tactical ;
- Save & Quit -> reprise ;
- Dungeon après Survival ;
- Builder ;
- Capture historique + provider ;
- Capture victoire/reprise ;
- Capture composition complète ;
- PvP placeholder ;
- non-interférence quatre modules ;
- interfaces protégées et checks de composition.

## Règle 26

Le fichier `index.html` exact de cette base doit être fourni et vérifié avant inspection
runtime détaillée.

Empreinte attendue :
- `8172529` octets ;
- blob Git `696014056409dda9b6ef25ace58dfd9d5f9e2718`.

## Sortie du pré-audit

GREEN uniquement si :
1. seam Shell final caractérisé ;
2. sentinelle dédiée GREEN ;
3. aucune modification runtime ;
4. Architecture + navigateur complet GREEN ;
5. Firefox GREEN ;
6. Tactical Dock GREEN ;
7. checkpoint de pré-audit créé.

Le micro-lot runtime suivant devra commencer par un RED dédié et ne pourra retirer
aucun propriétaire historique dans le même lot que la bascule Shell.

Aucun merge sur `main`.


## Fichier exact S4 vérifié

Fichier utilisateur :
`work16.zip -> indexwork16.txt`.

Vérification :
- taille : `8172529` octets ;
- blob Git : `696014056409dda9b6ef25ace58dfd9d5f9e2718`.

Correspondance avec le checkpoint S4 GREEN : **exacte**.

## Cartographie de l'autorité finale

Le runtime exact contient toujours :
- un propriétaire natif `async function startConfiguredGame()` ;
- cinq affectations historiques :
  `captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Providers publics déjà raccordés :
- Survival : 1 ;
- Capture : 1 ;
- Dungeon : 1 ;
- PvP : 0.

Le vrai callsite utilisateur reste :
`onclick="startConfiguredGame()"`.

Les scripts chargés après `dungeonCore200Rebuild` ont été vérifiés :
- `assets/dungeon/dungeon-core-316.js` ;
- `assets/dungeon/dungeon-core-317.js` ;
- `assets/gensrpg/gens-mobile-combat-performance-16781022.js`.

Aucun ne lit ou ne réaffecte `startConfiguredGame`, et aucun n'utilise
`GensShellModuleLaunchV1`.

Le dernier script actuel est :
`assets/gensrpg/gens-mobile-combat-performance-16781022.js`.

## Seam sélectionné

Le futur propriétaire final doit être un fichier Shell dédié :

`assets/gensrpg/shell/module-launch-final-authority-v1.js`.

Il sera chargé **après tous les scripts actuels**, comme dernier script avant
`</body>`.

Il remplacera `window.startConfiguredGame` par un dispatcher Shell routing-only qui :
1. lit le module actif via l'API publique `GensShellModuleLaunchV1.activeModule()` ;
2. délègue à `GensShellModuleLaunchV1.startModuleSession(...)` ;
3. retourne le booléen public du contrat.

### Décision importante : aucun fallback legacy

Le futur propriétaire final :
- ne capture pas l'ancien `window.startConfiguredGame` ;
- ne délègue pas à l'ancienne chaîne en cas de refus ;
- ne contient aucun fallback Capture/Dungeon/Survival ;
- ne crée aucune double autorité.

Justification :
- Survival S2 possède déjà sa référence native validée ;
- Capture S3 possède déjà sa référence Capture139 validée ;
- Dungeon S4 possède déjà sa référence Core200 validée ;
- PvP reste volontairement sans provider et le registre retourne `false`.

Le callsite HTML pourra donc rester byte-identique :
`startConfiguredGame()`.

### Retraits historiques

**Aucun retrait dans le même lot que la bascule Shell.**

Après validation utilisateur de la future bascule :
les cinq anciennes affectations seront caractérisées et retirées une par une,
chacune avec RED/GREEN et E2E propres.

## Sentinelle de pré-audit

`tests/gens_phase5_module_launch_final_shell_authority_preaudit_v1.test.cjs`.

Elle verrouille :
- l'empreinte S4 exacte ;
- les trois providers publics ;
- PvP sans provider ;
- la chaîne historique à cinq propriétaires ;
- le callsite production inchangé ;
- l'absence d'un propriétaire tardif caché ;
- le futur emplacement Shell final ;
- l'interdiction d'un fallback legacy ;
- la présence des preuves E2E obligatoires.

Aucun runtime n'est modifié par ce pré-audit.


## Validation technique du pré-audit

SHA technique :
`3f6b5b23653de7d1fd41e12f40a51d9f77ac478f`.

CI :
- Architecture + navigateur complet : `35981166457` — SUCCESS ;
- Tactical Dock : `35981166458` — SUCCESS ;
- Firefox : `35981166471` — SUCCESS.

Le navigateur complet a notamment validé :
- Survival historique + provider S2 ;
- Survival après Dungeon ;
- goMenu Dungeon/Capture ;
- Dungeon map -> Tactical V2 ;
- Capture victoire/reprise ;
- Dungeon après Survival ;
- Dungeon Builder ;
- Config objet moderne ;
- fiche RPG ;
- openChar ;
- caches/pièges authored ;
- Save & Quit/reprise ;
- provider Dungeon S4 ;
- PvP placeholder ;
- Monster Capture historique ;
- provider Capture S3 ;
- composition Capture complète ;
- non-interférence quatre modules ;
- preview/assets/Equipment.

Le runtime reste strictement inchangé :
- taille `8172529` ;
- blob `696014056409dda9b6ef25ace58dfd9d5f9e2718`.

### Décision d'architecture finale du pré-audit

La future bascule doit ajouter un propriétaire Shell **sans fallback legacy** :
`assets/gensrpg/shell/module-launch-final-authority-v1.js`.

Ce fichier sera chargé en dernier et remplacera uniquement
`window.startConfiguredGame` par le dispatcher du contrat public.

Les cinq propriétaires historiques restent chargés pendant ce futur lot runtime.
Ils ne pourront être retirés qu'après validation utilisateur de la bascule,
puis un par un avec TDD dédié.

### Clôture documentaire

Le présent SHA documentaire doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Checkpoint cible après triple GREEN :
`checkpoint/gensrpg-phase5-module-launch-final-shell-authority-preaudit-green-2026-09-24`.

Aucun merge sur `main`.
