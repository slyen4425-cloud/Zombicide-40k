# Publication C2 — stocks marchands et import volontaire des potions

- START : `main@2a545f7b3fb9c44e997ef0286bf3e2c81916428d`, checkpoint `checkpoint/gensrpg-start-merchant-stock-potions-publisher-20261124`.
- Source Capture immuable `04b4653cd6e9a9c615fd61c6c50db32e42b7e103` (PR #635 et #636 fusionnées sur la même branche source). Comparaison au pin précédent `61dac2f6b2b061f297a982ea9da156cd8233c0ae` : 15 commits en avance, zéro en retard, 11 fichiers, aucun changement de pin moteur ni d'asset.
- CI des PR source : #635 runs 45272703637, 45272703668, 45272703650, 45272703635 SUCCESS ; #636 runs 45273114504, 45273114497, 45273114576, 45273114507 SUCCESS. CI de la combinaison via publisher encore requise.
- Propriétaire unique Capture AdventureRules et AdventureSession. Publisher : pin et sentinelle physique seulement, aucun changement de moteur, sauvegarde, SW, assets ou autre module. Les stocks facultatifs et l'import explicite restent les seuls ajouts métier.
- Le PNJ marchand muet reste ouvert dans #629 ; ne pas clore #629 ni #594. Ancien texte d'aide stock à clarifier dans la source, pas de patch de runtime côté publisher.
- Gates : CI complète du publisher, build physique, parcours Chromium PC/mobile, budget, puis main et Pages HTTPS du SHA exact ; essai PWA installée distinct. Ne pas déclarer GREEN avant les preuves.
