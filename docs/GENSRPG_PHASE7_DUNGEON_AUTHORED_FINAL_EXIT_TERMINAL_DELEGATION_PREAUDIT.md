# GenSrpG — Phase 7 / Dungeon authored Final Exit — délégation canonique terminale — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-lock-delegation-green-2026-09-29`

SHA exact de base :
`4cc0d8a985a42ff934127508398df245f1be503b`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-final-exit-terminal-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-final-exit-terminal-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale documentaire de la base :
- Architecture + Browser : `36567160296` — SUCCESS ;
- Firefox : `36567160281` — SUCCESS ;
- Tactical Dock : `36567160491` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat d'architecture

Le propriétaire canonique Dungeon de la décision terminale existe déjà :

`GensDungeonV1.movement.isAuthoredTerminalExit(heroId, realExitIndex, positionalEnabled, heroPosition)`.

`DungeonAuthoredRuntime167839.atTerminalExit(x)` le consomme déjà.

Le module production `DungeonAuthoredFinalExit167875.finalState()` conserve encore une copie de la sous-décision positionnelle :

`const atExit=hasExit&&(!positional||pos===exitIdx)`.

Cette duplication peut être retirée sans déplacer la validation locale `hasExit`.

## Frontière stricte du micro-lot 15

Faire calculer uniquement la sous-décision terminale par :

`GensDungeonV1.movement.isAuthoredTerminalExit(hero, exitIdx, positional, x?.positions?.[hero])`.

Le résultat Final Exit doit rester :

`atExit = hasExit && décisionTerminaleCanonique`.

Ainsi `hasExit` reste une garde locale obligatoire.

## Important — resolver de vraie sortie explicitement hors périmètre

Final Exit résout actuellement `exitIdx` ainsi :
- si `map.exitIdx` est un entier >= 0, il l'utilise directement ;
- sinon il recherche la première cellule `exit`.

Le resolver canonique `resolveAuthoredRealExitIndex` possède une sémantique différente : si l'index direct ne désigne pas réellement une cellule EXIT, il recherche un fallback.

Ce micro-lot **ne doit donc pas** remplacer la résolution locale d'`exitIdx`.
Ce cas limite devra faire l'objet d'une caractérisation dédiée avant toute harmonisation.

## Parité historique à préserver

Avec `hasExit === true` et héros déjà validé :
- positional OFF : `atExit === true`, quelle que soit la position ;
- positional ON + position numérique correspondante : `true` ;
- positional ON + chaîne numérique correspondante : `true` via `Number(...)` ;
- position différente : `false` ;
- position absente/invalide : `false`.

Avec `hasExit === false` :
- `atExit` doit rester `false`, même si le helper terminal pur retournerait `true` sur les seules autres valeurs.

## Propriétaires préservés

### GensDungeonV1.movement

Reste propriétaire de la décision pure terminale.

### DungeonAuthoredFinalExit167875

Reste propriétaire de :
- `activeHero()` local ;
- `inSecondaryBranch()` ;
- lectures runtime ;
- validation graphe / nœud terminal ;
- résolution locale `exitIdx` ;
- `hasExit` ;
- lecture de `a.positional()` ;
- `finalState()` comme raccord ;
- `finish()`, verrouillage, stockage, complétion, session, popup et retour accueil ;
- `syncButton()` et wrappers UI historiques.

### DungeonAuthoredRuntime167839 / Spatial

Entièrement inchangés dans ce micro-lot.

## Hors périmètre absolu

Ne pas toucher :
- resolver local de `exitIdx` ;
- `hasExit` ;
- logique de branche secondaire ;
- détection du nœud terminal ;
- verrouillage de sortie ;
- `finish()` ;
- stockage / complétion ;
- session ;
- popup / retour accueil ;
- `syncButton()` ;
- Authored Runtime 167839 ;
- Spatial ;
- movement / travel ;
- événements / spawn ;
- Tactical ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractériser GREEN `hasExit / atExit` dans Final Exit sur la base exacte ;
2. prouver que le helper terminal canonique existe déjà mais n'est pas consommé par Final Exit ;
3. raccorder la caractérisation à Architecture ;
4. triple CI GREEN ;
5. UNE garde RED exigeant le consommateur canonique tout en maintenant `hasExit` local ;
6. RED isolé ;
7. micro-diff minimal dans Final Exit + tests/contrat uniquement ;
8. réaligner les tests historiques Final Exit sur la dépendance production réelle `entry-v1.js` si nécessaire, sans affaiblir leurs assertions ;
9. aucun changement `index.html` ;
10. triple CI ;
11. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n'est prévue.
Toute dérive vers le gros runtime arrête le lot et déclenche Rule 26.
