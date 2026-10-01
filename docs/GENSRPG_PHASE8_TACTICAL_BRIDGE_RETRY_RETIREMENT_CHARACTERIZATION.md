# GenSrpG — Phase 8 — Caractérisation retrait retries Bridge Tactical — 2026-10-01

## Base

- checkpoint : `checkpoint/gensrpg-phase8-tactical-session-lifecycle-audit-green-2026-10-01`
- SHA : `bbeea10737a759ddb70b729f9d6458b90efc8d90`
- branche : `work/gensrpg-phase8-tactical-bridge-retry-retirement-2026-10-01`

## État caractérisé

L'entrée publique Tactical charge dans l'ordre :
1. engine ;
2. adapter ;
3. rules ;
4. integration ;
5. UI ;
6. Bridge.

Le Bridge est donc le dernier fichier de base.

Après ce chargement :
- `finalize()` exécute une installation Bridge immédiate ;
- puis programme trois réinstallations : 250, 1200 et 3000 ms ;
- le runtime actuel effectue donc quatre appels Bridge `install()`.

## Invariants protégés

- ordre exact des six fichiers ;
- Bridge dernier ;
- suffixe de chargement historique conservé ;
- guard `__gensTacticalV2Loader105` conservé ;
- Bridge exige engine + adapter + UI ;
- wrapper Bridge porte `__gensRpg113Start` et `__gensRpg112Start` ;
- V113 court-circuite son hook de démarrage si le Bridge porte déjà ce marqueur.

## Cible RED suivante

Exiger :
- exactement une installation Bridge immédiate ;
- aucun timer 250 / 1200 / 3000 dans l'entrée Tactical ;
- aucun changement des retries internes V108-V114.11.

Aucun changement gameplay, `index.html`, hit, dégâts, armure, UI, AI ou Dungeon n'est attendu.

## RED isolé

HEAD RED :
`124b40b0d5e64605df5813d00c46832675fb4cf6`

- Architecture run `36917709606` — FAILURE attendue ;
- caractérisation Bridge Phase 8 — SUCCESS ;
- garde de retrait retries — FAILURE attendue avec `3 !== 0` ;
- cause unique : l'entrée publique Tactical programme encore les trois réinstallations 250 / 1200 / 3000 ms ;
- aucun changement runtime dans le commit RED.

## Micro-diff appliqué

Dans `assets/gensrpg/tactical/entry-v1.js` :

- l'installation Bridge immédiate est conservée ;
- les trois `setTimeout(apply, 250 / 1200 / 3000)` sont retirés ;
- l'ordre des six fichiers reste inchangé ;
- le Bridge reste dernier ;
- le guard `__gensTacticalV2Loader105` reste inchangé ;
- le Bridge métier et V108-V114.11 ne sont pas modifiés.

Les gardes Phase 2 / Phase 8 qui décrivaient explicitement ces retries ont été réalignées uniquement sur le runtime courant. La caractérisation historique conserve la trace des trois délais pré-migration.

Le manifeste timers Phase 2 reflète le retrait :
- sources timers externes : 52 -> 51 ;
- syntaxes `setTimeout` externes : 145 -> 142 ;
- l'entrée Tactical n'est plus classée comme source `bootstrap-retry`.

Aucun changement `index.html`, gameplay, hit, dégâts, armure, UI, AI, Dungeon, Survival, Capture ou PvP.

## Validation technique GREEN

SHA technique :
`2acb1922ad1195764e9f19b6f0ed1d9710bd42e9`

- Architecture + Browser `36918174048` — SUCCESS ;
- Firefox `36918174021` — SUCCESS ;
- Tactical Dock `36918173998` — SUCCESS ;
- étape Architecture Phase 8 retrait retries Bridge — SUCCESS ;
- scénarios Browser inter-modules — SUCCESS.

Décision : **MICRO-LOT 3 TECHNIQUEMENT GREEN**.

## Suite

1. valider le HEAD documentaire par triple CI ;
2. créer `checkpoint/gensrpg-phase8-tactical-bridge-retry-retirement-green-2026-10-01` sur le SHA documentaire exact ;
3. repartir de ce checkpoint pour réauditer le prochain plus petit seam lifecycle ;
4. ne pas présélectionner de migration V108-V114.11 sans nouvel audit.
