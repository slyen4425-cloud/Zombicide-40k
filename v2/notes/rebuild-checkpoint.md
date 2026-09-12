# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, état combat/PV/KO/statuts/capacités/réactions, résumé adverse actif et inspection adverse.
- Le résumé adverse et les cartes Équipe active/Réserve utilisent désormais le registre canonique `capture-creature-assets.json` pour résoudre l’ID canonique et le vrai nom d’espèce.
- Le registre Capture est chargé de façon lazy en parallèle du module Capture, uniquement à l’ouverture du mode.
- Un art/icône ne peut être rendu que si le registre fournit un `path` autorisé dans `v2/assets/capture/creatures/` et que son statut n’est plus `pending_import`.
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
- nom canonique + gating assets roster : `34694300782` success

## Dernière étape terminée

Nom canonique et branchement sûr des assets sur les cartes Équipe active / Réserve :
- `v2/src/modes/capture/ui-roster-list.js` utilise maintenant `resolveCaptureSpeciesAsset()` et `captureAssetPathAllowed()` ;
- avec un registre canonique, une créature peut exposer `displayName`, `mainArt` et `iconArt` ;
- le surnom reste prioritaire comme titre, tandis que le vrai nom canonique remplace l’ID technique dans le sous-titre ;
- les alias legacy sont résolus vers leur espèce canonique avant affichage ;
- un asset avec `path:null`, statut `pending_import` ou chemin hors racine Capture est rejeté et devient `null` ;
- les chemins repo `v2/assets/capture/...` sont convertis en source UI `./assets/capture/...` uniquement après validation ;
- `capture-page.js` transmet le même `assetRegistry` aux cartes roster et n’ajoute un `<img data-capture-roster-art>` que lorsqu’un asset validé existe ;
- l’icône est préférée à l’art principal pour les cartes compactes ;
- sans registre, le presenter conserve sa forme historique pour ne pas casser les consommateurs existants ;
- aucune mutation du roster ou du combat n’est effectuée.

Régression :
- `v2/tests/capture-ui-roster-list.test.mjs` couvre maintenant le nom canonique, la résolution d’alias, `pending_import`, un faux asset Capture `ready`, le rejet de chemins RPG/Dungeon, le rendu conditionnel et la non-mutation ;
- le premier run `34694246607` a échoué uniquement sur une assertion statique obsolète qui cherchait encore `buildCaptureRosterLists(session.state)` sans registre ;
- cette assertion a été mise à jour pour le nouvel appel `buildCaptureRosterLists(session.state,{assetRegistry})` ;
- batterie complète corrigée : `34694300782` success.

Commits de l’étape :
- résolution canonique + gating assets roster : `6562f802d972ab3819a521dbb06754e9171e3b36`
- rendu page roster avec registre : `f7f4d0643a7bcddd92f2926aa8b711d287de9971`
- compatibilité presenter sans registre : `f5cc72a1806ac4ebbe8f3afffefe1e95863a3714`
- régression roster canonique/assets : `847145f1109d14b19a7463060e6a806f804240bc`

## Priorités ouvertes

1. prochaine étape Capture : faire utiliser le même **nom canonique** dans l’overlay d’inspection des créatures possédées, sans ajouter d’image tant qu’un asset `ready` n’existe pas ;
2. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
3. enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
4. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
