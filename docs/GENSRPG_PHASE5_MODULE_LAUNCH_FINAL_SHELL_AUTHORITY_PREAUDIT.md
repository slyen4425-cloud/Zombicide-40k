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
