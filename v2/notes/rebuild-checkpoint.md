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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite et désormais un pas temporel unifié réactions + cooldowns + statuts.
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
- premier socle réaction/esquive configurable : `34683114512` success
- réactions configurables routées par joueur + IA : `34683246425` success
- politique d'esquive data-driven : `34683578020` success
- coût/cooldown de réaction par instance : `34683977742` success
- fenêtre temporelle explicite de réaction : `34684261793` success
- progression globale horloge réaction : `34684443173` success
- pas temporel unifié Capture : `34684569147` success

## Dernière étape terminée

Pas temporel unifié Capture :
- nouveau `v2/src/modes/capture/time-runtime.js` ;
- nouvelle opération publique `advanceCaptureModeTime(state,{amount,tickReactionCooldowns,tickStatuses})` ;
- un seul appel avance maintenant `battle.timing.reactionTime`, les cooldowns de réaction et les statuts/effets périodiques avec le même delta ;
- la cadence reste entièrement explicite et abstraite : aucune seconde, frame, fréquence ou i-frame n'est imposée ;
- l'état de cooldown de la créature joueur reste synchronisé dans `activeTeam` et `roster` ;
- les effets périodiques réutilisent le moteur de statuts existant et donc le même flux KO/remplacement/fin de combat ;
- si un effet périodique met l'adversaire KO, le combat est terminé, la rencontre est nettoyée et l'exploration est réouverte dans le même pas temporel ;
- `tickStatuses:false` permet de faire avancer uniquement horloge + cooldowns quand le futur design aura besoin de séparer ces couches ;
- `tickReactionCooldowns:false` reste également possible ;
- aucun moteur parallèle RPG/D100/timeline n'est introduit.

Régression :
- nouveau `v2/tests/capture-unified-time-runtime.test.mjs` ;
- couvre progression simultanée horloge + cooldown joueur/adversaire + dégâts périodiques + durée de statut ;
- couvre KO adverse déclenché par statut avec fin automatique du combat et retour exploration ;
- couvre progression horloge/cooldowns sans tick des statuts ;
- batterie complète : `34684569147` success.

Commits de l'étape :
- runtime temps unifié : `b08248c2e0798475e1926b6a7859cdc646fec948`
- alignement du résultat de statuts : `f56fd87086a1d4318bf7e54c05980b89123585b0`
- régression temps unifié : `19d3398f409adf8f121f4e67416725bb90079b4e`

## Priorités ouvertes

1. prochaine étape Capture : raccorder ce pas temporel unifié comme chemin public principal à la place des ticks séparés, sans retirer encore les helpers bas niveau utiles aux tests ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
