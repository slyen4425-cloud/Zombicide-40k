# GenSrpG Phase12 / Dungeon — Audit provenance des événements secondaires de salle (NON GREEN)

Date : 21 octobre 2026.

## État vérifié et respect de la charte

- Dernier code certifié : `checkpoint/gensrpg-phase12-dungeon-chest-reload-parity-green-2026-10-21`, SHA `7e82bf8e1b3235bc4ee8dcf2ce4535eb6d9e7aa7`, [CI 39582689512](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39582689512), deux jobs succès. Il protège l'identité et l'emplacement de coffres sans promettre stabilité de tous les événements.
- START §25 du nouveau lot : `checkpoint/gensrpg-start-phase12-dungeon-secondary-events-replay-2026-10-21` sur le même SHA, branche de travail `work/gensrpg-phase12-dungeon-secondary-events-replay-2026-10-21`.
- `index.html` non lu via connecteur ni modifié ; blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` (1 729 855 octets).
- Aucun correctif du runtime et aucun autre propriétaire modifié dans ce lot d'audit ; `main`, laboratoires, Survie, Capture, PvP, PWA protégés.

## Points de contrôle du code externe

- `assets/gensrpg/dungeon/core200-rebuild-v1.js` : `roomIntro` appelle la fonction de rappel `maybeEvent('room')` quand l'utilisateur ferme la narration. `maybeEvent` convertit dans certains cas un événement de salle en round, enregistre `dc306NarrativeEventRoom`, et appelle le producteur `applyDungeonTurnEvent`. Ce producteur ne doit pas être remplacé par un outil de test.
- `assets/gensrpg/dungeon/core213-stability-v1.js` : `ensurePuzzle213` est programmé à l'installation par `setTimeout(...,0)`, et après exploration par le propriétaire Core213. Si `challengeDoorChance` est positif, la fonction peut retenter le tirage d'un défi de porte sur une salle déjà visitée lorsqu'aucun défi n'avait été généré ; le champ `dc213LastPuzzleRoom` suit seulement la **dernière réussite**, pas toutes les évaluations infructueuses. C'est une **piste spécifique aux défis de porte**, pas une preuve d'origine des marqueurs `trap` ou `special_branch`.
- La précédente sentinelle a observé, après REPRENDRE, des cases `floor` devenant `trap`, des scènes `special_branch` supplémentaires et des défis associés à certains coffres. Leur propriétaire exact n'est pas encore attribué.
- `tests/gensrpg_phase12_dungeon_secondary_event_write_audit_browser.cjs` reprend le trajet réel Dungeon/Combat/REPRENDRE et ajoute une interception **strictement observationnelle au navigateur de test** des écritures locales. Elle transmet les valeurs originales inchangées, journalise les évolutions pertinentes de `room`, `trap`, `chest`, scènes et piles d'appel, et n'est **pas** un wrapper de production.

## Critère de suite

1. Exécuter les contrôles d'architecture/R10–R15 et le vrai parcours Chromium/Firefox au SHA exact de la branche.
2. Lorsque le test observe une nouvelle case ou scène après rechargement, comparer les écritures et piles avant/après. Séparer les effets secondaires attendus et les doublons/rejouages.
3. Modifier seulement le fichier d'autorité identifié ; si le propriétaire se trouve dans l'HTML historique, suivre §26 et demander le ZIP exact du SHA au lieu d'une lecture GitHub non fiable.
4. Ne pas déclarer GREEN de restauration globale avant stabilité explicite de trap, special_branch, challenge et coffre, plus contrôle vrai utilisateur.

[Charte](https://github.com/slyen4425-cloud/Zombicide-40k/blob/7e82bf8e1b3235bc4ee8dcf2ce4535eb6d9e7aa7/docs/GENSRPG_CHARTE.md) · [Politique de checkpoints](https://github.com/slyen4425-cloud/Zombicide-40k/blob/7e82bf8e1b3235bc4ee8dcf2ce4535eb6d9e7aa7/docs/GENSRPG_CHECKPOINT_POLICY.md).
