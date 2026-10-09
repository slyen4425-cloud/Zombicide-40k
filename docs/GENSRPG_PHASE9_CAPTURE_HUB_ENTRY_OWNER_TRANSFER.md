# Phase 9 — Transfert de la transition UI du Hub Capture — 2026-10-09

## Gouvernance
- Base GREEN `00d7adcf3be669e7921234eb30e9b319413c8649`, `checkpoint/gensrpg-phase9-capture-hub-world-owner-preaudit-green-2026-10-09`.
- Checkpoint de départ `checkpoint/gensrpg-start-phase9-capture-hub-entry-owner-transfer-2026-10-09`.
- Branche `work/gensrpg-phase9-capture-hub-entry-owner-transfer-2026-10-09`.
- Règle 26 : ZIP `worki.zip/indexI.txt` reçu et contrôlé ; fichier exact 8 165 823 octets, Git blob `26421e0347305437fe2b1dc149b3e4fb8b3761bd`.
- Production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Micro-lot
Déplacer **seulement** les 15 lignes de transition UI de `window.captureEnterWorld139` (fermeture de popup, masquage des sept panneaux, affichage menu, rafraîchissements protégés, affichage / scroll Hub) vers le propriétaire `GensCaptureHubEntryV1`. Le seul point de câblage restant Capture139 injecte `closeTurnPopup`, `renderMenuStatuses`, `renderCaptureWorldHub`. Les deux consommateurs SessionStart et ScreenReturn pointent vers `GensCaptureHubEntryV1.enterWorld()`.

Aucun nouveau router Shell, aucune deuxième méthode globale `captureEnterWorld139`, aucun changement de `renderCaptureWorldHub`, des kits, du monde, des sauvegardes ou du garde `gensStability151` ni du wrapper historique `captureFix138`.

## TDD et fingerprint
- Avant : 8 165 823 octets, blob `26421e0347305437fe2b1dc149b3e4fb8b3761bd`.
- Après patch local strict et réversible : 8 165 398 octets, blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`.
- Test `tests/gens_phase9_capture_hub_entry_owner_transfer_v1.test.cjs` : RED sur l'index de départ, GREEN sur le runtime cible (4 parités VM), rollback byte-exact obligatoire.
- Le moteur monde, les liens Shell et les autres modes doivent conserver leurs tests.

Les fichiers `index.html` sont gros : le workflow one-shot applique les 3 substitutions exactes à partir de la base validée, repin les tests historiques uniquement après preuve du nouveau blob et exécute les sentinelles. Un nouveau SHA/CI/preview utilisateur est requis avant checkpoint GREEN.

## Barrières
Pas de renommage global, pas de contournement de sentinelle, pas de rustine ni multiautorité, pas de `main` merge. Le premier commit ajoute seulement le nouveau propriétaire, le TDD RED et le périmètre ; le runtime sera modifié **après** ce RED par un commit séparé, avec diff borné et rollback vérifié.
