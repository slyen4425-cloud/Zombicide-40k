# GenSrpG — Phase 4 Storage — Audit suivant 11 / Economy Session

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-storage-next-audit-11-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-next-audit-11-2026-09-20`.
- Base : `c7e4dea6d9a9e51ddf381b2ab3c4e3d7145137a5`.
- Dernier GREEN : `checkpoint/gensrpg-phase4-storage-dungeon-scene-green-2026-09-20`.
- Production gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Objet et décision

Audit dédié de la famille dynamique Economy Session, sans migration runtime.
Candidat retenu pour un lot séparé :
`gensrpg_dungeon_session_eco_160_<profileId>`.

Le transport JSON peut être raccordé à `GensStorageV1` par deux expressions,
sans déplacer les clés, le schéma, les règles ou les consommateurs Dungeon.
Aucun `removeItem`, aucune migration de format ni nouvelle API Core nécessaire.

Cette décision ne clôture pas Storage : les familles larges et les accès
non résolus restent à auditer. Les compteurs Phase 2 ne sont pas un pourcentage
de migration exhaustive et ne remplacent pas la recherche dans les scripts anonymes.

## Preuve de source et couverture de recherche

Inspection contrôlée en lecture seule :
- run `35529853991`, job `106128414527` — SUCCESS ;
- checkout épinglé sur le SHA de base ci-dessus ;
- taille vérifiée : `8 174 580` octets ;
- blob Git vérifié : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054` ;
- copie intégrale du propriétaire inline dans le log ;
- recherche du préfixe et des deux APIs dans tout `index.html`
  (scripts anonymes compris) et tous les fichiers JavaScript suivis ;
- aucun changement dans le checkout d'inspection.

Résultat :
- une seule fabrique du préfixe, dans `dungeonEconomy160` ;
- une définition de `dungeonSessionEco160` ;
- une définition de `saveDungeonSessionEco160` ;
- 8 appels au lecteur et 5 appels au writer, tous dans le même propriétaire ;
- aucun consommateur ni writer externe découvert.

Le workflow d'inspection temporaire est retiré dans la fermeture de cet audit.
La sentinelle permanente refait la recherche sur le vrai checkout CI.

## Contrat exact à conserver

### Lecture

Propriétaire : `window.dungeonSessionEco160`.

- profil : `String(activeGameProfileId() || "dungeon")` ;
- clé : préfixe historique + cet ID ;
- defaults : `{chests:0, merchantPasses:0}` ;
- transport : `JSON.parse(localStorage.getItem(key) || "{}")` ;
- fusion : `Object.assign(d, valeur)`, dans le `try/catch` existant ;
- retour : `{key,...d}` ;
- aucune écriture ni suppression à la lecture.

Absence, chaîne vide, JSON invalide, `null` et erreur de lecture gardent les
defaults. Les objets, tableaux et chaînes conservent la sémantique native
`Object.assign`, sans validation de schéma ajoutée.
Une erreur dans `activeGameProfileId()` est hors du catch de lecture et se propage.

**Détail legacy à préserver :** une propriété `key` déjà dans le JSON gagne sur
la clé calculée à cause de `{key,...d}`. La modifier serait un changement de
comportement persistant, interdit dans ce lot de transport.

### Écriture

Propriétaire : `window.saveDungeonSessionEco160(d)`.

- `if (!d?.key) return` reste un no-op ;
- `const {key,...rest}=d` exclut la clé du JSON persisté ;
- seule la clé portée par `d` décide du stockage cible ;
- ne pas recalculer le profil actif pendant la sauvegarde ;
- un objet lu sous A puis sauvegardé après passage à B reste écrit sous A ;
- aucune mutation de l'argument ;
- retour `undefined` conservé ;
- erreurs de sérialisation et d'écriture propagées.

### Raccord futur limité

Lecture :
`GensStorageV1.readJson(localStorage,key,{})`
à la place du seul `JSON.parse(localStorage.getItem(key)||"{}")`,
dans le même `try/catch`.

Écriture :
`GensStorageV1.writeJson(localStorage,key,rest)`
à la place du seul `localStorage.setItem(key,JSON.stringify(rest))`.

Aucun autre changement du bloc `dungeonEconomy160`.

## Consommateurs et ordre d'effets

Lecteurs :
- coffre / fouille `openDungeonChest` ;
- `updateDungeonSearchUi` ;
- `dungeonMjAddChest160` ;
- `dungeonMerchantAvailable160` ;
- `dungeonOpenMerchant160` ;
- `dungeonMjActivateMerchant160` ;
- décorateur historique `openMerchant` ;
- `dungeonRenderEconomyButtons160`.

Writers métier :
- consommation coffre ;
- ajout coffre MJ ;
- consommation passage marchand ;
- activation marchand MJ ;
- autorisation marchand depuis événement.

Les compteurs, nombres, chances, conditions et appels UI restent Dungeon-owned.
Une écriture échouée interrompt les actions qui suivent :
UI/alerte coffre, alerte marchand et ouverture marchand.
Le présent audit caractérise cet ordre sans corriger les mécaniques historiques.

## Frontières

Restent inchangés :
- Economy Rules déjà raccordé : 1 lecture Core + 1 écriture Core ;
- inventaire héros via `localStorage.setItem(key(heroId),...)` ;
- loot, drops, coffres, marchands, UI MJ ;
- tous les wrappers/timers historiques du propriétaire ;
- autres modules, profil actif, stats, cache et bootstrap.

Restent différés :
- Pending Trap / Special Branch : get/set/remove, audit dédié ;
- gameplay-by-profile : miroir principal + seed Capture + marqueur scalaire ;
- `gensrpg_dungeon_runtime_v2` et Core 02 ;
- Tactical mixed state / Runtime Repair ;
- Stats dynamique : futur service Core Stats ;
- autres familles Capture / device hero / session profile / MJ Rules.

## Tests du vrai propriétaire

`tests/gens_phase4_storage_economy_session_characterization_v1.test.cjs` :
- exécute le bloc réel complet extrait du `index.html` CI ;
- charge le vrai service Core Storage ;
- 13 cas de lecture et sémantique de fusion ;
- 7 variantes d'ID/fallback de profil ;
- lecture sans écriture ;
- no-op sans clé ;
- round-trip, champs inconnus, clé exclue du payload ;
- isolation A/B, y compris sauvegarde après changement de profil ;
- conservation du comportement legacy `key` persisté ;
- erreurs de lecture/profil/sérialisation/écriture ;
- appels réels MJ coffre, MJ marchand et ouverture marchand ;
- succès et interruption UI sur erreur d'écriture ;
- recherche des propriétaires supplémentaires dans scripts anonymes et fichiers externes.

Les stubs concernent uniquement les entrées/effets externes (Storage, profil,
DOM absent, alertes). Aucun résultat Stats ou gameplay n'est injecté à la place
des fonctions sous test. Aucun test existant n'est affaibli.

## État Storage inchangé

| Mesure | Ensemble | Dungeon |
| --- | ---: | ---: |
| Accès directs | 187 | 155 |
| Résolus | 122 | 105 |
| Non résolus | 65 | 50 |
| Clés directes | 21 | 13 |

Aucun manifeste ni runtime modifié dans cet audit.

## Validation et reprise

Le checkpoint final attendu est :
`checkpoint/gensrpg-phase4-storage-next-audit-11-green-2026-09-20`.

Le créer uniquement après Architecture + navigateur complet, Firefox et
Tactical Dock tous SUCCESS sur le HEAD documentaire final.
Ne pas déclarer GREEN à partir de la seule exécution locale du test.

Prochaine étape après ce checkpoint :
nouveau checkpoint de départ + branche séparée Economy Session ;
garde d'autorité RED avant raccord ; micro-diff limité aux deux transports ;
parité du vrai propriétaire et CI complète avant GREEN.

## Coordination Stats

Le pré-audit Agent 1 est reçu et vérifié séparément :
- SHA `73261adc723f2d7f4b5e3873e95debd2d908c8cd` ;
- checkpoint `checkpoint/gensrpg-phase4-stats-preaudit-agent1-green-2026-09-20` ;
- diff depuis sa base : un seul document ajouté, 811 lignes ;
- Architecture + navigateur `35529371421`, Firefox `35529371532`,
  Tactical Dock `35529371432` : tous SUCCESS sur ce SHA.

Document de référence sur sa branche gelée :
[Pré-audit Core Stats](https://github.com/slyen4425-cloud/Zombicide-40k/blob/73261adc723f2d7f4b5e3873e95debd2d908c8cd/docs/GENSRPG_PHASE4_STATS_PREAUDIT_AGENT1.md).

Pas de merge de sa branche ni d'extraction Stats dans cet audit Storage.
Préparer S1 (contrats) puis S2 (normalisation pure) après décision de clôture
du périmètre Storage ; Armure / Toucher-Défense-Esquive / Résistances et cache
exigent leurs caractérisations dédiées. Aucun changement de formule implicite.
