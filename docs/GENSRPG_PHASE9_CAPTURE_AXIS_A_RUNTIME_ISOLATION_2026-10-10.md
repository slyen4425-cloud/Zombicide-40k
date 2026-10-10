# GenSrpG — Phase 9 — Axe A : diagnostic navigateur runtime Capture seul

Date de départ : 10 octobre 2026. **Statut de ce document : PROTOCOLE D'OBSERVATION, PAS VALIDATION DE L'AUTONOMIE.**

## Gouvernance

- **Dernier checkpoint GREEN** : `checkpoint/gensrpg-phase9-capture-exit-gate-green-2026-10-10`, SHA `a556eeb0f6798e1cf210eca5896ac75231efc1c6` ; GREEN d'audit uniquement, `phaseExitReady:false`.
- **Checkpoint de départ** : `checkpoint/gensrpg-start-phase9-capture-axis-a-runtime-isolation-2026-10-10`, même SHA `a556eeb0f6798e1cf210eca5896ac75231efc1c6`.
- **Branche de travail** : `work/gensrpg-phase9-capture-axis-a-runtime-isolation-2026-10-10`.
- **Production `main` gelée** : `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; zéro merge.
- **En conflit potentiel, hors périmètre** : `work/gensrpg-phase9-capture138-legacy-start-retirement-2026-10-09` et `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09`, branches divergentes. Interdiction de les fusionner / modifier ici.

## Question binaire visée par l'axe A

Un navigateur vierge, sans partie Dungeon créée ni état `gensrpg_dungeon_runtime_v2`, peut-il lancer Capture, avancer dans le monde et exécuter un vrai combat jusqu'au retour au Hub tout en gardant le runtime privé Dungeon **absent ou inactif** et le runtime Survie **inactif**, sans emprunter une identité Dungeon ?

Le mot « chargé » n'est pas synonyme d'« actif » : les scripts historiques peuvent être chargés sans piloter le mode. Le critère vise la **création/activation réelle d'un runtime privé**, la capture d'autorité ou l'utilisation du mode Dungeon.

## Scope, propriétaires, protections

- Mode : Capture. Propriétaire public canonique : `assets/gensrpg/capture/entry-v1.js`; session : `session-start-v1.js`; Hub : `hub-entry-v1.js`. Shell : routage seulement, Core : services génériques.
- Réutiliser les vrais parcours déjà prouvés dans `tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs` et `tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs`.
- Autorisé : **nouveau test Chromium navigateur autonome**, branchement sentinelle CI, rapport factuel RED/GREEN et état des clés/du DOM Capture/Dungeon aux étapes.
- Interdit : modification de `index.html`, de tout runtime, éditeur, sauvegarde, Shell, Core, Dungeon, Survie, Tactical, PvP, projets laboratoires, données de profils, ou création d'un deuxième propriétaire. Toute future inspection du gros index doit suivre charte §26 et le SHA exact.
- Critère de résultat : si un résidu Dungeon apparaît, le test doit le signaler clairement **sans effacer le runtime fautif** afin d'identifier le premier déclencheur. Une UI Dungeon simplement masquée ne suffit pas.
- Le test historique avec une vraie ancienne sauvegarde Dungeon reste inchangé : il prouve **une autre frontière**, la non-interférence avec une sauvegarde existante.

## Parcours cible

1. Démarrer avec un contexte navigateur vierge, `localStorage.clear()` puis vrai reload via `preview.html`, et constater aucune clé de runtime Dungeon. Aucun scénario de mise en place d'une partie Dungeon.
2. Utiliser l'UI réelle : choisir Monster Capture, dresseur et créature, lancer la session.
3. Relever contexte canonique `gensMode151() === "capture"`, `isDungeonMode() === false`, Hub visible, écran Dungeon caché **ET** clé `gensrpg_dungeon_runtime_v2` absente avant/après ; éviter les faux diagnostics à base de CSS seulement.
4. Passer au jour 2 par l'UI, vérifier persistance du monde Capture et toujours aucune création de runtime Dungeon.
5. Former un combat avec le **vrai moteur Capture existant**, effectuer une attaque, vérifier victoire et retour Hub, plus absence de runtime Dungeon créé.
6. Ne **pas** prendre pour preuve de fermeture/reprise : elles appartiennent aux axes C/B séparés.
7. Si échec, noter l'étape et les symptômes exacts; aucune rustine ni suppression indiscriminée.

## Gate

Le RED qui identifierait une dépendance privée à Dungeon est un résultat de diagnostic, pas une raison de falsifier le test. CI Architecture+Browser, Firefox et Tactical obligatoires avant checkpoint GREEN du lot. **Ne pas qualifier Phase 9 comme achevée parce que seul l'axe A serait validé.**
