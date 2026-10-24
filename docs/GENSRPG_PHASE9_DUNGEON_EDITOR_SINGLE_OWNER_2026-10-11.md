# Phase 9 — Propriété unique de l'éditeur Dungeon dans le Shell

11 octobre 2026. **Statut** : correctif structurel appliqué ; triple CI finale et validation utilisateur à confirmer.

## Cause et remplacement du correctif initial

Le commit `5faf9614` utilisait deux masquages Capture dans `applyModeEditorVisibility` et `syncEditorHubForActiveFamily` et une troisième garde indépendante sur `openDungeonAdvancedEditor`. Bien qu'une triple CI ait passé, cette multi-écriture de l'accès à l'éditeur enfreignait la charte §§3, 17–21. Ce checkpoint technique précédent n'est donc pas une validation fonctionnelle de la séparation.

## Gouvernance

- Point de départ : `6ce7e0a2cf3613a02629f4d5c20237a01cbcc57e`, trois CI SUCCESS (38094709779, 38094709768, 38094709816).
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-dungeon-editor-single-owner-2026-10-11`.
- Branche dédiée : `work/gensrpg-phase9-dungeon-editor-single-owner-2026-10-11`.
- Source index charte §26 : ancien fichier utilisateur 7 958 968 octets/blob `42583858...` + patch Git `5faf9614` reconstitués, puis **empreinte exacte vérifiée** contre le blob source `d19fb899e646ee97ec21d055b5271ac2cbba91a2`, 7 959 154 octets.
- Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Propriété cible

Une méthode de capacité `gensShellDungeonEditorAllowed()` appartient à Shell. Elle lit le profil actif et délègue la classification Capture à `GensCaptureV1.isProfile()` (propriétaire préexistant). La vue `applyModeEditorVisibility()` est la **seule fonction écrivant la visibilité** du bouton `dungeonAdvancedEditorBtn`. L'écriture concurrente dans `syncEditorHubForActiveFamily()` est **supprimée**. L'entrée réelle `openDungeonAdvancedEditor()` réutilise exactement la même capacité Shell. Pas de fallback vers `gensMode151` (runtime optionnel dans certains parcours) ni d'autre classificateur Capture.

Aucun générateur copié dans Capture ; aucun overlay de dissimulation, wrapper, timer, listener, second runtime, écriture de sauvegarde ou règle de combat introduit. Les anciens critères visuels globaux « Aventure » non relatifs au contrôle du bouton n'ont pas été refondus dans ce lot. Les profils/biomes/rencontres de Capture, Dungeon Builder et ses pièces, Core, Survie, Tactical, PvP, Shell navigation et PWA restent protégés.

## Résultat et tests

- Commit de code `7221f062e87e9ce9f85e04fb5db658240e988384`, seul `index.html`.
- Index : **7 959 089 octets**, Git blob `e777d484ab10049650440fee04f47cf2dfdc3043`, réduction de 65 octets par rapport à la rustine.
- Script réversible `tools/gensrpg_phase9_dungeon_editor_single_owner_apply.py` : rollback byte-exact vers `d19fb899...`.
- [Application GitHub Actions 38108342391](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38108342391) **SUCCESS** : 5 cas de mode, absence de V151, test d'un seul écrivain, anciens snapshots exacts, seed/monde Capture/lieux créés par l'utilisateur, navigateur réel Capture -> éditeur sans Dungeon -> refus direct -> vrai Dungeon -> constructeur et Room Creator actifs, reprise Capture.
- Les itérations RED antérieures ont révélé les assertions trop larges, les tests HEAD exécutés avant commit et l'absence de V151 dans une composition navigateur : tous traités avant ce SHA, sans masquer leurs résultats.
- Triple CI Architecture+Browser, Firefox, Tactical à valider sur le SHA documentaire ; puis **test utilisateur** avant checkpoint GREEN final. Ne pas ouvrir Équipe/Réserve ou Phase 10 auparavant.

