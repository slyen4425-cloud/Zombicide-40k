# GenSrpG — Phase 12 / R06 — 18 scripts Capture historiques, extraction physique

Date : 18 octobre 2026. **Extraction publiée sur la branche de travail, sans toucher à `main`. Jalon R06 en validation CI, pas encore GREEN à la rédaction de cette note.**

## Source et protocole §§25–26

- Après validation utilisateur du Dungeon (combats, embuscades, murs générés), reprise depuis `checkpoint/gensrpg-dungeon-generated-wall-texture-green-2026-10-17` au SHA immuable `4dd865a45634b7367ce66a526feae58b923edef9`. Ses quatre CI sont vertes ; `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Nouveau checkpoint START `checkpoint/gensrpg-start-phase12-r06-inline-owner-scope-2026-10-18`, branche exclusive `work/gensrpg-phase12-r06-inline-owner-scope-2026-10-18`.
- Source §26 fournie par l'utilisateur : `d1.zip` contenant `index.html(1).txt` ; **2 782 155 octets**, Git blob `b33542b033c5afa8a1643d99c56c21dbd4be266c`. Vérification exacte contre l'arbre Git du checkpoint. Aucun ancien ZIP R05 substitué.
- Les corrections validées Core079 des murs générés (`dng_wall_block.jpg`), détection unique V113, combat Tactical et authored Builder sont conservées sans modification.

## Périmètre réellement extrait

- **Un seul domaine : Monster Capture**, sans création de nouveau moteur ou propriétaire. Groupe de **18 scripts actifs consécutifs**, du `captureGameplayModalMount` à `captureAbilityTruth144`, comprenant `capturePlaytestFix128`, `captureFix129` à `captureFix140`, `captureItems141`, `captureBuffs142` et `captureBuffFx143`.
- Les 18 corps JavaScript totalisent **140 211 octets** ; chacun est conservé **strictement byte-identique**, sans regroupement de portées globales ni modification d'initialisation. Chaque ancienne balise `<script id="...">...</script>` est remplacée **à son emplacement parser d'origine** par `<script id="..." src="assets/gensrpg/capture/legacy-patches/...-v1.js"></script>` classique et synchrone, sans `async`, `defer` ou `type=module`.
- **Index résultant : 2 643 155 octets**, Git blob `12fc91df4ee4c7989a172baa96f9790da6dc57f7` ; **–139 000 octets HTML** par rapport à la source d'entrée.
- Le script contrôlé `tools/gensrpg_phase12_r06_capture_inline_extract_apply.py` vérifie l'empreinte du ZIP d'origine, applique une transformation déterministe, refuse toute entrée ambiguë, vérifie syntaxiquement les 18 fichiers et reconstruit **à l'octet près** l'index source via rollback. L'action d'extraction [39076266755](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39076266755) a réussi ; commit runtime [a72f0cc8](https://github.com/slyen4425-cloud/Zombicide-40k/commit/a72f0cc8e81a433cef933888c2cf502e1cb05442).
- Pré-cache `service-worker.js` versionné et étendu aux 18 URLs, registre `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` étendu de 107 à 125 propriétaires atteignables (18 uniquement `domain: capture`). Aucun transfert des assets des deux laboratoires ; 32 images Survie historiques laissées en place.

## Vérifications et sauvegardes historiques

- Le helper test-only `tests/helpers/gens_phase12_r06_capture_source_view_v1.cjs` restaure l'intégralité des 18 scripts d'origine dans le HTML en mémoire **avant** les retours D9→D1 et R05→R01. Les empreintes historiques sont maintenues et non remplacées par les empreintes courantes.
- La table Phase 2 historique des affectations globales (428 noms, 739 affectations, 114 multi-propriétaires) reste figée. Les sentinelles lisent le contenu externe des 18 scripts pour vérifier **les mêmes chaînes d'autorité effectives**, notamment les anciens `captureFix138`, `captureFix139` et `captureRenderBattleLive`.
- Les sentinelles Phase 5/9/Architecture ont été adaptées pour contrôler la nouvelle composition ordonnée et la présence stricte des 18 fichiers, sans contourner les frontières de lancement Capture, de `goMenu`, `startConfiguredGame` et `openChar`.
- La sentinelle rapide `GenSrpG Phase12 R06 source intake preflight` vérifie le blob courant, la restauration exacte, les corrections murales, et les invariants de démarrage/retour de Capture et Phase 9. [Run 39078270215](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39078270215) : **SUCCESS** sur l'état qui précède cette documentation.
- **Gates finaux encore nécessaires** : Architecture statique + navigateur Chromium, Tactical dock, Firefox et préflight source **au même SHA incluant la documentation** ; revue des éventuels défauts observés, checkpoint GREEN R06 seulement après tous les SUCCESS. Test manuel Capture recommandé via un lien immutable si un jalon prévisualisable est émis.

## Invariants et suite

Aucun gameplay Capture, Dungeon, Survie ni PvP n'a été réécrit ; aucune donnée de profil ou sauvegarde n'a changé de format ; aucune deuxième autorité d'inventaire, de rendu, de combat ou de détection. R07 et D10 **non commencés**. `main` et les dépôts des laboratoires inchangés.
