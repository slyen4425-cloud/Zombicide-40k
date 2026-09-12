# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, état combat/PV/KO/statuts/capacités/réactions, résumé adverse actif et inspection adverse.
- Le résumé adverse utilise désormais le registre canonique `capture-creature-assets.json` pour résoudre l’ID canonique et le vrai nom d’espèce.
- Le registre Capture est chargé de façon lazy en parallèle du module Capture, uniquement à l’ouverture du mode.
- Un art/icône adverse ne peut être rendu que si le registre fournit un `path` autorisé dans `v2/assets/capture/creatures/` et que son statut n’est plus `pending_import`.
- Aucun fallback RPG/Dungeon n’est accepté. Si le registre est absent, invalide ou encore `pending_import`, la vue reste sans image.
- Les 14 visuels canoniques actuels restent tous `pending_import` avec `path:null`; les noms canoniques sont donc actifs, mais aucune image réelle n’est encore affichée.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- Les listes, résumés et inspections restent strictement consultatifs : aucune attaque, IA, switch, déplacement, dégâts, soin, capture ou progression du temps n’est déclenché depuis ces vues.
- Les 4 orbes reconnues restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; coefficients non inventés.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed / temps visuel / visibilité / overlay : success jusqu’à `34687557658`
- inspection métier de créature : `34688278893` success
- listes Équipe active/Réserve inspectables : `34688524627` success
- marquage créature active en combat : `34690135197` success
- affichage PV / KO du roster : `34690466513` success
- affichage statuts actifs du roster : `34690816101` success
- affichage charges / cooldowns capacités : `34691249135` success
- affichage état réactions / esquive : `34692442765` success
- inspection détaillée PV/KO/statuts/capacités/réactions : `34692774662` success
- résumé visuel adversaire actif : `34693245713` success
- inspection adverse depuis le résumé : `34693630321` success
- nom canonique + gating assets adversaire : `34693958720` success

## Dernière étape terminée

Nom canonique et branchement sûr des assets sur l’adversaire actif :
- `v2/src/modes/capture/ui-opponent-summary.js` utilise maintenant `resolveCaptureSpeciesAsset()` et `captureAssetPathAllowed()` ;
- `buildCaptureOpponentSummary(state,{assetRegistry})` expose `displayName`, `mainArt` et `iconArt` ;
- un asset avec `path:null`, statut `pending_import` ou chemin hors racine Capture est rejeté et devient `null` ;
- les chemins repo `v2/assets/capture/...` sont convertis en source UI `./assets/capture/...` uniquement après validation ;
- `capture-page.js` accepte `assetRegistry`, affiche le nom canonique et ne crée un `<img data-capture-opponent-art>` que lorsqu’un asset validé existe ;
- l’icône est préférée à l’art principal pour le résumé compact ;
- l’inspection adverse utilise le même registre pour son nom d’espèce ;
- `app.js` charge `./docs/capture-creature-assets.json` en lazy via `loadCaptureAssetRegistry()` en parallèle de l’import dynamique de `capture-page.js` ;
- un échec de chargement du registre produit `{}` et donc aucun visuel/fallback inventé.

Régression :
- `v2/tests/capture-ui-opponent-summary.test.mjs` couvre le registre réel actuel (`Descendre`, `Rocorne`), l’absence d’image tant que `pending_import`, un faux registre de test avec chemins Capture valides, le rejet d’un chemin RPG, le rendu conditionnel et le chargement lazy ;
- le premier run `34693930691` a échoué seulement parce que l’ancien garde lazy exigeait littéralement `await import(...)` ;
- `v2/tests/capture-lazy-entry.test.mjs` a été mis à jour pour vérifier l’import dynamique réel dans `Promise.all` sans autoriser d’import statique ;
- batterie complète corrigée : `34693958720` success.

Commits de l’étape :
- résolution canonique + gating assets adversaire : `d0d8c43b5586fc316b9d0a1bce65c97a5077e7ba`
- rendu page / registre injecté : `a7e49c12b6a51e46cfd461bb4e16b56f4da08d5c`
- chargement lazy du registre : `98403582b569836a202fcda9f3d0927c00f82028`
- régression noms/assets : `77145e632937bd48365090d90791b0793021551b`
- correction garde lazy historique : `1879abdebc92dcd5463680b5b112a49708bbce4e`

## Priorités ouvertes

1. prochaine étape Capture : appliquer la même résolution **nom canonique + asset sûr** aux cartes Équipe active/Réserve, sans importer de fichiers tant que les arts restent `pending_import` ;
2. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
3. enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
4. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
