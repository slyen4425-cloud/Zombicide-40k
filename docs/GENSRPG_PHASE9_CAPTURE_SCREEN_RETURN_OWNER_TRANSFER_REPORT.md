# GenSrpG — Phase 9 — Transfert propriétaire du retour Capture

Date : 2026-10-08.

## Base, règle 26 et contrôle de source

- Branche dédiée : `work/gensrpg-phase9-capture-screen-return-owner-transfer-2026-10-08`.
- Départ / dernier GREEN avant transfert : `1d1eede2556bbe3f76120dfb4befca262f023296`, checkpoint `checkpoint/gensrpg-start-phase9-capture-screen-return-owner-transfer-2026-10-08`.
- Fichier utilisateur reçu : `indexH.txt`. Contenu `index.html` exact : 8 165 794 octets, Git blob `462abc969e7ac636f8ac4ee54c0d14fe51b83e7d`, SHA-256 `29ade721f6518d7ccb5a30573f35676d43d1fa827c15097ed7dac2452b792d6e`. Règle 26 satisfaite.
- Runtime après le seul transfert : 8 165 823 octets, Git blob `26421e0347305437fe2b1dc149b3e4fb8b3761bd`. Diff contrôlé : nouveau script chargé après session-start et avant `captureFix139`; un seul bloc de délégation remplacé. Aucun moteur ni autre mode touché.
- Production `main` : `e8681f9823573ced8aec59c8ddc47a72b02bc663`, inchangée et gelée.

## Avant / après — une autorité unique

**Avant** : `captureFix139` possédait à la fois le rendu `captureEnterWorld139`, l’injection des dépendances SessionStart et l’enregistrement `GensShellScreenReturnV1.register("capture",...)`.

**Après** :
- `assets/gensrpg/capture/screen-return-v1.js` est l’unique propriétaire de l’opération `returnToPrimaryView` pour Capture et enregistre exactement une fois son provider auprès de l’API Shell existante ;
- la décision de retour garde strictement les deux conditions précédentes `hasActiveSession()` et `isCaptureContext138()`, puis appelle `captureEnterWorld139()` une fois, avec `handled:boolean` inchangé ;
- `captureFix139` fournit uniquement trois dépendances explicites, sans enregistrer Shell et sans wrapper global `goMenu` ;
- `captureEnterWorld139` et sa transition Hub restent inchangés, au même emplacement : pas de deuxième renderer ni de déplacement prématuré de contexte DOM ;
- `GensCaptureSessionStartV1`, `GensCaptureV1` et l’identification Capture restent intacts ;
- le provider Dungeon, la fonction native `goMenu`, la navigation Survie/PvP et les données/sauvegardes sont inchangés.

Le propriétaire expose `install()`, `dispose()`, `status()` et reste inactif si les dépendances sont désinstallées ; aucune boucle de maintenance, timer, observer, stockage, DOM privé ou import inter-module.

## Preuves et barrières CI

- RED de l’ancien provider puis GREEN du nouveau : one-shot `37823283538` SUCCESS.
- Sentinelle permanente `tests/gens_phase9_capture_screen_return_owner_transfer_v1.test.cjs` : un seul script chargé, aucun provider dans l’inline, un seul `register("capture",...)` dans Capture, guards session/famille, idempotence, inertie après dispose, absence d’autorité DOM/stockage.
- Tests Phase 5/9 adaptés à la propriété réelle, non supprimés ; composition du graphe runtime Phase 2 = 85 actifs (deux owners Capture auxiliaires) ; cartographie d’assets et fonctions historiques intactes.
- Retour arrière byte-exact : le test historique `gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs` inverse d’abord le nouveau seam Capture, exige le blob précédent `462abc...`, puis inverse les deux seams plus anciens et exige toujours le blob immuable `20381d1df0b10b664d5163f308f909cd7a6e45df`. Les assertions originelles sont conservées.
- Un balayage `37823983854` a exécuté 339 sentinelles statiques, identifié neuf anciens contrats liés à l’ownership et aux comptes ; ceux-ci ont été réécrits pour attendre explicitement le nouveau propriétaire, sans faiblir les protections.
- Triple CI Architecture + Browser / Firefox / Tactical Dock sur le HEAD documentaire final exigée. Preview publique exacte et validation utilisateur ciblée avant de déclarer GREEN fonctionnel.

## Sortie — validation utilisateur reçue le 8 octobre 2026

Après correction de l'ancienne sentinelle Phase 5 devenue obsolète, triple CI du **même commit runtime/documentaire** `cd5f43d29fa3cae395729d6d5a3e4dc9ef9cceba` :

- Architecture + Browser : [run 37831320078](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37831320078), SUCCESS, 341 étapes Architecture et 55 étapes Browser ;
- Firefox : [run 37831320077](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37831320077), SUCCESS ;
- Tactical Dock : [run 37831320196](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37831320196), SUCCESS.

Prévisualisation exacte testée : https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/cd5f43d29fa3cae395729d6d5a3e4dc9ef9cceba/preview.html

**Validation manuelle utilisateur**, après demande de contrôle de Monster Capture → Hub/retour/reprise et accès Builder Dungeon : « Ok tout fonctionne parfaitement » (8 octobre 2026). Aucun dysfonctionnement signalé.

L'ancien test Phase 5 `gens_phase5_gomenu_core01_retirement_v1.test.cjs` a été adapté pour vérifier le nouveau propriétaire Capture plutôt que forcer `GensShellScreenReturnV1` au sein de `captureFix139`. Il conserve les vérifications d'unicité et d'absence de wrapper global.

Le chantier a un checkpoint technique GREEN : `checkpoint/gensrpg-phase9-capture-screen-return-owner-transfer-technical-green-2026-10-08` au SHA `cd5f43d29fa3cae395729d6d5a3e4dc9ef9cceba`. Le checkpoint **fonctionnel** `checkpoint/gensrpg-phase9-capture-screen-return-owner-transfer-green-2026-10-08` sera créé après GREEN des CI sur le HEAD final incluant ces mises à jour documentaires.

Aucun changement de runtime par cette mise à jour. Aucun merge de `main`.
