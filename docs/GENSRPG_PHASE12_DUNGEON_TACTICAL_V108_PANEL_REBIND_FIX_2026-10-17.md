# GenSrpG / Phase 12 — Correctif du panneau Tactical V108 — 17/10/2026

**GREEN technique/CI, pas encore GREEN utilisateur.** Ce correctif répond à la régression de commandes Dungeon observée sur preview R05. Phase 12 R06 reste suspendue ; `main` non modifiée.

## Bornage / charte

- Branche unique : `work/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17`.
- Checkpoint START : `checkpoint/gensrpg-start-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17` au commit `7ac97a36df9f31f2cc3f7640e857ffc59963574c` (diagnostic GREEN de caractérisation, non correctif).
- Commit **code certifié** : `32b5120f26fe8d01dcd6c602b82630fa27bbf23e`.
- Checkpoint **GREEN** : `checkpoint/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-green-2026-10-17` pointe exactement sur `32b5120f26fe8d01dcd6c602b82630fa27bbf23e`.
- Aucune édition du gros `index.html`; source R05 et blob inchangés (`485de2e6a08ffd89e4f1fb9410e40c938774d62f`). Aucun changement sur `main`, laboratoire combat ou exploration.

## Cause démontrée et correction

Le module V108 de contrôles Attaque / Arme / Objet s'installait durant le chargement initial, alors que l'UI Tactical V2 est chargée à la demande lors du premier combat. Son état `installed=true` pouvait coexister avec `ui.render` non raccordé. Après sélection d'ennemi ou rapprochement, le nouvel affichage Tactical supprimait le panneau et le système d'attaque historique réapparaissait, avec des contrôles incohérents.

Périmètre exact :
1. `assets/gensrpg/tactical/entry-v1.js` effectue **un raccord explicite de V108 au moment où l'UI privée est prête**.
2. `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js` utilise **l'API existante `GensRpgTacticalCombatV2Ui.onAfterRender`** pour réinjecter un panneau unique après chaque rendu, avec désabonnement au `dispose`. Pas d'observateur global, pas de nouveau moteur ni de double autorité.
3. `tests/gens_phase12_dungeon_combat_preview_regression_diagnostic_browser_v1.test.cjs` n'appelle **plus V108.install() artificiellement**. Les vrais boutons Attaquer, choisir une arme et sélectionner un objet doivent rester présents.

Le rapprochement vers l'ennemi, les règles de portée, les attaques, l'IA, la résolution et l'animation des dés ne sont pas modifiés.

## Preuves CI au même commit `32b5120f26fe8d01dcd6c602b82630fa27bbf23e`

- [Architecture/Chromium — 39027235756](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235756) SUCCESS : `architecture-sentinels` et `browser-sentinel`.
- [Firefox — 39027235760](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235760) SUCCESS.
- [Tactical dock — 39027235759](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235759) SUCCESS : contrat, Chromium et Firefox.
- [Dungeon combat preview — 39027235758](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235758) SUCCESS : **local et externe émulé**, vraie session Dungeon, rencontre préparée, cible, rapprochement à portée de mêlée, panneau d'action visible avant/après les rendus, choix d'attaque visible, deux dés du héros et « Continuer » obligatoire, tour ennemi et ses dés avec confirmation obligatoire, absence de nouvelles frappes pendant attente de confirmation, aucune erreur JS.

**Sept check-runs GitHub SUCCESS sur le même SHA :** `architecture-sentinels`, `browser-sentinel`, `firefox-wall-zoom`, `dock-contract`, `dock-chromium`, `dock-firefox`, `preview-combat-browser-diagnostic`.

## Limites et statut utilisateur

Les tests navigateur Chrome mobile sont simulés. Supabase et QR CDN y sont délibérément indisponibles ; la preview externe s'affranchit du Service Worker et ne prouve ni l'installation PWA ni le hors-ligne. Pas encore de test manuel Pixel confirmé sur **cette** révision. La détection réelle des monstres jugée irrégulière constitue un **incident distinct** et ne doit pas être déclarée réparée.

**Prévisualisation épinglée sans fusion production :**
https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/32b5120f26fe8d01dcd6c602b82630fa27bbf23e/preview.html

Demander un essai sans compte ni sauvegarde personnelle : ouverture Dungeon, rencontre, approche, attaque à portée, panel Attaque/Arme/Objet, dés et confirmation de chaque tour ; noter tout écart de détection. R06 reste fermé jusqu'au retour.
