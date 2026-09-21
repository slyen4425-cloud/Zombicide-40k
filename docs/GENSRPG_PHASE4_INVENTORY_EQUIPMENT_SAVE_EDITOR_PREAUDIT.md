# Phase 4 Core Inventory / Equipment — pré-audit saveEquipmentEditor

Date : 2026-09-22

## Statut

Pré-audit structurel et comportemental terminé sans modification runtime.

Branche :
work/gensrpg-phase4-inventory-equipment-save-editor-preaudit-2026-09-22

Base GREEN :
669a8b2ef1caeba2d75a97000b4716877e9e5fc9

Production main :
e8681f9823573ced8aec59c8ddc47a72b02bc663 — V16.78.114.11 — inchangée.

## Autorité du gros index.html

Le fichier fourni par l'utilisateur a été vérifié avant inspection contre le blob Git du SHA de base.

- taille : 8 174 580 octets ;
- blob Git attendu : 5b9b9ae780f735eadef049afeb10acf0b57441fe ;
- blob Git du fichier fourni : 5b9b9ae780f735eadef049afeb10acf0b57441fe.

Le propriétaire natif saveEquipmentEditor analysé est donc bien celui du dépôt au SHA de base, conformément à la règle 26.

## Participants réellement atteignables

La cartographie Phase 2 et la composition Pages / preview confirment cinq niveaux sur la chaîne de sauvegarde :

1. Equipment Cleanup — marqueur __eqCache1021 ;
2. Hero Editor Dynamic — marqueur __canon101 ;
3. Dungeon Set Editor — marqueur __setEditor167818 ;
4. Dungeon Equipment Hotfix — marqueur __equipmentHotfix167817 ;
5. saveEquipmentEditor natif de index.html.

Après la correction GREEN précédente de la garde de chaîne retry, l'ordre extérieur vers intérieur est stable :

Equipment Cleanup -> Hero Editor Dynamic -> Set Editor -> Equipment Hotfix -> natif.

Aucun second propriétaire Hero Editor n'est réinstallé par le retry.

## Responsabilité exacte du propriétaire natif

Le saveEquipmentEditor natif construit et persiste l'objet Equipment principal.

Chemin builtin :
- charge les overrides ;
- remplace l'override de l'id édité ;
- écrit une fois via saveDungeonItemOverrides.

Chemin custom :
- met à jour ou ajoute l'objet dans la liste custom ;
- écrit une fois via saveCustomEquipment.

L'objet natif ne prend pas la responsabilité de rpgBonuses canoniques ni de setId / setPieceId.

## Écritures supplémentaires des wrappers

### Dungeon Equipment Hotfix

Après le save natif, le hotfix persiste les bonus RPG lus depuis ses champs historiques.

- builtin : une écriture supplémentaire dans les overrides ;
- custom : une écriture supplémentaire dans la liste custom.

Son openEquipmentEditor reste couplé à ce save : il charge les champs historiques que le wrapper de save relit ensuite.

### Dungeon Set Editor

Après toute la chaîne précédente, Set Editor persiste setId et setPieceId.

- builtin : une écriture supplémentaire dans les overrides ;
- custom : une écriture supplémentaire dans la liste custom.

Son openEquipmentEditor synchronise les contrôles de membership que le save relit.

### Hero Editor Dynamic

Hero Editor possède l'UI canonique rpgBonuses.

Son wrapper save :
- lit les bonus canoniques ;
- exécute la chaîne précédente ;
- programme ensuite un setTimeout(..., 0) ;
- recharge uniquement loadCustomEquipment ;
- recherche l'équipement custom correspondant ;
- écrit target.rpgBonuses ;
- appelle saveCustomEquipment.

Conséquence :
- custom : une quatrième écriture, différée, contenant la valeur canonique finale ;
- builtin : aucun writer canonique, car un builtin n'existe pas dans loadCustomEquipment.

### Equipment Cleanup

Cleanup entoure la chaîne avec l'invalidation du cache Equipment :

invalidate -> old.apply(...) -> invalidate.

Cette invalidation post-save est synchrone. Le writer canonique Hero Editor est, lui, différé après old.apply.

Ce décalage est conservé comme risque structurel à caractériser séparément ; le présent lot ne conclut pas à un défaut de cache sans preuve comportementale dédiée.

## Nombre d'écritures caractérisé

### Save custom Dungeon existant

Ordre observé :

1. natif -> saveCustomEquipment ;
2. hotfix -> saveCustomEquipment ;
3. Set Editor -> saveCustomEquipment ;
4. Hero Editor différé -> saveCustomEquipment.

Total : 4 écritures custom pour un Save.

La sentinelle navigateur prouve que la valeur rpgBonuses canonique du Hero Editor gagne finalement, et que le membership de set survit.

### Save builtin Dungeon

Ordre observé :

1. natif -> saveDungeonItemOverrides ;
2. hotfix -> saveDungeonItemOverrides ;
3. Set Editor -> saveDungeonItemOverrides ;
4. callback Hero Editor différé -> aucun target builtin, donc aucune écriture.

Total : 3 écritures overrides pour un Save.

## Défaut fonctionnel caractérisé — à ne pas corriger dans ce lot

La sentinelle navigateur modifie volontairement le bonus canonique Force d'un builtin de 2 vers 9.

Résultat réel :
- la chaîne native s'exécute ;
- le hotfix restaure la valeur historique 2 ;
- le Set Editor persiste correctement le nouveau membership ;
- le writer canonique Hero Editor ne trouve aucun builtin dans loadCustomEquipment ;
- la valeur finale persistée reste Force = 2 au lieu de 9.

Le défaut est donc prouvé :

**une modification rpgBonuses faite dans l'UI canonique d'un équipement builtin n'est actuellement pas persistée par le propriétaire canonique.**

Conformément à la charte, aucune correction runtime n'est faite dans ce pré-audit.

## Dépendances open -> save encore nécessaires

- Hotfix open -> remplit les champs historiques relus par Hotfix save.
- Set Editor open -> synchronise setId / setPieceId relus par Set Editor save.
- Hero Editor open -> rend l'UI canonique rpgBonuses relue par Hero Editor save.
- Cleanup open -> masque les anciens contrôles et décore l'évolution canonique ; son wrapper save reste l'invalidateur cache.

Retirer isolément un de ces wrappers maintenant modifierait encore une responsabilité observable.

## Décision soustractive

Aucun retrait isolé n'est sûr à la fin de ce pré-audit.

Le premier défaut à traiter est la persistance canonique rpgBonuses des builtins chez le vrai propriétaire Hero Editor Dynamic, dans un lot correctif séparé.

Une fois ce défaut corrigé et validé :
- le besoin du writer rpgBonuses historique du hotfix pourra être réaudité séparément ;
- la duplication des écritures pourra alors être réduite de manière soustractive si les preuves le permettent ;
- Set Editor ne doit pas être retiré tant qu'il reste propriétaire du membership ;
- le propriétaire natif doit rester propriétaire de l'objet Equipment principal ;
- le risque d'invalidation cache après writer différé doit être caractérisé dans un lot dédié s'il reste pertinent.

## Sentinelles ajoutées

Statique :
tests/gens_phase4_inventory_equipment_save_editor_static_preaudit_v1.test.cjs

Navigateur :
tests/gens_phase4_inventory_equipment_save_editor_browser_preaudit_v1.test.cjs

La sentinelle navigateur extrait le vrai corps saveEquipmentEditor depuis index.html puis charge les vrais wrappers du dépôt. Elle ne réimplémente pas le save ciblé.

## Validation technique avant clôture documentaire

SHA technique :
a17ecc6b835b089db730742af7e35c7099ea01a4

- Architecture + navigateur complet : run 35665725105 — SUCCESS ;
- Firefox : run 35665725045 — SUCCESS ;
- Tactical Dock : run 35665725046 — SUCCESS ;
- étape navigateur ciblée « Caractériser la chaîne saveEquipmentEditor dans Chromium » — SUCCESS.

Aucun fichier runtime n'a été modifié.

## Prochaine étape après checkpoint GREEN

Ouvrir un lot dédié :

Phase 4 Core Inventory / Equipment — correction persistance rpgBonuses canonique builtin.

Le lot devra :
1. partir du checkpoint GREEN de ce pré-audit ;
2. créer une branche dédiée ;
3. faire passer en RED une sentinelle qui exige que la valeur canonique builtin soit persistée dans les overrides ;
4. corriger uniquement le vrai propriétaire canonique, sans nouveau wrapper, observer, timer ou fallback ;
5. préserver le chemin custom, le membership Set Editor et l'invalidation existante ;
6. repasser Architecture + navigateur, Firefox et Tactical avant checkpoint GREEN.
