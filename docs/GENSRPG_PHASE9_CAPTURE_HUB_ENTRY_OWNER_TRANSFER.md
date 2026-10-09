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

## Application réelle — runtime ciblé, 9 octobre 2026

- Commit du transfert : `7704651e92840226d7915e753149a02d0aa944f7`.
- Avant : `index.html` 8 165 823 octets, blob `26421e0347305437fe2b1dc149b3e4fb8b3761bd`.
- Après : 8 165 398 octets, blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`.
- Chaîne nouvel owner : `GensCaptureHubEntryV1.install({closeTurnPopup,renderMenuStatuses,renderCaptureWorldHub})` exécuté dans `captureFix139`; `GensCaptureSessionStartV1` et `GensCaptureScreenReturnV1` appellent tous deux `GensCaptureHubEntryV1.enterWorld()`.
- Unique responsabilité déplacée : fermeture du popup/7 panneaux, affichage du menu, appels protégés aux renderers existants, Hub visible puis scroll demandé dans requestAnimationFrame. Le déplacement n'ajoute aucun deuxième renderer ni routeur.
- Test dédié `tests/gens_phase9_capture_hub_entry_owner_transfer_v1.test.cjs` : ancien runtime RED ; 4 scénarios VM ancien/nouveau GREEN ; rollback 1:1 `18627...` → `26421...`.
- L'ancienne sentinelle `gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs` continue de jouer les cas VM historiques, sur la source initiale **reconstituée et contrôlée par hash**, plutôt que de perdre son oracle. La cumulative rollback vers les checkpoints Dungeon anciens reste testée.
- One-shot appliqué : [run 37933458038](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37933458038) **SUCCESS**, commit transmis par GitHub Actions sur la branche dédiée. Les essais de workflow intermédiaires qui ont échoué étaient bloqués avant commit runtime ; aucune mutation de `main`.
- À partir du prochain commit, les outils de one-shot seront retirés : ils n'ont aucune raison de rester chargés en permanence. La triple CI doit valider le SHA final ensuite.
- Passage en GREEN fonctionnel **uniquement** après Architecture+Browser / Firefox / Tactical à SUCCESS sur un seul SHA et test smartphone réel, avec checkpoint final sur ce même SHA.
