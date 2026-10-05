# Phase 9 — Transfert de propriété de l'entrée Dungeon hors Capture

## Périmètre et base

Branche : `work/gensrpg-phase9-capture-dungeon-setup-entry-owner-transfer-2026-10-05`.
Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-dungeon-setup-entry-owner-transfer-2026-10-05`.
Base GREEN : `a8c9aa9934276c38fc4ca2755e65cee7116ada4e`.
Runtime Rule 26 : `8166377` octets, blob `37056722bb0a27f96e26b3ef3b05e9543dc5a223`.
Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Le pré-audit a identifié trois propriétaires successifs de la même frontière : entrée native, wrapper Capture137, wrapper V151.
Le lot transfère le prédicat complet V151 dans l'entrée native, conserve `isDungeonMode()` et retire uniquement les deux wrappers de cette entrée.

## Contrat conservé et preuve TDD

La fixture `tests/fixtures/phase9_dungeon_setup_entry_before_transfer_v1.json` contient les sources exactes native/137/151 et les fragments de suppression issus du blob GREEN.
SHA-256 immuable de la fixture : `3d925e4f3760819642b1f48d2ab2d0aba66dbd5c45d6595d0d4d4b1e3d22e7b2`.
Elle sert exclusivement de référence historique dans les tests et ne charge aucun code dans le runtime.

Le nouveau test exécute l'API publique Capture et le helper Dungeon réels, compare le propriétaire natif à l'ancienne chaîne sur 18 cas, vérifie refus sans effet UI/stockage, navigation une seule fois, priorité Capture, retour inchangé et erreurs fail-closed.
Les 10 cas du pré-audit sont conservés. S'ajoutent priorité Capture sur identifiant Dungeon, identité creature seule, flags partiels, erreurs profil/identité/stockage, API optionnelle absente et élément UI absent.
Il vérifie aussi zéro réassignation globale de l'entrée et reconstitue le blob GREEN exact en inversant les seuls trois fragments autorisés.

RED local avant mutation : échec de l'assertion `native owner must preserve the complete V151 entry predicate`, notamment Capture historique et identifiant Dungeon sans style.
RED GitHub : à relever avant application.

## Adaptations d'attentes volontairement obsolètes

La règle de comportement reste identique ; la propriété de la garde change volontairement.

- La caractérisation précédente exigeait la présence active des wrappers et l'absence de garde Capture native. Ces attentes structurelles sont obsolètes après ce transfert autorisé. Les dix résultats de production deviennent les attentes du propriétaire natif ; la comparaison complète à l'ancienne chaîne est désormais protégée par le nouveau test immuable.
- Le test du bouton Dungeon protégeait provisoirement les deux wrappers « dans ce seam » antérieur. Il protégera désormais la garde native et l'absence de ces wrappers ; ses assertions concernant le bouton et Capture139 restent identiques.
- Les empreintes exactes des anciens tests suivent le nouveau blob/taille vérifiés, sans changer leurs invariants métier.
- La table des affectations explicites `window.<name>` perd exactement la ligne `openSessionDungeonSetup` (deux affectations). La déclaration native reste active : le nouveau test prouve son existence unique. Totaux attendus : 430 globals, 744 affectations, 115 globals multi-propriétaires, mêmes 119 blocs actifs.
- Les descriptions du manifeste d'owners doivent retirer uniquement l'ownership de cette entrée pour 137/151. Les autres responsabilités et frontières restent présentes.

Aucun test navigateur de parcours, victoire/reprise, sauvegarde ou quatre modules ne sera affaibli.
Les scénarios existants restent obligatoires : vrai pré-game Capture sans/avec style historique, reprise persistée, vrai Dungeon, Dungeon après Survie, quatre modules, Firefox et Tactical Dock.

## Mise en œuvre prévue

Réutiliser directement `getActiveGameProfile?.()` et `window.GensCaptureV1?.isProfile?.(p)`, refuser Capture ou l'absence de style Dungeon dans le try/catch de l'entrée native.
Conserver ensuite `if(!isDungeonMode())return;` et le corps original intégral.
Conserver sans changement les helpers globaux et toutes les autres parties de Capture137/V151.
Aucun nouveau wrapper, helper d'identité, timer, observer, migration, asset, règle ou moteur.

Si nécessaire, transporter ce gros HTML par un workflow ponctuel borné à la branche dédiée : assertions de base, remplacement déterministe local, assertions du résultat, tests, commit et dispatch de la triple CI. Les fichiers de transport seront retirés du résultat final.

## Validation et clôture

À compléter après RED GitHub, GREEN local et triple CI complète.
