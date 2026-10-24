# Phase 9 — Capture : première extraction physique de la source V16.162

**Date :** 10 octobre 2026. **Périmètre :** seed officiel / données de vitrine, pas encore moteur Capture complet. Statut : extraction et parcours navigateur ciblés GREEN ; triple CI finale à confirmer.

## Gouvernance / preuve charte
- Base : `checkpoint/gensrpg-phase9-capture-axis-c-shutdown-owner-green-2026-10-10`, commit `74866ac8c824bc13fb6d44e3571f683b57af4769` (Architecture+Browser 38053501475, Firefox 38053501444, Tactical 38053501461 : SUCCESS).
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-physical-seed-extraction-2026-10-10`, SHA identique. Branche : `work/gensrpg-phase9-capture-physical-seed-extraction-2026-10-10`, aucun merge divergent, aucune écriture `main`.
- Source `index.html` utilisateur reçue auparavant, vérifiée : **8 165 438 octets**, Git blob `1a61147d5a32889fa85e6a09e846049103b9f0bf`; comparaison Git avec checkpoint confirmant même contenu avant travail. Règle 26 respectée.

## Transformation précise et réversible
- `<script id="builtinMonsterCapture162">[body]</script>` devient à la **même position** `<script id="builtinMonsterCapture162" src="assets/gensrpg/capture/builtin-seed-v1.js?v=1"></script>`.
- L'ancienne IIFE de seed est recopiée **sans changer un octet** : **189 500 octets**, blob `15721cc9d1f13368aee2d1ea2e0de22945ed3960`.
- HTML transformé : **7 975 990 octets**, blob `2f2edfa5a1e229e4630889e7f0d5442199e221eb`; réduction nette **189 448 octets**. Réinsertion du seed dans le tag d'origine redonne exactement le blob HTML initial.
- Aucun moteur monde/combat Capture déplacé à ce jalon. Le contrat Capture reste honnêtement `partial-runtime-loaded`.
- Les anciennes sauvegardes, IDs, réglages éditables, roster et capacités conservent les mêmes définitions et fusion non destructive. Aucun code de navigation Shell ni logique Dungeon/Survie/PvP/Tactical modifié.
- Action contrôlée de déplacement : [38056335519](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38056335519) SUCCESS, commit résultant `47f94f1fd5f4e8dfb956de61fec66a4c3321ee16`; tests navigateur vrais Capture B et C **avant** autorisation du commit. Workflow éphémère supprimé.

## Cartographie et sentinelles
- Sentinelle permanente `tests/gens_phase9_capture_seed_physical_extraction_v1.test.cjs` dans Architecture+Browser.
- Helper de lecture historique `tests/helpers/gens_capture_v162_legacy_snapshot_v1.cjs` reconstruit et vérifie le précédent index **octet par octet** ; les tests des patches 138/139 continuent ainsi d'exécuter les vraies expressions historiques, et le test physique plus les E2E protègent le `src` actuellement chargé.
- Mises à jour explicites du graphe Phase 2, du manifeste propriétaire et de la composition du runtime : un seul propriétaire domaine `capture`, ordre inchangé, nouveau script physiquement chargé.
- Tests requis avant checkpoint GREEN : Architecture+Browser, Firefox, Tactical Dock tous SUCCESS au **même SHA** ; vraie preview Capture avec test utilisateur ciblé. La production Pages/PWA reste inchangée.

## Suite bornée
Passer ensuite à l'extraction des propriétaires **monde/exploration, équipe/réserve et combat Capture** depuis les blocs encore embarqués, de manière progressive et sans recréation du gameplay. Respecter pour chaque responsabilité le protocole checkpoint → unique autorité → RED/parité → retrait ancienne autorité → triple CI → checkpoint GREEN. Phase 10 n'est pas démarrée.
