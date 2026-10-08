# GenSrpG — Phase 9 — Préaudit propriétaire du retour écran Capture

Date : 2026-10-08. **Préadit documentaire : aucune mutation runtime.**

## Gouvernance et base vérifiée

- Branche : `work/gensrpg-phase9-capture-screen-return-preaudit-2026-10-08`.
- Départ : `checkpoint/gensrpg-start-phase9-capture-screen-return-preaudit-2026-10-08`.
- Base et dernier GREEN : `ff1e9516913f2bcbb0d0c169f9442768f872b7a1`, `checkpoint/gensrpg-phase9-capture-session-start-builder-preview-green-2026-10-08`.
- CI base : Architecture + Browser `37798497172` (deuxième tentative SUCCESS), Firefox `37798497251` SUCCESS, Tactical Dock `37798497163` SUCCESS ; preview externe validée sur l’étape précédente `37798462269` SUCCESS.
- Validation utilisateur : Builder rétabli et vignette Capture cohérente, signalé le 8 octobre.
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Correction du diagnostic : la fonction existe déjà

Le rapport d’entrée Capture Phase 9 notait `moduleScreenReturn: declared-not-loaded`. Ce champ décrit **l’entrée physique Phase 3** dans `assets/gensrpg/capture/entry-v1.js`, pas l’absence de tout retour fonctionnel.

Le raccord de Phase 5 est déjà LIVE et validé : `docs/GENSRPG_PHASE5_MODULE_SCREEN_RETURN_CAPTURE_S1.md` et `...DUNGEON_S2.md`. Un unique `goMenu` natif Shell route vers `GensShellScreenReturnV1.returnToPrimaryView`. Le bloc historique inline `captureFix139` enregistre `capture` et appelle la transition propriétaire `captureEnterWorld139()` ; Dungeon conserve son propre provider. Les overrides `window.goMenu =` ont été retirés.

Le transfert Phase 9 du démarrage Capture est également déjà terminé : `GensCaptureV1.startModuleSession()` délègue à `GensCaptureSessionStartV1`. **Ne pas reprendre ce travail.**

## Dette réelle et frontière à protéger

La dette restante est **l’emplacement physique de l’enregistrement du provider et de son implémentation de transition dans `captureFix139`**. L’entrée autonome `capture/entry-v1.js` n’enregistre pas de provider de retour et son contrat reste à l’état `declared-not-loaded`. Il serait erroné de créer un nouveau provider, de retoucher `goMenu`, ou d’activer directement `moduleScreenReturn` par simple changement de métadonnées.

Responsabilités : Shell = dispatch public unique ; Capture = décision et rendu du Hub Capture ; Dungeon = rendu Dungeon ; Core = services génériques uniquement. L’UI n’est pas le propriétaire des données persistantes. Retour écran et initialisation de session sont deux lots distincts.

## Périmètre et tests de ce préaudit

Fichiers modifiés : ce rapport, `docs/GENSRPG_CURRENT_WORK.md`, une sentinelle documentaire `tests/gens_phase9_capture_screen_return_ownership_preaudit_v1.test.cjs`, son activation dans le workflow Architecture. Aucun `index.html`, moteur, asset, profil, sauvegarde, PWA ni labo modifié.

La sentinelle exige le fichier runtime exact (8 165 794 octets / blob Git `462abc969e7ac636f8ac4ee54c0d14fe51b83e7d`), l’unicité du dispatch et du provider historique, le contrat Phase 3 encore non chargé, l’absence d’override global, et la présence des tests navigateur réels déjà existants.

Les E2E protégés sont : Dungeon fiche → carte, Capture avec ancienne sauvegarde Dungeon → Hub Capture, Capture victoire → reprise, Survie menu, PvP, Builder, non-interférence des quatre modules et réouverture après rechargement.

## Suite stricte après GREEN

1. Créer le checkpoint vert **uniquement après** Architecture + Browser, Firefox et Tactical Dock SUCCESS sur le HEAD final de ce rapport.
2. Ouvrir un lot runtime distinct et un checkpoint de départ sur ce SHA GREEN, sans modifier cette branche de préaudit.
3. Appliquer la règle 26 : obtenir le `index.html` **exact** du nouveau checkpoint (Git blob/taille vérifiés) pour inspecter localement le code de `captureFix139`, `captureEnterWorld139()` et les appels `goMenu` correspondants. Les tests et rapports ne remplacent pas la lecture de ce corps exact pour le déplacer.
4. Définir un unique seam : supprimer l’enregistrement historique et transférer le propriétaire au module Capture dans **la même étape**, ou s’arrêter si l’API d’entrée ne permet pas une délégation sûre. Pas de second provider, wrapper, MutationObserver, timer, polling, reload, ni clone du rendu.
5. Écrire le RED réel + reprise de tous les E2E, corriger uniquement ce seam, réévaluer les anciens contrats/sentinelles historiques par preuve, fournir un preview mobile et demander validation ciblée.

Aucun merge/deploy `main`.
