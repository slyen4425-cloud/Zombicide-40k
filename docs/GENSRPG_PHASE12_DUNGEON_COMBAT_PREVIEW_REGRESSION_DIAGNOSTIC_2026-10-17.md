# Diagnostic en cours — régression combat Dungeon après premier test R05 (17/10/2026)

**État : anomalie utilisateur toujours ouverte ; aucune correction du gameplay ; R06 suspendu.** Ceci n'est PAS un nouveau GREEN Dungeon.

## Retour terrain

- Navigation des modes OK.
- Détection des monstres perçue comme erratique.
- Entrée en combat et déplacements initiaux OK.
- Dès la première attaque : frappes héros/ennemis enchaînées, résultats immédiats, dés sans animation, impossibilité de sélectionner normalement les objets/actions.
- Test sur preview **externe** de la révision R05, pas sur une préproduction GitHub Pages native.

## Autorités

- Branche : `work/gensrpg-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17`.
- Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17` sur `5f6eaf3933c521f1fa43ffea9808f59eeb7a54a6` (clôture documentaire R05).
- Runtime épinglé : R05 GREEN `a832da1cbbad39c446f46f1035dbb819aa60ec20`.
- Source §26 : `c8.zip` → `index.html(18).txt`, **2 781 436 octets**, Git blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`.
- Aucun changement sur `index.html`, `preview.html`, les moteurs de jeu, les sauvegardes, `main` ni laboratoires.

## Preuves de composition

- Dans `preview.html` mode local, le graphe auxiliaire est écrit dans le HTML avant `</body>` et exécuté par le parser.
- En mode externe, les scripts sont chargés par ajout DOM après `DOMContentLoaded`, alors que leur ordre/phase de démarrage n'est pas identique à GitHub Pages.
- Le test navigateur `tests/gens_phase12_dungeon_combat_preview_regression_diagnostic_browser_v1.test.cjs` vérifie un HTML R05 intact, essaie un vrai lancement de partie puis un combat Dungeon. [Run GitHub 39009788207](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39009788207) : SUCCESS **du test de diagnostic**, sans signifier validation du combat.
- Résultat local : `previewReady=1`, `GensRuntimeBootstrapV1=object`, `GensTacticalV1=undefined`, `GensRpgTacticalCombatV2Bridge.requestCombat=undefined`, `GensRpgTacticalCombatV2Ui=undefined` au point de contrôle ; auxiliaires dynamiques 0.
- Résultat externe simulé : `previewReady=1`, `GensRuntimeBootstrapV1=object`, `GensTacticalV1=object`, `GensRpgTacticalCombatV2Bridge.requestCombat=function`, `GensRpgTacticalCombatV2Ui=undefined` (UI chargée à l'activation), **30 modules** ajoutés avec `document.readyState=interactive` ; différence d'initialisation prouvée.
- **Limite décisive** : le scénario de navigation test échoue après le boot en attendant la session Dungeon (timeout 25 s dans les deux modes). Il ne reproduit donc PAS encore la séquence attaque → dés et ne prouve pas l'origine des frappes automatiques. Ne pas maquiller un test de boot GREEN en « combat réparé ».
- L'ancien test `gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs` atteint l'ouverture de l'overlay Tactical mais ne vérifie pas le cycle d'attaque complet. Ajouter vérification du vrai choix d'action, de l'animation dés, du ciblage et de la fin de tour au prochain protocole.

## Actions requises avant toute correction

1. Corriger **uniquement le banc de diagnostic** : navigation de profil Dungeon avec reload explicite, attendre l'activation Tactical, puis reproduire l'attaque/animation et observer l'éventuelle boucle.
2. Comparer **le même flux réel** en preview externe et dans le mode Pages équivalent ; distinguer un problème de bootstrap du comportement du moteur.
3. Si le défaut est dans la composition externe, corriger la preview isolée ; si le défaut est dans le runtime, ouvrir un correctif borné avec tests / CI / checkpoint propres.
4. Tester la détection ennemie séparément ; ne pas reconfigurer les règles de gameplay pour masquer un défaut d'UI/événement.
5. Aucune fusion `main`, R06 ou nouveau chantier gameplay tant que le blocage utilisateur n'est pas résolu.
