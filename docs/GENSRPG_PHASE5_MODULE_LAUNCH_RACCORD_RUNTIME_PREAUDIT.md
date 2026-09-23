# GenSrpG — Phase 5 / module-launch — pré-audit du raccord runtime

Date : 2026-09-24

## Base sûre

- Branche :
  `work/gensrpg-phase5-module-launch-raccord-runtime-preaudit-2026-09-24`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-raccord-runtime-preaudit-2026-09-24`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-contract-preaudit-green-2026-09-24`
- SHA exact :
  `8dee418cc1d8ed777166624d6bb04e6c14540443`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## Règle 26 satisfaite

Le fichier exact a été fourni par Sylvain dans `work14 (1).zip`.

Contenu :
`indexwork14.txt`.

Vérifications locales :
- taille : `8170726` octets ;
- blob Git calculé : `d9ee34d47fa888795db68cdc244d0c73d30ee523`.

Ces valeurs correspondent exactement au checkpoint GREEN.

Aucune inspection détaillée du gros runtime n'a été effectuée avant cette vérification.

## État runtime exact

### Autorité publique de module actif déjà existante

Le Shell possède déjà un seul resolver :

`gensShellActiveModuleV1()`.

Il est exposé publiquement par :

`GensShellScreenReturnV1.activeModule()`.

Décision :
**le futur service module-launch doit réutiliser ce resolver.**

Interdit :
- créer un second détecteur de module ;
- dupliquer la logique profile/family ;
- lire directement des états privés Capture/Dungeon dans un nouveau Shell router.

### startConfiguredGame

Propriétaire Shell natif :
`async function startConfiguredGame()`.

Cinq affectations historiques actives :
1. `captureFix135`
2. `captureFix138`
3. `captureFix139`
4. `gensDungeonCore01Js`
5. `dungeonCore200Rebuild`

La chaîne reste volontairement intacte.

### Responsabilités observées

#### captureFix135
- reset jour/tour/round Capture ;
- sauvegarde du world state ;
- délégation.

#### captureFix138
- capture du contexte avant délégation ;
- retour/rendu Hub Capture après lancement ;
- nettoyage UI ;
- timer historique.

#### captureFix139
- route dédiée Capture ;
- validation dresseurs/créatures de départ ;
- activation session ;
- initialisation monde Capture ;
- tours ;
- entrée monde.

#### gensDungeonCore01Js
- ancien propriétaire Dungeon réel ;
- `eligible() -> start()` ;
- délégation hors Dungeon.

#### dungeonCore200Rebuild
- propriétaire Dungeon final actuel ;
- Dungeon uniquement ;
- exclusion Capture explicite ;
- `start()` final.

### PvP

Le vrai Shell conserve :
- `Le moteur PvP n’est pas encore construit.`
- `PVP — À VENIR`.

Donc PvP est déclaré dans le contrat de domaine mais **ne doit pas recevoir de provider runtime de lancement** tant que son moteur reste un placeholder.

## Conclusion du pré-audit

Le futur raccord doit reprendre le modèle déjà réussi pour `goMenu` :
- une autorité Shell publique ;
- providers module-owned ;
- aucun état privé transporté par le Shell ;
- migration progressive ;
- retrait des anciennes autorités seulement après preuve E2E.

## Séquence sélectionnée

### S1 — registre Shell module-launch

Ajouter uniquement un service Shell :

`GensShellModuleLaunchV1`.

Il devra :
- être placé à côté de `GensShellScreenReturnV1` ;
- réutiliser `gensShellActiveModuleV1()` ;
- exposer `register(moduleId, handler)` ;
- exposer `activeModule` ;
- exposer `startModuleSession(moduleId)` ;
- n'ajouter aucun second resolver ;
- n'être appelé par aucun chemin de production dans S1 ;
- ne modifier aucune affectation `startConfiguredGame`.

S1 est donc un raccord de contrat **runtime inert vis-à-vis du lancement actuel**.

### S2 — provider Survival

En lot séparé :
- enregistrer le propriétaire Shell natif Survival ;
- ne pas modifier la chaîne globale ;
- caractériser par navigateur l'appel public direct ;
- conserver tous les vrais parcours actuels.

### S3 — provider Capture

En lot séparé :
- exposer/raccorder uniquement le chemin Capture-owned actuel ;
- conserver `captureFix135/138/139` pendant la preuve ;
- aucune suppression sur la base du shadowing.

### S4 — provider Dungeon

En lot séparé :
- raccorder le `start()` du propriétaire Dungeon final ;
- conserver temporairement les propriétaires globaux Dungeon ;
- vérifier Dungeon map -> Tactical, Builder, embuscades, reprise.

### PvP

Aucun provider runtime tant que le placeholder reste le comportement officiel.

### Autorité Shell finale

Seulement après parité des providers sur les vrais chemins utilisateur :
- le Shell pourra devenir le propriétaire final de `startConfiguredGame` ;
- les anciennes affectations module seront alors retirées une par une avec TDD ;
- aucun wrapper de compatibilité temporaire permanent.

## Invariants utilisateur obligatoires

Avant toute suppression d'une autorité :
- Dungeon -> map -> Tactical ;
- détection/embuscade/proximité ;
- Builder jeu + édition ;
- Capture -> lancement -> combat -> victoire -> Hub ;
- Capture -> reprise ;
- Survival ;
- Save & Quit ;
- PvP placeholder ;
- non-interférence quatre modules.

## QA différée hors périmètre

- petits bugs de rafraîchissement ;
- inventaire objet Survie initialisé à 0 ;
- Stats au retour ;
- détection ennemie intermittente / téléportation ;
- terminologie Survie.

## Sentinelle

`tests/gens_phase5_module_launch_raccord_runtime_preaudit_v1.test.cjs`.

Elle verrouille :
- fichier exact/taille/blob ;
- unicité de `gensShellActiveModuleV1` ;
- exposition par ScreenReturn ;
- absence actuelle de `GensShellModuleLaunchV1` ;
- chaîne `startConfiguredGame` à 5 propriétaires ;
- responsabilités Capture/Dungeon ;
- PvP placeholder ;
- Shell entry toujours inert et hors graphe.

## Critère de sortie

Pré-audit uniquement :
- aucune modification `index.html` ;
- sentinelle GREEN ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN ;
- checkpoint GREEN dédié.

## Micro-lot runtime suivant

Après GREEN :
**Phase 5 / module-launch S1 — Shell registry raccord**.

Ce lot S1 devra commencer par un RED dédié exigeant le nouveau registre tout en exigeant :
- blob runtime de départ exact ;
- chaîne `startConfiguredGame` strictement inchangée ;
- aucun provider module encore connecté ;
- aucun appel de production vers le nouveau service.

Aucun merge sur `main`.
