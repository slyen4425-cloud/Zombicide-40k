# Phase 9 — Capture / Dungeon : frontière de l'éditeur de cartes

Date : 11 octobre 2026. Chantier : `work/gensrpg-phase9-capture-dungeon-editor-boundary-2026-10-11`.

## Demande utilisateur et règle

La carte **Dungeon** du hub d'édition Capture était héritée de la famille « Aventure ». Le créateur Dungeon n'a jamais été dupliqué dans Capture. L'utilisateur confirme : **ne pas créer de copie du générateur Dungeon dans Capture**, préparer à terme l'intégration du World Builder autonome, conserver les lieux, biomes, événements et sauvegardes Capture.

## Base, propriétaire et sécurité

- Base testée trois CI SUCCESS : `2e6c01aa0d7ce4ebe061a436b2753940b1750e03` ; Architecture+Browser 38091868762, Firefox 38091868838, Tactical 38091868770.
- Checkpoint initial créé **avant mutation** : `checkpoint/gensrpg-start-phase9-capture-dungeon-editor-boundary-2026-10-11` sur cette base.
- Source `index.html` fournie par l'utilisateur dans le fil, vérifiée Git blob `42583858f0df0f1b3bcd65ca6a282c8ba27b1c07`, 7 958 968 octets, conforme §26.
- Bloc corrigé : présentation de `#dungeonAdvancedEditorBtn` dans `applyModeEditorVisibility()` et `syncEditorHubForActiveFamily()`, plus garde directe `openDungeonAdvancedEditor()` fondée sur `GensCaptureV1.isProfile(activeProfile)`.
- **Données et mécaniques inchangées** : World/Exploration Capture, Dungeon Builder Dungeon, équipes/combats, stockage, Shell/navigation, Survival, PvP, Tactical, PWA, profils, éditeurs partagés.
- Le thème historique Adventure/Dungeon et la visibilité des autres éditeurs restent hors périmètre. **Pas de duplication du générateur.**
- Le dépôt `main` reste à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Migration physique vérifiée

- Outil réversible `tools/gensrpg_phase9_capture_dungeon_editor_boundary_apply.py` : 3 remplacements exacts, avec refus si la taille/l'empreinte ne correspondent pas.
- Index corrigé : **7 959 154 octets**, blob Git `d19fb899e646ee97ec21d055b5271ac2cbba91a2` ; delta **+186 octets**.
- Restauration octet-à-octet vérifiée et source Monde/Exploration antérieure toujours reconstituable via `tests/helpers/gens_capture_editor_boundary_snapshot_v1.cjs`.
- Commit runtime : `5faf9614e49668dcae2a56d9ac85265bbf3a6349`.
- Workflow d'application [38094461562](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38094461562) **SUCCESS**, y compris reprise des tests historiques et navigateur réel.
- Test navigateur modifié : `tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs`, vérifie **Capture -> éditeur -> carte Dungeon invisible -> appel direct refusé -> retour -> véritable Dungeon -> Dungeon Builder visible et modal ouverte**. Première tentative bloquée uniquement par un sélecteur non unique de Retour, corrigé et relancée avec succès.
- La suite vérifie également `gens_phase9_capture_world_physical_extraction_v1.test.cjs`, `gens_phase9_capture_seed_physical_extraction_v1.test.cjs`, `gens_phase9_capture_world_creator_preservation_v1.test.cjs`, le rollback du monde et le runtime graph.

## Validation et suite

- Triple CI **Architecture+Browser, Firefox, Tactical** à vérifier sur un même SHA après la mise à jour des documents (GITHUB_TOKEN push de workflow n'émet pas automatiquement une nouvelle run).
- Aucune validation manuelle utilisateur de l'interface corrigée ne doit être inventée. Checkpoint technique seulement après les trois CI ; checkpoint final GREEN après gate manuel si requis par la charte.
- Preview au SHA documenté après validation ; puis lot physique **Équipe / Réserve Capture** distinct, avec checkpoint de départ et source `index.html` exacte selon §26.
