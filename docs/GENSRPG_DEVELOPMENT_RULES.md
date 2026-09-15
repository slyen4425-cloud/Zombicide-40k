# GenSrpG — Règles de développement strictes

Ces règles s’appliquent à tous les travaux futurs sur GenSrpG.

## 1. Toujours partir d’une base connue

Avant toute modification :
- relever le commit exact de `main` ;
- créer une branche de travail dédiée ;
- créer une branche de sauvegarde lorsque la modification touche un runtime déjà validé ;
- ne jamais développer directement sur `main`.

## 2. Un changement = un périmètre

Chaque tâche doit annoncer son propriétaire :
- Core ;
- UI/navigation ;
- Survie ;
- Dungeon exploration ;
- Combat tactique Dungeon ;
- Capture ;
- Duel/PvP ;
- World Builder/éditeur ;
- stockage ;
- PWA/assets/tests.

Une modification ne doit pas changer un autre périmètre sans raison explicite et test associé.

## 3. Interdictions globales par défaut

Sont interdits sauf justification documentée :
- `MutationObserver` sur `document.body` ou `document.documentElement` ;
- listeners globaux en phase capture qui bloquent la propagation ;
- `location.reload()` comme mécanisme de navigation ;
- `setInterval` global permanent ;
- heartbeat de maintenance UI ;
- monkey-patch d’une fonction globale sans contrat de propriété ;
- scan DOM général pour trouver des boutons appartenant à un autre module.

Si une mécanique a besoin d’observer le DOM, elle doit observer le conteneur qu’elle possède et être démontable.

## 4. Pas d’auto-install implicite pour les modules complexes

Un module runtime important ne doit pas prendre le contrôle simplement parce que son fichier JavaScript a été chargé.

Préférence :
- exporter `install()` ;
- exporter `dispose()` ;
- laisser le propriétaire du mode décider quand installer ;
- garantir l’idempotence ;
- libérer observers/listeners/timers à la sortie.

## 5. Autorité unique

Chaque responsabilité critique doit avoir un seul propriétaire actif :
- navigation globale : shell/UI ;
- fiche héros exploration : Dungeon ;
- `Save & Quit` : Dungeon + stockage ;
- stats : moteur stats commun ;
- démarrage combat : Dungeon décide, Tactical reçoit ;
- résolution combat : Tactical ;
- récompenses et retour au monde : contrat Tactical -> Dungeon ;
- cache PWA : service worker.

## 6. Contrats entre modules

Les modules communiquent par entrées/sorties explicites, pas en modifiant mutuellement leurs variables internes.

Exemple cible Combat tactique :

```text
Dungeon -> startTacticalCombat(snapshot)
Tactical -> CombatResult
Dungeon -> applyCombatResult(result)
```

Le snapshot contient uniquement les données nécessaires. Tactical ne va pas relire arbitrairement toute l’application pendant le combat.

## 7. Tests obligatoires avant publication

Selon le changement :
- test unitaire du module ;
- test navigateur mobile si UI ;
- test de non-régression du mode ;
- test de frontière avec au moins un autre mode si code partagé ;
- test PWA/cache si fichiers runtime servis ont changé.

Une CI rouge bloque la publication. On corrige la cause ou le test obsolète après preuve ; on ne supprime pas un garde utile pour obtenir du vert.

## 8. Mobile d’abord

Le comportement smartphone est prioritaire :
- viewport étroit ;
- tactile ;
- DPR élevé ;
- PWA ;
- reprise après cache ;
- coût DOM/animations limité.

Les tests navigateur doivent refléter autant que possible ces contraintes.

## 9. Procédure de publication

1. travail sur branche dédiée ;
2. tests locaux/CI ;
3. revue des fichiers modifiés ;
4. sauvegarde de `main` ;
5. merge PR ;
6. relever SHA exact du merge ;
7. vérifier CI de `main` ;
8. vérifier déploiement Pages ;
9. demander fermeture/reouverture complète de la PWA si cache modifié ;
10. test utilisateur ciblé.

## 10. Gestion des régressions

Si une régression apparaît après une série de correctifs :
- ne pas empiler immédiatement un nouveau patch ;
- comparer avec la dernière version sûre ;
- identifier le premier commit qui change le comportement ;
- retirer ou isoler l’autorité fautive ;
- préférer un correctif soustractif à un nouveau garde global.

## 11. Refactor progressif uniquement

Pas de big-bang sur l’application actuelle.

Ordre recommandé :
1. documenter ;
2. tester les frontières ;
3. isoler les propriétaires ;
4. retirer les auto-installs globaux ;
5. consolider une chaîne à la fois ;
6. conserver l’historique Git ;
7. publier par petits jalons validés.

## 12. Ce qui ne doit pas être perdu

Tout nettoyage doit préserver :
- fonctionnalités existantes ;
- règles validées ;
- graphismes/assets ;
- données utilisateur ;
- compatibilité des sauvegardes, sauf migration explicite ;
- performances mobile ;
- capacités des éditeurs.

## 13. Documentation obligatoire

Tout changement architectural durable doit mettre à jour la documentation du dépôt. Le fonctionnement du projet ne doit pas dépendre uniquement du contexte d’une conversation ChatGPT.

## 14. Règle de décision

Quand deux solutions sont possibles, préférer celle qui :
- réduit le nombre de propriétaires d’une même responsabilité ;
- réduit les effets globaux ;
- rend le code testable sans DOM complet ;
- permet de désinstaller proprement le module ;
- limite le risque pour les autres modes.
