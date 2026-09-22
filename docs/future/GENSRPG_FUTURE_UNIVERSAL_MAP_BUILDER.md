# GenSrpG — Futur chantier : Builder universel de cartes / lieux

> **STATUT : FUTUR / NON ACTIF**
>
> Ce document enregistre une orientation produit et architecture validée le 2026-09-22.
> Il ne déclenche aucun développement pendant la restructuration actuelle.
> Aucun runtime, `index.html`, stockage, service Core, module de jeu ou production `main` ne doit être modifié au titre de ce document avant ouverture explicite du chantier après la restructuration.

## 1. Intention

Faire évoluer le Builder Dungeon actuel, aujourd'hui centré sur des salles relativement simples, vers un **Builder universel de cartes et de lieux** capable de produire les environnements souhaités par l'utilisateur :

- donjon ;
- maison ;
- village ;
- ville ;
- route ;
- forêt ;
- grotte ;
- tour ;
- bâtiment à plusieurs étages ;
- sous-sol ;
- vaisseau ;
- environnement moderne ;
- environnement SF ;
- monde Capture ;
- autres univers futurs GenSrpG.

L'objectif n'est pas de créer un Builder différent par mode, mais un **système de données de carte commun et neutre**, utilisable ensuite par les modules autorisés.

Le Builder reste un éditeur : il produit des données validées. Le runtime actif des modules reste seul propriétaire de l'exécution gameplay.

## 2. Principe architectural validé

Architecture conceptuelle cible :

```
Map
  -> Places / Rooms
       -> Floors / physical levels
       -> Visual Layers
       -> Zones
       -> Entities / Interactions
       -> Connections
  -> Asset Pack references
```

La distinction importante est :

- **un lieu / une salle** est une unité logique et jouable ;
- **une couche visuelle** décrit l'affichage ;
- **un étage / niveau physique** décrit la hauteur ou le niveau logique ;
- **une zone** permet d'appliquer un comportement local ;
- **une entité / interaction** porte une fonction gameplay ;
- **une connexion** relie deux lieux ou deux points de transition.

Cette séparation évite qu'une simple texture devienne une règle de gameplay.

## 3. Conservation du principe actuel de raccordement des salles

Le système existant de raccord entre salles doit servir de base conceptuelle.

Exemple :

```
Lieu 1 : Rue extérieure
  -> Porte Maison A
       -> Lieu 2 : Maison A - RDC

Lieu 2 : Maison A - RDC
  -> Escalier montant
       -> Lieu 3 : Maison A - Étage

Lieu 3 : Maison A - Étage
  -> Escalier descendant
       -> Lieu 2 : Maison A - RDC
```

Le moteur n'a pas besoin de supposer que le lieu supérieur est géométriquement exactement au-dessus.

Il doit seulement connaître une connexion explicite :

```
connection A -> connection B
```

Ce modèle doit permettre :

- porte ;
- passage ;
- escalier ;
- échelle ;
- trappe ;
- ascenseur ;
- portail ;
- téléporteur ;
- sortie de zone ;
- transition vers sous-sol ;
- transition vers étage supérieur.

Cette approche permet une grande liberté de conception sans imposer une géométrie 3D stricte.

## 4. Notion de carte

Une carte contient :

- un identifiant stable ;
- un nom ;
- des dimensions ;
- une grille ou échelle configurable ;
- un ou plusieurs lieux ;
- des références d'assets ;
- des connexions ;
- des métadonnées ;
- éventuellement des paramètres propres au module consommateur.

Exemple conceptuel :

```json
{
  "id": "village_01",
  "name": "Village",
  "width": 60,
  "height": 40,
  "grid": {
    "enabled": true,
    "cellSize": 1
  },
  "places": ["street_a", "house_a_ground", "house_a_floor_1"]
}
```

Ce modèle est indicatif. Le schéma réel devra être conçu après audit du stockage et des données existantes.

## 5. Notion de lieu / salle

Le terme actuel de salle doit évoluer vers une notion plus générale de **Lieu**.

Un lieu peut représenter :

- une pièce ;
- une maison entière ;
- un étage ;
- une rue ;
- une portion de forêt ;
- une grotte ;
- un sous-sol ;
- un pont de vaisseau ;
- une grande zone extérieure.

Un lieu doit pouvoir contenir :

- sol ;
- murs ;
- toits ;
- décorations ;
- obstacles ;
- objets ;
- créatures ;
- PNJ ;
- points d'interaction ;
- zones ;
- connexions.

Exemple :

```json
{
  "id": "house_a_ground",
  "name": "Maison A - RDC",
  "floor": 0,
  "layers": [],
  "zones": [],
  "entities": [],
  "connections": []
}
```

## 6. Floors / niveaux physiques

Les niveaux physiques restent séparés des couches visuelles.

Exemples :

- sous-sol : `-1` ;
- rez-de-chaussée : `0` ;
- étage 1 : `1` ;
- étage 2 : `2`.

Le changement de niveau se fait par connexion explicite.

Le système doit permettre qu'un étage soit un **autre lieu raccordé**, plutôt qu'un calque géométrique obligatoire posé au-dessus du premier.

Exemple :

```
Maison RDC -> escalier A
escalier A -> Maison Étage / escalier B
```

C'est la solution privilégiée.

## 7. Couches visuelles

Les couches ne doivent pas être des numéros anonymes du type "layer 1 / layer 2 / layer 3".

Elles doivent avoir une responsabilité explicite.

Catégories initiales envisagées :

1. Terrain
2. Sol
3. Décoration basse
4. Murs / structures
5. Obstacles
6. Objets
7. Entités visuelles
8. Toit / couverture / occlusion
9. Effets
10. Marqueurs d'édition non visibles en jeu

L'ordre de rendu exact sera défini lors du chantier.

Exemple :

```json
{
  "type": "roof",
  "asset": "roof_tile_red_01",
  "zOrder": 80
}
```

## 8. Toits et système d'occlusion

Le toit doit être une **couche de couverture / occlusion**, et non un étage gameplay.

Principe :

- depuis l'extérieur : toit visible ;
- lorsque les conditions de révélation du lieu sont remplies : le toit du lieu concerné devient transparent ou invisible ;
- seul le toit du lieu / de la zone concernée doit réagir ;
- aucun toit global de la carte ne doit disparaître à cause de l'ouverture d'une porte ailleurs.

### Comportements prévus

Le Builder pourra à terme proposer :

- invisible ;
- transparent ;
- éventuellement découpe locale autour du héros dans une version ultérieure.

Première version recommandée :

- **invisible pour le lieu** ;
- **transparent pour le lieu**.

### Déclencheurs possibles

Le créateur pourra choisir la règle :

- porte ouverte ;
- héros entré dans le lieu ;
- héros présent dans la zone intérieure ;
- visibilité / découverte, si cette notion devient utile plus tard.

Valeur par défaut recommandée :

**révéler lorsque le héros entre réellement dans le lieu / la zone intérieure**.

Cela évite qu'ouvrir une porte depuis l'extérieur découvre immédiatement tout l'intérieur.

## 9. Zones locales

Les zones sont un élément important du futur système.

Une zone appartient à un lieu et décrit une surface locale avec un rôle précis.

Exemples :

- intérieur Maison A ;
- toit Maison A ;
- salle du boss ;
- boutique ;
- zone secrète ;
- forêt dense ;
- zone de piège ;
- zone de spawn ;
- zone de révélation.

Exemple conceptuel :

```json
{
  "id": "house_a_interior",
  "placeId": "house_a_ground",
  "kind": "interior",
  "roofGroup": "house_a_roof"
}
```

Le système de toit peut alors fonctionner par groupe :

```
aucun héros dans house_a_interior
  -> house_a_roof visible

héros dans house_a_interior
  -> house_a_roof transparent ou invisible
```

Cela évite de gérer chaque tuile de toit séparément.

## 10. Portes comme vraies entités interactives

Une porte ne doit pas être uniquement une texture intégrée dans un mur.

Elle doit devenir une entité avec état.

Exemple conceptuel :

```json
{
  "type": "door",
  "state": "closed",
  "locked": true,
  "keyId": "cellar_key",
  "blocksMovement": true,
  "blocksVision": true,
  "connectionId": "house_a_front_door"
}
```

États possibles :

- closed ;
- open ;
- locked ;
- broken ;
- éventuellement hidden / secret.

Les visuels pourront être associés à l'état :

- `door_closed` ;
- `door_open` ;
- `door_broken`.

Le runtime du module reste responsable des règles réelles d'ouverture, clé, test, destruction, vision et mouvement.

## 11. Escaliers et transitions

Un escalier est une entité de connexion.

Exemple :

```json
{
  "type": "stairs",
  "direction": "up",
  "connectionId": "house_a_stairs_up"
}
```

La connexion décrit la destination :

```json
{
  "id": "house_a_stairs_up",
  "from": {
    "placeId": "house_a_ground",
    "anchorId": "stairs_ground"
  },
  "to": {
    "placeId": "house_a_floor_1",
    "anchorId": "stairs_floor_1"
  }
}
```

Le même contrat pourra servir aux échelles, trappes, ascenseurs et portails.

## 12. Classement propre des assets dès le départ

Le futur Builder ne doit pas devenir une bibliothèque plate de PNG.

Chaque asset importé ou natif doit être catalogué.

Catégories initiales :

- Terrain
- Sol
- Mur
- Toit / couverture
- Porte / passage
- Escalier / transition
- Décoration
- Obstacle
- Objet interactif
- Créature
- PNJ
- Effet
- Marqueur gameplay

Sous-catégories possibles :

- route droite ;
- route angle ;
- route T ;
- route croisement ;
- mur intérieur ;
- mur extérieur ;
- toit tuile ;
- toit chaume ;
- eau ;
- lave ;
- rocher ;
- arbre ;
- meuble ;
- etc.

Conformément à la charte, les chemins devront passer par le **resolver central d'assets** et respecter le futur rangement physique des assets.

## 13. Import de textures / packs personnalisés

Objectif validé : permettre à terme aux utilisateurs d'importer leurs propres textures et packs de construction.

Exemple de pack :

```
Pack : Village médiéval

Terrain
- grass_01
- dirt_01

Road
- road_straight
- road_corner
- road_t
- road_cross

Walls
- stone_wall
- wood_wall

Roofs
- roof_thatch
- roof_tile

Props
- barrel
- well
- tree
```

Lors de l'import, l'utilisateur doit pouvoir indiquer :

- catégorie ;
- sous-catégorie ;
- dimensions ;
- ancrage ;
- rotation autorisée ;
- éventuelle collision par défaut ;
- tags ;
- variante visuelle ;
- comportement spécial uniquement si ce comportement correspond à un type de données reconnu.

Important : un PNG importé ne doit jamais embarquer lui-même du runtime arbitraire.

## 14. Palette / pinceaux du Builder

Organisation UX envisagée :

### Terrain
- herbe ;
- terre ;
- route ;
- pierre ;
- eau ;
- lave ;
- neige ;
- etc.

### Structures
- murs ;
- cloisons ;
- barrières ;
- fenêtres ;
- falaises.

### Couverture
- toits ;
- plafonds ;
- canopées ;
- couvertures de grotte.

### Décors
- tables ;
- lits ;
- tonneaux ;
- statues ;
- arbres ;
- rochers.

### Interactions
- portes ;
- coffres ;
- pièges ;
- leviers ;
- escaliers ;
- échelles ;
- sorties ;
- portails.

### Gameplay
- spawn héros ;
- spawn ennemis ;
- PNJ ;
- marchands ;
- objectifs ;
- boss ;
- zones d'événements.

Le Builder filtre sa bibliothèque en fonction de l'outil sélectionné.

## 15. Exemple de panneau "Lieu"

Interface conceptuelle :

```
Nom : Maison du marchand

Type :
[ Intérieur ]

Niveau :
[ 0 ]

Couches :
[x] Sol
[x] Murs
[x] Décors
[x] Objets
[x] Créatures
[x] Toit

Comportement du toit :
[ Masquer lorsque le lieu est occupé ]

Connexions :
- Porte principale -> Rue du village
- Escalier -> Maison du marchand - étage
- Trappe -> Cave
```

Cette interface doit rester compréhensible par un créateur non développeur.

## 16. Séparation stricte visuel / gameplay

Principe fondamental :

**Une texture dit comment une chose s'affiche.  
Une entité ou une donnée dit ce qu'elle fait.**

Exemples :

- une image de porte n'est pas une porte gameplay ;
- une texture de lave n'inflige pas automatiquement des dégâts ;
- un toit ne change pas d'étage ;
- une image de coffre n'est pas automatiquement un loot ;
- un escalier graphique ne devient transition que s'il possède une connexion.

Cette séparation évite les doubles sources de vérité et facilite les univers personnalisés.

## 17. Compatibilité avec la charte GenSrpG

Ce futur chantier devra appliquer notamment :

### Éditeur -> données -> runtime
Le Builder produit des données persistées et validées.
Il ne modifie pas directement le runtime actif.

### Propriétaire unique
Le Builder possède l'édition.
Le module Dungeon / autre module possède l'exécution gameplay de la carte.

### Core partagé uniquement pour le réellement commun
Le futur format de carte pourra être partagé, mais aucune règle spécifique Dungeon ne doit contaminer Survie, Capture ou PvP.

### Assets
Tous les assets passent par le resolver central et par une classification claire.

### Stockage
Aucune nouvelle persistance parallèle.
Le futur format devra utiliser le propriétaire Storage défini après restructuration.

### Aucun big-bang
La migration se fera progressivement depuis les Builders actuels.

## 18. Réutilisation souhaitée des systèmes existants

Lors de l'ouverture réelle du chantier, un pré-audit devra déterminer ce qui peut être réutilisé parmi :

- graphe actuel de salles ;
- raccords entre salles ;
- Room Creator ;
- World Builder ;
- Zone Graphs ;
- stockage authored ;
- Asset Resolver ;
- Core Storage ;
- événements de déplacement ;
- portes / coffres / pièges existants.

Aucun de ces systèmes ne doit être dupliqué simplement parce que le nouveau Builder est plus ambitieux.

## 19. Migration depuis le Builder actuel

Objectif : évolution progressive, pas remplacement brutal.

Ordre envisagé :

1. caractériser le format actuel des salles ;
2. définir un contrat `Map / Place / Connection` sans modifier le runtime ;
3. adapter une salle actuelle vers un `Place` ;
4. conserver les anciens mondes lisibles ;
5. ajouter les couches visuelles structurées ;
6. ajouter les zones ;
7. ajouter les toits / occlusion ;
8. généraliser portes et transitions ;
9. ajouter les étages raccordés ;
10. ajouter l'import d'assets ;
11. migrer progressivement le World Builder ;
12. seulement après validation, retirer les anciennes autorités devenues inutiles.

## 20. Futur découpage de chantier recommandé

### Étape A — Pré-audit
- cartographier Builder actuel ;
- schémas de données ;
- stockage ;
- raccords ;
- propriétaires ;
- dépendances runtime ;
- tests existants.

Aucun runtime modifié.

### Étape B — Contrat de données universel
Créer les contrats purs :

- Map ;
- Place ;
- VisualLayer ;
- Zone ;
- Entity ;
- Connection ;
- AssetReference.

Tests unitaires uniquement.

### Étape C — Adaptateur du Builder actuel
Lire une salle existante et la projeter dans le nouveau contrat sans changer son comportement.

### Étape D — Couches visuelles structurées
Ajouter le classement sol / mur / toit / décor / etc.

### Étape E — Zones et toit
Implémenter le système local d'occlusion par lieu / zone.

### Étape F — Connexions généralisées
Portes, passages, escaliers, échelles, trappes, portails.

### Étape G — Multi-lieux / étages
Permettre de construire RDC, étage, cave, etc. via lieux raccordés.

### Étape H — Catalogue et packs d'assets
Importer et classer les textures dans un format sûr.

### Étape I — UX Builder
Palette, filtres, sélection, édition des propriétés, visualisation des connexions.

### Étape J — Runtime
Brancher progressivement les modules consommateurs sur les données validées.

### Étape K — Migration / compatibilité
Tester les anciennes cartes et proposer une migration versionnée si nécessaire.

## 21. Tests futurs obligatoires

Avant tout GREEN du futur chantier :

- ancienne salle Dungeon toujours lisible ;
- création d'un lieu simple ;
- sauvegarde / fermeture / réouverture ;
- raccord porte A -> lieu B ;
- raccord escalier RDC -> étage ;
- retour étage -> RDC ;
- toit Maison A indépendant du toit Maison B ;
- entrée Maison A -> seul toit A réagit ;
- sortie Maison A -> comportement configuré respecté ;
- porte fermée bloque mouvement / vision selon contrat ;
- porte ouverte ne modifie pas les autres lieux ;
- pack d'assets importé puis relu ;
- absence de doublon de stockage ;
- absence de chemin asset hors resolver ;
- non-interférence Survie / Capture / PvP ;
- reprise d'une ancienne sauvegarde ;
- tests navigateur mobile.

## 22. Critères de réussite du futur Builder

Le chantier sera considéré comme réussi lorsque :

1. un utilisateur peut créer une carte de taille configurable ;
2. il peut peindre sols, murs, routes et autres couches visuelles ;
3. il peut créer plusieurs lieux ;
4. il peut relier ces lieux par portes, escaliers ou autres connexions ;
5. il peut créer une maison avec toit révélable localement ;
6. il peut créer un étage comme autre lieu raccordé ;
7. il peut importer et classer ses propres textures ;
8. les textures restent séparées des règles gameplay ;
9. les données persistent proprement ;
10. le runtime ne dépend pas du Builder pour fonctionner ;
11. les anciens contenus restent compatibles ou migrables ;
12. aucun autre module n'est contaminé.

## 23. Non-objectifs de la première version

À ne pas chercher à faire immédiatement :

- vraie 3D ;
- empilement physique complexe de meshes ;
- éclairage 3D ;
- pathfinding vertical automatique global ;
- découpe dynamique sophistiquée du toit autour de chaque héros ;
- scripts arbitraires dans les assets utilisateurs ;
- génération procédurale automatique complète ;
- éditeur de règles gameplay universel en même temps que l'éditeur visuel.

La première ambition est un **éditeur 2D/2.5D très flexible, structuré et sûr**.

## 24. Décision enregistrée

Orientation validée :

**Le Builder Dungeon doit à terme évoluer vers un Builder universel GenSrpG fondé sur des cartes, lieux, couches visuelles, zones, entités interactives et connexions explicites.**

Les étages seront privilégiés sous forme de **lieux séparés raccordés par escaliers / transitions**, dans la continuité du système actuel de salles raccordées.

Les toits seront des **couches d'occlusion locales au lieu ou à la zone**, capables de devenir transparentes ou invisibles selon une condition configurée, sans affecter les autres lieux.

Les assets devront être classés proprement dès le départ et l'import de textures / packs personnalisés fait partie de la cible.

## 25. Condition d'ouverture du chantier

**Ne pas démarrer ce chantier pendant la restructuration actuelle.**

Avant ouverture :

1. restructuration suffisamment stabilisée ;
2. propriétaires Core / Storage / Asset Resolver / Builders clairement établis ;
3. lecture de la charte et de la roadmap à jour ;
4. pré-audit spécifique du Builder existant ;
5. branche dédiée ;
6. checkpoint GREEN de départ ;
7. périmètre déclaré ;
8. aucun développement direct sur `main`.

Le présent document sert uniquement de **spécification de futur chantier** et de mémoire de la décision produit.
