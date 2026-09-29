# GenSrpG — Phase 7 / Dungeon authored — résolution du héros actif — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-terminal-delegation-green-2026-09-29`

SHA exact de base :
`930d4a33b31f465646f3941aa21cf3a4f7793d61`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-active-hero-resolution-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-active-hero-resolution-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale documentaire de la base :
- Architecture + Browser : `36580054199` — SUCCESS ;
- Firefox : `36580053906` — SUCCESS ;
- Tactical Dock : `36580053914` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat d'architecture

Deux runtimes authored actifs contiennent aujourd'hui exactement la même sélection de héros actif :

`DungeonAuthoredRuntime167839.activeHero(x)`

et

`DungeonAuthoredFinalExit167875.activeHero(x)`.

Implémentation dupliquée bit-à-bit :

`const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")`.

Il n'existe ici aucune divergence de sémantique comparable au resolver local `exitIdx` de Final Exit.

## Cible stricte du micro-lot 16

Créer une seule décision pure Dungeon :

`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Cette décision reçoit uniquement :
- la valeur `participants` déjà lue ;
- l'index actif déjà lu.

Elle reproduit exactement la sélection historique.

Les deux runtimes restent responsables de leurs lectures `x?.participants` et `x?.index`, puis délèguent au helper pur.

## Parité historique à préserver

- `participants` non tableau : héros vide ;
- tableau vide : héros vide ;
- index absent / NaN / falsy : index 0 ;
- index négatif : clamp 0 ;
- index au-delà du tableau : clamp dernier index ;
- chaîne numérique : coercition numérique historique ;
- index fractionnaire : appliquer d’abord le clamp numérique historique ; s’il reste fractionnaire à l’intérieur des bornes, ne pas l’arrondir et conserver le lookup fractionnaire historique ;
- valeur participant falsy : chaîne vide ;
- valeur participant truthy : `String(...)`.

Aucune nouvelle validation métier n'est ajoutée.

## Propriétaires à préserver

### GensDungeonV1.movement

Devient propriétaire uniquement de la sélection pure du héros actif authored.

### DungeonAuthoredRuntime167839

Reste propriétaire de :
- lecture du runtime ;
- `activeHero(x)` comme raccord local ;
- plan / mouvement / travel / spatial / notifications ;
- toute politique de navigation authored.

### DungeonAuthoredFinalExit167875

Reste propriétaire de :
- lecture de son runtime local ;
- `activeHero(x)` comme raccord local ;
- validation branche secondaire / graphe / nœud terminal ;
- resolver local `exitIdx` ;
- `hasExit` ;
- terminal decision consumer ;
- lock, `finish()`, stockage, session, popup, home et UI.

## Hors périmètre absolu

Ne pas toucher :
- resolver local `exitIdx` Final Exit ;
- `hasExit` ;
- `isAuthoredTerminalExit` ;
- `isAuthoredExitBlocked` ;
- graph / plan / outgoing edges ;
- movement allowance ;
- positions / Spatial ;
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

1. caractériser GREEN les deux sélecteurs historiques sur la base exacte ;
2. prouver qu'ils sont encore dupliqués et que le helper canonique n'existe pas ;
3. raccorder la caractérisation à Architecture ;
4. triple CI GREEN ;
5. UNE garde RED exigeant le helper pur et les deux consommateurs directs ;
6. preuve RED isolée ;
7. micro-diff minimal dans `entry-v1.js`, les deux runtimes et le contrat ;
8. aucun wrapper, fallback global ou modification comportementale ;
9. aucun changement `index.html` ;
10. triple CI ;
11. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n'est prévue.
Toute dérive vers le gros runtime arrête le lot et déclenche Rule 26.
