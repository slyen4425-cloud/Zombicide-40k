# Phase 9 — Axe C — Fermeture autonome Capture

Date : 10 octobre 2026. **Résultat navigateur ciblé GREEN. Triple CI finale en attente sur commit intégrant la sentinelle permanente.**

## Gouvernance
- Branche `work/gensrpg-phase9-capture-axis-c-shutdown-owner-2026-10-10`, checkpoint de départ `checkpoint/gensrpg-start-phase9-capture-axis-c-shutdown-owner-2026-10-10` sur `b492ed66bc8e61f65c1c3bf81cd937f8f57f5129`.
- Production `main` : `e8681f9823573ced8aec59c8ddc47a72b02bc663`, inchangée.
- Archive utilisateur `indexj.zip` contrôlée : 8 165 438 octets, empreinte Git `1a61147d5a32889fa85e6a09e846049103b9f0bf`. Aucun changement HTML.
- Branches divergentes Capture138 et lifecycle non fusionnées.

## Premier RED, puis correction
La vraie UI du Hub n'exposait aucun contrôle direct « Sauvegarder et quitter » ; un test RED l'a reproduit (run 38052227337). Un second RED après ajout du contrôle a isolé la classe CSS historique `gens-pure-capture` qui forçait `display:block!important` sur le Hub pendant le retour Shell (runs 38052257697 et 38052361700). Aucun timer artificiel ni observer ajouté pour masquer ce défaut.

Propriétaire de fermeture : `GensCaptureV1.stop`. La sauvegarde du monde reste à `GensCaptureSessionStartV1.stop`, la navigation à l'ancien Shell et la libération de l'UI Capture (modales, classe CSS et requestAnimationFrame) à `GensCaptureHubEntryV1.leaveWorld`. Le contrôle reste unique à travers les reprises, son callback n'est pas dupliqué et aucune autre autorité n'est créée.

## Preuve navigateur réelle
[Run 38052459057](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38052459057) **SUCCESS** au SHA `8b708de9f95e41e0aec7f744752e2d4f053f6cd8`. Chemin : navigateur vierge → choix dresseur/créature → Hub jour 1→2 → combat réel, attaque, victoire → fermeture/recréation de page → vrai bouton Reprendre → jour 3 → clic « SAUVEGARDER ET QUITTER » → écran Shell → Reprendre **sans recharger la page** → jour 4 → seconde fermeture.

Assertions : monde et participants restaurés, menu et Hub cachés au stop, modales Capture fermées, `status().inWorld === false`, `pendingScrolls === 0`, contrôle permanent unique et caché après stop, `gensrpg_dungeon_runtime_v2` et `gensrpg_dungeon_state_v1` absents, `isDungeonMode()===false`. `z40k_session_active_v1` reste volontairement `1` afin de rendre « Reprendre » disponible ; ce marqueur de sauvegarde n'est pas l'état UI actif.

La sentinelle permanente ajoute `tests/gens_phase9_capture_axis_c_shutdown_owner_browser_v1.test.cjs` après le test axe B. L'ancien E2E avec une sauvegarde Dungeon est préservé. Une preuve de non-activation exhaustive de tous les anciens scripts Survie n'est pas revendiquée par ce seul run.

## Gate
CI Architecture+Browser, Firefox, Tactical Dock au même HEAD, puis checkpoint GREEN. Phase 9 globale uniquement après vérification finale des frontières et validation ciblée utilisateur. Ni assets ni éditeurs ni Phase 10 ne sont inclus dans ce lot.

## Clôture du lot C — triple CI GREEN (10 octobre 2026)

- Checkpoint final : `checkpoint/gensrpg-phase9-capture-axis-c-shutdown-owner-green-2026-10-10`, SHA **`74866ac8c824bc13fb6d44e3571f683b57af4769`**.
- Architecture + Browser : [38053501475](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38053501475) SUCCESS ; le navigateur a validé A, B, C, le parcours inter-module avec ancienne sauvegarde Dungeon et la preview externe.
- Firefox : [38053501444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38053501444) SUCCESS.
- Tactical Dock : [38053501461](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38053501461) SUCCESS.
- Test de contre-vérification ciblé sur la conservation Dungeon → Capture : [38053396300](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38053396300) SUCCESS. Un premier run Architecture + Browser avait montré un retour d'accueil intermittent dans ce parcours, non reproduit ensuite, sans suppression de la sentinelle.
- Test manuel : https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/74866ac8c824bc13fb6d44e3571f683b57af4769/preview.html ; essayer Capture → monde/combat → Sauvegarder et quitter → Reprendre → encore un jour → Sauvegarder et quitter. La validation utilisateur n'a pas encore été fournie.
- **Statut** : AXE C GREEN, pas une déclaration autonome d'achèvement complet Phase 9 au-delà des preuves instrumentées. Trois axes sur trois, reste la validation utilisateur et décision de sortie, sans élargissement artificiel aux FX, éditeurs, assets ou Phase 10.
