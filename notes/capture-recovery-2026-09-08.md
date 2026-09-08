# Monster Capture — pistes de restauration (2026-09-08)

Ne pas restaurer maintenant. À conserver pour le futur chantier Capture.

## Systèmes à retrouver/restaurer
- stockage / réserve des créatures ;
- équipe active / invocation façon Pokémon ;
- combats de créatures ;
- objets de capture ;
- dresseurs ;
- données `starter_capture` ;
- données `gensrpg_shared_entities_v1` / `gensrpg_shared_entities_v1__family__creature` ;
- anciens commits où Capture était explicitement isolé de Dungeon et Survie.

## Trace confirmée
Le module `gens-world-summary-167820.js` (V16.78.20) lit encore les créatures depuis `gensrpg_shared_entities_v1__<profileId>` et `gensrpg_shared_entities_v1__family__creature`, les dresseurs depuis les héros du profil Capture et les objets depuis `gensStarterCaptureItems()` + les équipements `contentFamily: creature`.

## Règle de reprise
Avant toute réécriture du mode Capture, rechercher et comparer les anciennes implémentations dans l'historique Git plutôt que recréer le système.