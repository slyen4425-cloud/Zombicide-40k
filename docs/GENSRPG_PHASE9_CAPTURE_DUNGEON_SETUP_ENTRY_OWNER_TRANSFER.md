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
RED GitHub initial : HEAD `54843ead4af50c5d0766f04624b922f749fdbe3a`, run `37362473505`, job `111940130819`, étape #270 en échec attendu. Log vérifié : Capture historique et identifiant Dungeon sans style.
RED confirmé aussi sur le HEAD transport `a0ad35074bcb7023911ad2168f9fbd5be9e48fcf`, run `37363506670`.

## Adaptations d'attentes volontairement obsolètes

La règle de comportement reste identique ; la propriété de la garde change volontairement.

- La caractérisation précédente exigeait la présence active des wrappers et l'absence de garde Capture native. Ces attentes structurelles sont obsolètes après ce transfert autorisé. Les dix résultats de production deviennent les attentes du propriétaire natif ; la comparaison complète à l'ancienne chaîne est désormais protégée par le nouveau test immuable.
- Les tests du bouton et de l'ownership du pré-game Dungeon protégeaient provisoirement les deux wrappers « dans ce seam » antérieur. Il protégera désormais la garde native et l'absence de ces wrappers ; ses assertions concernant le bouton et Capture139 restent identiques.
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

Runtime appliqué : `284b4c76f333780b68c069fe0b18e610467f044a`.
Taille `8165906`, blob `1e3398755beb751786d825047bc60fe1a7179d79`, SHA-256 `0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d` ; delta `-471` octets.
Application ponctuelle `37363506750` : première tentative annulée en attente de runner, relance ciblée, tentative 2 / job `111948888218` SUCCESS. RED/GREEN exécutés avant commit ; transport supprimé dans le commit runtime.
16 tests locaux Phase 9 et trois inventaires : GREEN. Triple CI fonctionnelle finale avec la preuve du vrai bouton Dungeon : en cours.

La preuve UI est ajoutée au scénario existant `tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs` : vrai Shell, profil Dungeon, nouveau jeu, clic réel sur le bouton, affichage de la bibliothèque et de ses cartes, clic réel de retour, puis poursuite intacte du scénario de provider / Save & Quit / reprise.
Aucun handler, wrapper ou valeur runtime de succès n'est injecté dans cette preuve.
