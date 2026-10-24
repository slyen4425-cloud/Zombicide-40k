# GenSrpG — Phase 9 — Prochain couplage résiduel Capture / Dungeon

Date : 2026-10-05

## Base

- Base GREEN : `4331c7b00e98d1ed629146e688fef6a1ca249386`
- Checkpoint GREEN : `checkpoint/gensrpg-phase9-capture-dungeon-pregame-button-owner-transfer-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-next-residual-dungeon-coupling-preaudit-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-next-residual-dungeon-coupling-preaudit-2026-10-05`
- Runtime : `8166377` octets / blob `37056722bb0a27f96e26b3ef3b05e9543dc5a223`
- Production main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Inventaire GREEN

La sentinelle `gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs` rapporte encore 126 appels historiques à `isDungeonMode()`, mais ceux-ci ne sont pas à nettoyer globalement.

Blocs d'identité résiduels observés :
- `dungeonMj72_2Script` ;
- `gensStability151` ;
- `dungeonCore100ResumeAndInteractionFix` ;
- `dungeonCore310PersistenceAndTokens`.

Blocs de services Dungeon vus statiquement depuis des zones Capture/Dungeon :
- `captureFix137` ;
- `captureFix139` ;
- `gensStability151` ;
- plusieurs vrais blocs Dungeon.

## Candidat prioritaire

`captureFix137` conserve un wrapper autour de `openSessionDungeonSetup()` :

- le wrapper bloque l'entrée quand `gensCapturePregameMode()` est vrai ;
- le bouton Dungeon lui-même n'appartient plus à Capture : `updatePregameWizard()` en est l'autorité GREEN ;
- le nettoyage visuel Capture137/Capture138 a déjà été retiré ;
- `gensStability151` possède également une garde autour de la même entrée.

Ce candidat semble être une autorité inter-module résiduelle, mais son retrait n'est PAS encore autorisé.

## Questions d'ownership à résoudre

1. Où se trouve la définition propriétaire de `openSessionDungeonSetup()` ?
2. Cette définition possède-t-elle déjà une garde vrai Dungeon / Capture ?
3. Quelle responsabilité exacte garde V151 ?
4. Le wrapper Capture137 est-il redondant, ou protège-t-il encore un chemin programmatique réel ?
5. Le propriétaire correct doit-il être Shell/pré-game ou Dungeon ?

## Périmètre protégé

Ne pas modifier avant preuve :
- `openSessionDungeonSetup()` ;
- Capture137 ;
- garde V151 ;
- `isDungeonMode()` ;
- vrai Dungeon runtime ;
- sauvegarde/reprise ;
- Survie / PvP / Tactical ;
- Combat Dynamique / Exploration / Builder / Map Actor.

Interdit :
- suppression du wrapper sans test ;
- nouveau wrapper/fallback/timer/observer/polling ;
- remplacement global de `isDungeonMode()`.

## Rule 26

L'inspection inline exacte est désormais nécessaire pour déterminer la chaîne de propriétaires.
Le fichier utilisateur doit correspondre exactement au HEAD courant avant sélection du seam.

## Caractérisation exacte sous Rule 26

Fichier reçu : `index.zip`, membre `index.html`.
- taille : `8166377` octets ;
- blob Git : `37056722bb0a27f96e26b3ef3b05e9543dc5a223` ;
- SHA-256 : `25417800fd80f8efb5bfe10d6cb0e16058c6b81b80cfd5cb479b801361fb3863` ;
- correspondance avec `de81c9e4c8bab829ed55e970b9259166caaae748` confirmée ;
- aucun changement du runtime dans le pré-audit.

### Chaîne et propriété

L'entrée native est définie dans le bloc principal, près de `renderSessionDungeonLibrary()` et `closeSessionDungeonSetup()`.
Elle appartient à la navigation de pré-game et délègue le contenu à la bibliothèque Dungeon.

Ordre d'installation :
1. définition native `openSessionDungeonSetup()` ;
2. `captureFix137`, qui capture cette définition dans `old` ;
3. `gensStability151`, qui capture le wrapper Capture137 dans `openD151`.

Ordre d'appel :
`V151 -> Capture137 -> entrée native -> bibliothèque Dungeon`.

- Entrée native : refuse uniquement `!isDungeonMode()`.
- Capture137 : refuse `gensCapturePregameMode()`, qui appelle l'identité canonique `GensCaptureV1.isProfile()`.
- V151 : refuse `gensMode151() !== "dungeon"` ; cette classification donne priorité à l'identité Capture canonique sur le style Dungeon.
- V151 capture également les erreurs de classification et reste fermé.

### Preuves VM sur sources exactes

Sentinelle :
`tests/gens_phase9_capture_dungeon_setup_entry_ownership_characterization_v1.test.cjs`.

Les fonctions/gardes viennent du runtime vérifié et sont exécutés dans l'ordre réel ; l'identité Capture vient du vrai fichier public `capture/entry-v1.js`.
Seules les dépendances de lecture du profil et les effets de navigation sont simulés pour observer le passage de la frontière.

| Cas | Native seule | + Capture137 | Chaîne complète V151 |
| --- | --- | --- | --- |
| Capture neuf, sans style | bloqué | bloqué | bloqué |
| Capture historique, style Dungeon | ouvert | bloqué | bloqué |
| Capture reconnue par modules, style Dungeon | ouvert | bloqué | bloqué |
| Dungeon intégré, style Dungeon | ouvert | ouvert | ouvert |
| Identifiant Dungeon intégré sans style | ouvert | ouvert | bloqué |
| Dungeon personnalisé, style Dungeon | ouvert | ouvert | ouvert |
| Identifiant Survie avec style Dungeon | bloqué | bloqué | bloqué |
| Survie sans style | bloqué | bloqué | bloqué |
| Autre profil | bloqué | bloqué | bloqué |
| Aucun profil actif | bloqué | bloqué | bloqué |

Dans les trois cas Capture, la chaîne complète ne lit que le profil via V151 : Capture137, `isDungeonMode()` et le corps de navigation ne sont pas atteints.
Retirer uniquement Capture137 dans la composition VM finale conserve les effets sur tous les cas.
Retirer les deux wrappers sans transférer le prédicat complet ferait régresser Capture historique et l'identifiant Dungeon sans style.

### Frontière navigateur réelle

La sentinelle existante :
`tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs`
traverse toujours Shell -> profil Capture -> pré-game -> dresseur/créature -> lancement -> Hub -> progression.

Le nouveau contrôle appelle directement l'entrée publique existante depuis le vrai pré-game Capture :
- une fois avec le profil sans style ;
- une fois en représentant le format historique `gameStyle:"dungeon"` ;
- les deux doivent conserver les vues et toutes les clés de stockage ;
- le profil initial est rétabli avant de poursuivre le parcours normal.

Le test n'injecte aucun wrapper, garde ou valeur de retour.
Cet appel programmatique vérifie une frontière atteignable ; le parcours UI normal Capture n'expose pas le bouton Adventure Dungeon.

## Décision d'ownership

Seam sélectionné pour un **lot TDD séparé** :
transférer le prédicat complet de V151 dans le propriétaire natif du pré-game, puis retirer les deux wrappers autour de `openSessionDungeonSetup()`.

Le transfert doit conserver :
- priorité de l'identité Capture publique ;
- refus hors profil de style Dungeon, y compris absence de style/profil ;
- comportement fermé sur erreur de classification ;
- garde native `isDungeonMode()` inchangée ;
- ouverture Dungeon intégré/personnalisé exactement une fois ;
- zéro effet de vue/stockage en Capture et Survie ;
- compatibilité des anciens profils sans migration.

Retirer seulement Capture137 conserverait V151 comme propriétaire inter-module de cette entrée ; le seam choisi vise donc une seule autorité au propriétaire natif.
Aucune nouvelle fonction d'identité ou maintenance globale ne doit être créée.

Le reste de Capture137 et V151, la navigation du bouton déjà transférée, les modules, sauvegardes et labos restent hors périmètre du prochain lot.

## Validation de ce pré-audit

- nouveau test VM local : GREEN ;
- tests existants bouton Dungeon/pré-game et inventaire couplages : GREEN ;
- navigateur local indisponible faute de Chromium ; validation par le job navigateur GitHub obligatoire ;
- sentinelle VM ajoutée au workflow Architecture permanent ;
- triple CI puis fermeture documentaire et checkpoint requis ;
- aucun runtime modifié.

## GREEN — caractérisation et frontière navigateur

HEAD fonctionnel validé :
`d9b1b10f5e8f4e938adecdb6e06211d7f3b97c3d`.

Triple CI :
- Architecture + Browser : `37344256269` — SUCCESS ;
- Firefox : `37344256249` — SUCCESS ;
- Tactical Dock : `37344256223` — SUCCESS.

Preuves ciblées du run Architecture :
- job architecture `111878751340`, nouveau test des gardes natifs — SUCCESS ;
- job navigateur `111879269684`, pré-game Capture sans identité Dungeon renforcé — SUCCESS ;
- vraie victoire/reprise Capture — SUCCESS ;
- vraie reprise persistée sans style avec résidu Dungeon — SUCCESS ;
- provider Capture — SUCCESS ;
- Dungeon après Survie — SUCCESS ;
- non-interférence quatre modules — SUCCESS.

Diff réel du lot : cinq fichiers, uniquement tests, branchement CI et documentation.
Le runtime avant/après conserve `8166377 / 37056722bb0a27f96e26b3ef3b05e9543dc5a223`.
Aucun profil persistant ni sauvegarde utilisateur n'est migré.

Checkpoint final :
`checkpoint/gensrpg-phase9-capture-next-residual-dungeon-coupling-preaudit-green-2026-10-05`.

Le checkpoint doit pointer sur le HEAD exact triple-GREEN **après** ce commit documentaire.
Les runs de fermeture sont attachés au SHA résolu par ce checkpoint dans GitHub Actions ; aucun commit supplémentaire ne sera créé seulement pour recopier leurs IDs dans le même fichier.

Décision finale du pré-audit : propriétaire natif sélectionné, retrait des deux wrappers autorisé uniquement dans le prochain lot isolé après RED dédié et transfert intégral de la protection.

Production main reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.
