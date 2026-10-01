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
