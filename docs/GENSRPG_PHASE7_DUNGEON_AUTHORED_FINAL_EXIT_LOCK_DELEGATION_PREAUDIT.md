# GenSrpG — Phase 7 / Dungeon authored Final Exit — délégation canonique du verrouillage — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-exit-lock-decision-green-2026-09-29`

SHA exact de base :
`bf11948595ccbaa700e56cd4f50f569b766f8fdf`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-final-exit-lock-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-final-exit-lock-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale documentaire de la base :
- Architecture + Browser : `36538216504` — SUCCESS ;
- Firefox : `36538216686` — SUCCESS ;
- Tactical Dock : `36538216745` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat d'architecture

Le micro-lot 13 a donné la décision authored locale de verrouillage à un propriétaire canonique unique :

`GensDungeonV1.movement.isAuthoredExitBlocked(lastExitLocked, mapObjectiveStatus, objectiveStatus)`.

`DungeonAuthoredRuntime167839.blocked(x)` conserve :
- le garde dynamique `dungeonRoomExitLocked102?.()` ;
- son ordre et son `try/catch` ;
- les lectures runtime ;
puis délègue la décision locale au helper Dungeon.

Le module production `assets/dungeon/dungeon-authored-final-exit-167875.js` conserve toutefois encore une copie historique de la même décision :

`if(x?.last?.exitLocked)return true; return String(x?.last?.map?.objective?.status||x?.last?.objective?.status||"")==="locked"`.

Cela maintient deux implémentations actives d'une même règle Dungeon.

La cartographie Phase 2 protège `assets/gensrpg/dungeon/entry-v1.js` comme entrée Dungeon production-reachable, chargée directement avant les modules Dungeon externes. Le module Final Exit n'est pas listé parmi les JS Phase 2 non-reachables : il appartient donc au graphe runtime actif actuel.

## Cible stricte du micro-lot 14

Retirer uniquement la duplication locale de la décision de verrouillage dans `DungeonAuthoredFinalExit167875`.

Aucune nouvelle API.

Le module Final Exit doit consommer :
`GensDungeonV1.movement.isAuthoredExitBlocked(lastExitLocked, mapObjectiveStatus, objectiveStatus)`.

Le garde dynamique doit rester local et premier :

`try { if (R.dungeonRoomExitLocked102?.()) return true } catch (e) {}`

Puis seulement délégation des trois valeurs déjà lues au propriétaire canonique.

## Parité historique à préserver

- garde dynamique truthy : `true` immédiatement ;
- garde dynamique false/absente : continuer sur l'état authored ;
- garde dynamique qui lève : exception ignorée puis fallback authored ;
- `last.exitLocked` truthy : verrouillé ;
- `map.objective.status === "locked"` : verrouillé ;
- statut map falsy + `last.objective.status === "locked"` : verrouillé ;
- statut map truthy autre que `"locked"` garde la priorité ;
- comparaison strictement sensible à la casse ;
- aucun verrou : non verrouillé.

## Propriétaires à préserver

### GensDungeonV1.movement

Reste propriétaire unique de la décision pure locale :
`isAuthoredExitBlocked(...)`.

### DungeonAuthoredFinalExit167875

Reste propriétaire de :
- son garde dynamique `dungeonRoomExitLocked102?.()` et son `try/catch` ;
- lectures de son runtime local ;
- `finalState()` ;
- `finish()` ;
- `syncButton()` ;
- marquage de complétion ;
- sauvegarde ;
- fin de session ;
- popup ;
- retour accueil ;
- wrappers render/show historiques, hors ce micro-lot.

### DungeonAuthoredRuntime167839

Reste inchangé dans ce micro-lot.

## Hors périmètre absolu

Ne pas toucher :
- `finish()` ;
- `finalState()` sauf consommation indirecte inchangée ;
- `syncButton()` hors consommation de `blocked()` existante ;
- `showHome()`, `scheduleHome()`, `hideDungeonUi()` ;
- stockage et marqueurs de complétion ;
- session active ;
- wrappers `render/show` ;
- Authored Runtime 167839 ;
- Spatial ;
- travel ;
- mouvement ;
- terminal exit ;
- vraie sortie ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractériser GREEN la politique actuelle de verrouillage du module Final Exit sur cette base exacte ;
2. prouver que le helper canonique existe déjà mais n'est pas encore consommé par Final Exit ;
3. raccorder cette caractérisation à Architecture ;
4. Architecture + Browser, Firefox et Tactical Dock GREEN ;
5. UNE garde RED exigeant la consommation du helper canonique par Final Exit et l'absence de la copie locale ;
6. preuve RED isolée ;
7. micro-diff minimal dans `dungeon-authored-final-exit-167875.js` et contrat/tests seulement ;
8. aucune nouvelle API ni fallback global ;
9. aucun changement `index.html` ;
10. triple CI ;
11. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune lecture/modification détaillée de `index.html` n'est nécessaire.
Le lot s'appuie sur la taille/blob déjà verrouillés et sur les sentinelles de composition existantes.

Si le périmètre exige finalement une modification du gros runtime, arrêter le lot et appliquer Rule 26 avant toute modification.
