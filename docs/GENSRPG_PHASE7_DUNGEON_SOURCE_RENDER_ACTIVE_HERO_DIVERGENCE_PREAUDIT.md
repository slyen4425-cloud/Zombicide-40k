# GenSrpG — Phase 7 / Dungeon — divergence héros actif Source Render Stability — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-core317-active-hero-divergence-green-2026-09-30`

SHA exact de base :
`6fedae19e66c7eb87aa7e626692926801cdfa445`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-source-render-active-hero-divergence-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-source-render-active-hero-divergence-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36699004061` — SUCCESS ;
- Firefox `36699004069` — SUCCESS ;
- Tactical Dock `36699004115` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire canonique existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Source Render Stability ne possède pas de helper nommé, mais sélectionne encore le héros actif inline dans `paintTokensNow()` :

`const active=String(x.participants?.[Number(x.index)||0]||"");`

Cette sélection est utilisée uniquement pour ajouter la classe visuelle `active` au token du héros.

## Divergence soupçonnée

Le helper canonique :
- exige un tableau `participants` ;
- clamp l'index dans `[0, length-1]` ;
- conserve l'absence d'arrondi des index fractionnaires dans les bornes ;
- retourne `String(...)`.

Source Render inline :
- indexe directement `participants[Number(index)||0]` ;
- ne clamp ni les index négatifs ni les dépassements ;
- peut indexer une valeur non-tableau mais indexable, par exemple une string ;
- retourne ensuite `String(...)`.

Cas à caractériser :
- index valide string / number -> parité attendue ;
- index négatif -> Source Render aucun actif, canonique premier héros ;
- index au-delà de la borne -> Source Render aucun actif, canonique dernier héros ;
- index fractionnaire 1.5 avec 2 héros -> Source Render aucun actif, canonique dernier héros par clamp ;
- index fractionnaire 1.5 avec 3 héros -> aucun actif des deux côtés ;
- `participants:"ab"` index 0 -> Source Render "a", canonique `""` ;
- tableau vide / valeurs falsy -> vérifier la parité exacte.

## Cible stricte du micro-lot 29

Caractériser uniquement la divergence entre la sélection inline de `DungeonSourceRenderStability167877.paintTokensNow()` et le helper canonique.

Aucune migration runtime n'est autorisée dans ce lot.

Si la divergence est confirmée :
- aucun RED de migration ;
- aucun changement de `dungeon-source-render-stability-167877.js` ;
- aucun changement du helper canonique ;
- clôture documentaire GREEN uniquement.

## Propriétaires préservés

Source Render Stability conserve intégralement :
- patch `dungeonMapHtml` ;
- choix des textures / murs ;
- création des tokens héros / ennemis ;
- peinture synchrone du board ;
- `sameView` Spatial ;
- styles et scaling des tokens ;
- wrappers `DungeonCore01.render/show` ;
- neutralisation de l'ancien observer de scale ;
- retry d'installation historique.

## Hors périmètre absolu

Ne pas toucher :
- comportement visuel utilisateur ;
- clamp ou politique d'index ;
- rendu des héros / ennemis ;
- styles / assets ;
- Core 317 / Core 318 ;
- Spatial ;
- Tactical / Survival / Capture / PvP ;
- `index.html`.

## TDD / caractérisation obligatoire

1. caractériser le vrai chemin `paintTokensNow()` avec un DOM minimal de test ;
2. comparer le token marqué `active` à `resolveAuthoredActiveHero(...)` sur les cas limites ;
3. documenter précisément les cas de parité et divergence ;
4. triple CI GREEN ;
5. aucun RED si divergence confirmée ;
6. fermeture documentaire ;
7. triple CI documentaire ;
8. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.
Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture du micro-lot 29

### Caractérisation GREEN

SHA :
`9b610776fda094f4f75450e4657bde17f19adf33`.

CI :
- Architecture + Browser `36701730421` — SUCCESS ;
- Firefox `36701730296` — SUCCESS ;
- Tactical Dock `36701730395` — SUCCESS ;
- Browser 45/45 sans échec ;
- étape dédiée #235 `Caractériser la divergence héros actif Source Render Phase 7` — SUCCESS.

### Résultat exact

Parité confirmée entre Source Render et le helper canonique pour :
- index entier valide ;
- chaîne numérique d'index ;
- index fractionnaire encore dans les bornes, qui ne correspond à aucune propriété de tableau ;
- participant truthy non-chaîne dans un tableau, car Source Render applique lui aussi `String(...)` ;
- participant falsy.

Divergence confirmée pour :
- index négatif : Source Render ne marque aucun token actif, le helper canonique sélectionne le premier héros ;
- index au-delà de la borne : Source Render ne marque aucun token actif, le helper canonique sélectionne le dernier héros ;
- index fractionnaire au-delà de la borne : Source Render ne marque aucun token actif, le helper canonique clamp vers le dernier héros ;
- `participants` non-tableau : le vrai chemin Source Render reste historiquement dépendant de `.forEach` et lève une erreur, tandis que le helper canonique retourne `""`.

### Décision conforme à la charte

Aucun RED de migration.
Aucun changement runtime.

La délégation directe de la sélection inline Source Render vers `resolveAuthoredActiveHero(...)` changerait le comportement visuel dans plusieurs cas limites et n'est donc pas autorisée comme simple refactor.

Toute harmonisation future exige une décision fonctionnelle dédiée sur :
- politique de clamp des index ;
- contrat de type de `participants` ;
- comportement attendu du token visuellement actif.

### Frontière préservée

- `dungeon-source-render-stability-167877.js` inchangé ;
- helper canonique inchangé ;
- textures, murs, tokens héros/ennemis, styles, Spatial, wrappers render/show et retry inchangés ;
- aucun changement `index.html`.

### Conformité

- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-source-render-active-hero-divergence-green-2026-09-30`.
