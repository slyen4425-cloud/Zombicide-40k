# GenSrpG — Carnet de règles de développement strictes

Ce document est la charte permanente de développement de GenSrpG.

Il doit être relu et appliqué avant chaque travail, quel que soit le fil de discussion, la version, la branche ou la personne qui intervient sur le projet.

Le but est simple : empêcher les dérives architecturales, les correctifs qui polluent d’autres systèmes et les régressions provoquées par un nouveau contenu qui reprend l’autorité sur une fonction déjà existante.

---

## 0. Règle absolue : ne jamais casser un système validé pour en ajouter un autre

Une nouvelle fonctionnalité ne doit jamais remplacer, détourner ou réécrire silencieusement une fonction existante qui fonctionne déjà.

Avant de créer quelque chose de nouveau, il faut d’abord vérifier si le projet possède déjà :
- un système de statistiques ;
- un système de dés ;
- une fiche personnage ;
- un système d’inventaire / équipement ;
- un système de sauvegarde ;
- un système de navigation ;
- un moteur de combat ;
- un système de dégâts / armure / résistances ;
- un système de progression / XP / niveau ;
- un système de déplacement ;
- un système d’assets ;
- un système d’événements / spawn ;
- un système de règles configurables.

Si le système existe déjà, le nouveau contenu doit l’utiliser par une interface claire. Il ne doit pas recréer une seconde version concurrente.

Exception : remplacement volontaire d’un système après audit, tests de comparaison et décision explicite. Dans ce cas l’ancien système est retiré proprement du runtime au lieu de rester empilé derrière le nouveau.

---

## 1. Les quatre modules de jeu doivent rester isolés

GenSrpG comporte quatre modules de jeu principaux :

1. **Survie**
2. **Dungeon / Aventure RPG**
3. **Monster Capture**
4. **Duel / Affrontement PvP**

Règle stricte : le runtime d’un module ne doit jamais piloter directement l’interface ou les règles internes d’un autre module.

Exemples interdits :
- un correctif Dungeon qui change les dés de Survie ;
- Monster Capture qui modifie une fonction globale de combat utilisée par Dungeon ;
- le PvP qui réutilise directement l’état runtime d’une partie Survie ;
- un module qui masque ou réaffiche les écrans d’un autre module ;
- un module qui lit ou écrit les variables privées d’un autre module.

Ce qui est réellement commun doit passer par un **Core commun** documenté.

---

## 2. Séparer le Core commun des règles propres aux modules

Le Core commun peut posséder :
- modèles héros / créatures / objets ;
- moteur de statistiques commun ;
- effets génériques ;
- inventaire et équipements génériques ;
- progression générique ;
- stockage et migrations ;
- résolution d’assets ;
- utilitaires purs ;
- bus d’événements documenté.

Le Core ne doit pas décider :
- quelle salle Dungeon afficher ;
- quand un combat Monster Capture commence ;
- quelle phase Survie est active ;
- quel joueur agit en PvP ;
- quelle vue globale doit être visible.

Chaque module reste propriétaire de son gameplay.

---

## 3. Une responsabilité critique = un seul propriétaire

À tout instant il ne doit exister qu’une seule autorité active pour une responsabilité critique.

Propriétaires de référence :
- navigation globale : **Shell / UI principal** ;
- fiche personnage hors combat : **Shell ou module actif selon le contexte, jamais Tactical** ;
- stats : **moteur stats commun** ;
- dés : **service de dés commun + présentation du module**, jamais plusieurs calculateurs concurrents ;
- inventaire / équipements : **service commun** ;
- sauvegarde / reprise : **service stockage commun + état fourni par le module** ;
- assets : **resolver d’assets commun** ;
- déplacement Dungeon : **Dungeon exploration** ;
- démarrage d’un combat Dungeon : **Dungeon exploration** ;
- résolution du combat tactique Dungeon : **Tactical** ;
- retour du résultat de combat : **contrat Tactical -> Dungeon** ;
- logique Survie : **Survie** ;
- logique Monster Capture : **Monster Capture** ;
- logique PvP : **Duel/PvP** ;
- cache PWA : **service worker**.

Si deux fichiers pensent être propriétaires de la même fonction, il faut arrêter le développement et clarifier l’autorité avant d’ajouter du code.

---

## 4. Fonctions protégées : interdiction de les écraser silencieusement

Les familles suivantes sont considérées comme protégées :
- fiche personnage ;
- navigation / changement d’écran ;
- système de stats ;
- calculs dérivés ;
- dés et interprétation des jets ;
- calcul de touche ;
- dégâts, armure, résistances, critique ;
- inventaire / équipements / sets ;
- sauvegarde / reprise / export ;
- déplacement ;
- participants d’un combat ;
- récompenses / XP / loot ;
- résolution d’assets ;
- cache / version PWA.

Un nouveau contenu ne peut pas remplacer une de ces fonctions globales avec un wrapper ou un monkey-patch juste pour obtenir son résultat.

Si une extension est nécessaire, utiliser dans cet ordre :
1. une API existante ;
2. un hook ou événement documenté ;
3. un paramètre / stratégie injectée ;
4. une nouvelle méthode explicitement exposée par le propriétaire ;
5. seulement après décision architecturale, modifier le propriétaire lui-même avec ses tests.

---

## 5. Interdictions globales par défaut

Sont interdits sauf justification documentée et test dédié :
- `MutationObserver` sur `document.body` ou `document.documentElement` ;
- listeners globaux en phase capture qui bloquent la propagation ;
- `stopImmediatePropagation()` utilisé comme mécanisme d’autorité générale ;
- `location.reload()` comme navigation ;
- `setInterval` global permanent ;
- heartbeat de maintenance UI ;
- retries longs pour « réinstaller » une fonction qui peut être écrasée ;
- monkey-patch d’une fonction globale sans propriétaire clair ;
- scan DOM général pour retrouver des boutons appartenant à d’autres modules ;
- auto-install d’un module complexe au simple chargement du fichier.

Si un module observe le DOM, il observe uniquement son conteneur et fournit un `dispose()` qui libère observer, listeners et timers.

---

## 6. Contrats explicites entre modules

Un module communique avec un autre par entrées/sorties définies.

Exemple cible Dungeon / Tactical :

```text
Dungeon -> startTacticalCombat(snapshot)
Tactical -> CombatResult
Dungeon -> applyCombatResult(result)
```

Le snapshot contient les données nécessaires : participants, stats déjà calculées, équipement, positions, ennemis, règles utiles.

Tactical ne doit pas aller rechercher arbitrairement toute l’application pendant le combat.

Même principe pour Monster Capture, Survie et PvP.

---

## 7. Les données ont une source de vérité unique

Pour chaque donnée importante, définir une source de vérité.

Exemples :
- Force finale d’un héros : moteur stats commun ;
- équipement porté : inventaire commun ;
- position Dungeon : état Dungeon ;
- PV pendant un combat tactique : état Tactical, puis résultat appliqué au Dungeon ;
- règles RPG : configuration RPG normalisée ;
- personnage sélectionné : Shell / module actif.

Une UI peut afficher ou mettre en cache une valeur ; elle ne devient pas une deuxième source de vérité.

---

## 8. Aucun calcul important ne doit être dupliqué dans l’UI

L’UI affiche le calcul fourni par le moteur.

Elle ne doit pas recalculer de son côté :
- chance de toucher ;
- bonus de Force ;
- dégâts ;
- armure ;
- résistance ;
- critique ;
- XP ;
- déplacement.

Le moteur doit retourner un résultat détaillé pouvant être affiché, par exemple :

```text
Épée 2
+ Force 16 : +1
= dégâts bruts 3
- Armure 3
= 0
Test d’armure : 50 % blocage / 50 % minimum 1 dégât
Résultat final : 1 dégât
```

Ainsi la description et le calcul ne peuvent pas diverger.

---

## 9. Tout nouveau contenu doit annoncer son périmètre avant codage

Avant chaque changement, écrire clairement :
- module concerné ;
- fichiers propriétaires ;
- systèmes existants réutilisés ;
- fonctions qui ne doivent pas être touchées ;
- tests nécessaires ;
- risque pour les autres modules.

Si le périmètre déborde pendant le développement, on arrête et on recadre avant de poursuivre.

---

## 10. Toujours partir d’une base connue

Avant toute modification :
- relever le commit exact de `main` ;
- créer une branche de travail dédiée ;
- créer une branche de sauvegarde si le runtime validé est touché ;
- ne jamais développer directement sur `main`.

Un changement important doit avoir un point de retour simple et vérifiable.

---

## 11. Tests obligatoires avant publication

Selon le changement :
- test unitaire du moteur concerné ;
- test du vrai raccord entre données et moteur ;
- test navigateur mobile si UI ;
- test de non-régression du module ;
- test de frontière avec les autres modules si code partagé ;
- test sauvegarde/reprise si état persistant ;
- test PWA/cache si fichiers runtime servis changent.

Important : un test ne doit pas injecter artificiellement la bonne valeur si justement le risque se situe dans le raccord qui doit produire cette valeur.

Exemple : pour vérifier `16 Force -> +1 dégâts`, le test doit partir d’un vrai héros avec Force 16 et traverser le moteur stats -> snapshot -> attaque -> dégâts.

Une CI rouge bloque la publication.

---

## 12. Test de non-interférence obligatoire

Chaque changement d’un module doit prouver au minimum que les autres modules critiques ne sont pas altérés.

À terme, la CI doit posséder quatre scénarios sentinelles :
- Survie démarre et joue sans dépendance Dungeon ;
- Dungeon démarre, fiche héros / déplacement / sauvegarde / combat fonctionnent ;
- Monster Capture démarre et joue sans fonctions Dungeon/Survie détournées ;
- Duel/PvP démarre sans modifier les trois autres runtimes.

---

## 13. Mobile d’abord

Le smartphone est la cible prioritaire :
- viewport étroit ;
- tactile ;
- DPR élevé ;
- PWA ;
- cache ;
- reprise ;
- mémoire et coût DOM raisonnables.

Une solution qui fonctionne uniquement dans un test Node mais pas dans un vrai navigateur mobile n’est pas considérée comme validée.

---

## 14. Gestion stricte des régressions

Si une régression apparaît :
- ne pas empiler immédiatement une nouvelle rustine ;
- comparer avec la dernière version sûre ;
- identifier le premier changement responsable ;
- retirer ou isoler l’autorité fautive ;
- préférer un correctif soustractif ;
- ajouter un test reproduisant précisément la régression avant publication.

Si plusieurs patchs commencent à se chevaucher, lancer un mini-audit du domaine avant toute nouvelle correction.

---

## 15. Refactor progressif uniquement

Pas de big-bang sur l’application active.

Ordre :
1. documenter ;
2. écrire les tests de frontière ;
3. identifier le propriétaire ;
4. déplacer une responsabilité ;
5. retirer l’ancienne autorité du runtime ;
6. comparer le comportement ;
7. publier un petit jalon ;
8. passer au domaine suivant.

Le code historique peut rester dans Git. Il n’a pas besoin de rester chargé en production.

---

## 16. Éditeurs et World Builder ne possèdent jamais le runtime

Les éditeurs créent des données.

Flux obligatoire :

```text
Éditeur -> données validées -> sauvegarde -> runtime du module lit ces données
```

Interdit :

```text
Éditeur -> modification directe des fonctions du runtime actif
```

---

## 17. Sauvegarde et migrations

Toute modification de structure persistante doit :
- conserver la compatibilité avec les sauvegardes existantes ou fournir une migration ;
- être versionnée ;
- être idempotente ;
- ne pas réappliquer une migration à chaque lancement ;
- posséder un test reprise après fermeture.

---

## 18. Assets

Les chemins d’assets doivent être résolus par un resolver central quand il existe.

Un nouveau module ne doit pas créer une nouvelle logique parallèle de recherche d’images si héros, créatures, objets ou tuiles sont déjà couverts par le resolver commun.

---

## 19. Procédure de publication

1. branche dédiée ;
2. tests locaux / CI ;
3. revue des fichiers modifiés ;
4. vérifier qu’aucun autre module n’est touché sans raison ;
5. sauvegarde de `main` ;
6. merge PR ;
7. relever le SHA exact ;
8. vérifier CI de `main` ;
9. vérifier GitHub Pages ;
10. fermer/réouvrir la PWA si cache modifié ;
11. test utilisateur ciblé.

---

## 20. Ce qui ne doit jamais être perdu pendant un nettoyage

Préserver :
- fonctionnalités validées ;
- règles validées ;
- graphismes / assets ;
- données utilisateur ;
- sauvegardes ;
- performances mobile ;
- capacités des éditeurs ;
- comportement des autres modules.

Un nettoyage doit réduire la complexité sans changer silencieusement le jeu.

---

## 21. Documentation obligatoire

Toute décision architecturale durable doit être écrite dans le dépôt.

Le fonctionnement de GenSrpG ne doit jamais dépendre uniquement de la mémoire d’un fil de discussion.

Les documents de référence sont au minimum :
- `docs/GENSRPG_DEVELOPMENT_RULES.md` — cette charte ;
- `docs/GENSRPG_ARCHITECTURE_AUDIT.md` — audit ;
- `docs/GENSRPG_MODULE_OWNERSHIP.md` — propriétaires ;
- `docs/GENSRPG_RUNTIME_RISK_INVENTORY.md` — risques runtime.

---

## 22. Check-list obligatoire avant tout travail futur

Avant de coder, répondre à ces questions :

1. Quel module est concerné ?
2. Qui possède actuellement cette fonction ?
3. Existe-t-il déjà un système pour ce besoin ?
4. Est-ce que je suis en train de créer un deuxième système concurrent ?
5. Est-ce que je remplace ou wrappe une fonction globale ? Si oui, pourquoi ?
6. Ce changement peut-il affecter Survie, Dungeon, Monster Capture ou PvP ?
7. Quel test prouve que le vrai raccord fonctionne ?
8. Quel test prouve que les autres modules restent intacts ?
9. Existe-t-il une branche de retour sûre ?
10. La documentation doit-elle être mise à jour ?

Si une réponse révèle une ambiguïté d’autorité, ne pas coder avant de la résoudre.

---

## 23. Règle finale de décision

Quand deux solutions sont possibles, choisir celle qui :
- réutilise le système existant au lieu d’en créer un second ;
- réduit le nombre de propriétaires ;
- réduit les effets globaux ;
- sépare les quatre modules ;
- rend le moteur testable sans UI ;
- fournit un `dispose()` pour tout comportement temporaire ;
- rend les calculs visibles et explicables ;
- facilite un retour arrière ;
- minimise le risque pour les autres modes.

**Cette charte prime sur la solution la plus rapide.**
