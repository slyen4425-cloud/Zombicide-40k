# GenSrpG — Point de reprise LIVE (14 octobre 2026)

**Phase 12 en cours. D1, D2, D3, D4, D5 GREEN ; D6 NON ouvert.**

## Dernier checkpoint GREEN — D5 Dungeon Core211

- **Checkpoint final §25 :** `checkpoint/gensrpg-phase12-dungeon-core211-d5-green-2026-10-14` au SHA **`50715c1b150fbd8d9829b90d88a983e6550ff63d`**, contrôlé sur trois CI complètes.
- **Branche D5 :** `work/gensrpg-phase12-dungeon-core211-d5-extraction-2026-10-14`. Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-core211-d5-extraction-2026-10-14`, base triple CI GREEN `00022b60a5b9dea8bc8bc281a7705d94b31ff09a`.
- **Source §26 certifiée :** ZIP `b1.zip` / `index.html(6).txt`, également confirmé par `b2.zip` / `index.html(7).txt`, 7 780 333 octets et Git blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`.
- **Extraction physique D5 :** `dungeonCore211Consolidation` (propriétaire actif exclusif Dungeon), 17 511 octets, blob `bba60d921df20a114b489e17f9222e0c4f310871`, transféré sans modification vers `assets/gensrpg/dungeon/core211-consolidation-v1.js`. Même emplacement de chargement synchrone classique.
- **Index physique final :** 7 762 879 octets, blob Git **`2ad1961efb9733037b7753ffd4a308baa1b00b64`**. Reconstruction exacte D5→D4→D3→D2→D1 ; anciens propriétaires et snapshots conservés.
- **Triple CI sur SHA identique :** [Architecture + Chromium 38584005349](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005349) SUCCESS (356 contrôles structurels, 64 étapes browser) ; [Firefox 38584005102](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005102) SUCCESS ; [Tactical 38584005388](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005388) SUCCESS.
- **Application contrôlée :** [38581987594](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38581987594) SUCCESS, premier commit runtime `a039172e51efec5fa48b4b6d2fd4ced556473471`.
- Rapport complet : `docs/GENSRPG_PHASE12_DUNGEON_CORE211_D5_EXTRACTION_2026-10-14.md`. Documentation de clôture post-checkpoint sur branche D5, sans changer le checkpoint testé.

## Bilan Phase 12

- D1 Core01 : 22 768 octets ; D2 Core051 : 47 962 ; D3 MJ72 : 27 511 ; D4 Core200 : 55 842 ; D5 Core211 : 17 511.
- **171 594 octets de JavaScript externalisés**, **171 325 octets nets retirés de l'index** depuis 7 934 204 octets, désormais à 7 762 879 octets.
- **Phase 12 globale non terminée.** Le hub reste modulaire par domaines Survie, Dungeon, Capture, PvP.

## Prochaine étape : D6, pas encore ouvert

- **§26 :** besoin de l'index exact **après D5**, à télécharger ici : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/50715c1b150fbd8d9829b90d88a983e6550ff63d/index.html`. Demander un ZIP ; vérifier **7 762 879 octets** et blob `2ad1961efb9733037b7753ffd4a308baa1b00b64` avant toute nouvelle analyse/modification du gros HTML. **Ne pas réutiliser `b2.zip`** : c'est l'état D4, antérieur à D5.
- **§25 :** dernier SHA GREEN vérifié, checkpoint propre de départ D6 et une branche exclusive, propriétaire actif documenté, risques fonctionnels et tests prévus. Ne pas extraire les scripts marqués `disabled`.
- Valider un seul lot autonome, code byte-identique et parser-time inchangé. Reconstituer les états historiques et exécuter Architecture/Chromium, Firefox et Tactical, même SHA, avant GREEN.
- Éviter la multiplication de petits audits et tout changement de gameplay dans cette phase.

## Invariants

- `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Laboratoires Combat et Exploration séparés, non modifiés. 32 images Survie historiques en place.
- PvP gameplay non commencé ; Shell seul maître de la navigation, Core maître des services communs ; ne pas créer de multi-autorité.
- Pour reprise, lire `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`, puis ce document.

Historique D5 avant GREEN : `docs/history/GENSRPG_CURRENT_WORK_PRE_D5_GREEN_2026-10-14.md`.
