# GenSrpG — Phase 7 / Dungeon — divergence héros actif Core 317 — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-core318-active-hero-delegation-green-2026-09-30`

SHA exact de base :
`21893747841404a17187fdaa77ad5fa3cf3d2ac1`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-core317-active-hero-divergence-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-core317-active-hero-divergence-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36694853712` — SUCCESS ;
- Firefox `36694853706` — SUCCESS ;
- Tactical Dock `36694853731` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire canonique existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Les consommateurs authored/runtimes déjà migrés progressivement incluent notamment :
- Authored Runtime ;
- Final Exit ;
- Return Persist ;
- Branch Nav Cleanup ;
- Action Fix ;
- Exact Trap ;
- Zone Links ;
- Room Runtime ;
- World Runtime ;
- Large Room Support ;
- Core 318.

Core 317 conserve encore une fonction privée :
`activeHeroId(x)`.

Implémentation historique Core 317 :
`const list=Array.isArray(x?.participants)?x.participants:[]; const i=Math.max(0,Math.min(list.length-1,Number(x?.index)||0)); return list[i]||"";`

Le helper canonique utilise la même sélection d'index sur les cas usuels, mais applique :
`String(heroes[index]||"")`.

## Divergence soupçonnée

Pour un participant truthy non-chaîne :
- Core 317 renvoie la valeur brute ;
- le helper canonique renvoie sa représentation `String(...)`.

Exemples à caractériser :
- `participants:[42]` -> Core 317 : `42` (number), canonique : `"42"` ;
- `participants:[{id:"hero"}]` -> Core 317 : objet, canonique : `"[object Object]"`.

Les cas string/falsy/index doivent aussi être caractérisés pour délimiter précisément la divergence.

## Cible stricte du micro-lot 28

Caractériser uniquement la divergence de sélection héros actif Core 317.

Aucune migration runtime n'est autorisée dans ce lot.

Si une divergence sémantique est confirmée :
- aucun RED de migration ;
- aucun changement de `dungeon-core-317.js` ;
- aucun changement du helper canonique ;
- clôture documentaire GREEN uniquement.

## Propriétaires préservés

Core 317 conserve intégralement :
- `goBackRoom` ;
- `ensureBackButton` / `scheduleBackButton` ;
- navigation spatiale retour salle ;
- marchand, stock et UI marchande ;
- armor floor ;
- overrides marchands ;
- observer/timers historiques déjà présents ;
- toute logique DOM.

`DungeonSpatial313` reste inchangé.

## Hors périmètre absolu

Ne pas toucher :
- comportement utilisateur Core 317 ;
- navigation retour salle ;
- merchant ;
- armor ;
- DOM / observer / timers ;
- Core 318 ;
- Source Render Stability ;
- Spatial ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD / caractérisation obligatoire

1. injecter uniquement une exposition de test temporaire en mémoire du vrai `activeHeroId`, sans modifier le runtime source ;
2. comparer le vrai sélecteur Core 317 au helper canonique sur :
   - index absent / NaN / négatif / dépassement ;
   - chaîne numérique ;
   - fractionnaire ;
   - tableau vide / non-tableau ;
   - participant falsy ;
   - participant truthy non-chaîne ;
3. prouver précisément les cas de parité et de divergence ;
4. triple CI GREEN ;
5. documenter la décision : migration simple interdite tant qu'une décision fonctionnelle n'autorise pas l'harmonisation ;
6. triple CI documentaire ;
7. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture du micro-lot 28

### Caractérisation GREEN

SHA :
`c28454bcba818ebb73b6e191f4652d6de7b9a7ce`.

CI :
- Architecture + Browser `36697844017` — SUCCESS ;
- Firefox `36697844151` — SUCCESS ;
- Tactical Dock `36697843950` — SUCCESS ;
- Browser 45/45 sans échec.

### Résultat exact

Parité confirmée entre Core 317 et le helper canonique pour :
- identifiants héros string ;
- index absent / NaN / négatif / dépassement ;
- chaîne numérique ;
- index fractionnaire ;
- tableau vide / non-tableau ;
- participant falsy.

Divergence confirmée pour un participant truthy non-chaîne :
- `participants:[42]` : Core 317 renvoie `42` (number), le helper canonique renvoie `"42"` ;
- `participants:[{id:"hero"}]` : Core 317 renvoie l'objet brut, le helper canonique renvoie `"[object Object]"` ;
- `participants:[true]` : Core 317 renvoie `true`, le helper canonique renvoie `"true"`.

### Décision conforme à la charte

Aucun RED de migration.
Aucun changement runtime.

La délégation directe de `Core 317 activeHeroId(x)` vers `resolveAuthoredActiveHero(...)` n'est pas un refactor à comportement constant.

Toute harmonisation future exige une décision fonctionnelle dédiée et une caractérisation de ses impacts consommateurs.

### Frontière préservée

- `dungeon-core-317.js` inchangé ;
- helper canonique inchangé ;
- retour salle, marchand, armor, DOM, observer/timers et Spatial inchangés ;
- Source Render Stability reste le prochain seam de divergence à caractériser ;
- aucun changement `index.html`.

### Conformité

- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-core317-active-hero-divergence-green-2026-09-30`.
