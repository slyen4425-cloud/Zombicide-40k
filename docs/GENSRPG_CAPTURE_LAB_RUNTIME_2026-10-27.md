# Capture → Core Combat officiel : lot 1v1 du 27 octobre

## Ce qui fonctionne

La zone provisoire déclenche le port Capture existant. L'adaptateur charge les véritables modules du Labo Combat, initialise les PV depuis le snapshot Capture, délègue compétences/coûts/préparation/impact et IA aux propriétaires natifs, puis expose une promesse `completion`. L'Encounter Source consomme cette promesse une fois, valide le résultat avec `BattleBridgeContract`, arrête et libère la session, puis rend le déplacement à la zone. Fuite, erreur et annulation suivent le même cycle de vie.

La preview `capture-lab-preview.html` montre ce chemin avec une petite rencontre de données d'essai. Aucun résultat n'est injecté artificiellement pour simuler une victoire. Les PV et l'énergie affichés viennent du Core ; les boutons ne calculent ni coûts ni dégâts. Les identités d'instances sont distinctes des IDs des acteurs Combat.

## Base et autorités

- GenSrpG : `3738615068a87182e393360f007a8cfe1bfa4f3b`, PR #175 ; START `checkpoint/gensrpg-start-capture-lab-runtime-2026-10-27`.
- Branche : `work/gensrpg-capture-lab-bridge-runtime-2026-10-27`.
- Combat : `main@65e21792ff74aea9862e528c8dbfdb22797b6693`, Laboratory CI [40477906275](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/40477906275) SUCCESS. Le pin est défini une seule fois dans `combat-lab-engine-loader-v1.mjs`.
- Aucune modification du labo, de son catalogue ou de ses exports auteur. Le manifeste rc1 historique reste bloqué et ne sert pas de livraison stable. Pas d'autoSync.
- Le build transporte les modules officiels inchangés sous `vendor/combat-lab/`. Aucun moteur dupliqué n'est commité dans GenSrpG ; aucune dépendance inverse et aucun import de la Demo UI.

## API de l'adaptateur

`createCombatLabProviderV1({engine, resolveBattle, mountBattle, clock})` retourne le protocole 1 du port existant. Capacités : `battle-trigger`, `battle-1v1`. L'éditeur n'est pas annoncé comme raccordé.

`resolveBattle(context)` est synchrone et retourne une source normalisée par `adaptCaptureCombatExportStackV1`, deux `actorIds` dans l'ordre des camps Capture, et éventuellement `aiEnabled` / `aiTactics`. Les identités, PV maximum, équipe locale et listes de capacités doivent coïncider ; les PV courants Capture gagnent sur `initialHp` de la définition auteur. Les deux camps doivent avoir exactement un actif et aucun membre de réserve. Un format non supporté est refusé explicitement.

Le handle propose `state()`, `skills()`, `useSkill(skillId, targetInstanceId)`, `flee()` et `completion`. Une vue montable fournit `dispose()` et éventuellement `render(state)`. L'adaptateur possède son cycle de vie, jamais un second timer de combat. L'IA est appelée par l'horloge officielle du Runtime. Tous les coûts, effets et timings proviennent des données normalisées.

## Vérification reproductible

```sh
COMBAT_LAB_ROOT=/chemin/vers/le/labo node --test tests/gens_capture_lab_runtime_v1.test.cjs
node tools/build_capture_lab_preview.mjs /chemin/vers/le/labo _site/capture-lab-preview
node --test tests/gens_capture_lab_runtime_browser_v1.test.cjs
```

Le checkout Combat doit être au SHA épinglé et propre. Le test navigateur nécessite Playwright avec Chromium et Firefox. Le workflow `capture-lab-runtime.yml` prépare ces prérequis et fournit l'artifact autonome `capture-lab-preview`. Servir son dossier par HTTP, puis ouvrir `/capture-lab-preview.html`.

Tests réels : énergie consommée une fois, pas de dégâts avant impact, KO et retour automatique, IA native, PV d'entrée et IDs Capture conservés, fuite, annulation pendant préparation, zéro timer après sortie, rejet des résultats tardifs/malformés et des formats incompatibles, capacités à durée nulle. En navigateur : gestes tactiles paysage, vraie victoire par deux actions, nouvelle rencontre et fuite, absence de requêtes vers une branche mouvante et sauvegarde locale témoin inchangée.

## État et limites

Ce lot prépare un raccord exécutable 1v1 et une preview opt-in. Il n'active pas encore le moteur dans le profil Monster Capture historique. La fixture reste une donnée d'essai unique sous `tests/fixtures`, jamais un catalogue de créatures de production. La vue est une projection minimale de PV/énergie/actions ; le raccord animations/FX et les réglages visuels auteur restent à faire.

Pas de persistance : la zone garde `persist:false`. Le contrat actuel retourne les PV ; le transport des statuts, énergie et cooldowns persistants, les réserves et l'éditeur devront être versionnés et testés avant activation en partie sauvegardée. Ne pas présenter cette preview comme une validation Android physique ou comme une livraison stable complète.

La base a deux CI générales rouges : Architecture [40517592344](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/40517592344), test `gens_phase9_capture_hub_entry_owner_transfer_v1.test.cjs`, et V114.11 [40517592320](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/40517592320), test `gens_phase6_survival_builtin_boundary_retirement_v1.test.cjs`. Toutes deux butent dans `restoreHistoricalHubSnapshot` (`gens_capture_team_roster_snapshot_v1.cjs`, appelé par la chaîne de reconstruction World) sur le blob Capture `17ba8e…` au lieu de `613b4a…`. Cet échec existe au SHA de départ inchangé. Aucun test n'est supprimé et aucun GREEN global n'est annoncé. Suivi : [#177](https://github.com/slyen4425-cloud/Zombicide-40k/issues/177), propriétaire des reconstructions historiques Capture, réévaluation le 28 octobre 2026 et avant promotion de #175 dans `main`.

## Résultat vérifié et reprise

CI dédiée [40523172022](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/40523172022) **SUCCESS** au SHA `313dbff58fa930223a3b7db0c049867fd87c4913` : huit tests Core réels, huit sentinelles existantes, build épinglé, Chromium + Firefox tactiles paysage, sauvegarde témoin préservée, artifact de preview disponible. Le runner Ubuntu 24.04 corrige l'incompatibilité initiale de Playwright 1.55 avec Ubuntu 26.04 ; aucune assertion du gameplay n'a été réduite. Le contrôle d'une touche de déplacement masquée pendant le combat inclut explicitement les éléments cachés pour vérifier qu'elle est désactivée.

La [PR #176](https://github.com/slyen4425-cloud/Zombicide-40k/pull/176) porte uniquement ce lot vers la branche #175. Point de reprise : `checkpoint/gensrpg-capture-lab-runtime-c2-green-2026-10-27`, créé après les mêmes contrôles sur le SHA documentaire final. GREEN strictement limité au lot C2 ; dette globale ci-dessus maintenue. L'[artifact autonome de référence](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/40523172022/artifacts/12741834407) contient les modules officiels et la page d'essai, à servir par HTTP.

## Prochaine étape et rollback

Après validation de ce lot : raccorder explicitement le profil réel au resolver des transferts canoniques, appliquer/persister le résultat via le propriétaire Capture et ajouter le test de reprise ; puis brancher la présentation officielle et élargir le format. Chaque évolution commence par son START.

Rollback du lot : revenir au checkpoint START ci-dessus. Aucun profil, sauvegarde, cache PWA ni fichier `index.html` n'a été modifié. Le labo reste au même SHA et le runtime historique conserve son parcours.
