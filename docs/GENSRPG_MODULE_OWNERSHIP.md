# GenSrpG — Module ownership matrix

Base auditée : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663`
Branche : `audit/gensrpg-module-architecture-2026-09-15`

## Règle

Chaque responsabilité critique a un seul propriétaire actif. Les autres modules utilisent une API explicite et ne doivent pas modifier directement son DOM, ses variables internes ou ses fonctions globales.

| Responsabilité | Propriétaire cible | Entrées autorisées | Sorties autorisées | Interdictions |
|---|---|---|---|---|
| Navigation globale / accueil / changement de vue | UI shell | intent de navigation | vue active | gameplay qui force une vue, reload, scan global de boutons |
| Fiche héros en exploration | Dungeon exploration | heroId | fiche visible / fermeture | Tactical qui réaffiche Dungeon ou masque la fiche |
| Save & Quit / reprise | Dungeon + Storage | snapshot de session | persisted / home | Tactical qui relance un renderer après quit |
| Stats / effets / équipement | Core stats | héros + définition objets | valeurs dérivées | coefficients cachés ou seconde autorité de calcul |
| Déplacement Dungeon | Dungeon exploration | état carte + héros | nouvelle position | Tactical qui déplace hors combat |
| Déclenchement d'un combat | Dungeon exploration | ennemis détectés + portée + participants | CombatSnapshot | Tactical qui décide quels héros sont entrés dans le donjon |
| Résolution du combat | Tactical Engine | CombatSnapshot | CombatResult | accès arbitraire au shell/navigation |
| UI combat | Tactical Battlefield UI | état local combat | actions utilisateur | observer `document.body` / UI hors overlay |
| Récompenses / retour monde | Bridge Tactical -> Dungeon | CombatResult | XP/loot/ennemis persistés | rendu global non contractuel |
| Capture | Capture runtime | données monde Capture | résultat Capture | dépendance directe Dungeon/Survie |
| Survie | Survival runtime | profil Survie | état Survie | dépendance directe Tactical Dungeon |
| Duel/PvP | PvP runtime | session duel | résultat duel | globals partagés non contractuels |
| World Builder / éditeurs | Editors | données éditables | documents validés | devenir autorité runtime |
| IndexedDB / migrations / import-export | Storage | commandes de persistance | données versionnées | persistance dispersée par mode |
| Cache / PWA | Service Worker | version assets | cache | logique gameplay |

## Constats confirmés dans la production actuelle

### A-001 — `index.html` reste une grosse racine runtime

`index.html` contient encore beaucoup de CSS, HTML et logique inline et charge notamment `assets/dungeon/dungeon-core-316.js`, `assets/dungeon/dungeon-core-317.js` puis `assets/gensrpg/gens-mobile-combat-performance-16781022.js` en fin de document.

Conséquence : l'ordre de chargement est encore une dépendance architecturale forte. Le nettoyage ne doit pas commencer par scinder ce fichier : il faut d'abord documenter les contrats et protéger les frontières avec des tests.

### A-002 — le module performance mobile est aussi un bootstrapper

`gens-mobile-combat-performance-16781022.js` ne fait pas seulement de la performance. Il :
- wrappe plusieurs fonctions globales de stats/sauvegarde ;
- remplace les animations de dés ;
- s'auto-installe puis se réinstalle avec timers ;
- charge dynamiquement le moteur Tactical, adapter, rules, integration, UI, bridge et l'isolation Survie ;
- relance l'installation du bridge avec plusieurs retries.

C'est un mélange de responsabilités. **Priorité haute** : à terme séparer `performance` et `bootstrap/runtime composition`, mais seulement après tests de frontière.

### A-003 — le Bridge Tactical possède actuellement des fonctions globales Dungeon

`gens-rpg-tactical-combat-v2-bridge.js` remplace actuellement :
- `dc200StartCombat` ;
- `openDungeonCombatSetup` ;
- `launchCombat200` ;
- `startCombat`.

Il conserve les anciennes fonctions comme rollback. C'est acceptable comme étape de migration, mais le contrat cible doit devenir :

`Dungeon -> startTacticalCombat(snapshot)`

et non un remplacement permanent de plusieurs fonctions historiques globales.

### A-004 — V111 mélange règles combat, détection et maintenance UI

`gens-rpg-tactical-runtime-fixes-1678111.js` contient dans un même fichier :
- multi-dés et résolution ;
- rebuild des attaques ;
- détection ennemis/héros ;
- wrappers sur mouvement/render Dungeon ;
- peinture de murs ;
- masquage de tabs ;
- dock de boutons ;
- listener click capture ;
- `MutationObserver` body ;
- auto-install avec retries.

Le correctif V114.11 bloque désormais l'observer global en production, mais ce fichier reste un candidat prioritaire de décomposition architecturale.

### A-005 — les auto-installs sont un risque structurel

La chaîne Tactical peut exécuter du code au simple chargement d'un `<script>`. Le correctif publié a dû installer un garde temporaire sur `MutationObserver` pendant le chargement complet V108 -> V114.11 parce qu'un filtre appliqué seulement dans `onload` arrivait trop tard.

C'est la preuve qu'un module complexe doit évoluer vers `install()/dispose()` explicites sans auto-install au chargement.

## Ordre de migration recommandé

1. **Ne rien changer à main pendant l'audit.**
2. Ajouter des tests de frontières génériques : global observers/listeners/timers/wrappers.
3. Créer un `RuntimeBootstrap` propriétaire du chargement des modules ; retirer ce rôle du module performance mobile sans changer l'ordre effectif de chargement.
4. Extraire du V111 la maintenance UI hors combat ; conserver les règles multi-dés dans Tactical.
5. Remplacer progressivement les wrappers `dc200StartCombat/openDungeonCombatSetup/...` par un contrat unique Dungeon -> Tactical.
6. Ajouter `dispose()` aux modules UI/observers/listeners avant de retirer les anciens garde-fous.
7. Auditer ensuite Storage, Capture, Survival, PvP et World Builder avec la même matrice.

## Tests de frontière à créer avant le premier refactor

- aucun module Tactical ne peut observer `body`/`html` ;
- aucun module Tactical ne peut modifier fiche héros ou home hors combat ;
- quitter le Dungeon coupe toute maintenance Tactical ;
- Survie ne reçoit aucune substitution de fonctions Dungeon/Tactical ;
- un seul propriétaire écrit les animations de dés selon le mode ;
- un seul propriétaire du démarrage de combat Dungeon ;
- tout timer/retry créé par un module UI possède une condition d'arrêt ou un `dispose()` ;
- la liste des fonctions globales wrapées est connue et testée.

## Statut

Document d'audit uniquement. Aucun refactor de production n'est appliqué depuis cette branche.
