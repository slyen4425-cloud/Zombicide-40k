# GenSrpG — Audit d’architecture

Date de départ : 2026-09-15
Branche d’audit : `audit/gensrpg-module-architecture-2026-09-15`
Base : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Objectif

Stabiliser durablement GenSrpG sans supprimer de fonctionnalités, d’assets, de graphismes ni de règles déjà validées.

Le but n’est pas une réécriture brutale. L’audit doit d’abord cartographier les responsabilités, isoler les modules, documenter les dépendances globales et créer des tests de frontières avant toute consolidation.

## Principe directeur

Une fonctionnalité ne doit pas pouvoir modifier un autre mode ou une autre zone de l’application en dehors d’un contrat explicite.

Exemple critique observé : des couches de Combat tactique Dungeon ont installé des `MutationObserver`, wrappers et comportements globaux sur l’UI générale. Cela a pu reprendre le contrôle après l’ouverture d’une fiche héros ou après `Save & Quit`. Le correctif V16.78.114.11 publié le 2026-09-15 a restauré l’autorité de l’UI Dungeon native en bloquant les observers globaux de la chaîne tactique.

## Cartographie cible des domaines

### 1. Core commun
Responsabilités autorisées :
- modèles héros / créatures / objets ;
- statistiques et effets ;
- progression ;
- sérialisation commune ;
- événements communs strictement documentés ;
- utilitaires purs.

Le Core ne doit pas piloter directement l’affichage d’un mode.

### 2. UI / navigation / shell
Autorité unique sur :
- écran d’accueil ;
- navigation entre modes ;
- ouverture / fermeture de fiches ;
- transitions globales ;
- visibilité des vues principales.

Aucun moteur de gameplay ne doit :
- écouter globalement tous les clics pour détourner la navigation ;
- forcer `location.reload()` ;
- réafficher une vue masquée ;
- écrire directement dans les états d’affichage d’un autre module.

### 3. Survie
Doit conserver ses règles, données et UI propres. Les fonctions historiques partagées avec Dungeon doivent être identifiées puis remplacées progressivement par des interfaces communes explicites.

### 4. Dungeon / Aventure — exploration
Autorité sur :
- salles et sous-salles ;
- déplacement ;
- interactions ;
- coffres, portes, pièges, énigmes ;
- ennemis présents dans le donjon ;
- fiche héros en exploration ;
- `Save & Quit` ;
- reprise de partie ;
- règles de proximité avant combat.

Le Dungeon exploration décide quand un combat doit démarrer et fournit un snapshot d’entrée au Combat tactique.

### 5. Combat tactique Dungeon
Périmètre strict :
- overlay / vue de combat ;
- participants déjà validés ;
- initiative / timeline ;
- attaques, D100, dégâts, armure, portée, LOS ;
- fin du combat ;
- retour d’un résultat au Dungeon.

Interdictions :
- observer `document.body` ou `document.documentElement` ;
- posséder la navigation globale ;
- posséder la fiche héros d’exploration ;
- posséder `Save & Quit` ;
- scanner et modifier des éléments d’UI non tactiques.

### 6. Capture
Doit être un module isolé avec ses propres règles de combat, capture, équipe, réserve, biomes et progression de créatures.

Il ne doit pas réutiliser des fonctions Dungeon ou Survie par effet de bord. Les mécaniques réellement communes passent par le Core.

### 7. Duel / PvP
Isolation complète du runtime des autres modes. Les échanges multijoueur doivent passer par une interface dédiée et non par des variables globales partagées avec Dungeon/Survie.

### 8. World Builder / éditeurs
Les éditeurs produisent et modifient des données de jeu.
Ils ne doivent pas devenir une seconde source d’autorité runtime.

Principe :
`éditeur -> données validées -> runtime du mode`

Pas :
`éditeur -> mutation directe du runtime actif`

### 9. Stockage / sauvegardes
Une couche unique doit gérer :
- IndexedDB ;
- version de schéma ;
- migration ;
- export/import ;
- autosauvegarde ;
- reprise.

Chaque mode doit demander une sauvegarde via une API commune au lieu de manipuler les structures persistantes de manière dispersée.

### 10. PWA / cache / service worker
Le service worker ne doit contenir aucune logique de gameplay.
La stratégie de version/cache doit rester explicite et testable.

### 11. Assets
Résolution d’assets centralisée par type :
- héros ;
- créatures ;
- objets ;
- tuiles / murs / portes ;
- sons.

Les modules ne doivent pas disperser leurs propres chemins de fichiers si un resolver commun existe.

## Risques déjà confirmés ou fortement probables

1. Empilement de couches versionnées successives dans `assets/gensrpg/`.
2. Wrappers successifs de fonctions globales avec références `__original`.
3. `MutationObserver` ou listeners en capture au niveau document/body.
4. timers / retries / heartbeats qui continuent après changement de vue.
5. plusieurs modules pouvant considérer qu’ils sont « autorité » sur une même UI.
6. logique de détection / combat répartie sur plusieurs versions au lieu d’un propriétaire unique.
7. compatibilités historiques qui restent chargées en production alors qu’elles ne sont plus nécessaires.

## Stratégie de nettoyage

### Phase A — cartographie seulement
- inventorier les fichiers runtime réellement chargés ;
- lister tous les `MutationObserver` ;
- lister tous les `addEventListener(..., true)` globaux ;
- lister `setInterval`, heartbeats et retries longs ;
- lister les wrappers de fonctions globales ;
- identifier l’autorité réelle de chaque fonction critique.

Aucun comportement de production ne doit être changé pendant cette phase.

### Phase B — tests de frontières
Avant tout nettoyage, ajouter des tests qui garantissent :
- Tactical ne touche pas l’UI Dungeon hors combat ;
- Dungeon ne modifie pas Capture ;
- Capture ne modifie pas Survie ;
- World Builder ne prend pas l’autorité runtime ;
- changement de vue coupe les timers/listeners temporaires ;
- une seule autorité existe pour navigation, sauvegarde, combat et stats.

### Phase C — consolidation progressive
Traiter un domaine à la fois.
Pour chaque consolidation :
1. sauvegarde ;
2. branche dédiée ;
3. tests du module ;
4. tests croisés ;
5. comparaison fonctionnelle ;
6. publication seulement si tout est vert.

## Règle de conservation

Pendant l’audit et la consolidation :
- ne supprimer aucune feature visible sans décision explicite ;
- ne remplacer aucun asset validé sans demande ;
- ne changer aucune règle gameplay validée juste pour « simplifier le code » ;
- conserver les anciennes couches en historique Git même lorsqu’elles sortent du runtime.

## Premier constat de structure

Le dossier `assets/gensrpg/` contient déjà de nombreuses couches versionnées distinctes pour art héros, UI Dungeon, stats, performance mobile, multiplayer et surtout la chaîne Combat tactique. Cette structure explique pourquoi des correctifs tardifs peuvent hériter d’effets de bord d’anciens modules encore auto-installés.

La priorité de l’audit est donc de distinguer :
- fichiers historiques conservés ;
- fichiers réellement chargés en production ;
- fichiers qui doivent devenir des modules propriétaires ;
- fichiers qui ne devraient plus s’auto-installer.

## État actuel

Audit initialisé. Aucune refonte n’est publiée sur `main` depuis cette branche.
