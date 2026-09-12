# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture est autonome : aucun état gameplay mutable partagé avec RPG, Survie ou PVP.
- Moteur spatial neutre partagé dans `v2/src/core/spatial-engine.js` ; graphe World Builder neutre dans `v2/src/core/world-graph.js`.
- Capture reste lazy : aucun bootstrap global ; stockage exclusivement `gensrpg:v2:capture:*`.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement et premier moteur générique de statuts/conditions.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le combat Capture utilise son runtime dédié `v2/src/modes/capture/dynamic-combat.js` et reste indépendant du `turnSequence`/D100 RPG.

## Jalons CI récents validés

- canonicalisation/déduplication créatures : `34679224508` success
- stockage isolé + spatial neutre : `34679382483` success
- contrats gameplay : `34679477548` success
- runtime Capture isolé : `34679708898` success
- roster/équipe/réserve : `34679980856` success
- ouverture lazy Capture : `34680539893` success
- registre assets canonique : `34680830787` success
- objets + capacités/charges : `34681113738` success
- biomes + exploration/rencontres : `34681280023` success
- tentative de capture configurable : `34681385329` success
- contrat combat dynamique Capture : `34681468819` success
- premier runtime combat dynamique Capture : `34681648425` success
- premières actions de capacités dynamiques : `34681748038` success
- capture complète en combat sauvage : `34681864744` success
- première IA dynamique dédiée : `34681979266` success
- PV/dégâts/soins/KO : `34682075802` success
- flux post-KO / remplacement forcé : `34682302866` success
- post-KO automatique après action : `34682441521` success
- état global Capture après capacité : `34682576122` success
- IA Capture routée par état global : `34682681387` success
- moteur générique statuts/conditions : `34682807731` success

## Dernière étape terminée

Premier moteur générique de statuts/conditions Capture :
- nouveau `v2/src/modes/capture/statuses.js` ;
- statuts totalement indépendants du moteur RPG ;
- normalisation avec `id`, durée, `stackMode`, `maxStacks` et effets déclaratifs ;
- ajout, retrait et tick explicite ;
- `stackMode:'stack'` incrémente jusqu'au plafond configuré ;
- `stackMode:'refresh'` conserve une seule pile et rafraîchit la durée ;
- expiration séparée en `active` / `expired` ;
- collecte des effets déclaratifs avec nombre de piles, sans appliquer automatiquement de formule de poison/brûlure/mouvement ;
- nouveau `resolveCaptureStatusEffect()` pour qu'une capacité puisse appliquer un statut au combattant ciblé ;
- les acteurs du combat dynamique possèdent maintenant leur propre tableau `statuses` ;
- le changement forcé de créature recharge les statuts de l'instance sélectionnée ;
- lors d'un KO joueur, l'état des statuts de la créature tombée est synchronisé avec l'équipe possédée.

Régression :
- nouveau `v2/tests/capture-statuses.test.mjs` ;
- couvre cumul plafonné, refresh de durée, expiration, retrait, collecte d'effets et application d'un statut par une vraie capacité ;
- vérifie qu'un statut n'altère pas spontanément les PV tant qu'aucune résolution spécifique n'est définie ;
- batterie complète V2 : `34682807731` success.

Commits de l'étape :
- primitives de statuts : `93018cb42a737c07cebda555a4092dc4de6fb636`
- resolver déclaratif : `15e62326290cc8c92ddd390abe853be873a49aa9`
- raccord aux acteurs du combat : `238412e4b45132b8a1ed1e9ec9e7d765e6ae8025`
- régression statuts : `ad9089bea59af8ee707c70dec010d47da7f7046f`

## Priorités ouvertes

1. prochaine étape Capture : brancher un tick de statuts explicite au runtime global, sans figer la cadence temps réel ;
2. ensuite ajouter une première esquive/réaction tactique configurable ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
