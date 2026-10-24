# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit wrappers openEquipmentEditor

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-open-wrapper-preaudit-2026-09-21`.
- Base exacte :
  `405257244acf58e19e738048d95b07fcad9459d3`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-setstate-fallback-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est diagnostic / caractérisation uniquement.
Aucun runtime n'est modifié.

## Pourquoi ce pré-audit était nécessaire

Le pré-audit UI historique précédent avait résumé la chaîne
`openEquipmentEditor` comme :

1. hotfix Equipment ;
2. Set Editor ;
3. cleanup canonique.

L'inventaire exhaustif des **76 fichiers externes atteignables** de la cartographie
Phase 2 montre toutefois cinq participants contenant réellement
`openEquipmentEditor` :

1. `assets/dungeon/dungeon-equipment-hotfix-167817.js` ;
2. `assets/dungeon/dungeon-set-editor-167818.js` ;
3. `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js` ;
4. `assets/gensrpg/gens-hero-editor-dynamic-167897.js` ;
5. `assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`.

Les deux couches intermédiaires doivent donc être intégrées à toute décision de
retrait.

## Ordre réel de composition

Pages et `preview.html` injectent directement, dans cet ordre :

1. `dungeon-equipment-hotfix-167817.js` ;
2. `dungeon-set-editor-167818.js` ;
3. les services Core Stats ;
4. `gens-rpg-stats-clean-167874.js` ;
5. `gens-dungeon-hero-art-repair-167874.js`.

Le Hero Art Repair :
- wrappe lui-même `openEquipmentEditor` via son hook générique ;
- appelle ensuite `loadRuntimeBridges()` ;
- charge `gens-hero-editor-dynamic-167897.js` avant
  `gens-equipment-stat-cleanup-1678102.js`.

Les deux derniers modules attendent l'API Stats canonique si nécessaire.

Ordre d'installation initial caractérisé :

1. Equipment hotfix ;
2. Set Editor ;
3. Hero Art Repair ;
4. Hero Editor Dynamic ;
5. Equipment Stat Cleanup.

## Responsabilités par couche

### 1. Equipment hotfix 167817

Son wrapper :
- appelle le propriétaire précédent ;
- résout l'objet édité ;
- appelle `loadEditor(findItem(id))`.

Cette fonction peuple la section historique :
`#deuiEquipmentEditorStats167817`
avec les champs `rpgBonuses` et un résumé de set.

Couplage important :
le wrapper `saveEquipmentEditor` du même fichier lit encore ces champs via
`readEditorBonuses()`.

### 2. Set Editor 167818

Son wrapper :
- appelle le propriétaire précédent ;
- exécute `syncEditorFromCurrentItem()` ;
- ajoute le bouton de création de set.

Son writer `saveEquipmentEditor` utilise ensuite le même état de membership pour
`persistItemMembership(...)`.

Le wrapper open n'est donc pas une simple décoration indépendante du writer.

### 3. Hero Art Repair 167874

Le hook générique inclut encore :
`openEquipmentEditor`.

Après le propriétaire précédent, il exécute :
- `repairDefs()` ;
- `schedule()`.

Le travail programmé concerne principalement :
- art héros / participants ;
- nettoyage ancien éditeur RPG ;
- décorations de modules chargés dynamiquement.

Il n'est pas propriétaire des données Equipment ni de l'ouverture de l'éditeur.

C'est le premier candidat architecturalement suspect de la chaîne.

### 4. Hero Editor Dynamic 167897

Ce module possède la vraie UI canonique des bonus RPG de base de l'équipement :

`#eqCanonicalRpgBonuses1678101`.

Son wrapper `openEquipmentEditor` programme :
`ensureEquipmentBonusUi(...)`.

Il possède également le writer correspondant pour persister ces bonus.

Point important :
`install()` relance `installWrappers()` :
- première relance après 50 ms ;
- jusqu'à 30 relances supplémentaires à 100 ms.

Le garde d'installation est basé sur :
`__canon101`.

### 5. Equipment Stat Cleanup 1678102

Son wrapper `openEquipmentEditor` programme :
`decorateEquipmentEditor(id)`.

Cette décoration :
- masque explicitement `#deuiEquipmentEditorStats167817` ;
- rend l'éditeur canonique d'évolution ;
- canonicalise les grilles de bonus des paliers de set.

Son marqueur est :
`__canonEq102`.

Le module lui-même est single-install via `installed`.

## Empilement tardif / risque de réinstallation

Après l'installation initiale du cleanup, le retry du Hero Editor Dynamic peut voir
un wrapper courant marqué `__canonEq102` mais non `__canon101`.

Il peut alors re-wrapper `openEquipmentEditor` une fois au-dessus du cleanup.

Cela signifie que la notion de « dernier wrapper = cleanup » n'est pas stable par
simple lecture de l'ordre de chargement.

Aucun correctif de ce comportement n'est autorisé dans le présent pré-audit.

## Conclusion sur les retraits possibles

### Hotfix open

Pas de retrait isolé maintenant.

Même si sa section visuelle est ensuite masquée par le cleanup canonique, son
writer historique lit encore les champs que `loadEditor()` remplit.
Retirer uniquement l'open changerait potentiellement la valeur sauvegardée.

### Set Editor open

Pas de retrait isolé maintenant.

Il synchronise la sélection de set et le writer persiste cette appartenance.

### Hero Editor Dynamic open

Pas un candidat au retrait :
il possède l'UI canonique des bonus RPG de base.

### Equipment Cleanup open

Pas un candidat au retrait :
il possède la décoration canonique évolution / set et le masquage des contrôles
legacy.

### Hero Art Repair open

Premier candidat soustractif pour un lot dédié.

Sa responsabilité post-open est générique et extérieure à l'éditeur Equipment.
Avant retrait il faut cependant une sentinelle navigateur réelle prouvant que :
- l'UI canonique de bonus apparaît toujours ;
- l'UI set reste synchronisée ;
- l'évolution canonique reste décorée ;
- le cleanup legacy reste appliqué ;
- les arts héros / participants ne régressent pas.

## Effets hors périmètre

Non modifiés :
- chaîne `saveEquipmentEditor` ;
- wrapper `renderDungeonGear` ;
- MutationObserver Equipment UI ;
- listeners document Equipment / Set Editor ;
- timers / RAF de rafraîchissement ;
- stockage des sets ;
- moteur bonus/sets ;
- évolution ;
- invalidation cache ;
- Stats gameplay ;
- Tactical / combat.

## TDD / sentinelle

Sentinelle :
`tests/gens_phase4_inventory_equipment_open_wrapper_preaudit_v1.test.cjs`.

Elle :
- inventorie tous les fichiers externes atteignables contenant
  `openEquipmentEditor` ;
- verrouille les cinq participants réels ;
- verrouille l'ordre Pages / preview ;
- verrouille l'ordre de chargement dynamique Hero Editor -> Equipment Cleanup ;
- caractérise les responsabilités open ;
- caractérise les couplages open/save ;
- caractérise le retry Hero Editor et la différence de marqueurs.

## Sortie attendue

Après Architecture + navigateur, Firefox et Tactical tous GREEN sur le SHA
documentaire final :

1. créer
   `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21` ;
2. ouvrir un lot séparé :
   `Hero Art Repair / retrait du hook openEquipmentEditor` ;
3. obtenir une preuve navigateur avant le retrait ;
4. ne modifier aucun autre wrapper open/save dans ce lot ;
5. conserver `main` gelée.
