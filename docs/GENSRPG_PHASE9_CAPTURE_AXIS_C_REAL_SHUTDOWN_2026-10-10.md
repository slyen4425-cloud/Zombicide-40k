# Phase 9 — Axe C : caractérisation navigateur du vrai arrêt Capture

Date : 10 octobre 2026. **Ce jalon ne valide PAS la fermeture autonome avant observation et preuve.**

- **Base GREEN** : `checkpoint/gensrpg-phase9-capture-axis-b-clean-resume-green-2026-10-10` sur `0bc5e2348d195c8581509b76ce47f6c20d052318`, CI Architecture+Browser `38032288907`, Firefox `38032288895`, Tactical Dock `38032288898`, toutes SUCCESS.
- **Checkpoint de départ** : `checkpoint/gensrpg-start-phase9-capture-axis-c-real-shutdown-2026-10-10` sur 0bc5e2348d195c8581509b76ce47f6c20d052318. Branche : `work/gensrpg-phase9-capture-axis-c-real-shutdown-2026-10-10`.
- **Cible** : identifier le contrôle de sortie vraiment accessible depuis Capture après le parcours entier (dresseur, créature, Hub, jour 2, combat victoire, reload, reprise, jour 3) et séparer la navigation Shell du teardown de session.
- **Propriétaires** : entrée Capture `assets/gensrpg/capture/entry-v1.js`, session-start `session-start-v1.js`, Hub `hub-entry-v1.js`, écran `screen-return-v1.js`; Shell pour navigation seulement, Core pour stockage générique.
- **Protections** : aucun changement de `index.html`, Shell, runtime Dungeon/Survie, Capture gameplay, Core storage, imports/exports, Tactical, builders, PWA. Production `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- **Coordination** : branche parallèle `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` divergente et documentaire uniquement, non fusionnée. Pas de nouvel arrêt global ou deuxième autorité sans preuve RED.
- **Méthode** : nouvel essai Chromium mobile sur vraie preview en contexte vierge, puis scan des **éléments DOM visibles** des actions de sortie et relevé d'état des propriétaires publics, sans consulter le contenu exact du gros `index.html` (charte §26). À la suite, écrire le test définitif du **vrai clic de fermeture** ou signaler si aucun contrôle ne l'expose.
- **Risque** : `showGensRootHome()` est potentiellement une navigation, et `DungeonCore01.quit()` appartient à Dungeon : ni l'un ni l'autre ne doit être présenté comme un shutdown Capture sans test. Ne pas confondre fermeture de page/reload validée en axe B avec fermeture de session.
- **Gates** : test ciblé GREEN pour la caractérisation, puis pas de checkpoint GREEN de fermeture sans test explicite du cycle arrêt/réouverture et triple CI du HEAD final. Ne pas annoncer Phase 9 achevée.
