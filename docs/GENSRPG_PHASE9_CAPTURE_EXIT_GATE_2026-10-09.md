# Phase 9 Monster Capture — AUDIT DE SORTIE : trois axes décisifs

**Date de base :** 9 octobre 2026 · **Décision : PHASE 9 NON ENCORE VALIDÉE POUR SORTIE**. Ceci n'est **pas** une nouvelle liste illimitée de micro-lots : les critères et les preuves existantes déterminent exactement ce qui doit encore être démontré.

## 1. Sources et gouvernance

- Roadmap effective : `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`, section « Phase 9 — Séparer Monster Capture » : **Capture doit démarrer, fonctionner et se fermer comme module autonome de premier niveau, sans runtime Dungeon/Survie actif ni identité Dungeon fonctionnelle**.
- Charte `docs/GENSRPG_CHARTE.md` : frontières propriétaires, pas de multi-autorité ni couche de patch; tests du chemin réel ; checkpoint et source `index.html` sous règle 26.
- Base du lot : `d45f4d4d853289895b9d76ffc6a7eb8c284b7352` (documentation seulement après GREEN fonctionnel). Checkpoint de départ `checkpoint/gensrpg-start-phase9-capture-exit-gate-2026-10-09` ; branche `work/gensrpg-phase9-capture-exit-gate-2026-10-09`.
- **Dernier GREEN fonctionnel** : `checkpoint/gensrpg-phase9-capture138-delayed-hub-guard-green-2026-10-09`, SHA `3e47a393f9fca326bf9aab21a15ba4b4d315eddb`, CI Architecture+Browser `37995288162`, Firefox `37995288148`, Tactical `37995288208` **SUCCESS**, essai smartphone validé par l'utilisateur.
- Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`. **Aucune modification du runtime ou de l'index HTML dans ce lot**.
- Branches à ne pas fusionner : `work/gensrpg-phase9-capture138-legacy-start-retirement-2026-10-09` (divergente, même HTML) et `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` (lifecycle divergent).

## 2. Matrice de sortie : prouvé ≠ autonome

| Critère de la roadmap | État prouvé | Preuve concrète | Ce qui manque au critère de sortie |
| --- | --- | --- | --- |
| Identité et entrée publique Capture | **PROUVÉ** | `assets/gensrpg/capture/entry-v1.js` inscrit le provider `capture` dans Shell; E2E `gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs` | Ne pas refaire le Shell. |
| Initialisation session, Hub et retour écran | **PROUVÉ** | `session-start-v1.js`, `hub-entry-v1.js`, `screen-return-v1.js`; test du callback Capture138 + validation mobile | Ne pas redoubler les propriétaires. |
| Monde / exploration Capture | **PARTIEL** | E2E `gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs` ouvre le Hub, progresse **jour 1 → jour 2** et persiste l'état Capture | Parcours d'exploration complet avec propriété/runtime exclusivement Capture non encore démontré. |
| Équipe et combat Capture | **PARTIEL** | `gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs` crée un vrai combat via `captureStartBattleAutomatic`, fait une attaque réelle, gagne puis revient au Hub | Le combat existe et marche ; la propriété de toute la chaîne reste historique. Il faut tester l'absence d'autorité Dungeon active, pas le réécrire d'office. |
| Sauvegarde / reprise Capture | **PARTIEL** | Même E2E : reprend Capture après reload sans basculer vers le menu Dungeon | **Attention :** ce test commence volontairement par `startDungeonAndLeaveSavedRuntime(page)` puis vérifie que l'ancienne sauvegarde Dungeon est préservée. C'est une preuve de non-collision, **pas** un test avec runtime Dungeon absent. |
| Fermeture / teardown Capture | **NON PROUVÉ** | `session-start-v1.js`, `hub-entry-v1.js`, `screen-return-v1.js` exposent des `dispose()` partiels | L'entrée publique `GensCaptureV1` ne fournit pas encore une fermeture/teardown de session complète. Aucun scénario de fermeture et deuxième session autonome n'est établi ici. |
| Inactivité réelle de Dungeon et Survie pendant tout le cycle | **PARTIEL : parcours froid GREEN** | `module-contract-v1.json` décrit le module comme `partial-runtime-loaded`; les E2E montrent un mode Capture et une UI Dungeon masquée | Il faut une preuve explicite que les moteurs privés Dungeon/Survie ne sont ni nécessaires ni actifs durant **démarrage, exploration, combat, reprise ET fermeture**. Une UI masquée n'est pas une preuve suffisante. |

### Limite de preuve essentielle

Le dossier `assets/gensrpg/capture/` contient **quatre fichiers JS propriétaires de frontière** (`entry-v1.js`, `session-start-v1.js`, `screen-return-v1.js`, `hub-entry-v1.js`) et `module-contract-v1.json`, lequel déclare encore `partial-runtime-loaded`. Cela ne veut **pas** dire que le jeu Capture n'existe pas : le Hub, l'équipe et le combat réels fonctionnent actuellement via le runtime historique dans le gros HTML. Le défaut à résoudre est la **propriété et la preuve de l'isolation**, pas la recréation arbitraire du gameplay.

## 3. Plan borné : exactement trois axes critiques

**A — Indépendance en jeu.** Tester dans le navigateur réel un profil Capture sans `gameStyle="dungeon"`, démarrant sans session ni runtime Dungeon/Survie préexistant, puis explorer et combattre. Enregistrer les états des moteurs privés avant/après chaque étape. Si un propriétaire privé Dungeon intervient : isoler **uniquement** le seam avéré, RED réel, migration soustractive, régression quatre modules.

**B — Cycle métier complet.** Faire réellement : choix dresseur/créature → Hub/exploration → combat → victoire → sauvegarde → recréation page → reprise → nouvel événement ou combat. Sans construire de fausse sauvegarde Dungeon pour obtenir la session Capture. Conserver simultanément l'ancien E2E de non-collision (il couvre une autre garantie utile). **Ne pas dupliquer** système équipe, monde, combat ou sauvegarde si les propriétaires fonctionnent déjà.

**C — Fermeture et réouverture.** Prouver fermeture Capture depuis l'UI réelle, extinction des effets/session actifs, puis redémarrage Capture sans listeners/timers/état obsolète ni navigation Dungeon/Survie. Si un défaut est observé : raccorder un seul propriétaire de lifecycle Capture, `dispose()` idempotent, tests avec 2 sessions. **Coordination préalable obligatoire avec chantier lifecycle divergent**.

On peut **terminer la Phase 9** lorsque ces trois axes ont des preuves navigateur **GREEN sur un même SHA**, et que les tests existants (Shell, Capture, Dungeon, Survie, Tactical et reprise) restent verts, avec validation utilisateur. Il ne faut **pas** attendre d'avoir terminé les enrichissements de l'éditeur, les effets visuels, tous les assets et tous les laboratoires pour passer à la Phase 10.

## 4. Ce qui est explicitement reportable

Import de nouveaux assets/sons, animations et FX, contenu de créatures, confort d'éditeur, évolution des interfaces, intégration générale des laboratoires, refonte assets de Phase 11 et réduction du poids du HTML de Phase 12. Les traitements d'anciens wrappers ne deviennent obligatoires que s'ils empêchent réellement l'un des axes A/B/C.

## 5. Sentinel du présent audit

- `docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-09.json` : inventaire vérifiable machine par machine, sept critères, les trois axes critiques, état `phaseExitReady:false`.
- `tests/gens_phase9_capture_exit_gate_evidence_v1.test.cjs` : lit **les vrais fichiers** du contrat et des modules Capture et les tests navigateur de référence; verrouille l'exactitude du diagnostic et interdit une déclaration de sortie prématurée. Ce test peut être **GREEN alors que la Phase 9 reste non achevée** : il s'agit de la sincérité de l'audit.
- Ce lot ne lit/ne modifie pas `index.html`. **Règle 26** : tout futur travail exigeant le contenu exact devra demander le fichier correspondant au SHA courant, par permalink, puis vérifier taille/blob.
- Triple CI + checkpoint GREEN **de l'audit** obligatoires avant tout nouveau chantier. Ne pas confondre ce checkpoint documentaire avec une approbation de sortie de Phase 9.

**Conclusion :** l'essentiel de la navigation et le jeu historique Capture existent ; la sortie n'est pas justifiée tant que le cycle complet autonome et sa fermeture ne sont pas démontrés. Plutôt qu'un pourcentage trompeur ou un nombre de micro-lots inventé, la progression se mesurera désormais **3 axes validés sur 3**.


## Complément du 10 octobre 2026 — Axe A froid GREEN

Le [test Chromium mobile à froid 38023317474](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38023317474) montre **sept instantanés réels** (accueil, Capture lancée, exploration jour 2, combat, victoire, rechargement, reprise). À aucun moment une session Dungeon n'est créée dans `gensrpg_dungeon_runtime_v2` ni dans `gensrpg_dungeon_state_v1`. Après l'ouverture Capture, `GensShellModuleLaunchV1.activeModule()` vaut `capture`, `gensMode151()` vaut `capture`, `isDungeonMode()` reste faux. Les clés d'état privés Dungeon restent null. **Aucun Dungeon de contrôle n'a été lancé avant Capture**, à la différence des anciens tests de non-interférence.

Cette preuve fait passer le critère `noForeignRuntime` de **NON PROUVÉ** à **PARTIEL** dans la matrice JSON ; elle ne démontre pas l'absence de tous les appels privés Dungeon/Survie en mémoire, ni le teardown complet de Capture. Les trois axes A/B/C de la sortie restent ouverts dans la mesure nécessaire. Rapport détaillé : `docs/GENSRPG_PHASE9_CAPTURE_COLD_ISOLATION_E2E_2026-10-10.md`.
