# GenSrpG — Inventaire des risques runtime

Base auditée : `main` commit `e8681f9823573ced8aec59c8ddc47a72b02bc663`
Branche : `audit/gensrpg-module-architecture-2026-09-15`

## Objet

Ce document recense les effets de bord runtime encore présents dans la version publiée, sans modifier le gameplay. Il sert à préparer les tests de frontières et l’ordre de consolidation.

## 1. Loader mobile qui possède trop de responsabilités

Fichier : `assets/gensrpg/gens-mobile-combat-performance-16781022.js`

Constats :
- remplace plusieurs fonctions globales de calcul/animation ;
- installe des invalidateurs autour de nombreuses fonctions de sauvegarde et dégâts ;
- se réinstalle par `setTimeout` ;
- charge dynamiquement toute la chaîne Tactical V2 ;
- réinstalle ensuite Survival isolation et le bridge Tactical à plusieurs délais.

Risque : le module nommé "mobile combat performance" agit en réalité comme bootstrapper d’architecture. Une correction de performance peut donc changer le routage combat ou l’isolation des modes.

Cible : séparer en trois responsabilités :
1. `combat-performance` ;
2. `runtime-bootstrap` ;
3. `mode-routing`.

## 2. Tactical V108

Fichier : `gens-rpg-tactical-combat-v2-polish-1678108.js`

Constats :
- wrap de `dungeonMoveHero098` ;
- wrap de `dungeonMapHtml` ;
- wrap de `DungeonCore01.render/show` ;
- wrap de `GensRpgTacticalCombatV2Ui.render` ;
- observer global sur `document.body/documentElement` ;
- logique de détection Dungeon + UI Tactical + textures de murs + inventaire/armes dans le même module.

Risque : frontière Exploration/Tactical floue.

## 3. Tactical V109

Fichier : `gens-rpg-tactical-combat-v2-polish-1678109.js`

Constats :
- wrap de `heroAttacks` et `createBattle` ;
- listener document en phase capture ;
- observer global du body ;
- retries d’installation à 80/220/600/1200/2500 ms ;
- modifications du HUD, timeline, armes et murs dans la même couche.

Risque : un correctif UI peut affecter règles de portée et équipement.

## 4. Tactical V111

Fichier : `gens-rpg-tactical-runtime-fixes-1678111.js`

Constats :
- wrap de `heroAttacks` et `createBattle` ;
- remplace `resolveAttack` pour le multi-dé ;
- wrap de fonctions Dungeon de déplacement/événements/rendu pour la détection ;
- maintenance DOM et dock d’actions ;
- historique récent : ce module installait encore un observer global malgré les premières protections V114.11.

Risque : très élevé, car règles de combat, détection Dungeon et UI sont mélangées.

## 5. Tactical V112

Fichier : `gens-rpg-tactical-combat-coherence-1678112.js`

Constats :
- possède sélection spatiale de participants ;
- possède une partie de la détection ennemie ;
- wrap plusieurs fonctions Dungeon (`dungeonMoveHero098`, événements, spawn, render/show) ;
- listener `document.click` en phase capture ;
- observer global `document.body` ;
- maintenance UI des dés, détails et murs.

Risque : chevauchement direct avec V111 et V113 sur la même autorité.

## 6. Tactical V113 / V114.10

Fichier : `gens-rpg-tactical-runtime-authority-1678113.js`

Constats :
- reprend encore la sélection de participants et la détection ;
- ajoute scope salle / sous-salle ;
- contient à nouveau UI, D100, murs et hooks runtime ;
- son nom annonce explicitement une nouvelle "autorité" au-dessus des couches précédentes.

Risque : architecture en couches correctives successives plutôt qu’un propriétaire unique.

## 7. Bridge Tactical V2

Fichier : `gens-rpg-tactical-combat-v2-bridge.js`

Constats :
- remplace globalement `dc200StartCombat` ;
- remplace `openDungeonCombatSetup` ;
- remplace potentiellement `launchCombat200` et `startCombat` ;
- charge encore un runtime repair dynamiquement ;
- garde des pointeurs vers les anciennes fonctions pour fallback.

Risque : le bridge n’est pas seulement un adaptateur ; il devient routeur global de fonctions historiques.

Cible : une API unique `Dungeon.startTacticalCombat(snapshot)` sans remplacer plusieurs entrées globales.

## 8. Intégration V114.11

Fichier : `gens-rpg-tactical-combat-v2-integration.js`

État actuel : correctif de protection nécessaire en production.

Constats :
- le loader doit temporairement remplacer `MutationObserver` pendant le chargement V108→V114.11 ;
- cette protection est nécessaire car certains modules s’auto-installent avant leur `onload` ;
- elle restaure ensuite le constructeur natif.

Interprétation : ce garde doit rester tant que les couches anciennes sont actives, mais il ne doit pas devenir l’architecture finale.

## 9. Pattern commun observé

Les couches Tactical V108, V109, V111, V112 et V113 partagent plusieurs responsabilités :
- détection d’ennemis ;
- sélection des participants ;
- rendu murs ;
- amélioration HUD ;
- wrappers de fonctions globales ;
- installation/retry ;
- parfois observers/listeners document.

C’est le principal multiplicateur de risque actuel : une même responsabilité a plusieurs propriétaires successifs.

## 10. Ordre de consolidation recommandé

### Étape 1 — tests de frontières avant suppression
Créer les tests suivants :
- aucune couche Tactical ne peut modifier fiche héros / Save & Quit hors combat ;
- aucune couche Tactical ne peut observer `body/html` ;
- changement de vue sans combat ne déclenche aucun renderer Tactical ;
- Survival ne voit aucun wrapper Dungeon/Tactical ;
- un seul démarrage de combat pour un événement donné ;
- un seul calcul de participants par combat.

### Étape 2 — extraire le bootstrap
Sortir le chargement des modules de `gens-mobile-combat-performance-16781022.js` sans changer le comportement.

### Étape 3 — autorité détection
Conserver un seul propriétaire pour détection + scope salle/sous-salle. Les couches V108/V111/V112 ne doivent plus déclencher le combat une fois la nouvelle autorité validée.

### Étape 4 — autorité visuelle Tactical
Consolider murs, timeline, dock, dés et fiche détail dans un renderer Tactical unique, limité à l’overlay combat.

### Étape 5 — autorité règles
Consolider portée, multi-dé, D100, armure et dégâts dans le moteur/adaptateur, sans DOM.

### Étape 6 — bridge propre
Remplacer progressivement les wrappers globaux par un contrat explicite Dungeon -> Tactical -> Dungeon.

## 11. Règle de migration

Chaque étape doit être soustractive :
- ajouter les tests ;
- désactiver une ancienne autorité ;
- vérifier comportement identique ;
- seulement ensuite supprimer son chargement runtime.

Les anciens fichiers restent dans l’historique Git. Aucun gros nettoyage simultané.
