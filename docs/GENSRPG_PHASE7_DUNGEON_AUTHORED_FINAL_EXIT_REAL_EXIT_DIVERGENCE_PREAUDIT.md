# GenSrpG — Phase 7 / Dungeon authored Final Exit — divergence de résolution de vraie sortie — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-terminal-delegation-green-2026-09-29`

SHA exact de base :
`930d4a33b31f465646f3941aa21cf3a4f7793d61`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-final-exit-real-exit-divergence-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-final-exit-real-exit-divergence-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser : `36581813705` — SUCCESS ;
- Firefox : `36581813465` — SUCCESS ;
- Tactical Dock : `36581813531` — SUCCESS.

Runtime `index.html` :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat

Deux résolutions de sortie authored subsistent avec des sémantiques différentes.

### Resolver canonique Dungeon

`GensDungeonV1.movement.resolveAuthoredRealExitIndex(cells, directExitIndex)`

Comportement :
- utilise l'index direct seulement s'il est entier >= 0 ET désigne réellement une cellule `exit` ;
- sinon cherche la première vraie cellule `exit` ;
- retourne `-1` si aucune sortie réelle n'existe.

### Resolver local Final Exit

Dans `DungeonAuthoredFinalExit167875.finalState()` :

`const direct=Number(map.exitIdx),exitIdx=Number.isInteger(direct)&&direct>=0?direct:cells.findIndex(...)`.

Comportement :
- tout entier direct >= 0 est retenu immédiatement, même s'il pointe vers `floor`, `door` ou hors tableau ;
- `hasExit` invalide ensuite la fin si cette case n'est pas une vraie sortie ;
- aucun fallback vers une autre vraie cellule `exit` n'est effectué dans ce cas.

## Conséquence

Sur les cas normaux, les deux chemins convergent.

Ils divergent lorsque :
- `map.exitIdx` est entier >= 0 ;
- cet index ne désigne pas une vraie cellule `exit` ;
- mais une autre vraie cellule `exit` existe ailleurs.

Exemple :
- cells = `['floor','exit']`
- exitIdx = `0`

Final Exit historique :
- exitIdx = 0
- hasExit = false
- atExit = false

Resolver canonique :
- resolveAuthoredRealExitIndex(...) = 1

Une migration directe vers le resolver canonique changerait donc le comportement visible de fin de donjon sur cet état incohérent.

## Cible stricte du micro-lot 16

**Caractérisation uniquement.**

Verrouiller :
1. les cas où les deux résolutions sont équivalentes ;
2. les cas précis où elles divergent ;
3. le fait que Final Exit conserve actuellement son resolver local ;
4. le fait que le resolver canonique reste inchangé.

Aucun RED d'extraction ne doit être posé tant que la politique fonctionnelle n'est pas explicitement décidée.

## Règle de gouvernance

La charte interdit de présenter une modification comportementale comme une simple restructuration.

Donc :
- si la caractérisation prouve une divergence : arrêter toute harmonisation dans ce micro-lot ;
- documenter le cas ;
- fermer ce lot comme caractérisation/audit GREEN ;
- traiter une éventuelle harmonisation plus tard comme décision fonctionnelle dédiée, avec test utilisateur si nécessaire.

## Hors périmètre absolu

Ne pas modifier :
- resolver local Final Exit ;
- `resolveAuthoredRealExitIndex` ;
- `hasExit` ;
- `isAuthoredTerminalExit` ;
- `finish()` ;
- verrouillage ;
- stockage / session / popup / retour accueil ;
- Authored Runtime 167839 ;
- Spatial ;
- movement / travel ;
- événements / spawn ;
- Tactical ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD / audit obligatoire

1. ajouter une caractérisation comparative GREEN ;
2. couvrir direct valide, chaîne numérique valide, casse EXIT, direct invalide négatif/non-entier, index direct faux mais autre sortie réelle, index hors tableau mais autre sortie réelle, absence de sortie ;
3. raccorder à Architecture ;
4. triple CI GREEN ;
5. si divergence confirmée, **ne pas poser de RED de migration** ;
6. documenter la divergence et fermer le lot sans runtime change ;
7. checkpoint GREEN documentaire.

## Rule 26

Aucune modification de `index.html` n'est prévue.
Si le périmètre dérive vers le gros runtime, arrêter et appliquer Rule 26.
