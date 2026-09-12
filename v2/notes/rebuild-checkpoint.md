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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique et synchronisation de l'état global après capacité.
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

## Dernière étape terminée

Synchronisation globale après résolution d'une capacité :
- nouvelle opération publique `useCaptureBattleAbility()` dans `capture.js` ;
- elle appelle `resolveCaptureAbilityAction()` avec l'équipe active actuelle ;
- après une action normale, `battle` reste actif et l'exploration reste bloquée ;
- après KO joueur avec remplaçant, `activeTeam`, `roster` et `battle.player.activeInstanceId` sont synchronisés en une seule opération ;
- les PV du combattant tombé sont persistés dans l'équipe et le roster ;
- après une fin `opponent_ko`, le `battle` global est supprimé, la rencontre est nettoyée et l'exploration redevient libre ;
- la réserve reste intacte et le roster est reconstruit à partir de l'équipe synchronisée + réserve ;
- aucune logique RPG n'est introduite.

Régression :
- nouveau `v2/tests/capture-global-battle-state.test.mjs` ;
- couvre action normale, KO joueur avec remplacement forcé et KO adverse avec retour exploration ;
- le premier run `34682542852` a échoué car le test initialisait une créature sans `abilityIds`, donc son état de capacité était vide conformément au contrat ;
- correction ciblée du setup de test uniquement ;
- run corrigé `34682576122` : success.

Commits de l'étape :
- synchronisation état global : `9800c410e00c83339d1444ec1a11c115670838f4`
- régression globale : `067dd48d156209a31e99107a2afdfdfb12cbb37b`
- correction setup test : `4568433671f8a02277fefc7c762f1ff8bc0759fb`

## Priorités ouvertes

1. prochaine étape Capture : brancher l'IA dédiée sur cette même opération d'état global pour qu'un cycle IA complet mette à jour `battle`, équipe et sortie de combat sans chemin parallèle ;
2. ensuite ajouter progressivement statuts/esquive et réactions tactiques de l'IA ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
