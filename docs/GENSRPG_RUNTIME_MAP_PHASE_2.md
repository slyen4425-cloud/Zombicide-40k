# GenSrpG — Cartographie réelle du runtime — Phase 2

Date : 2026-09-15  
Branche de travail : `work/gensrpg-restructure-phase-1`

Ce document applique la Phase 2 de `GENSRPG_RESTRUCTURATION_ROADMAP.md`. Il décrit les fichiers réellement actifs et leurs effets avant toute extraction supplémentaire. Le but est de connaître les propriétaires actuels, les doublons d'autorité et les dépendances à retirer progressivement. Aucun déplacement de gameplay n'est réalisé par cette cartographie.

## 1. Graphe de chargement réellement observé

```text
index.html
├─ assets/dungeon/dungeon-core-317.js
└─ assets/gensrpg/gens-mobile-combat-performance-16781022.js
   ├─ gens-rpg-tactical-combat-v2.js
   ├─ gens-rpg-tactical-combat-v2-adapter.js
   ├─ gens-rpg-tactical-combat-v2-rules.js
   ├─ gens-rpg-tactical-combat-v2-integration.js
   │  └─ chaîne dynamique active :
   │     ├─ gens-rpg-tactical-combat-v2-polish-1678108.js
   │     ├─ gens-rpg-tactical-combat-v2-polish-1678109.js
   │     ├─ core/rpg-rules.js
   │     ├─ gens-rpg-tactical-combat-v2-stats-1678110.js
   │     ├─ gens-rpg-tactical-runtime-fixes-1678111.js
   │     ├─ gens-rpg-tactical-combat-coherence-1678112.js
   │     ├─ gens-rpg-tactical-runtime-authority-1678113.js
   │     └─ gens-rpg-tactical-visual-dice-16781142.js
   ├─ gens-rpg-tactical-combat-v2-ui.js
   ├─ gens-rpg-tactical-combat-v2-bridge.js
   │  └─ gens-rpg-runtime-repair-1678106.js
   └─ gens-survival-mode-isolation-1678104.js
```

Le Core RPG est désormais chargé explicitement entre V109 et V110. Le test `gens_core_rpg_runtime_load_order_contract.test.cjs` vérifie l'ordre réel d'exécution, et `gens_core_rpg_browser_wiring_contract.test.cjs` vérifie le chemin complet `index -> bootstrap -> integration -> Core -> V110`.

## 2. Classement et effets observés

| Fichier | Propriétaire actuel / cible | Auto-install / effets globaux | Accès stockage | État Phase 2 |
|---|---|---|---|---|
| `index.html` | Legacy mixte / futur Shell | Monolithe inline + bootstrap final | Oui, nombreux accès historiques inline | À inventorier par domaines pendant Phase 4/5 |
| `dungeon-core-317.js` | Dungeon legacy | Fournit encore des règles/fallbacks Dungeon dont armure | À confirmer au détail | Actif, ne pas déplacer maintenant |
| `gens-mobile-combat-performance-16781022.js` | Bootstrap/performance temporaire | Auto-install ; wraps équipement/stats/cache/invalidation ; réinstallations différées ; charge la pile V2 | Lit le contexte de session | À découpler du futur bootstrap Shell |
| `gens-rpg-tactical-combat-v2.js` | **Tactical engine cible** | Aucun DOM, aucun timer, aucun storage ; API pure | Non | Bon propriétaire cible à conserver |
| `gens-rpg-tactical-combat-v2-adapter.js` | Tactical adapter | Traduit les états/armes/ennemis legacy vers Tactical | Lit notamment runtime Dungeon | Actif ; dépend encore de nombreux globals Dungeon |
| `gens-rpg-tactical-combat-v2-rules.js` | Tactical rules legacy-extension | Remplace `createBattle`, `attackPreview`, `resolveAttack`, `aiStep` | Non observé | Autorité intermédiaire à absorber plus tard dans engine/rules propres |
| `gens-rpg-tactical-combat-v2-integration.js` | Loader/bridge temporaire | Remplace `commitBattle`, charge V108→V114.11, garde les observers globaux pendant la chaîne | Indirect | À remplacer plus tard par points d'entrée explicites |
| `gens-rpg-tactical-combat-v2-ui.js` | **Tactical UI cible** | UI bataille ; paramètres de règle ; aucun body observer annoncé | Oui : règle D100 + profils | Conserver l'UI, extraire stockage/assets/règles |
| `gens-rpg-tactical-combat-v2-bridge.js` | Dungeon -> Tactical bridge | Remplace `dc200StartCombat`, `openDungeonCombatSetup`, `launchCombat200`, `startCombat`; charge V106 ; retries | Lit garde de famille | Propriétaire de transition à réduire au contrat `startTacticalCombat` |
| `gens-rpg-runtime-repair-1678106.js` | Legacy repair | Wrap `saveGameProfiles` + plusieurs renderers Dungeon | **Direct localStorage** profils/session | Dette legacy explicite ; à retirer lorsque Shell/storage possèdent ces responsabilités |
| `gens-survival-mode-isolation-1678104.js` | Survival/Shell guard temporaire | Wrap navigation, profil, `isDungeonMode`, reprise et `DungeonCore01.show`; réinstalle 0/300/1300 ms | **Direct localStorage** | Nécessaire aujourd'hui, mais incompatible avec la cible sans wrappers globaux |
| `gens-rpg-tactical-combat-v2-polish-1678108.js` | Legacy Tactical/Dungeon mixte | Wrap mouvement Dungeon, map, render Dungeon, UI ; body observer demandé | **Direct localStorage runtime** | Autorité dupliquée ; future suppression après reprise des fonctions utiles |
| `gens-rpg-tactical-combat-v2-polish-1678109.js` | Legacy Tactical polish | Wrap adapter/UI/Dungeon render ; body observer ; listener capture ; `stopImmediatePropagation`; retries | **Direct localStorage runtime** | Dette prioritaire Phase 8 |
| `core/rpg-rules.js` | **Core RPG rules cible** | Pur, sans auto-install gameplay ; API calculatoire | Non | Bon propriétaire cible ; déjà raccordé à V110/V114.11 |
| `gens-rpg-tactical-combat-v2-stats-1678110.js` | Transition Core stats -> Tactical snapshot | Wrap `saveState`, adapter, engine rules, UI ; listener document ; retries | Via legacy APIs | À réduire au seul snapshot/adapter de contrat après extraction Core stats |
| `gens-rpg-tactical-runtime-fixes-1678111.js` | Legacy Tactical fixes | Wrap adapter, `resolveAttack`, détection Dungeon/render ; body observer ; listener capture ; retries jusqu'à 5 s | Via runtime | Autorité dupliquée dégâts/détection/UI |
| `gens-rpg-tactical-combat-coherence-1678112.js` | Legacy Tactical coherence | Wrap adapter/start/résultat/détection ; body observer ; listener capture | **Direct localStorage runtime** | Autorité dupliquée scope/détection/UI |
| `gens-rpg-tactical-runtime-authority-1678113.js` | Autorité spatiale Tactical actuelle | Wrap adapter/start/mouvement/événements ; body observer demandé ; retries jusqu'à 10 s | **Direct localStorage runtime** | Fonctionnellement important, mais doit devenir un propriétaire explicite sans retries/observer |
| `gens-rpg-tactical-visual-dice-16781142.js` | Autorité résolution/D100 actuelle | Remplace le resolver d'attaque, raccord dégâts Core, UI/menu ; retries courts 80/220/600 ms ; **pas de body observer** | Direct runtime/session pour certains états | Transition vers engine/résolution unique |

## 3. Autorités actuellement dupliquées

### Détection / engagement Dungeon -> Tactical

Au moins quatre couches actives possèdent encore une logique de détection ou des hooks de mouvement/événement :

- V108 ;
- V111 ;
- V112 ;
- V113.

V113 est aujourd'hui la couche la plus récente pour scope salle/sous-salle et héros réellement entrés. Les couches précédentes doivent être considérées comme legacy tant que leurs fonctions utiles n'ont pas été comparées puis absorbées.

### Résolution d'attaque / dégâts

La fonction de résolution traverse plusieurs propriétaires successifs :

1. engine V2 de base ;
2. `rules.js` ;
3. V110 ;
4. V111 pour multi-dés ;
5. V114.11 pour D100 + dégâts physiques/armure Core.

Le propriétaire final observé aujourd'hui est V114.11. Le Core `rpg-rules.js` possède désormais les calculs RPG purs configurables, mais l'orchestration de l'attaque reste à consolider en Phase 8.

### UI / rendu / murs

V108, V109, V110, V111, V112 et V113 ont tous ajouté des couches de rendu ou maintenance UI. V114.11 a déjà supprimé son propre body observer et délègue désormais les murs à l'UI de base, ce qui est la direction cible.

### Stockage

Le stockage est encore lu/écrit directement par plusieurs modules :

- bootstrap/performance pour certains gardes ;
- UI Tactical pour la règle D100 et les profils ;
- bridge/repair pour famille/profils ;
- Survival isolation ;
- V108/V109/V112/V113 pour runtime Dungeon.

Cela confirme que **Core storage/migrations** doit être l'une des premières extractions de Phase 4.

## 4. Risques architecturaux confirmés

1. **Réinstallations différées** : plusieurs modules utilisent des séries de `setTimeout(install, ...)` pour reprendre une fonction écrasée plus tard.
2. **Observers globaux historiques** : V108/V109/V111/V112/V113 demandent un `MutationObserver` sur `body`. L'intégration actuelle intercepte ces observations globales pendant le chargement, mais la dette existe toujours dans les fichiers.
3. **Listeners capture** : certaines couches Tactical utilisent des listeners document en capture ; V109 contient aussi `stopImmediatePropagation`.
4. **Monkey-patches en chaîne** : adapter, engine, UI, Dungeon renderers et fonctions de navigation/combat peuvent être enveloppés plusieurs fois.
5. **Stockage direct dispersé** : localStorage sert encore de contrat implicite entre Shell, Dungeon, Survival et Tactical.
6. **Valeurs/règles encore locales** : quelques defaults Tactical/adapter/UI existent encore localement. Ils devront être reliés aux données configurables conformément à la règle 24 de la charte.
7. **Chargement dépendant de l'ordre** : le bootstrap charge `integration.js` avant `ui.js` et `bridge.js`; les couches historiques compensent en partie cette disponibilité tardive avec retries. La cible devra charger des dépendances explicites plutôt que compter sur une réinstallation.

## 5. Propriétaires cibles déjà clairs

- `core/rpg-rules.js` : calculs RPG purs configurables.
- `gens-rpg-tactical-combat-v2.js` : base du futur Tactical engine pur.
- `gens-rpg-tactical-combat-v2-adapter.js` : candidat pour l'adapter, après suppression des lectures privées dispersées.
- `gens-rpg-tactical-combat-v2-ui.js` : candidat pour l'UI Tactical, après extraction storage/assets/règles.
- `gens-rpg-tactical-combat-v2-bridge.js` : à réduire au contrat Dungeon -> Tactical, sans devenir propriétaire de navigation ou de stockage.

## 6. Ordre de nettoyage recommandé à partir de cette carte

Sans suppression immédiate de comportement :

1. finir l'inventaire des accès stockage et créer le contrat Core storage/migrations ;
2. inventorier puis centraliser le resolver d'assets ;
3. extraire le moteur Core stats en conservant les sentinelles `stats -> snapshot -> dégâts` ;
4. rendre le bootstrap déclaratif et supprimer progressivement les retries de reprise d'autorité ;
5. seulement en Phase 8, absorber les fonctions utiles de V108/V109/V111/V112/V113 puis supprimer ces couches une par une avec tests.

## 7. État du jalon

La chaîne externe réellement chargée par le bootstrap est cartographiée et chaque fichier actif de cette chaîne a un propriétaire actuel/cible identifié. `index.html` reste un monolithe legacy mixte : son contenu inline sera découpé par responsabilités au fur et à mesure des extractions Phase 4/5 plutôt que réécrit en bloc.

Aucune suppression de runtime n'est autorisée sur la base de ce document seul : chaque retrait devra démontrer que son comportement utile a un propriétaire unique et une sentinelle correspondante.
