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

## Nouvelle preuve — vrai cycle Dungeon atteint (run 39012695829)

Commit de test `fca7cd4d386b865037edf12707745727102b79e9`, [run de diagnostic](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39012695829) **SUCCESS du protocole d'observation**, et non validation de la fonctionnalité. Amélioration du banc : gestion du rechargement du profil Dungeon, inspirée du test existant Phase 5.

**Scénario exécuté dans Chromium mobile simulé (412×915)** : boot → entrée réelle dans une session Dungeon → injection d'une rencontre de test déterministe sur carte → bouton d'engagement réel → overlay Tactical V2 → sélection d'ennemi → tentative de clic sur le bouton d'attaque.

- **Local preview** : entrée réelle Dungeon, ennemi et overlay tactique présents ; bouton d'attaque dans le DOM (`gtv2Actions button[data-attack]`), mais **invisible** selon Playwright. Clic impossible (timeout). Causes CSS/couches/état d'overlay à caractériser, conformément au §23 charte.
- **External preview simulée** : mêmes étapes de jeu jusqu'au clic réussi sur `⚔️ Épée longue · portée 0-1`. Dans la fenêtre d'observation, **aucun `.gtv2DiceBackdrop`** ; l'interface propose ensuite **« Approcher la cible »**, le tour reste au héros. **Interprétation limitée : une attaque hors portée n'est pas censée lancer des dés ; ne pas conclure « animation cassée » avant d'avoir confirmé la position et la portée puis effectué une attaque réellement à portée.**
- Dans la preview externe, les 30 scripts auxiliaires se chargent après `DOMContentLoaded` (`document.readyState=interactive`), différence structurelle conservée.
- Aucune erreur JS `pageerror` signalée ; deux scripts CDN (Supabase/QR) volontairement non chargés dans le protocole. Aucune séquence de frappes automatiques reproduite à ce stade.

**Correction toujours NON FAITE**. L'absence de dés mesurée ne prouve pas la régression utilisateur, car le ciblage pouvait être hors portée. Prochaine preuve exigée : position précise des acteurs, mouvement réel jusqu'à portée, attaque autorisée avec animation et décision « continuer », puis tour adverse sans auto-boucle ; inspecter overlays/visibilité avec screenshot/états CSS et comparer au chargement Pages natif. La détection de monstres reste un deuxième sous-problème distinct. **Pas de R06, pas de checkpoint GREEN diagnostic, pas de publication main.**

## Retour utilisateur aggravé — plusieurs manches, embuscades et détection

17 octobre 2026 — le test manuel utilisateur confirme que le déroulement est initialement fonctionnel pendant environ **trois tours**, puis les frappes/résultats s'enchaînent ou les commandes/dés ne répondent plus. Nouvelles observations : ennemis d'embuscade apparaissant loin du groupe et détection des monstres incohérente. Le jeu **n'est PAS validé**, même si une CI courte est GREEN.

### Diagnostic reproductible du deuxième tour

- Le navigateur mobile sur la vraie preview locale et la preview externe simulée a reproduit une absence de dé au deuxième tour après une attaque complète héros + ennemi validée. [Run 39031194199](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39031194199) : FAILURE **attendue** du scénario long.
- L'état Tactical valide héros actif, cible ennemie vivante et à distance 1, attaque autorisée ; panneau d'armes/objets visible. Au clic, le message exact est **« Choisis d’abord une cible. »** et aucun dé ne s'ouvre.
- Cause locale vérifiée par le code : `refreshSelection()` de `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js` effaçait la cible choisie lorsque le tour actif passait à l'ennemi (`t.side===cur.side`). La sélection n'était plus restaurée au tour suivant.
- Correction bornée : commit `3084c86d6c5a1af0ec6165a5d5d927bffbf8057c` ; conserver le choix de cible vivant pendant la phase ennemie, sans choisir ni lancer une attaque à la place du joueur, sans toucher portée/dégâts/dés/IA. Exiger **quatre cycles réels** avec pause dés héros/ennemi et panneau présent après chaque rendu, local et externe. **Validation longue encore en attente à l'écriture.**

### Anomalie potentielle du raccord d'embuscade

- Le module `assets/dungeon/dungeon-event-runtime-fix-167878.js` existe et un test unitaire isolé vérifie un placement adjacent dans son *fixture*.
- **Le nom de ce module est absent** du `index.html` R05 certifié, du tableau de scripts ajoutés dans `preview.html`, des scripts injectés par le workflow GitHub Pages `.github/workflows/main.yml`, ainsi que du Core `runtime-bootstrap-v1.js`. Il figure dans le **pré-cache du service-worker** et dans le manifeste des propriétaires, ce qui **ne prouve aucun chargement/exécution**. Hypothèse forte : le correctif de placement n'atteint pas la vraie partie.
- Avant raccord : vérifier l'absence d'autre chargeur effectif, l'ordre parser et la frontière avec **V113**, seul propriétaire autorisé de la détection, puis test d'embuscade dans le navigateur avec positions persistées. **Aucun patch embuscade/IA effectué dans le présent lot Tactical UI.**

### Détection

- `gens_tactical_single_detection_authority_v11411.test.cjs` confirme que **V113** possède la détection active ; les anciens hooks V108/V111/V112 sont débranchés. Ne pas réactiver un ancien détecteur pour masquer les écarts.
- Faire un test de déplacement réel sur grille : distances calculées à partir des cases traversables, positions héros/ennemis, room/scope, déclenchement unique, puis vérification du raccord Bridge. **Non validé à ce stade.**

### Blocage

R06 et déploiement `main` suspendus. Aucun checkpoint GREEN pour ce diagnostic tant que la CI Architecture/Chromium, Firefox, Tactical, les manches multiples, les embuscades et la détection en navigation réelle ne sont pas caractérisés/corrigés. Ne pas envoyer de nouvelle preview présentée comme sûre avant ces preuves.
