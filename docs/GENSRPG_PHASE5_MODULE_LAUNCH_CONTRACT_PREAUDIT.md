# GenSrpG — Phase 5 / contrat public de lancement module — pré-audit

Date : 2026-09-24

## Base sûre

- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-contract-preaudit-2026-09-24`
- Base GREEN :
  `checkpoint/gensrpg-phase5-openchar-core028-retirement-green-2026-09-23`
- SHA exact de base :
  `4ce38c01e00f75703f5103c83b268e1a75724364`
- Branche :
  `work/gensrpg-phase5-module-launch-contract-preaudit-2026-09-24`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## Validation utilisateur de la base

La preview complète du retrait Core 0.28 a été testée sur téléphone et jugée globalement correcte.

QA différée, hors de ce chantier :
- petits défauts de rafraîchissement déjà connus ;
- inventaire objet Survie observé à 0 par défaut, comportement anormal à caractériser plus tard ;
- dette Stats au retour ;
- détection ennemie intermittente / téléportation ;
- libellé Survie mélangeant du vocabulaire Dungeon.

Aucune de ces dettes n'est corrigée dans ce pré-audit.

## Constat architectural

La cartographie courante montre :

- `goMenu` : aucune affectation globale inline restante ;
- `openChar` : une affectation Capture 139 restante ;
- `resumeGame` : un propriétaire Dungeon restant ;
- `startConfiguredGame` : cinq propriétaires actifs, chaîne :
  `captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Le retrait antérieur de `captureFix135 -> startConfiguredGame` avait passé la CI mais avait provoqué des régressions utilisateur réelles :
- lancement combat Dungeon ;
- embuscades/spawn ;
- visibilité Builder ;
- retour Capture après combat ;
- reprise Capture.

Le rollback a restauré ces chemins et la sentinelle
`tests/gens_phase5_user_regression_rollback_guard_v1.test.cjs`
interdit désormais de retirer cette frontière sans contrat de remplacement prouvé sur les vrais chemins E2E.

Conclusion :
**l'ordre ou le shadowing statique des wrappers n'est pas une preuve suffisante de redondance.**

## Objectif du lot

Formaliser un contrat public de lancement module, analogue au contrat déjà utilisé pour le retour écran, sans raccorder aucun runtime.

Nouveau contrat metadata-only :
`assets/gensrpg/shell/module-launch-contract-v1.json`.

Opération :
`startModuleSession`.

Providers déclarés :
- Survival ;
- Dungeon ;
- Capture ;
- PvP.

Répartition d'autorité :
- Shell : sélectionne uniquement le provider à partir de l'état public de routage ;
- module : garde préconditions de lancement, participants, initialisation session/monde et transition UI ;
- Tactical : reste hors de ce contrat.

## Déclarations module

Les contrats Phase 3 Survival, Dungeon, Capture et PvP déclarent désormais une entrée publique
`moduleLaunch` vers le contrat Shell.

Statut :
`declared-not-loaded`.

Les fichiers `entry-v1.js` restent strictement inertes et hors graphe de production.

## Invariants nouveaux

1. Aucun état privé module ne traverse le Shell.
2. Aucune règle gameplay ne migre dans le Shell.
3. Aucun wrapper global de compatibilité n'est introduit.
4. Aucun observer/timer/retry/polling n'est ajouté.
5. La chaîne historique `startConfiguredGame` reste figée à cinq propriétaires pendant ce lot.
6. Aucun retrait futur ne peut être justifié par le seul shadowing statique.
7. Un futur retrait doit d'abord prouver la parité du provider sur les vrais chemins :
   - Dungeon -> map -> combat Tactical ;
   - embuscade/proximité ;
   - Builder jeu + édition ;
   - Capture -> combat -> victoire -> Hub ;
   - Capture -> reprise ;
   - Survie ;
   - PvP ;
   - non-interférence quatre modules.

## Sentinelle

`tests/gens_phase5_module_launch_contract_preaudit_v1.test.cjs`.

Elle verrouille :
- la forme du contrat ;
- la séparation Shell/module ;
- les quatre déclarations providers ;
- l'inertie des points d'entrée Phase 3 ;
- la garde de rollback utilisateur ;
- la chaîne restaurée à cinq propriétaires ;
- l'absence de raccord dans `index.html`, `preview.html` et `.github/workflows/main.yml`.

## Périmètre

Modifications autorisées dans ce lot :
- métadonnées de contrat ;
- sentinelle ;
- CI ;
- documentation.

Interdit :
- `index.html` ;
- runtime Capture/Dungeon/Survie/PvP ;
- `captureFix135/138/139` ;
- `gensDungeonCore01Js` ;
- `dungeonCore200Rebuild` ;
- `resumeGame` ;
- `openChar` ;
- Tactical ;
- Builder ;
- Storage ;
- Stats ;
- détection/mouvement ;
- inventaire Survie ;
- cache PWA ;
- `main`.

## Critère de sortie

1. sentinelle contrat GREEN ;
2. Architecture + navigateur complet GREEN ;
3. Firefox GREEN ;
4. Tactical Dock GREEN ;
5. runtime `index.html` byte-identique au blob
   `d9ee34d47fa888795db68cdc244d0c73d30ee523` ;
6. checkpoint GREEN du pré-audit.

## Étape suivante seulement après GREEN

Ouvrir un lot séparé :
**Phase 5 / raccord module-launch — pré-audit runtime**.

Conformément à la règle 26, ce lot suivant devra utiliser le fichier `index.html` exact du checkpoint GREEN fourni par l'utilisateur avant toute inspection ou modification détaillée du gros HTML.

Aucun merge sur `main`.


## Validation technique GREEN avant clôture documentaire

SHA technique :
`b4bc46560c1f47c383799e5f31b43bee507f9640`.

- Architecture + navigateur complet : run `35927000630` — SUCCESS ;
- Firefox : run `35927000589` — SUCCESS ;
- Tactical Dock : run `35927000620` — SUCCESS.

La batterie navigateur confirme notamment :
- Dungeon map -> Tactical ;
- Capture victoire et reprise inter-module ;
- Dungeon après Survie ;
- Builder réel ;
- Config objet moderne ;
- fiche RPG sans flash Survie ;
- openChar sans Core 0.28 ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- Capture en composition complète ;
- non-interférence quatre modules ;
- preview et assets.

Le runtime reste byte-identique :
- taille `8170726` ;
- blob `d9ee34d47fa888795db68cdc244d0c73d30ee523`.

## Clôture finale obligatoire

La clôture documentaire change le SHA.

Avant création du checkpoint GREEN final, le SHA documentaire final doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Checkpoint cible :
`checkpoint/gensrpg-phase5-module-launch-contract-preaudit-green-2026-09-24`.

Aucun merge sur `main`.
