# Phase 12 — Correction Dungeon Tactical V108 / panneau actions — 17/10/2026

**Statut : GREEN technique/CI.** Ce correctif résout le défaut reproductible de disparition des contrôles manuels du combat, **pas encore validé sur un vrai appareil Android**. La détection des monstres reste un autre sujet. Phase 12 OUVERTE, R06 non démarré.

## Constat utilisateur et bornage

Après un essai sur la preview externe R05, navigation entre modes OK, Dungeon avec détection ennemie peu fiable ; après première attaque, le joueur voyait défiler des résultats sans pouvoir choisir arme/objet ni voir les dés. L'utilisateur confirme que devoir se rapprocher de l'ennemi est **normal** et doit être conservé.

La CI R05 avait validé l'ouverture Tactical, non une attaque entière à portée. Diagnostic isolé sur branche `work/gensrpg-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17` avec START `checkpoint/gensrpg-start-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17`. [Test diagnostic 39014482141](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39014482141) : la partie Dungeon, rencontre, approche, panneau et dés fonctionnaient uniquement après un `V108.install()` forcé par le banc de test. **La branche diagnostic n'est pas la branche de correction.**

## Charte et source

- START correctif `checkpoint/gensrpg-start-phase12-dungeon-tactical-action-panel-rebind-2026-10-17` SHA `7ac97a36df9f31f2cc3f7640e857ffc59963574c`.
- Branche : `work/gensrpg-phase12-dungeon-tactical-action-panel-rebind-2026-10-17`.
- Source §26 : ZIP `c8.zip` / `index.html(18).txt`, **2 781 436 octets**, blob Git `485de2e6a08ffd89e4f1fb9410e40c938774d62f` = R05 GREEN. **Index identique avant/après correction**.
- Checkpoint final sur **le code exact `2ed333215a2b2f985b205daaf5fbc986314ecfe5`** : `checkpoint/gensrpg-phase12-dungeon-tactical-action-panel-rebind-green-2026-10-17`.

## Cause vérifiée et solution soustractive

Le renderer Tactical privé appelle son `render()` interne lors de l'ouverture, de la sélection de cible, du mouvement et des tours. L'extension V108 se branchait sur `GensRpgTacticalCombatV2Ui.render`, une fonction exportée que le renderer n'utilise pas systématiquement en interne. Le panneau `[data-v108-panel]` disparaissait. V108 indiquait `installed=true` même quand le panneau n'était plus monté ; le test diagnostique qui appelait manuellement `V108.install()` masquait le défaut.

Correction bornée :
- `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js` : utiliser le hook **déjà existant** `Ui.onAfterRender()` (abonnement unique, désabonnement au teardown), sans création d'une nouvelle autorité, d'observateur global ou de rafraîchissement périodique.
- `assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js` : garantir l'installation du même propriétaire V108 avant le premier `openCurrentEncounter()` du combat.
- `assets/gensrpg/tactical/entry-v1.js` : l'essai intermédiaire non probant est retiré ; le blob historique `b7a314998774b2528717b80b6a5a2887d18ed7b1` est restauré.
- `service-worker.js` : nouvelle identité du cache PWA. Aucune valeur gameplay, portée, dégâts, IA, sauvegarde ou règle D100 modifiée.

## Preuves finales au même SHA

- [Diagnostic browser Dungeon complet 39016355366](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39016355366) **SUCCESS** : Chromium tactile 412×915, chargement local et preview externe simulée depuis le même commit. Chaque variante réussit 13 étapes de boot/session/rencontre/tactical/cible/**approche légitime**/panneau visible/sélection d'attaque/**deux dés visibles**/confirmation/tour ennemi avec dés/retour au héros avec commandes. Le test ne force PLUS `V108.install()`. Aucun nouvel événement d'attaque pendant l'attente du bouton Continuer.
- [Architecture + Chromium 39016355312](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39016355312) : **SUCCESS**, `architecture-sentinels` + `browser-sentinel`.
- [Firefox 39016355389](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39016355389) : **SUCCESS**.
- [Tactical dock 39016355354](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39016355354) : **SUCCESS**, `dock-contract`, `dock-chromium`, `dock-firefox`.
- **7 checks SUCCESS sur le commit `2ed333215a2b2f985b205daaf5fbc986314ecfe5`**. Pas de merge `main` ; laboratoires intacts.

## Limites / suite

Le test utilise une **rencontre de test déterministe sur la véritable UI Dungeon**, pas toutes les rencontres naturelles. La détection initiale des monstres reste signalée comme irrégulière ; un lot de diagnostic distinct est nécessaire. La correction du panneau et des dés est GREEN technique, **non validée manuellement sur Pixel Android**, ni sur PWA installée/offline ni avec sauvegardes privées.

Pour essai manuel du correctif : [preview fixe R05 + correctif au SHA GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/2ed333215a2b2f985b205daaf5fbc986314ecfe5/preview.html). Le site GitHub Pages habituel `main` reste sur la version gelée. L'utilisateur ne doit pas confondre preview isolée et publication officielle.
