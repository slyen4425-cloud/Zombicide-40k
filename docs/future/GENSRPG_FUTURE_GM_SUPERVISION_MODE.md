# GenSrpG — Futur chantier : Mode MJ / Supervision de partie

> **STATUT : FUTUR / NON ACTIF**
>
> Ce document enregistre une orientation produit et architecture validée le 2026-09-22.
> Il ne déclenche aucun développement pendant la restructuration actuelle.
> Aucun runtime, stockage, service Core, module de jeu, `index.html` ou production `main` ne doit être modifié au titre de ce document avant ouverture explicite du chantier après stabilisation de la restructuration.

## 1. Intention

Faire évoluer le rôle MJ actuel vers un véritable **mode de supervision de partie**, puissant mais simple à utiliser.

Le MJ doit pouvoir :

- observer l'état réel de la partie ;
- contrôler ou corriger certaines actions ;
- déplacer ou faire agir les entités ;
- arbitrer des jets ;
- révéler ou masquer de l'information ;
- déclencher des événements ;
- communiquer avec les joueurs ;
- intervenir sur les ressources, états et objectifs ;
- piloter une partie multijoueur sans être considéré comme un joueur.

Le mode MJ doit rester **intuitif, contextuel et non rebutant**.

## 2. Principe fondamental : MJ != joueur

Le MJ ne doit plus être modélisé comme un "joueur spécial".

Architecture conceptuelle cible :

```
Session
├── GameMaster
│   ├── permissions
│   ├── supervision state
│   ├── omniscient view
│   └── GM tools
│
└── Players
    ├── Player 1 -> Hero A
    ├── Player 2 -> Hero B
    └── Player 3 -> Hero C
```

Conséquences obligatoires :

- le MJ ne possède pas de héros obligatoire ;
- il n'occupe aucune case ;
- il n'entre pas dans la timeline ;
- il n'est jamais ciblé ;
- il ne reçoit ni XP ni loot ;
- il n'est pas compté dans les conditions de victoire ou défaite ;
- il n'est pas compté dans la taille du groupe ;
- il n'est pas inclus dans les calculs de portée, de présence ou de participants ;
- il peut rejoindre une session sans personnage ;
- son rôle doit être distingué au niveau du modèle de session, pas seulement via un flag sur un joueur.

Le chantier devra migrer proprement depuis le modèle actuel où le MJ reste techniquement un joueur.

## 3. Positionnement architectural

Le mode MJ est une **couche de supervision et de commande**, pas un nouveau moteur de gameplay.

Principe :

```
MJ UI
  -> GM Command
      -> Owner du système concerné
          -> état canonique
              -> événement / synchronisation
                  -> UI joueurs / MJ
```

Exemples :

```
GM_COMMAND: moveEntity
-> Dungeon applique le mouvement

GM_COMMAND: giveItem
-> Core Inventory applique l'ajout

GM_COMMAND: damageEntity
-> propriétaire PV / combat applique la modification

GM_COMMAND: revealZone
-> Dungeon / Map runtime applique la visibilité
```

Interdit :

- modifier directement des données privées d'un autre système ;
- écrire dans l'inventaire depuis l'UI MJ ;
- modifier directement les PV dans le DOM ;
- dupliquer les calculs de stats, dés, combat ou progression ;
- créer un second stockage spécifique MJ.

## 4. Ergonomie — principe général

Le système doit être pensé pour ne pas décourager les MJ.

Trois règles UX :

1. **actions contextuelles avant gros menus** ;
2. **mode simple par défaut** ;
3. **options avancées uniquement à la demande**.

Le MJ ne doit pas avoir devant lui une interface de 40 boutons.

## 5. Deux niveaux d'interface

### Mode simple

Affiche uniquement les fonctions les plus fréquentes.

Exemple de sections principales :

- Carte
- Entités
- Événements
- Joueurs
- Outils MJ

### Mode avancé

Débloque :

- téléportation fine ;
- édition détaillée des états ;
- contrôle de timeline ;
- commandes avancées ;
- visibilité ciblée ;
- événements personnalisés ;
- historique et diagnostics.

Le changement simple/avancé doit être instantané et réversible.

## 6. Actions contextuelles

Le cœur de l'ergonomie doit reposer sur le clic/touch sur l'élément concerné.

### Clic sur un monstre

Panneau court :

- Déplacer
- Attaquer
- Compétence
- Modifier PV
- Ajouter statut
- Téléporter
- Masquer / Révéler
- Supprimer

### Clic sur un héros

- Message privé
- Demander un jet
- Donner objet
- Modifier ressource
- Ajouter / retirer statut
- Téléporter
- Voir fiche

### Clic sur une zone

- Révéler
- Cacher
- Déclencher événement
- Ajouter entité
- Ajouter marqueur

Le système doit éviter les allers-retours entre plusieurs écrans techniques.

## 7. Trois niveaux d'autorité MJ

Le mode MJ doit proposer trois styles de contrôle.

### Automatique

GenSrpG applique normalement les règles.

Le MJ observe et intervient seulement si nécessaire.

### Assisté

Le moteur calcule et propose le résultat.

Exemple :

```
Ork attaque Aldren
Toucher : réussite
Dégâts proposés : 4

[ Valider ] [ Modifier ] [ Annuler ]
```

### Libre

Le MJ peut imposer un résultat ou une action.

Exemples :

- infliger 3 PV ;
- déclarer une réussite ;
- déplacer une créature ;
- déclencher un événement ;
- ignorer un jet.

Le mode libre doit rester explicite et journalisé.

## 8. Contrôle manuel des monstres / PNJ

Le MJ doit pouvoir sélectionner une créature ou un PNJ sur la grille et :

- le déplacer ;
- changer sa cible ;
- déclencher une attaque ;
- utiliser une compétence ;
- modifier ses PV ;
- ajouter / retirer un statut ;
- le téléporter ;
- le cacher ou le révéler ;
- le supprimer.

La logique de déplacement, portée et combat doit toujours être appliquée par les propriétaires existants, sauf si le MJ utilise explicitement une commande de forçage autorisée.

## 9. Jets de dés et arbitrage

Le MJ doit disposer d'un outil de jet générique.

Types de jets :

- jet public ;
- jet MJ ;
- jet joueur secret ;
- jet caché total.

### Jet public

Tout le monde voit le résultat.

### Jet MJ

Seul le MJ voit le résultat.

### Jet joueur secret

Le joueur déclenche le jet, mais seul le MJ reçoit le résultat.

### Jet caché total

Le moteur lance pour le MJ sans révéler qu'un jet a été fait.

Applications :

- perception ;
- détection de piège ;
- mensonge ;
- furtivité ;
- connaissance ;
- comportement PNJ ;
- résolution narrative.

Le MJ peut choisir :

- type de dé ;
- stat utilisée ;
- seuil / difficulté ;
- bonus/malus ;
- visibilité du résultat ;
- validation automatique ou arbitrée.

Tous les calculs doivent passer par le service Dice / Stats canonique.

## 10. Demande de jet à un joueur

Le MJ doit pouvoir sélectionner un joueur et envoyer :

```
Le MJ vous demande un jet d'Intelligence.
Difficulté : 60
```

Le joueur peut :

- lancer virtuellement ;
- éventuellement indiquer un résultat physique si la partie utilise des dés réels.

Le résultat retourne au MJ avec la visibilité configurée.

## 11. Gestion de la grille

Le MJ doit pouvoir :

- activer / désactiver l'affichage tactique si le mode le permet ;
- forcer l'affichage d'une carte précise ;
- déplacer une entité ;
- téléporter une entité ;
- sélectionner plusieurs entités ;
- voir les cases accessibles ;
- voir les zones de portée ;
- ignorer une contrainte uniquement via une commande explicite de forçage.

La grille reste propriétaire du module actif.

## 12. Fog of War / visibilité MJ

Le MJ doit disposer d'une vue omnisciente optionnelle.

Il peut voir :

- toute la carte ;
- zones non découvertes ;
- monstres cachés ;
- pièges ;
- coffres ;
- passages secrets ;
- objectifs cachés ;
- événements préparés ;
- toits / zones d'occlusion ;
- informations privées de scène.

Les joueurs voient uniquement ce que le runtime leur autorise.

Le MJ doit pouvoir :

- révéler une zone ;
- cacher une zone ;
- révéler une entité ;
- masquer une entité ;
- préparer du contenu hors vue.

## 13. Déclenchement manuel des événements

Bibliothèque d'événements :

- embuscade ;
- renfort ;
- piège ;
- coffre ;
- énigme ;
- apparition PNJ ;
- marchand ;
- boss ;
- dialogue ;
- bruit ;
- changement météo ;
- événement personnalisé.

Le MJ doit pouvoir déclencher :

- sur une case ;
- dans une zone ;
- sur un joueur ;
- sur un groupe ;
- globalement.

Les événements doivent rester des données reconnues par le module, pas des scripts arbitraires exécutés depuis l'UI MJ.

## 14. Spawn MJ

Le MJ sélectionne un type d'entité puis une position.

Exemple :

```
Ajouter
-> Créature
-> Squelette
-> toucher une case
```

Types envisagés :

- monstre ;
- PNJ ;
- compagnon ;
- coffre ;
- piège ;
- objet ;
- obstacle ;
- marqueur ;
- événement préparé.

Le spawn doit passer par les propriétaires canoniques de création d'entité.

## 15. Interactions directes avec les joueurs

Le MJ doit pouvoir :

- donner un objet ;
- retirer un objet si autorisé ;
- ajouter de l'or ou une ressource ;
- modifier une ressource ;
- appliquer un buff ;
- appliquer un debuff ;
- ajouter / retirer un statut ;
- attribuer une clé ;
- modifier une progression d'objectif ;
- envoyer une notification ;
- envoyer une consigne de jet.

Les modifications doivent passer par Core Inventory, Stats, Progression, Storage ou le propriétaire concerné.

## 16. Messages privés et informations secrètes

Le MJ doit pouvoir envoyer une information à un seul joueur.

Exemple :

```
À Lyra uniquement :
"Tu remarques une fissure étrange derrière la bibliothèque."
```

Types :

- message privé ;
- indice ;
- révélation secrète ;
- résultat de perception ;
- objectif individuel ;
- information de rôle.

Le joueur concerné reçoit uniquement son contenu.

## 17. Timeline / initiative contrôlable

Le MJ doit pouvoir :

- voir la timeline ;
- ajouter une entité ;
- retirer une entité ;
- changer l'ordre ;
- passer un tour ;
- donner un tour bonus ;
- interrompre ;
- mettre en pause.

Exemple :

```
1. Aldren
2. Ork
3. Lyra
4. Gobelin
5. Brom
```

La modification de l'ordre doit utiliser le propriétaire de l'initiative, pas une liste UI parallèle.

## 18. Pause MJ

Bouton :

```
[ Pause MJ ]
```

Pendant la pause :

- les joueurs peuvent consulter les informations autorisées ;
- mouvements bloqués ;
- attaques bloquées ;
- événements automatiques suspendus ;
- le MJ peut préparer la scène.

Puis :

```
[ Reprendre ]
```

Le comportement exact devra être défini par contrat pour éviter de casser timers, effets ou combats en cours.

## 19. Journal MJ

Créer un historique clair des actions importantes.

Exemple :

```
09:42 Aldren se déplace en B7
09:42 Coffre ouvert
09:43 MJ donne 50 or à Lyra
09:43 MJ déplace Ork en C8
09:44 Brom lance Boule de feu
```

Les actions MJ doivent être identifiées comme telles.

Objectifs :

- comprendre la partie ;
- diagnostiquer une désynchronisation ;
- savoir qui a fait quoi ;
- préparer l'annulation de certaines commandes.

## 20. Annulation des actions MJ

Prévoir un undo ciblé, pas nécessairement un undo universel dès la première version.

Actions candidates :

- déplacement manuel ;
- téléportation ;
- modification PV ;
- ajout / retrait de statut ;
- objet donné ;
- spawn ;
- révélation d'une zone.

Le système doit utiliser les données d'avant/après produites par les propriétaires canoniques.

## 21. Préparation hors vue

Le MJ doit pouvoir créer / préparer des éléments en état caché.

Exemple :

```
Ork Shaman
Visibilité : MJ uniquement

[ Révéler aux joueurs ]
```

Applicable à :

- ennemis ;
- PNJ ;
- pièges ;
- événements ;
- objets ;
- zones ;
- informations.

Très important pour l'intégration future avec le Builder universel.

## 22. Synchronisation multijoueur

Le multijoueur doit éviter de resynchroniser toute la partie à chaque action.

Approche cible :

**petits événements / commandes synchronisés**.

Exemples :

```
MOVE_ENTITY
DAMAGE_ENTITY
ADD_ITEM
REMOVE_ITEM
SET_STATUS
REMOVE_STATUS
REVEAL_ZONE
HIDE_ZONE
OPEN_DOOR
SPAWN_ENTITY
REMOVE_ENTITY
GM_MESSAGE
REQUEST_ROLL
ROLL_RESULT
CHANGE_INITIATIVE
PAUSE_SESSION
RESUME_SESSION
```

Chaque événement doit :

- avoir un identifiant ;
- être ordonné ;
- être idempotent si nécessaire ;
- être validé côté propriétaire ;
- produire un état canonique ;
- être persisté si l'action modifie durablement la partie.

Supabase peut transporter ces micro-événements en temps réel si cette architecture est confirmée lors du chantier réseau.

## 23. Permissions

Le rôle MJ doit posséder des permissions explicites.

Exemples :

- voir toute la carte ;
- contrôler les monstres ;
- modifier les PV ;
- modifier l'inventaire ;
- révéler les zones ;
- déclencher les événements ;
- demander des jets ;
- gérer l'initiative ;
- mettre en pause ;
- envoyer des messages privés.

Le modèle doit permettre plus tard :

- MJ principal ;
- assistant MJ ;
- spectateur ;
- modérateur.

Ces rôles supplémentaires ne font pas partie de la première version obligatoire.

## 24. Sécurité / cohérence de session

Le runtime doit vérifier qu'une commande MJ :

- provient bien d'un rôle autorisé ;
- cible une session valide ;
- cible une entité existante ;
- respecte les contraintes du propriétaire ;
- produit un événement traçable.

Le client ne doit pas pouvoir obtenir les permissions MJ uniquement en changeant une valeur locale d'interface.

## 25. Intégration future avec le Builder universel

Le futur Builder prépare le monde.

Le mode MJ contrôle ce monde pendant la partie.

Répartition :

```
Builder
-> crée lieux, zones, connexions, événements, entités préparées

Runtime
-> exécute les règles

MJ
-> supervise, révèle, déclenche, arbitre
```

Exemples d'intégration :

- révéler le toit d'une maison ;
- ouvrir une porte préparée ;
- déclencher une embuscade liée à une zone ;
- révéler un passage secret ;
- faire apparaître une créature préparée ;
- déplacer un PNJ ;
- changer l'état d'une zone.

Le mode MJ ne doit pas modifier la structure de la carte en plein runtime comme un éditeur complet, sauf futur besoin explicitement séparé.

## 26. Compatibilité avec la charte GenSrpG

Ce futur chantier devra respecter :

### Propriétaire unique
Le mode MJ envoie des intentions, il ne remplace pas le propriétaire métier.

### Données canoniques
Pas d'état parallèle "MJ" pour PV, inventaire, stats, initiative ou position.

### Core
Utiliser les services Core extraits après restructuration.

### Storage
Toutes les modifications persistantes passent par le stockage canonique.

### Dice
Les jets utilisent Core Dice.

### Stats
Les calculs utilisent Core Stats.

### Inventory
Les objets passent par Core Inventory / Equipment.

### Modules
Dungeon, Survie, Capture et PvP restent propriétaires de leur runtime.

### Pas de pollution globale
Pas de wrapper permanent, observer global, heartbeat ou retry pour reprendre l'autorité.

## 27. Migration depuis le système MJ actuel

Un pré-audit obligatoire devra identifier :

- comment le MJ est actuellement représenté ;
- où il est encore compté comme joueur ;
- toutes les fonctions qui parcourent la liste des joueurs ;
- les effets sur taille de groupe ;
- initiative ;
- récompenses ;
- conditions de victoire / défaite ;
- spawn ;
- synchronisation réseau ;
- UI ;
- stockage de session.

Migration cible :

```
ancien :
player { role: "gm" }

vers :
session.gameMaster
session.players[]
```

Cette migration devra préserver les anciennes sauvegardes / sessions si elles sont persistées.

## 28. Futur découpage de chantier recommandé

### Étape A — Pré-audit
- modèle actuel MJ ;
- modèle Player ;
- stockage de session ;
- réseau ;
- timeline ;
- conditions de groupe ;
- permissions.

Aucun runtime modifié.

### Étape B — Contrat de rôle
Créer les contrats purs :

- SessionRole ;
- GameMaster ;
- Player ;
- PermissionSet ;
- GMCommand ;
- GMEvent.

### Étape C — Séparation MJ / Player
Retirer le MJ des collections et calculs de joueurs.

### Étape D — Command Bus MJ
Créer une voie de commande vers les propriétaires canoniques.

### Étape E — UI simple
Carte / Entités / Événements / Joueurs / Outils MJ.

### Étape F — Actions contextuelles
Monstre / héros / zone.

### Étape G — Jets et messages
Jets publics / secrets, demandes de jets, messages privés.

### Étape H — Contrôle du monde
Spawn, visibilité, événements, pause.

### Étape I — Timeline
Contrôle de l'ordre et des tours.

### Étape J — Journal / undo
Traçabilité et annulation ciblée.

### Étape K — Multijoueur temps réel
Micro-événements réseau.

### Étape L — Intégration Builder
Zones, événements préparés, entités cachées, toits et connexions.

## 29. Tests futurs obligatoires

Avant GREEN :

- un MJ rejoint sans héros ;
- un MJ n'est pas compté comme joueur ;
- un MJ n'apparaît pas dans la timeline ;
- un MJ ne reçoit pas XP / loot ;
- un MJ ne compte pas pour victoire / défaite ;
- un joueur ne peut pas obtenir les permissions MJ localement ;
- déplacement manuel d'un monstre via commande ;
- attaque déclenchée via le propriétaire combat ;
- modification PV via le propriétaire canonique ;
- objet donné via Inventory ;
- message privé reçu uniquement par le bon joueur ;
- jet secret visible uniquement selon la règle ;
- zone révélée seulement aux clients autorisés ;
- spawn d'entité ;
- pause / reprise ;
- journal créé ;
- undo ciblé ;
- déconnexion / reconnexion MJ ;
- reconnexion joueur ;
- non-interférence Survie / Dungeon / Capture / PvP ;
- mobile / tactile ;
- latence réseau raisonnable ;
- persistance / reprise de session.

## 30. Critères de réussite

Le futur mode MJ sera considéré comme réussi lorsque :

1. le MJ est un rôle distinct des joueurs ;
2. il peut rejoindre sans héros ;
3. son interface reste simple par défaut ;
4. il peut agir directement sur la carte via actions contextuelles ;
5. les règles automatiques restent disponibles ;
6. il peut arbitrer sans casser l'état canonique ;
7. les informations secrètes sont correctement ciblées ;
8. les commandes sont synchronisées en temps réel ;
9. les actions importantes sont journalisées ;
10. aucun service métier n'est dupliqué dans l'UI MJ ;
11. les quatre modules restent isolés ;
12. l'expérience reste utilisable sur smartphone.

## 31. Non-objectifs de la première version

À ne pas faire immédiatement :

- éditeur complet de carte pendant une session ;
- scripting arbitraire ;
- langage de macros complexe ;
- multi-MJ avancé complet ;
- automatisation IA du MJ ;
- undo universel de toute la partie ;
- réécriture simultanée du réseau, Builder et gameplay.

La priorité est : **simple, fiable, contextuel, puissant lorsque nécessaire**.

## 32. Décision enregistrée

Orientation validée :

**Le MJ devient un rôle de session distinct, non joueur, disposant d'outils de supervision contextuels et de commandes explicites vers les propriétaires canoniques du jeu.**

Principes retenus :

- MJ != joueur ;
- interface simple par défaut ;
- mode avancé optionnel ;
- actions contextuelles ;
- automatique / assisté / libre ;
- jets secrets et arbitrage ;
- contrôle monstres / PNJ ;
- visibilité / fog of war ;
- événements et spawn ;
- interactions directes avec joueurs ;
- messages privés ;
- timeline ;
- pause ;
- journal ;
- undo ciblé ;
- synchronisation par micro-événements ;
- intégration future avec le Builder universel.

## 33. Condition d'ouverture du chantier

**Ne pas démarrer ce chantier pendant la restructuration actuelle.**

Avant ouverture :

1. restructuration suffisamment stabilisée ;
2. propriétaires Core / Storage / Dice / Stats / Inventory / Session clairement établis ;
3. lecture de la charte et roadmap à jour ;
4. pré-audit spécifique du MJ actuel ;
5. branche dédiée ;
6. checkpoint GREEN de départ ;
7. périmètre déclaré ;
8. tests de non-interférence ;
9. aucun développement direct sur `main`.

Le présent document sert uniquement de **spécification de futur chantier** et de mémoire de la décision produit.
