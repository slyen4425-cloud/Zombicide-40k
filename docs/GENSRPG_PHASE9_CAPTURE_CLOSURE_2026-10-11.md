# GenSrpG — Clôture fonctionnelle de la Phase 9 Monster Capture

Date : **11 octobre 2026**. Décision : **Phase 9 clôturée fonctionnellement**, sous réserve du gate documentaire final CI sur le SHA de clôture ; **Phase 10 non ouverte**. Aucun changement de runtime sur ce lot de sortie.

## Gouvernance / provenance

- Dernier runtime **GREEN fonctionnel validé par l'utilisateur** (« Test validé ») : `checkpoint/gensrpg-phase9-capture-combat-core-extraction-green-2026-10-11`, `9ad6a3b0a8b54e6798d095e027f1770eca54f52b`.
- Base et checkpoint du lot preuve : `checkpoint/gensrpg-start-phase9-capture-exit-proof-2026-10-11` au même SHA, branche `work/gensrpg-phase9-capture-exit-proof-2026-10-11`.
- Résultat des tests A/B renforcés : `edab672d914f929becfdba93dbfd33638b75b6ff`. Checkpoint technique immuable `checkpoint/gensrpg-phase9-capture-exit-evidence-technical-green-2026-10-11` sur ce SHA.
- Triple CI sur le même SHA : Architecture avec Playwright Chromium [38149307335](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38149307335), Firefox [38149307324](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38149307324), Tactical Dock [38149307332](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38149307332), toutes **SUCCESS**, y compris les étapes navigateur « Capture seul », « reprise sans Dungeon » et « Save & Quit puis seconde session ».
- Production `main` restée immobile : `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; laboratoires Combat et Exploration intacts ; ni merge divergent ni Phase 10.

## Critères de sortie

| Axe | Preuve retenue | État |
|---|---|---|
| A — Démarrage autonome | `tests/gens_phase9_capture_axis_a_no_dungeon_runtime_browser_v1.test.cjs` : Capture comme unique module Shell actif, identité propre, état Dungeon absent, exploration jour 1→2 et victoire Capture. L'entrée publique Survie `assets/gensrpg/survival/entry-v1.js` n'expose que des règles de vagues pures, sans lancement de session Survie active dans ce parcours. | PROUVÉ pour l'activation du runtime |
| B — Équipe/Exploration/Combat/Reprise | `tests/gens_phase9_capture_axis_b_clean_resume_browser_v1.test.cjs` : partie réellement créée depuis l'UI, équipe de créatures, monde jour 2, combat moteur Capture/victoire/retour, page close puis recréée, restauration sans sauvegarde Dungeon, jour 3, **second combat moteur Capture avec victoire et retour Hub**, persistance conservée. Les adversaires sont déterministes pour garantir une sentinelle stable, sans moteur de combat mocké. | PROUVÉ pour le parcours de session |
| C — Fermeture et lifecycle | `tests/gens_phase9_capture_axis_c_shutdown_owner_browser_v1.test.cjs` : bouton Save & Quit Capture propriétaire, menu Shell remis au premier plan, UI Capture et overlays fermés, zéro animation différée propriétaire en attente, contrôle unique, reprise sur la même page et second Save & Quit sans Dungeon. `GensCaptureV1.stop()`, `SessionStart.stop()` et `HubEntry.leaveWorld()` existent et sont raccordés. | PROUVÉ pour arrêt/réouverture de session |

### Limites des preuves — ne pas survendre

1. Les scripts hérités peuvent rester **chargés mais inactifs**. Le critère A demande l'absence **d'activation** de runtime privé Dungeon/Survie, pas leur disparition physique de tout le bundle historique. La preuve d'exclusivité repose sur le Shell actif Capture, l'absence de runtime/état Dungeon créé et le provider Survie non activé, et non sur l'absence de tous les octets historiques en mémoire.
2. Les scénarios de combat déclenchent les **vraies fonctions Capture**, mais configurent l'adversaire/initiative en mode test pour garantir la victoire ; ce ne sont pas des assertions exhaustives du hasard des rencontres ni de l'équilibrage. La validation smartphone utilisateur a été obtenue sur le même runtime, avant ce lot de preuves.
3. Les actions/UI Capture de combat et certaines règles XP/récompenses et options demeurent dans le **propriétaire historique inline**. Aucune deuxième autorité active ni dépendance runtime Dungeon/Survie n'a été démontrée par ces tests. Cette dette de découpage physique est reportée au chantier approprié (notamment Phase 12), et n'est pas un motif de refactor sans anomalie.
4. La fermeture prouvée concerne les **états et effets propriétaire Capture** et la non-interférence visible. Elle ne constitue pas une preuve d'absence universelle de code global dormant dans l'application entière.

## Propriétaires et intégrité

- Shell : navigation générale et module actif. Capture : entrée, session, Hub, Monde/Exploration, Équipe/Réserve (**19 fonctions**), Combat Core (**39 fonctions**) et état de bataille. Core : services partagés et persistance. Dungeon, Survie, PvP, Tactical : non propriétaires des actions Capture.
- `assets/gensrpg/capture/module-contract-v1.json` conserve `partial-runtime-loaded` pour décrire **la dette de découpage physique**, et ne doit pas être confondu avec le gate **d'autonomie fonctionnelle** de Phase 9.
- Ancienne photographie du 9 octobre conservée sans falsification : `docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-09.json` (`phaseExitReady: false` à cette date). Source actuelle faisant autorité : `docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-11.json`.
- Pas de consultation ni édition de `index.html` dans ce lot, conformément au §26 ; `main`, gameplay, bibliothèques de créatures, sauvegardes et laboratoires préservés.

## Clôture et reprise future

Un **unique lot de preuves**, sans code runtime, solde les axes. Une fois la CI du commit documentaire de clôture elle-même GREEN, fixer le checkpoint final `checkpoint/gensrpg-phase9-capture-exit-green-2026-10-11` au SHA exact de cette documentation. Aucune validation manuelle additionnelle de gameplay n'est imposée puisque le runtime testé reste byte-identique au GREEN validé.

**Phase 9 terminée fonctionnellement ; Phase 10 non entamée.** Le futur chantier doit ouvrir son propre checkpoint de départ, respecter la charte et ne peut pas être confondu avec les travaux de laboratoires.

## Avenant du 11 octobre 2026 — Quatrième vignette du Hub racine

L'état de ce document, écrit avant la vérification de la position visuelle du module dans l'accueil, prouvait l'autonomie **fonctionnelle interne**. Le contrôle utilisateur a identifié un dernier critère d'acceptation : afficher Capture directement au premier niveau du Hub plutôt que dans la famille `adventure`.

Ce point a été corrigé via le chantier gouverné `work/gensrpg-phase9-capture-root-hub-2026-10-11`, à partir du checkpoint `bf6d6536fe013d9339a9790f6565a98699440f63`, avec le vrai fichier `a1.zip` préalablement vérifié selon la charte §26 (blob d'origine `b64eae3650081af624155c8a4b8e47e4a1791658`). Le code `53bab4060107683eb8e0f3159201ed3844849474` ajoute la vignette racine Monster Capture et sa famille de mondes dédiée ; Survie, Dungeon et PvP restent isolés. L'utilisateur a confirmé « Parfait ! » après visualisation. Le gate final demeure soumis à une **triple CI sur le SHA définitif** ; voir `docs/GENSRPG_CURRENT_WORK.md` pour le checkpoint. La dette de découpage physique du monolithe et le lancement de Phase 10 demeurent séparés.

**Validation utilisateur de l'avenant Hub racine :** « Test validé » le 11 octobre 2026. Deux anciennes sentinelles transversales (victoire/reprise puis frontière Dungeon Builder) ont été réalignées avec le sélecteur de famille à quatre modules. Le checkpoint final sera posé seulement après triple CI SUCCESS sur un seul SHA ; consulter `docs/GENSRPG_CURRENT_WORK.md` pour la référence définitive.
