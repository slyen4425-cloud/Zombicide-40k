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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, moteur générique de statuts/conditions, tick global explicite et premiers effets périodiques dégâts/soins.
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
- tick global explicite des statuts : `34682889435` success
- effets périodiques dégâts/soins sur tick explicite : `34683019572` success

## Dernière étape terminée

Premiers effets périodiques de statuts Capture :
- `tickCaptureBattleStatuses()` collecte désormais les effets déclaratifs actifs avant de décrémenter leur durée ;
- effets périodiques supportés à cette étape : `damage` et `heal` uniquement ;
- le montant est multiplié par le nombre de piles du statut ;
- dégâts et soins réutilisent `applyCaptureDamage()` / `applyCaptureHealing()` : aucun second moteur de PV ;
- les soins restent plafonnés et ne ressuscitent pas une créature KO ;
- le tick renvoie `applied.player` et `applied.opponent` pour exposer précisément les effets réellement exécutés ;
- après les effets et l'expiration, `resolveCaptureKoState()` est appelé : un poison/brûlure peut donc provoquer remplacement forcé, défaite d'équipe ou KO adverse avec le même flux autoritaire que les capacités ;
- `tickCaptureModeStatuses()` synchronise les PV/statuts vers équipe + roster et nettoie automatiquement le combat/rencontre lors d'un KO adverse ;
- la cadence reste entièrement externe et explicite : aucun timer réel n'est ajouté.

Régression :
- nouveau `v2/tests/capture-periodic-status-effects.test.mjs` ;
- couvre dégâts empilés, soin périodique, diminution de durée, KO joueur par statut avec remplacement forcé et KO adverse par statut avec fin de combat + retour exploration ;
- batterie complète V2 : `34683019572` success.

Commits de l'étape :
- résolution périodique combat : `790721d99a82c2ba9961288f8dd18cef5bf8531d`
- synchronisation globale périodique : `54290cc4da021127924d8788ae6ac32b6566be8d`
- régression effets périodiques : `162c9055827c888f33943fbf4ba6ec6e9182a967`

## Priorités ouvertes

1. prochaine étape Capture : première esquive/réaction tactique configurable, sans figer la formule finale ni les i-frames ;
2. ensuite enrichir progressivement les autres effets de statut seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
