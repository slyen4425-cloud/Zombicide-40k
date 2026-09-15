# GenSrpG — Charte permanente de développement

Cette charte est la référence obligatoire avant chaque travail sur GenSrpG. Elle s’applique à toutes les branches, tous les fils de discussion et toutes les futures versions.

Objectif : empêcher les régressions, l’empilement de correctifs, le mélange entre modes, les doubles sources de vérité et les fonctions globales qui reprennent l’autorité sur des systèmes déjà validés.

## 1. Quatre modules de jeu strictement séparés

GenSrpG comporte quatre modules principaux :

1. Survie
2. Dungeon / Aventure RPG
3. Monster Capture
4. Duel / Affrontement PvP

Un module ne pilote jamais directement le runtime, l’UI, les données privées ou les règles d’un autre module.

Ce qui est réellement commun doit passer par un Core partagé documenté.

## 2. Un système validé ne doit pas être recréé

Avant d’ajouter une fonction, vérifier si elle existe déjà : stats, dés, fiche personnage, inventaire, équipement, sets, sauvegarde, navigation, combat, dégâts, armure, résistances, progression, déplacement, assets, spawn, événements ou règles configurables.

Si elle existe, le nouveau contenu utilise son API. Il ne crée pas de second système concurrent.

## 3. Une responsabilité critique = un propriétaire unique

Une seule autorité active est permise pour chaque domaine :

- navigation globale : Shell/UI principal ;
- stats : Core stats ;
- dés : Core dice + présentation du module ;
- inventaire/équipement/sets : Core inventory/equipment ;
- sauvegarde/reprise : Core storage + état du module ;
- fiche personnage : Shell/module actif selon contexte, jamais Tactical ;
- déplacement Dungeon : Dungeon ;
- déclenchement du combat Dungeon : Dungeon ;
- résolution du combat tactique : Tactical ;
- retour de résultat : contrat Tactical -> Dungeon ;
- Survie : runtime Survie ;
- Capture : runtime Capture ;
- PvP : runtime PvP ;
- assets : resolver central ;
- cache PWA : service worker.

Si deux fichiers pensent posséder la même responsabilité, le développement s’arrête jusqu’à clarification.

## 4. Fonctions protégées

Ne jamais écraser silencieusement :

- fiche personnage ;
- navigation ;
- stats et calculs dérivés ;
- dés et interprétation des jets ;
- calcul de touche ;
- dégâts / armure / résistances / critique ;
- inventaire / équipement / sets ;
- sauvegarde / reprise / export ;
- déplacement ;
- participants d’un combat ;
- XP / récompenses / loot ;
- résolution d’assets ;
- cache/version PWA.

Ordre d’extension autorisé : API existante -> hook/événement documenté -> stratégie injectée -> nouvelle méthode du propriétaire -> modification du propriétaire avec tests.

## 5. Pas de pollution globale

Interdits par défaut :

- MutationObserver sur document.body/documentElement ;
- listener global capture bloquant la propagation ;
- stopImmediatePropagation comme mécanisme général d’autorité ;
- location.reload comme navigation ;
- heartbeat global ;
- setInterval permanent ;
- retries longs destinés à reprendre une fonction écrasée ;
- monkey-patch global sans propriétaire clair ;
- scan DOM général d’un autre module ;
- auto-install implicite d’un module complexe.

Tout module temporaire doit fournir install() + dispose() et libérer observers/listeners/timers.

## 6. Contrats explicites entre modules

Exemple Dungeon/Tactical :

Dungeon -> startTacticalCombat(snapshot)
Tactical -> CombatResult
Dungeon -> applyCombatResult(result)

Tactical reçoit ce dont il a besoin et ne relit pas arbitrairement toute l’application pendant le combat.

Même logique pour Survie, Capture et PvP.

## 7. Une source de vérité unique par donnée

Exemples :

- Force finale : Core stats ;
- équipement porté : Core inventory/equipment ;
- position Dungeon : état Dungeon ;
- PV pendant combat Tactical : état Tactical puis résultat appliqué au Dungeon ;
- règles RPG : configuration normalisée ;
- personnage sélectionné : Shell/module actif.

L’UI affiche ou met en cache ; elle ne devient pas une deuxième source de vérité.

## 8. Aucun calcul important dupliqué dans l’UI

L’UI affiche le calcul fourni par le moteur. Elle ne recalcule pas touche, bonus de stat, dégâts, armure, résistance, critique, XP ou mouvement.

Le moteur doit renvoyer un détail explicable, par exemple :

Épée 2
+ Force 16 : +1
= dégâts bruts 3
- Armure 3
= 0
Jet d’armure : 50 % blocage / 50 % minimum 1 dégât
Résultat final : 1 dégât

## 9. Découpage physique obligatoire du code

index.html doit devenir un shell léger et ne doit plus contenir l’essentiel du runtime.

Structure cible :

assets/gensrpg/core/
assets/gensrpg/shell/
assets/gensrpg/survival/
assets/gensrpg/dungeon/
assets/gensrpg/tactical/
assets/gensrpg/capture/
assets/gensrpg/pvp/
assets/gensrpg/builders/

Un fichier ne doit pas mélanger plusieurs domaines majeurs. Un fichier de performance ne doit pas devenir bootstrapper Tactical, un fichier UI ne doit pas devenir moteur de règles, etc.

## 10. Découpage physique obligatoire des assets

Les assets doivent suivre les mêmes frontières que le code.

Structure cible :

assets/common/
assets/survival/
assets/dungeon/
assets/capture/
assets/pvp/

Puis des sous-dossiers explicites : heroes, enemies, creatures, bosses, items, tiles, walls, doors, traps, chests, icons, ui, effects, arenas, biomes, etc.

Règles :

- un asset spécifique ne sort pas de son module ;
- aucun fallback automatique d’un module vers un autre ;
- les chemins doivent passer par un resolver central quand il existe ;
- noms d’assets uniques ou préfixés ;
- les assets vraiment partagés seulement vont dans common ;
- toute migration d’assets se fait avec table ancien chemin -> nouveau chemin et compatibilité temporaire contrôlée.

## 11. Les éditeurs produisent des données, pas du runtime

Flux autorisé : Éditeur -> données validées -> sauvegarde -> runtime du module.

Interdit : Éditeur -> modification directe du runtime actif.

## 12. Travail toujours sur base connue

Avant chaque changement :

- relever le SHA exact de main ;
- créer une branche dédiée ;
- créer une branche de sauvegarde si un runtime validé est touché ;
- ne jamais développer directement sur main.

## 13. Périmètre déclaré avant codage

Avant de coder, écrire :

- module concerné ;
- propriétaire ;
- systèmes existants réutilisés ;
- fonctions qui ne doivent pas être touchées ;
- tests nécessaires ;
- risque inter-module.

Si le périmètre déborde, on arrête et on recadre.

## 14. Tests du vrai chemin réel

Un test ne doit pas injecter artificiellement la bonne valeur lorsque le risque est justement dans le raccord.

Exemple : pour 16 Force -> +1 dégât, le test part d’un vrai héros avec Force 16 et traverse stats -> snapshot -> arme -> attaque -> dégâts.

## 15. Tests sentinelles permanents

La CI doit progressivement posséder des sentinelles pour :

- Survie ;
- Dungeon ;
- Monster Capture ;
- Duel/PvP ;
- fiche héros ;
- Save & Quit / reprise ;
- déplacement ;
- stats ;
- dés ;
- combat ;
- sauvegardes ;
- PWA/cache ;
- frontière inter-modules.

## 16. Règle de gel fonctionnel

Une fonction déclarée stable devient protégée. Ses invariants sont documentés et testés.

Tout futur changement qui touche cette fonction doit le déclarer explicitement et repasser ses tests sentinelles.

## 17. Gestion des régressions

En cas de régression :

- pas de nouvelle rustine immédiate ;
- revenir à la dernière version sûre ;
- identifier le premier changement responsable ;
- retirer ou isoler l’autorité fautive ;
- préférer un correctif soustractif ;
- ajouter un test reproduisant précisément la régression.

## 18. Refactor progressif uniquement

Pas de big-bang.

Ordre générique : documenter -> tester les frontières -> identifier le propriétaire -> déplacer une responsabilité -> retirer l’ancienne autorité -> comparer -> publier un petit jalon -> continuer.

Le code historique peut rester dans Git mais n’a pas besoin de rester chargé en production.

## 19. Sauvegardes et migrations

Toute structure persistante modifiée doit conserver la compatibilité ou fournir une migration versionnée, idempotente et testée.

## 20. Publication

1. branche dédiée ;
2. tests ;
3. revue des fichiers modifiés ;
4. vérification de non-interférence ;
5. sauvegarde main ;
6. PR/merge ;
7. SHA exact ;
8. CI main ;
9. GitHub Pages ;
10. relance PWA si cache changé ;
11. test utilisateur ciblé.

Une CI rouge bloque la publication.

## 21. Critère de fin d’un chantier

Un chantier n’est terminé que si :

- le propriétaire cible est unique ;
- l’ancien propriétaire est retiré du runtime ;
- les tests unitaires sont verts ;
- le vrai raccord est testé ;
- les frontières inter-modules sont testées ;
- la documentation est à jour ;
- la CI est verte ;
- le comportement utilisateur ciblé est validé.

## 22. Règle finale

Quand deux solutions sont possibles, choisir celle qui réduit les effets globaux, réutilise l’existant, sépare les modules, garde une seule source de vérité, facilite les tests et le rollback, et minimise le risque pour les autres modes.

Cette charte prime sur la solution la plus rapide.

## 23. Priorité au diagnostic de conflit d’affichage avant toute modification fonctionnelle

Lorsqu’une nouvelle interface, map, overlay, popup, panneau ou couche visuelle apparaît puis qu’une ancienne fonction UI cesse de répondre (par exemple : fiche personnage impossible à ouvrir après ajout de la map de combat), il faut d’abord considérer le problème comme un conflit d’affichage ou d’événement, pas comme une panne du système métier.

Avant de modifier la fiche personnage, la navigation, les stats ou tout autre système protégé, vérifier obligatoirement :

- `z-index` et ordre réel des couches ;
- présence d’un overlay transparent ou invisible encore actif ;
- `display`, `visibility`, `opacity`, `pointer-events`, `position` et taille des conteneurs ;
- backdrop ou `div` plein écran resté monté après fermeture ;
- classe CSS d’état non retirée ;
- verrouillage `overflow` du `body` ;
- élément invisible qui intercepte les clics ;
- listener en phase capture ;
- `preventDefault`, `stopPropagation` ou `stopImmediatePropagation` ;
- focus trap ou modal encore actif ;
- observer DOM qui réaffiche la couche ;
- fonction de rendu du nouveau module qui remonte par-dessus l’ancienne vue après le clic.

Règle stricte : si le défaut est apparu après l’ajout d’une nouvelle couche UI, corriger uniquement le conflit de couche ou d’événement démontré. Ne pas réécrire la fiche personnage, le routeur, le système de clic ou le moteur concerné tant qu’ils ne sont pas prouvés fautifs.

Exemple de diagnostic attendu : « Depuis l’ajout de la map de combat, la fiche personnage ne s’ouvre plus. Vérifier d’abord overlay/z-index/pointer-events/listeners de la map, puis corriger cette couche uniquement. »

Toute correction de ce type doit être accompagnée d’un test navigateur qui prouve simultanément que la nouvelle couche fonctionne et que l’ancienne fonction UI reste cliquable après ouverture/fermeture.