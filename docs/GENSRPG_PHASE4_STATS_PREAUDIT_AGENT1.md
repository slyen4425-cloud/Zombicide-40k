# GenSrpG — Phase 4 — Pré-audit du futur service Core Stats

Date : 2026-09-20  
Mission : audit préparatoire uniquement, sans extraction runtime  
Branche : work/gensrpg-phase4-stats-preaudit-agent1-2026-09-20  
Checkpoint de départ : checkpoint/gensrpg-start-phase4-stats-preaudit-agent1-2026-09-20  
Base exacte : 5259210bea918719603066057d3c64c4d68624eb  
Production main gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663

## 1. Périmètre et preuve de base

Cet audit a été réalisé sans modifier index.html, le runtime, le stockage, les workflows CI ni les branches work/gensrpg-phase4-storage-*.

Le contenu exact de index.html utilisé pour l'audit a été fourni puis vérifié contre Git :
- taille : 8 174 580 octets ;
- blob Git attendu et vérifié : 30487d09481e11e5883faca1a6e49727d9cecfb6 ;
- commit de référence : 5259210bea918719603066057d3c64c4d68624eb.

L'objectif est de préparer des micro-lots sûrs. Ce document ne décide aucune modification de formule et ne transforme aucune dette constatée en nouveau comportement.

## 2. Conclusion synthétique

Le propriétaire canonique le plus proche du futur Core Stats est actuellement :

assets/gensrpg/gens-rpg-stats-clean-167874.js

Son API GensCleanRpgStats167874 possède déjà :
- la normalisation des définitions de caractéristiques ;
- les caractéristiques natives et dynamiques ;
- les effets génériques entre caractéristiques et cibles dérivées ;
- le calcul value(hero,id) ;
- les effets extraTotal/sourceEffectTotal ;
- la synchronisation des valeurs héros ;
- la persistance des définitions/effects dans le profil RPG.

Mais ce fichier n'est pas extractible tel quel vers Core. Il mélange encore :
- moteur de calcul ;
- migration legacy ;
- persistance de profil ;
- wrappers autour des fonctions Dungeon globales ;
- rendu de l'éditeur Stats ;
- rendu/décoration de la fiche Dungeon ;
- raccord à l'éditeur de héros ;
- un MutationObserver de fiche ;
- plusieurs setTimeout de synchronisation UI.

La cible correcte est donc un moteur Core Stats pur, sans DOM, sans navigation, sans Tactical, sans équipement propriétaire et sans stockage privé.

## 3. Graphe de chargement réel pertinent

### 3.1 Composition de preview.html

preview.html charge le monolithe index.html puis ajoute notamment :
- dungeon-core-318.js ;
- les modules Room/World/Authored ;
- dungeon-equipment-ui.js ;
- dungeon-equipment-hotfix-167817.js ;
- gens-world-summary-167820.js ;
- gens-rpg-stats-clean-167874.js ;
- gens-dungeon-hero-art-repair-167874.js ;
- gens-mobile-combat-performance-16781022.js.

### 3.2 Ponts chargés après Stats

gens-dungeon-hero-art-repair-167874.js charge ensuite :
- gens-hero-editor-dynamic-167897.js ;
- gens-dungeon-hero-ingame-art-167898.js ;
- gens-stat-upgrade-policy-167898.js ;
- gens-dungeon-ui-cleanup-1678100.js ;
- gens-equipment-stat-cleanup-1678102.js ;
- plusieurs modules authored.

Le fichier gens-stat-manual-cost-167898.js existe dans le dépôt mais aucun chemin de chargement actif n'a été trouvé dans la composition actuelle. Il doit être traité comme dette/doublon dormant tant qu'un inventaire global de chargement n'a pas démontré le contraire.

### 3.3 Tactical

gens-mobile-combat-performance-16781022.js charge core/runtime-bootstrap-v1.js.

runtime-bootstrap-v1.js charge séquentiellement :
1. gens-rpg-tactical-combat-v2.js ;
2. gens-rpg-tactical-combat-v2-adapter.js ;
3. gens-rpg-tactical-combat-v2-rules.js ;
4. gens-rpg-tactical-combat-v2-integration.js ;
5. gens-rpg-tactical-combat-v2-ui.js ;
6. gens-rpg-tactical-combat-v2-bridge.js ;
7. gens-survival-mode-isolation-1678104.js.

L'intégration Tactical ajoute ensuite :
- V108 polish ;
- V109 polish ;
- V110 stats ;
- V111 runtime fixes ;
- V112 coherence ;
- V113 runtime authority ;
- V114.11 visual dice / résolution finale.

gens-rpg-tactical-wall-dice-stats-16781145.js contient un autre mécanisme de snapshot/réparation de stats, mais aucun chemin de chargement actif n'a été trouvé dans cette composition. Il doit être documenté comme couche historique/dormante, pas comme propriétaire runtime actuel.

## 4. Carte des propriétaires actuels

| Responsabilité | Propriétaire actuel observé | Lecteurs / consommateurs | Écrivains | Dépendances principales | Cible recommandée |
| --- | --- | --- | --- | --- | --- |
| Définitions de caractéristiques | GensCleanRpgStats167874.root / defs / def | éditeur Stats, fiche Dungeon, éditeur héros, Tactical V110 | syncEditor, addStat/removeStat | profile.rpgUniverse.stats | Core Stats |
| Liste native Force/Agilité/Intelligence/Esprit/Endurance/Initiative/Défense/Armure/Mouvement | CORE dans gens-rpg-stats-clean-167874.js | même chaîne | migration root | profil actif | Core Stats comme schéma par défaut, configurable |
| Valeur de base d'un héros | customBase / specialRaw + hero dungeonStats + state.rpgAttributes | value, fiche, dérivées, snapshot | changeDungeonAttribute, éditeur héros, sauvegarde d'état | CHARS, loadState | Core Stats doit calculer à partir de données fournies ; état héros reste hors Core |
| Valeur canonique finale | GensCleanRpgStats167874.value | Dungeon, Tactical Adapter, V110 snapshot, UI | aucune écriture directe | équipement, skills, debuffs, effets | Core Stats |
| Effets stat -> stat / dérivées | effectAmount, statEffectTotal, extraTotal, sourceEffectTotal | valeur canonique, dégâts/toucher dérivés | éditeur Stats | dynamicEffects90 | Core Stats |
| Bonus équipement de caractéristique | dungeonEquipmentBonus inline + wrapper gens-equipment-stat-cleanup-1678102 | Core Stats baseValue, dérivées Dungeon | équipement/inventaire et évolution | inventaire équipé, rpgBonuses, évolution | Inventory/Equipment reste propriétaire ; Core Stats consomme des modificateurs normalisés |
| Bonus compétences | dungeonSkillEffectTotal inline | Core Stats, dérivées Dungeon | système talents | état/talents | système Talents reste propriétaire ; Core Stats consomme |
| Malus challenges | dungeonChallengeDebuffTotal067 | Core Stats baseValue | runtime challenge | état challenge | module challenge reste propriétaire ; Core Stats consomme |
| PV maximum | dungeonEnduranceHpBonus + effectiveMaxWounds, décorés par Stats | fiche, snapshot V110 | règles/profil/effets | endurance, règles RPG | calcul max/bonus générique candidat Core Stats ; wounds/current HP hors Core |
| Mana maximum | dungeonMaxMana, décoré par Stats | fiche, snapshot V110 | règles/profil/effets | esprit, équipement, skills | dérivée candidate Core Stats ; current mana reste état module |
| Critique | dungeonCriticalChance, décoré par Stats | Dungeon/Tactical snapshot | règles/profil/effets | Agilité | valeur dérivée Core Stats ; résolution critique Tactical |
| Esquive | dungeonDodgeChance, décoré par Stats | Dungeon classique, Tactical | règles/profil/effets | Agilité | valeur dérivée Core Stats ; résolution d'esquive reste combat |
| Initiative | dungeonDerivedInitiative + Stats | Dungeon, Tactical ordre | règles/profil/effets | initiative canonique | valeur Core Stats ; ordre de tour Tactical |
| Défense | GensCleanRpgStats167874.value via wrapper dungeonDerivedDefense | Dungeon/Tactical | état héros, équipements, skills, effets | stat canonique | Core Stats fournit la valeur ; pénalité de toucher appartient au moteur combat |
| Armure score | GensCleanRpgStats167874.value via wrapper dungeonArmorScore | Dungeon/Tactical | état héros, équipements, skills, effets | stat canonique | Core Stats peut fournir le score ; interprétation/réduction reste combat |
| Réduction d'armure Dungeon | dungeonArmorReductionFromScore inline | Dungeon classique | règles RPG | armorReductionStep/gain | Dungeon/combat rules, pas Core Stats tant que sémantique non unifiée |
| Résistance magique dérivée | dungeonMagicResistance + Stats | Dungeon/Tactical | règles + effets | Esprit | candidat dérivée Core Stats |
| Résistances génériques/élémentaires | gensNormalizeResistances + données héros | Dungeon élémentaire, Tactical V110 | éditeur héros | array kind/value | données normalisées communes possibles ; résolution reste module combat |
| Précision de base arme | effectiveAttackStats + Tactical Adapter weaponHitProfile | Tactical | objets/règles | rpgScaling, hitChance, accuracy | Equipment/Combat, pas Core Stats |
| Bonus toucher par caractéristique | dungeonHitBonusForMode + Core sourceEffectTotal/extraTotal | Dungeon, Adapter | règles Stats/profil | stat canonique | Core Stats peut fournir un modificateur dérivé ; formule finale de touche reste combat |
| Formule touche Dungeon classique | dungeonDefenseReduction / rollEnemyAttack / dungeonCombatBasicAttack | Dungeon | règles RPG | défense cible, stat attaquant, dodge | Dungeon combat |
| Formule touche Tactical | Tactical V2 attackPreview + rules cover + V114.11 hitCalculation/resolveAttack | Tactical | snapshot acteur + attaque | defense, dodge, cover | Tactical |
| Bonus dégâts physique/magique | dungeonPhysicalDamageBonus / dungeonMagicDamageBonus décorés par Stats | Dungeon, V110 snapshot | règles Stats/profil | Force/Intelligence | dérivée Core Stats |
| Dégâts finaux Tactical | V114.11 resolvePhysicalDamage / resolveDamagePerHit / patchHitResolver | Tactical UI/log | combat | snapshot, arme, armure, règles | Tactical |
| Résistances dans Tactical | V110 resistanceSnapshot/resistanceFor/adjustedDamage | Tactical preview/final | snapshot | données héros/ennemis | transport snapshot + Tactical combat |
| Snapshot héros initial | inline dungeonCombatHeroSnapshot puis Adapter.heroSnapshot | Adapter | Dungeon | état héros | devra être remplacé par contrat explicite |
| Snapshot canonique Tactical actif | V110 buildHeroSnapshot + applyHeroSnapshot | Tactical actor/rules/UI | V110 decorateBattle | Core Stats + helpers Dungeon | adapter contract entre Core Stats/Dungeon et Tactical |
| Snapshot alternatif historique | V114.5 buildLinkedSnapshot/repairBattleStats | tests/historique ; pas de charge active trouvée | V114.5 | mêmes sources | dette à retirer/archiver après preuve |
| Éditeur riche Stats | GensCleanRpgStats167874.renderEditor/syncEditor | utilisateur | profil | DOM + profile store | UI/Builders, pas moteur Core |
| Politique coût/verrouillage progression active | gens-stat-upgrade-policy-167898.js | fiche/éditeur | profile.rpgUniverse.stats.upgradePolicy98 | changeDungeonAttribute | Progression/UI |
| Politique manuelle alternative | gens-stat-manual-cost-167898.js | aucun chemin actif trouvé | manualProgression98/ledger | changeDungeonAttribute | dette dormant à caractériser, ne pas extraire |
| Persistance définitions/effets Stats | saveProfile dans Stats | profil RPG | saveGameProfiles | Core storage actuel via API historique | futur Core Storage, Stats ne doit pas posséder le backend |
| Miroir de règles Dungeon legacy | syncRpgUniverseToDungeonRules + saveDungeonRpgRules | helpers Dungeon | localStorage gensrpg_dungeon_rpg_rules_v1 | profil RPG | compatibilité/migration à retirer tardivement, pas source finale |

## 5. Chemin réel : personnage -> équipement/effets -> dérivées -> Tactical

### 5.1 Données de départ

Définition du héros :
- CHARS[hero].dungeonStats pour les valeurs de définition/défaut ;
- héros personnalisés sauvegardés avec dungeonStats ;
- valeurs runtime par héros dans state.rpgAttributes.

Le moteur canonique Stats choisit state.rpgAttributes lorsqu'une valeur runtime existe, sinon dungeonStats/defaultValue.

### 5.2 Composition de la valeur canonique

Chemin principal :

profile.rpgUniverse.stats
-> root()/dynamicDefinitions + dynamicEffects90
-> customBase()/specialRaw()
-> dungeonEquipmentBonus()
-> dungeonSkillEffectTotal()
-> dungeonChallengeDebuffTotal067()
-> statEffectTotal()
-> value(hero,id)

Core Stats doit à terme recevoir les modificateurs d'équipement/talents/challenges en entrée. Il ne doit pas appeler directement leurs globals propriétaires.

### 5.3 Dérivées Dungeon

Les anciens helpers inline calculent encore :
- dégâts physique/magique ;
- bonus toucher ;
- PV max ;
- mana max ;
- critique ;
- esquive ;
- initiative ;
- défense ;
- armure ;
- réduction d'armure ;
- résistance magique.

gens-rpg-stats-clean-167874.js les décore ou les remplace selon la stat afin d'injecter les effets dynamiques.

Il existe donc actuellement une autorité canonique des valeurs Stats, mais les dérivées restent partagées entre ce moteur et les helpers Dungeon historiques.

### 5.4 Création d'acteur Tactical

Tactical Adapter :
- appelle d'abord dungeonCombatHeroSnapshot lorsqu'il existe ;
- construit l'acteur avec hp/maxHp/movement/initiative/defense/armor/dodge ;
- construit les attaques depuis l'équipement via effectiveAttackStats et weaponHitProfile.

Ensuite V110 Stats wrappe createBattle :
- reconstruit un buildHeroSnapshot canonique ;
- relit GensCleanRpgStats167874.value pour toutes les définitions ;
- calcule/copie les dérivées ;
- place le snapshot dans actor.meta.rpgStats ;
- réapplique movement/initiative/defense/armor/dodge sur l'acteur.

Cela constitue un double passage de snapshot : ancien snapshot Dungeon puis snapshot V110 canonique.

### 5.5 Précision / toucher Tactical

weaponHitProfile construit la chance d'attaque :
- rpgScaling.attribute ;
- valeur canonique de la caractéristique ;
- bonus Core sourceEffectTotal sur hit:melee/ranged/magic ;
- fallback dungeonHitBonusForMode ;
- ou valeur D100 explicite/effectiveAttackStats ;
- fallback legacy D6 converti en pourcentage.

Le moteur Tactical attackPreview retranche ensuite directement :
- target.defense ;
- target.dodge ;
- couvert ligne de vue ;
- couvert de cellule via l'extension Tactical rules.

V114.11 résout le D100 final en utilisant le preview Tactical comme autorité de hitChance.

### 5.6 Dégâts Tactical

V110 enrichit attackPreview :
- résistances non physiques ;
- critique et multiplicateur depuis snapshot.

V114.11 est le résolveur final actif :
- arme ;
- bonus canonique du snapshot pour physique mêlée ou magie ;
- dégâts bruts ;
- armure physique ;
- règle de plancher/blocage d'armure ;
- critique ;
- dégâts finaux ;
- détail explicable pour l'UI/log.

Chemin résumé :

stat canonique
-> effets/modificateurs
-> dérivées Dungeon compatibles
-> V110 buildHeroSnapshot
-> actor.meta.rpgStats
-> Adapter attaque
-> Tactical attackPreview
-> Défense/Esquive/Couvert
-> V114.11 résolution D100
-> dégâts arme + bonus dérivé
-> armure/résistance
-> critique
-> dégâts finaux

## 6. Duplications et conflits confirmés

### 6.1 Stats moteur + UI + raccord dans le même fichier

gens-rpg-stats-clean-167874.js est aujourd'hui à la fois :
- moteur ;
- adaptateur legacy ;
- migrateur ;
- persistance ;
- éditeur ;
- décorateur de fiche.

C'est le principal obstacle à une extraction directe.

### 6.2 Double persistance des règles

Le profil RPG conserve les paramètres dans rpgUniverse.stats/combat/progression.

syncRpgUniverseToDungeonRules recopie ensuite une partie de ces paramètres vers la clé locale :
gensrpg_dungeon_rpg_rules_v1.

Les helpers Dungeon relisent cette clé via loadDungeonRpgRules.

Core Stats ne doit pas créer une troisième source. La cible doit être profil normalisé + Core Storage, avec un adaptateur legacy transitoire explicitement testé.

### 6.3 Snapshot multiple

Trois générations existent dans le code :
1. dungeonCombatHeroSnapshot inline ;
2. V110 buildHeroSnapshot actif ;
3. V114.5 buildLinkedSnapshot/repairBattleStats présent dans le dépôt mais sans chemin de chargement actif trouvé.

Le futur contrat doit produire un seul snapshot de stats de combat.

### 6.4 Armure : score contre réduction

Dungeon classique :
- dungeonArmorScore produit un score ;
- dungeonArmorReductionFromScore transforme ce score selon armorReductionStep/armorReductionGain ;
- dungeonMitigationForHero applique armorReduction.

Tactical :
- l'acteur reçoit armor = score ;
- V2/V114.11 soustraient directement ce armor aux dégâts physiques.

Ce ne sont pas les mêmes sémantiques. Ne pas déplacer armor dans Core Stats en prétendant que le sens est déjà unique.

### 6.5 Défense / toucher

Dungeon classique :
- pénalité = max(0, Défense cible - caractéristique attaquante) × defensePenaltyPerPoint ;
- esquive fait l'objet d'un jet distinct.

Tactical :
- hitChance = attaque - Défense - Esquive - couvert ;
- clamp 5–95.

Ce conflit appartient à la consolidation combat/règles, pas au simple déplacement des caractéristiques.

### 6.6 Résistances : forme de données incompatible

L'éditeur générique du monolithe sauvegarde les résistances héros comme tableau :
[{kind,value}, ...].

V110 collectResistanceObjects ignore explicitement les tableaux et ne consomme que des objets clé -> nombre.

Donc certaines résistances éditées peuvent ne pas entrer dans le snapshot Tactical sous leur forme générique. Une normalisation de contrat est nécessaire avant extraction.

### 6.7 Politique de progression dupliquée dans le dépôt

gens-stat-upgrade-policy-167898.js est chargé et actif.

gens-stat-manual-cost-167898.js propose une seconde politique de coût/verrouillage et un second ledger, mais aucun chemin de chargement actif n'a été retrouvé dans la composition courante.

Avant extraction, il faut une sentinelle de graphe de chargement confirmant définitivement son statut puis conserver un seul propriétaire de progression.

### 6.8 Cache performance autour de Stats

gens-mobile-combat-performance-16781022.js wrappe :
- dungeonEquipmentBonus ;
- dungeonAttributeValue ;
- GensCleanRpgStats167874.value ;
- dungeonEnemyRpgStats.

Il invalide ces caches sur différentes mutations.

Le futur service Core Stats devra exposer une stratégie claire d'invalidation/version de contexte. Extraire value sans traiter ce cache pourrait créer des valeurs périmées ou doubler les caches.

## 7. Wrappers, observers, timers et retries pertinents

### gens-rpg-stats-clean-167874.js
- wrappers sur dungeonAttributeValue, changeDungeonAttribute, renderDungeonAttributes, renderRpgUniverseEditor, saveRpgUniverseStats et plusieurs dérivées ;
- MutationObserver global documentElement pour détecter dungeonAttributeGrid ;
- setTimeout de décoration/rendu après plusieurs cycles UI.

### gens-stat-upgrade-policy-167898.js
- wrap changeDungeonAttribute ;
- wrappers de rendu ;
- retries temporisés jusqu'à 20 tentatives pour reprendre les fonctions après chargement.

### gens-hero-editor-dynamic-167897.js
- wrappers éditeur héros/équipement/talents ;
- retries d'installation jusqu'à 30 cycles ;
- aucun MutationObserver global.

### gens-equipment-stat-cleanup-1678102.js
- wrap dungeonEquipmentBonus ;
- wrappers d'invalidation d'équipement ;
- retry court d'installation si l'API Stats n'est pas encore disponible.

### Tactical V110
- wrap Adapter.createBattle ;
- wrap Engine.attackPreview/resolveAttack/aiStep ;
- wrap UI ;
- retries d'installation.

### V114.11
- remplace le resolver final resolveAttack ;
- retries courts d'installation ;
- pas de moteur Stats propre, consomme snapshot + preview.

### Couche historique V114.5
- contient patchAdapter/patchUi et un système repairBattleStats avec nombreux retries ;
- aucun chargement actif trouvé dans le graphe courant ;
- ne doit pas être importée dans Core.

La future extraction doit réduire ces mécanismes, pas les transporter.

## 8. Ce qui doit devenir Core Stats

Core Stats doit idéalement être un service pur fournissant :

1. schéma normalisé d'une définition de stat ;
2. normalisation des alias/IDs ;
3. normalisation d'un effet ;
4. calcul d'une valeur canonique à partir de :
   - valeur de base ;
   - liste de modificateurs ;
   - liste d'effets configurés ;
5. calcul des effets target :
   - stat:<id> ;
   - damage:* ;
   - hit:* ;
   - max_hp ;
   - max_mana ;
   - crit ;
   - dodge ;
   - magic_resistance ;
   - initiative ;
   - etc. ;
6. détail explicable du calcul ;
7. construction d'un objet de valeurs dérivées à partir d'une configuration explicite ;
8. contrat de snapshot de stats destiné aux consommateurs.

Le service ne doit pas :
- lire le DOM ;
- connaître dungeonAttributeGrid ;
- ouvrir l'éditeur ;
- appeler localStorage directement ;
- posséder l'inventaire ;
- posséder les talents ;
- modifier current/state global ;
- résoudre une attaque Tactical ;
- calculer une ligne de vue ;
- appliquer une armure au dégât ;
- décider du tour ;
- écrire le HP/mana courant.

## 9. Ce qui doit rester propriétaire de son module

### Dungeon
- état courant d'exploration ;
- wounds/current mana hors combat ;
- affichage fiche Dungeon ;
- adaptations legacy temporaires ;
- règles spécifiques Dungeon tant qu'elles ne sont pas génériques.

### Inventory / Equipment
- équipement porté ;
- bonus d'objet ;
- évolution d'objet ;
- sets ;
- invalidation après equip/unequip.

Core Stats reçoit des modificateurs déjà structurés.

### Progression
- points disponibles ;
- coût de +1 ;
- verrouillage ;
- ledger de dépenses ;
- XP/niveaux.

Core Stats valide éventuellement les limites d'une stat, mais ne dépense pas les points.

### Tactical
- actor combat state ;
- toucher final ;
- couverture ;
- D100 ;
- critique résolue ;
- application armure/résistance ;
- dégâts ;
- HP pendant le combat ;
- log/résultat de combat.

### UI / Builders
- éditeur de stats ;
- éditeur héros ;
- rendu fiche ;
- explications visuelles.

L'UI consomme les détails de Core Stats, elle ne recalcule pas.

## 10. Tests existants utiles

### Moteur canonique
- gens_stat_engine_cleanup_v167894.test.cjs
- gens_native_defense_armor_movement_v167895.test.cjs

Ils couvrent notamment les stats dynamiques, valeurs natives, équipement et effets.

### Éditeur Stats
- gens_stats_editor_authority_characterization_v11411.test.cjs
- gens_stats_editor_single_authority_v11411.test.cjs
- gens_stats_editor_browser_v11411.test.cjs
- gens_stat_editor_game_display_semantics_v11411.test.cjs

Ils verrouillent le renderer riche canonique et empêchent l'ancien fallback checkbox de reprendre l'autorité.

### Equipement
- gens_equipment_stat_cleanup_v1678102.test.cjs
- gens_equipment_combat_cache_v1678102hf1.test.cjs

### Stats -> Tactical
- gens_force_to_tactical_snapshot_v11411.test.cjs
- gens_rpg_tactical_root_stats_v16781147.test.cjs
- gens_rpg_tactical_combat_v2_stats_v1678110.test.cjs

Le test Force -> snapshot prouve actuellement :
Force canonique -> effet damage:physical -> bridge Dungeon -> V110 snapshot.

### Toucher
- gens_hit_scaling_authority_extract_v11411.test.cjs
- gens_rpg_tactical_hit_wall_v16781148.test.cjs

### Dégâts
- gens_rpg_tactical_damage_v167811411.test.cjs
- gens_v11411_final_melee_damage_contract.test.cjs

Le contrat final verrouille notamment arme 5 + bonus stat 3 - armure 2 = 6 en Tactical.

### Progression / points
- gens_manual_xp_statpoints_characterization_v11411.test.cjs
- tests progression existants.

## 11. Tests manquants avant extraction

### T1 — Contrat pur Core Stats
Sans DOM et sans globals :
- stat de base ;
- plusieurs modificateurs ;
- effet stat -> stat ;
- effet stat -> dérivée ;
- min/max ;
- cycle d'effet ;
- valeurs personnalisées du profil supérieures aux defaults ;
- détail explicatif.

### T2 — Base héros vs état runtime
Pour chaque stat :
- dungeonStats seul ;
- state.rpgAttributes présent ;
- valeur personnalisée ;
- reload ;
- héros actif et héros non actif.

### T3 — Modificateurs équipement
Vrai chemin :
héros -> équipement réellement porté -> bonus rpgBonuses -> valeur Core -> dérivée.

Tester aussi :
- equip ;
- unequip ;
- évolution ;
- set ;
- invalidation du cache.

### T4 — Talents/challenges
Vérifier que les providers externes produisent les mêmes modificateurs sans que Core Stats lise directement leurs globals.

### T5 — Dérivées complètes
Une matrice indépendante pour :
- PV max ;
- mana max ;
- critique ;
- esquive ;
- initiative ;
- défense ;
- armure score ;
- résistance magique ;
- dégâts physique/magique ;
- toucher par mode.

Avec valeurs par défaut ET valeurs de règles personnalisées.

### T6 — Snapshot unique
Un test de frontière réel :
héros -> Core Stats -> snapshot -> Tactical actor.

Il doit échouer si Tactical relit un helper Dungeon pour recalculer une dérivée déjà présente.

### T7 — Résistances
Tester au minimum :
- tableau [{kind,value}] issu de l'éditeur actuel ;
- objet normalisé ;
- physique ;
- magique ;
- élément ;
- vulnérabilité négative ;
- snapshot Tactical ;
- résultat final.

### T8 — Armure sémantique
Caractériser séparément, sans décider la formule :
- armor score ;
- armor reduction Dungeon ;
- armor Tactical ;
- armor floor ;
- configuration armorReductionStep/gain ;
- configuration armorZeroBlockChance.

Le test doit rendre visible toute différence entre Dungeon et Tactical.

### T9 — Toucher sémantique
Caractériser même attaquant/cible dans :
- Dungeon classique ;
- Tactical.

Faire varier :
- caractéristique attaquante ;
- défense ;
- esquive ;
- couvert ;
- hit min/max ;
- bonus hit configurable.

Ne pas corriger tant que le contrat cible n'est pas décidé.

### T10 — Persistance/migration
- profil rpgUniverse.stats ;
- sauvegarde/reload ;
- ancien dynamicRules ;
- dynamicEffects90 ;
- migration legacy ;
- aucune reprise silencieuse du localStorage Dungeon sur le profil après migration.

### T11 — Graphe de chargement
Prouver :
- gens-stat-upgrade-policy actif ;
- gens-stat-manual-cost dormant ou retiré ;
- V114.5 snapshot repair dormant ou retiré ;
- une seule couche active par responsabilité.

### T12 — Cache
Vérifier que toute mutation pertinente invalide la valeur canonique et qu'un futur Core Stats n'est pas doublement mis en cache.

## 12. Proposition de micro-lots — du plus sûr au plus risqué

### Micro-lot S1 — Contrats et sentinelles de schéma
Risque très faible.

Documenter/verrouiller :
- définition ;
- effet ;
- valeur ;
- modificateur ;
- résultat dérivé ;
- détail explicatif.

Aucun changement runtime.

### Micro-lot S2 — Extraire les fonctions pures de normalisation
Risque faible.

Extraire seulement :
- canon/alias ;
- normDef ;
- normEffect ;
- comparaison ;
- calcul step/threshold.

Conserver les adaptateurs actuels autour du nouveau service.

### Micro-lot S3 — Moteur pur value/effects
Risque faible à moyen.

Créer une API Core prenant explicitement :
- definitions ;
- active ;
- baseValues ;
- modifiers ;
- effects.

Ne pas encore brancher UI/Tactical.

Comparer bit à bit avec GensCleanRpgStats167874 sur fixtures réelles.

### Micro-lot S4 — Provider de valeurs héros
Risque moyen.

Normaliser le contrat :
hero definition + runtime attributes -> baseValues.

Le module héros/Dungeon fournit les données ; Core Stats ne lit plus CHARS/state directement.

### Micro-lot S5 — Provider Equipment/Talents/Challenges
Risque moyen.

Créer le contrat de modificateurs externes.

Inventory/Talents/Challenge restent propriétaires. Core Stats ne connaît que des lignes de modificateur.

### Micro-lot S6 — Dérivées génériques
Risque moyen.

Déplacer progressivement les dérivées qui ont une sémantique déjà stable :
- max HP ;
- max mana ;
- crit ;
- dodge ;
- initiative ;
- magic resistance ;
- damage/hit modifiers.

Ne pas inclure encore l'application finale de Défense/Armure.

### Micro-lot S7 — Snapshot Core Stats unique
Risque moyen à élevé.

Produire un seul snapshot immuable contenant valeurs canoniques + dérivées.

Tactical Adapter reçoit ce snapshot.
Retirer ensuite seulement les doubles lectures démontrées.

### Micro-lot S8 — Normalisation des résistances
Risque élevé fonctionnel.

Unifier array/object dans un contrat de données sans changer les pourcentages.
Vérifier Dungeon et Tactical avant retrait des anciens lecteurs.

### Micro-lot S9 — Armure
Risque élevé gameplay.

Décider explicitement le contrat entre :
- armorScore ;
- armorReduction ;
- armor floor.

Aucune migration avant sentinelles comparatives et décision de design.

### Micro-lot S10 — Toucher / Défense / Esquive
Risque très élevé gameplay.

Résoudre explicitement la divergence Dungeon/Tactical.
Core Stats doit seulement fournir les valeurs/modificateurs ; Tactical/Dungeon restent propriétaires de la résolution tant qu'un moteur combat commun n'existe pas.

### Micro-lot S11 — Frontière dégâts
Risque élevé.

Une fois S7-S10 stabilisés :
- Core Stats produit les bonus dérivés ;
- Tactical applique arme, type, résistance, armure, critique ;
- supprimer les relectures Dungeon depuis le snapshot.

### Micro-lot S12 — Éditeur et persistance
Risque moyen à élevé.

Faire du renderer Stats un consommateur de l'API Core.
Conserver Core Storage comme backend unique.
Retirer progressivement le miroir gensrpg_dungeon_rpg_rules_v1 seulement avec migration versionnée.

### Micro-lot S13 — Nettoyage wrappers/observers/retries
Risque moyen.

Après transfert réel d'autorité :
- retirer les wrappers devenus inutiles ;
- retirer le MutationObserver de Stats ;
- retirer les retries de reprise de fonctions ;
- retirer les couches dormantes V114.5/manual-cost si leurs sentinelles prouvent qu'elles ne sont plus nécessaires.

## 13. Ordre recommandé pour le coordinateur

Ne pas commencer par Tactical ni par les formules de dégâts.

Ordre recommandé :
S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7 -> S8 -> S9 -> S10 -> S11 -> S12 -> S13.

Le meilleur premier lot d'implémentation est S1/S2 : normalisation pure, sans état, sans DOM, sans stockage et sans formule de combat.

## 14. Risques et blocages

### Blocage A — sémantique Armor non unique
Impossible de déclarer armor propriétaire Core tant que score et réduction ne sont pas distingués contractuellement.

### Blocage B — toucher Dungeon/Tactical différent
Une extraction mécanique figerait arbitrairement une des deux formules.

### Blocage C — résistances incompatibles
Le snapshot Tactical ne lit pas la forme tableau générée par l'éditeur héros.

### Blocage D — dérivées encore dépendantes des globals Dungeon
V110 buildHeroSnapshot appelle encore dungeonPhysicalDamageBonus, dungeonMagicDamageBonus, effectiveMaxWounds et autres seams globaux.

### Blocage E — couplage Equipment -> Stats
Core Stats appelle aujourd'hui dungeonEquipmentBonus. Il faut inverser ce couplage par provider/modifiers.

### Blocage F — cache
gens-mobile-combat-performance wrappe déjà GensCleanRpgStats167874.value et dungeonAttributeValue. Toute nouvelle API devra avoir une stratégie d'invalidation claire.

### Blocage G — UI et moteur dans le même module
Déplacer le fichier actuel entier déplacerait aussi DOM, observer et wrappers dans Core, ce qui violerait l'architecture cible.

### Blocage H — persistance double
Profil RPG + localStorage Dungeon coexistent encore.

### Blocage I — code dormant ressemblant à une autorité
manual-cost et V114.5 stats repair doivent être caractérisés comme dormants avant suppression ou migration.

## 15. Invariants à préserver pendant les futurs lots

- une seule valeur finale pour une caractéristique ;
- les règles personnalisées du profil gagnent sur les defaults ;
- l'équipement n'est jamais possédé par Stats ;
- Tactical ne relit pas arbitrairement tout Dungeon ;
- l'UI ne recalcule pas le gameplay ;
- aucune formule n'est modifiée pendant un lot d'extraction ;
- toute migration persistante est versionnée/idempotente ;
- pas de nouveau MutationObserver global ;
- pas de timer/retry destiné à reprendre une fonction ;
- aucune modification des autres modes pour faciliter Stats ;
- chaque micro-lot possède un RED de caractérisation et un GREEN réel.

## 16. Verdict du pré-audit

Le futur Core Stats est extractible progressivement, mais pas en un seul déplacement.

La source la plus fiable à transformer est GensCleanRpgStats167874, à condition de séparer d'abord :
- moteur pur ;
- providers de données/modificateurs ;
- dérivées ;
- snapshot ;
- UI ;
- persistance ;
- compatibilité Dungeon.

Les trois zones à ne surtout pas fusionner dans le premier lot sont :
1. armure ;
2. toucher/Défense/Esquive ;
3. résistances.

Elles possèdent encore des contrats divergents entre Dungeon et Tactical et nécessitent des lots de caractérisation dédiés avant toute consolidation.

Aucune extraction runtime n'a été effectuée dans ce pré-audit.
