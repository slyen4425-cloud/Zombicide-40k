# GenSrpG — Phase 5 / module-launch S2 — provider Survival

Date : 2026-09-24

## Base sûre

- S1 validation utilisateur : « cela semble correct ».
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-s1-shell-registry-green-2026-09-24`.
- SHA exact :
  `e12b71937521b24748a820b3e6698eed0b191d42`.
- Runtime S1 :
  - taille `8171576` octets ;
  - blob `12be0fdbaa5c05f7852933b48a3dd5df09da6145`.
- Checkpoint de départ S2 :
  `checkpoint/gensrpg-start-phase5-module-launch-s2-survival-provider-2026-09-24`.
- Branche :
  `work/gensrpg-phase5-module-launch-s2-survival-provider-2026-09-24`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Le fichier runtime exact S1 est disponible localement et son blob a été reverifié avant inspection.

## Mission unique

Raccorder **uniquement Survival** au contrat public :

`GensShellModuleLaunchV1.startModuleSession("survival")`.

S2 ne change pas encore le chemin de lancement de production.

Le bouton historique continue d'appeler :

`startConfiguredGame()`.

Aucun propriétaire historique n'est retiré.

## Pré-audit du chemin Survival

Le propriétaire natif Shell :

`async function startConfiguredGame()`

est chargé avant les cinq wrappers historiques.

Pour Survival, la chaîne historique est transparente :

1. `captureFix135` ne modifie que le contexte Capture ;
2. `captureFix138` ne fait son post-traitement qu'en Capture ;
3. `captureFix139` délègue hors Capture ;
4. `gensDungeonCore01Js` délègue hors Dungeon ;
5. `dungeonCore200Rebuild` délègue hors Dungeon.

Donc, lorsque le module actif est `survival`, le comportement final repose bien sur
le propriétaire natif Shell.

## Raccord cible

Après le propriétaire natif `startConfiguredGame`, capturer sa référence avant tout
wrapper historique :

`const gensSurvivalNativeStartV1=startConfiguredGame;`

Puis définir un provider routing-only :

`gensSurvivalStartModuleSessionV1`.

Contrat :
- refuser si `gensShellActiveModuleV1() !== "survival"` ;
- appeler uniquement la référence native capturée ;
- retourner `true` lorsque Survival a pris en charge la demande ;
- ne contenir aucun DOM, stockage, observer, listener, timer, retry ou polling.

Enregistrement :

`window.GensShellModuleLaunchV1.register("survival", gensSurvivalStartModuleSessionV1)`.

## Interdictions S2

- ne pas modifier le corps historique de `startConfiguredGame` ;
- ne pas modifier son bouton/callsite de production ;
- ne pas retirer `captureFix135` ;
- ne pas retirer `captureFix138` ;
- ne pas retirer `captureFix139` ;
- ne pas retirer `gensDungeonCore01Js` ;
- ne pas retirer `dungeonCore200Rebuild` ;
- ne pas raccorder Capture ;
- ne pas raccorder Dungeon ;
- ne pas raccorder PvP ;
- ne pas créer de second resolver ;
- ne pas déplacer de gameplay dans le registre Shell ;
- ne pas toucher aux QA différées.

## TDD RED

Sentinelle statique :
`tests/gens_phase5_module_launch_s2_survival_provider_v1.test.cjs`.

Elle exige :
- runtime exact S1 ;
- registre S1 intact ;
- capture de la fonction native ;
- provider Survival ;
- garde du module actif ;
- délégation native ;
- aucun provider Capture/Dungeon/PvP ;
- cinq wrappers historiques inchangés ;
- bouton production inchangé ;
- aucun appel production vers `startModuleSession`.

Sentinelle navigateur :
`tests/gens_phase5_module_launch_s2_survival_provider_browser_v1.test.cjs`.

Elle reprend le vrai setup Survival déjà validé mais déclenche le lancement par :

`GensShellModuleLaunchV1.startModuleSession("survival")`.

Le test historique
`gens_survival_shell_launch_browser_v11411.test.cjs`
reste également présent et continue de prouver le chemin legacy.

## Critère de sortie

Avant GREEN :
1. RED acquis sur absence du provider ;
2. patch runtime minimal ;
3. sentinelle S2 statique GREEN ;
4. ancien lancement Survival navigateur GREEN ;
5. nouveau provider Survival navigateur GREEN ;
6. Architecture + navigateur complet GREEN ;
7. Firefox GREEN ;
8. Tactical Dock GREEN ;
9. preview téléphone ;
10. validation utilisateur avant S3.

Aucun merge sur `main`.


## Candidat runtime S2

RED acquis :
- SHA `a07bbbe65bbb9e3f1bd84e70a9c82d9ac4147007` ;
- Architecture run `35959014200` ;
- échec unique attendu :
  `Raccorder le provider Survival module-launch S2` ;
- assertion RED :
  absence de la référence native capturée.

Commit runtime :
`3df4297e55b0d18518623ff248401b78f5dac8b5`.

Runtime :
- taille `8171879` ;
- blob `cacee0bb95d8c046264668c1ccc721fc88bbed2d` ;
- diff `index.html` : +8 lignes uniquement.

Ajout :
- `gensSurvivalNativeStartV1` capture le propriétaire natif avant les wrappers ;
- `gensSurvivalStartModuleSessionV1` refuse tout module autre que Survival ;
- le provider appelle uniquement la référence native ;
- enregistrement uniquement de `survival`.

Inchangés :
- bouton production `startConfiguredGame()` ;
- propriétaire natif ;
- cinq wrappers historiques ;
- aucun provider Capture/Dungeon/PvP.

Le mécanisme one-shot a été supprimé dans le même commit runtime.

### Validation en cours

Les cartographies et sentinelles qui suivent l'empreinte du runtime courant sont
réalignées sur `8171879 / cacee0bb...` sans changement d'assertion métier.

Le SHA documentaire descendant de ce candidat doit encore passer :
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

Aucun checkpoint GREEN avant cette triple validation.


## RED structurel — ordre d'installation du provider

La première validation navigateur S2 a détecté une régression réelle avant même le
nouveau scénario provider.

Run :
`35959902449`.

Le scénario historique
`gens_survival_shell_launch_browser_v11411.test.cjs`
échoue pendant le chargement du Shell.

Cause :
`window.GensShellModuleLaunchV1.register("survival", ...)`
était exécuté juste après le propriétaire natif, alors que
`GensShellModuleLaunchV1` n'est exposé que plus loin dans le même script.

Erreur observée :
`TypeError: Cannot read properties of undefined (reading 'register')`.

Décision :
- conserver la capture native et la fonction provider près du propriétaire Survival ;
- déplacer uniquement l'enregistrement après
  `window.GensShellModuleLaunchV1=Object.freeze(...)` ;
- l'enregistrement doit rester avant `goMenu()` ;
- aucune temporisation/retry/wrapper de compatibilité n'est autorisé.

La sentinelle S2 est renforcée pour rendre cette mauvaise position RED.


## Candidat S2 corrigé — ordre d'enregistrement

Le RED structurel a été acquis au SHA :
`30f3c682a1ab9d6377f1696940dbda226b09b1f7`.

Correction runtime appliquée :
- commit runtime bot : `ed37caac80206d2cf90cdf11be7ad191025e498c` ;
- nettoyage des mécanismes temporaires : `16eee755746ab614271de53e7b379d55d9f11337` ;
- taille : `8171879` ;
- blob : `7601760f7a635094d4f687b725a639b5728e93b4`.

Changement par rapport au premier candidat :
- aucune nouvelle logique ;
- la ligne d'enregistrement Survival est déplacée après
  `window.GensShellModuleLaunchV1=Object.freeze(...)` ;
- elle reste avant `goMenu()`.

La définition du provider reste près du propriétaire natif et ne contient toujours
aucun DOM/stockage/timer/observer/retry.

Les empreintes historiques qui suivent le runtime courant ont été réalignées sur
`7601760f...`.

Les mécanismes temporaires sont absents avant CI finale.
