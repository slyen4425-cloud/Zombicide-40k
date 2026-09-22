# GenSrpG — Phase 4 Core Progression / XP — pré-audit

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-preaudit-2026-09-22`.
- Base exacte :
  `0ce2451da078cceb90c0431a3735932dbd41f945`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-d10048-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce pré-audit est documentaire/diagnostic uniquement.
Aucun runtime, gameplay, asset, règle ou stockage n'est modifié.

## Position dans la roadmap

La Phase 4 ordonne les services communs ainsi :

1. resolver d'assets ;
2. stockage/migrations ;
3. stats ;
4. inventory/equipment/sets ;
5. dés ;
6. **progression/XP** ;
7. bus d'événements/utilitaires.

Le sous-chantier Dice est gelé après son raccord `d10048` GREEN.
Le chantier courant est donc Progression/XP, et non un troisième seam Dice.

## Fait structurel 1 — ancien progression-runtime V1 inerte

Fichier historique :

`assets/gensrpg/dungeon/progression-runtime-v1.js`.

La cartographie de production actuelle le classe explicitement hors graphe :
- non chargé par `index.html` ;
- non injecté par GitHub Pages ;
- non injecté par `preview.html` ;
- non mis en cache comme entrée de production ;
- présent uniquement pour tests/documentation historiques.

Son implémentation est un wrapper de `changeXP` :
- `install()` capture le gestionnaire précédent ;
- remplace `rt.changeXP` ;
- délègue hors Dungeon ;
- réutilise les fonctions natives Dungeon.

Conclusion :
**ne pas réactiver ce fichier**.
Il s'agit d'un artefact de transition Dungeon, pas d'un candidat Core.

## Fait structurel 2 — Dungeon possède déjà plusieurs responsabilités distinctes

Les sentinelles existantes identifient au minimum :

### Calcul / synchronisation
- `dungeonRpgLevelFromXp` ;
- `dungeonSyncProgressionForState` ;
- calcul des points de talents / caractéristiques ;
- configuration exposant notamment `xpPerLevel` et `statPointsPerLevel`.

### Mutation manuelle
- `changeXP` ;
- synchronisation via `dungeonSyncProgressionForState` ;
- cycle niveau via `dungeonHandleLevelUp071` ;
- persistance explicite ;
- rendu fiche.

### Récompenses
- `awardDungeonDefeatXp` ;
- `dungeonRecordCombatReward` ;
- intégration Tactical -> Dungeon ;
- partage d'XP ;
- loot et résumé de victoire.

### Présentation
- `dungeonHandleLevelUp071` ;
- popup de niveau ;
- rendu `rpgLevel / statPoints / skillPoints` ;
- résumé de victoire.

Ces responsabilités ne doivent pas être déplacées ensemble dans un « Core Progression »
monolithique.

## Fait structurel 3 — Capture a son propre contrat de progression configurable

Le stockage Capture conserve les règles métier dans Capture, pas dans Core Storage.

Contrat déjà caractérisé :
- `xpMultiplier` ;
- `statCap` ;
- `statPointsPerLevel` ;
- `talentEvery` ;
- `maxMoves` ;
- `moveRelearn`.

La famille de règles est profilée via :

`gensrpg_capture_progress_v2_<profileId>`.

Conclusion :
un futur Core Progression ne peut pas reprendre les règles Dungeon et les
imposer à Capture.

Le Core éventuel doit être **paramétré par les données du module/profil** et ne
contenir que des primitives véritablement génériques.

## Fait structurel 4 — Survival n'est pas encore suffisamment caractérisé

Les sentinelles Survival actuelles protègent surtout :
- isolation de module ;
- lancement par le Shell ;
- absence de fuite Dungeon.

Elles ne fournissent pas encore un contrat suffisamment précis de progression/XP
pour déclarer une primitive commune avec Dungeon ou Capture.

Conclusion :
aucun contrat partagé n'est sélectionné avant caractérisation de Survival et
inspection exacte des propriétaires inline actuels.

## Matrice de responsabilités provisoire

| Domaine | Calcul pur | Mutation | Stockage | UI | Récompenses |
| --- | --- | --- | --- | --- | --- |
| Dungeon | natif, configurable | natif | état héros / sauvegarde native | fiche + popup niveau | Dungeon + intégration Tactical |
| Capture | règles Capture configurables | Capture | famille profilée via Core Storage générique | Capture | Capture |
| Survival | à caractériser | à caractériser | à caractériser | Survie | Survie |
| Core actuel | aucun moteur progression connecté | aucun | stockage générique seulement | aucun | aucun |

## Interdictions confirmées

Le futur Core ne doit pas :
- coder `10 XP = 1 niveau` en dur ;
- posséder une popup de niveau ;
- distribuer lui-même le loot ;
- connaître les héros Dungeon ;
- connaître les créatures Capture ;
- persister directement une clé métier de module ;
- wrapper `changeXP` globalement ;
- uniformiser Dungeon, Survival et Capture ;
- réactiver `progression-runtime-v1.js`.

## Sentinelle structurelle

Test :

`tests/gens_phase4_progression_preaudit_v1.test.cjs`.

Il verrouille :
- l'inertie de l'ancien wrapper Dungeon ;
- l'absence d'un Core Progression introduit prématurément ;
- les autorités Dungeon déjà documentées ;
- la séparation du contrat Capture ;
- l'obligation de poursuivre le pré-audit avant toute extraction.

## Source exacte encore nécessaire

Le `index.html` du checkpoint GREEN courant est :

- commit :
  `0ce2451da078cceb90c0431a3735932dbd41f945` ;
- blob :
  `2d7677950f04e9a3290ff0062e157a126123891d` ;
- taille :
  `8 174 648` octets.

La copie utilisateur précédente correspond au blob antérieur `5b8e790f...`.
Elle ne doit pas servir à l'inspection détaillée des propriétaires inline de ce
pré-audit.

Conformément à la règle 26, l'étape suivante nécessite la copie utilisateur
exacte du SHA GREEN courant.

## Prochaine analyse après vérification du fichier

Sur la copie exacte, inventorier sans modification :
1. définition + callsites de `dungeonRpgLevelFromXp` ;
2. définition + callsites de `dungeonRpgEarnedSkillPoints` ;
3. responsabilités exactes de `dungeonSyncProgressionForState` ;
4. frontières de `changeXP` ;
5. attribution et partage dans `awardDungeonDefeatXp` ;
6. cycle et effets de `dungeonHandleLevelUp071` ;
7. propriétaires Survival de l'XP / seuils / niveaux ;
8. propriétaires Capture de l'application des règles déjà configurées ;
9. séparation calcul pur / effets / persistance / UI.

Seulement après cette matrice, sélectionner **un seul** futur micro-lot TDD,
ou conclure qu'aucune primitive n'est suffisamment commune.

## État

Pré-audit structurel en cours.

Aucun futur seam n'est encore sélectionné.
Aucun fichier runtime n'a été modifié.
