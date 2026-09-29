# GenSrpG — Phase 7 / Dungeon authored — résolution du héros actif après divergence Final Exit — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-real-exit-divergence-green-2026-09-29`

SHA exact de base :
`ce72d8c115e55b80134a1d933d61b4dd6992af19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-active-hero-resolution-post-divergence-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-active-hero-resolution-post-divergence-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser : `36591058090` — SUCCESS ;
- Firefox : `36591058200` — SUCCESS ;
- Tactical Dock : `36591057899` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Vérification des tentatives parallèles historiques

Deux branches `active-hero` existaient déjà, mais elles partent toutes deux de l'ancien checkpoint lot 15 `930d4a33...` et sont désormais divergentes de la base canonique `ce72d8c...` :
- `work/gensrpg-phase7-dungeon-authored-active-hero-2026-09-29` ;
- `work/gensrpg-phase7-dungeon-authored-active-hero-resolution-2026-09-29`.

Elles ne possèdent aucun checkpoint GREEN final canonique.

La première se termine sur `f34e998de3afa16ff9e95bfa2140be8724df63ae` avec :
- Architecture `36584477927` — FAILURE uniquement sur la garde #212 exigeant le futur helper ;
- Firefox `36584477891` — SUCCESS ;
- Tactical Dock `36584478280` — SUCCESS.

La seconde se termine sur `a0d62fa9ec42db6b7efaf024f8a39539a31da5b6` avec une caractérisation GREEN, mais elle reste basée sur `930d4a33...` et n'intègre pas le lot 16 canonique.

Ces branches sont donc utilisées uniquement comme sources de diagnostic historique. Aucun cherry-pick, merge ou reprise de HEAD n'est autorisé pour ce lot.

## Constat sur la base canonique actuelle

La même sélection historique du héros actif est encore dupliquée bit-à-bit dans **quatre** consommateurs authored :
- `assets/dungeon/dungeon-authored-runtime-167839.js` ;
- `assets/dungeon/dungeon-authored-final-exit-167875.js` ;
- `assets/dungeon/dungeon-authored-return-persist-167862.js` ;
- `assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js`.

Expression commune :

`const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")`.

Dans `assets/gensrpg/dungeon/entry-v1.js`, aucun
`resolveAuthoredActiveHero` n'existe sur la base `ce72d8c...`.

La duplication concerne une décision pure à partir de :
- `participants` ;
- `activeIndex`.

Conformément à la règle micro-lot / autorité unique, il serait trop large de migrer les quatre consommateurs simultanément. Le présent lot crée le propriétaire pur puis ne raccorde qu'Authored Runtime.

## Cible stricte du micro-lot 17

Créer une seule décision pure propriétaire Dungeon :

`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Puis faire déléguer **uniquement** :
- `DungeonAuthoredRuntime167839.activeHero(x)`.

Ce micro-lot ne migre pas les trois autres consommateurs. Ils restent volontairement locaux et feront l'objet de micro-lots séparés après fermeture GREEN du présent lot.

Authored Runtime continue de lire son propre état `x`.

## Parité historique obligatoire

Le helper doit reproduire exactement la sémantique actuelle :
- `participants` non tableau : `""` ;
- tableau vide : `""` ;
- index absent / NaN / falsy : `0` ;
- index négatif : clamp vers `0` ;
- index au-delà de la dernière position : clamp vers le dernier index ;
- chaîne numérique : coercition via `Number(...)` ;
- index fractionnaire au-delà de la borne haute : clamp vers le dernier index ;
- index fractionnaire restant à l'intérieur des bornes : **ne pas arrondir** ; le lookup fractionnaire historique doit rester tel quel et peut produire `""` ;
- participant falsy : `""` ;
- participant truthy : `String(...)`.

Aucune nouvelle validation métier n'est ajoutée.

## Propriétaires préservés

### GensDungeonV1.movement

Devient propriétaire uniquement de la sélection pure du héros actif authored.

### DungeonAuthoredRuntime167839

Reste propriétaire de :
- lecture de l'état runtime ;
- `activeHero(x)` comme raccord local ;
- graphe / plan / mouvement / travel ;
- entrée dans les nodes ;
- notifications ;
- politique de navigation authored ;
- raccord Spatial.

### DungeonAuthoredFinalExit167875

Reste totalement inchangé dans ce micro-lot, y compris :
- lecture de son état runtime ;
- sa copie locale historique `activeHero(x)` ;
- branche secondaire ;
- validation graphe / nœud terminal ;
- resolver local `exitIdx` volontairement divergent ;
- `hasExit` ;
- décision terminale consommée ;
- verrouillage ;
- `finish()` ;
- stockage / session / popup / retour accueil / UI.

### DungeonAuthoredReturnPersist167862

Reste totalement inchangé, y compris sa copie locale historique `activeHero(x)`.

### DungeonAuthoredBranchNavCleanup167863

Reste totalement inchangé, y compris sa copie locale historique `activeHero(x)`.

### DungeonSpatial313

Reste propriétaire unique de la persistance spatiale. Inchangé.

## Hors périmètre absolu

Ne pas toucher :
- resolver local `exitIdx` Final Exit ;
- `resolveAuthoredRealExitIndex` ;
- `hasExit` ;
- `isAuthoredTerminalExit` ;
- `isAuthoredExitBlocked` ;
- graphe / outgoing edges / politique de plan ;
- movement allowance ;
- positions / déplacement réel / pathfinding / Spatial ;
- travel ;
- `finish()` ;
- stockage / session / home ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractériser GREEN les deux sélecteurs historiques depuis la base exacte `ce72d8c...` ;
2. verrouiller notamment les deux cas fractionnaires distincts ;
3. prouver que le helper canonique n'existe pas encore ;
4. raccorder cette caractérisation à Architecture ;
5. triple CI GREEN ;
6. poser UNE garde RED exigeant le helper pur et le raccord direct d'Authored Runtime uniquement ;
7. vérifier que le RED est isolé à cette garde ;
8. micro-diff minimal dans `entry-v1.js`, `DungeonAuthoredRuntime167839.activeHero(x)` et le contrat/documentation strictement nécessaire ;
9. aucun wrapper, fallback global ou changement comportemental ;
10. triple CI GREEN ;
11. fermeture documentaire ;
12. triple CI sur SHA documentaire ;
13. checkpoint GREEN final exact.

## Rule 26

Aucune consultation ni modification du contenu exact de `index.html` n'est nécessaire.

La métadonnée connue reste :
- taille : `8169990` octets ;
- blob : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.
