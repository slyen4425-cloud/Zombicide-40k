# GenSrpg — C2 PWA Update / Cache Isolation — 7 novembre 2026

## Gouvernance
- BASE production immuable : `9537ee28a626522246b7be16c690375cd8e4e164`.
- START checkpoint : `checkpoint/gensrpg-start-pwa-cache-isolation-2026-11-07`.
- Branche dédiée : `work/gensrpg-pwa-cache-isolation-2026-11-07`. Aucun changement sur `main` ou sur les laboratoires.
- Propriétaire : service worker PWA racine uniquement ; aucun code Capture, Dungeon, Survie, Exploration ou données IndexedDB modifié.
- Risque C2 : migration du cache en application installée sur Android, multi-PWA sur même origine.
- Test RED : `tests/gensrpg_pwa_cache_isolation_20261107.test.cjs`, validant qu'un worker racine actif ne détruit plus les caches de prévisualisation ni ceux d'autres applications et relance `registration.update()` sur navigation.
- Correctif : nom de cache versionné et suppression limitée aux seuls caches `gensrpg-cache-*`. Le namespace existant du preview `gensrpg-preview-capture-v2-*` reste indépendant.
- Test de non-régression existant : `tests/gens_capture_pwa_offline_pinned_media_v1.test.cjs`; les images immuables restent servies depuis le cache réseau/hors-ligne.
- Pipeline : test RED/GREEN ajouté au build Pages principal. Ne pas passer GREEN sans CI exacte, Pages et preuve HTTPS.
- Aucune suppression de sauvegardes, de branches, d'assets auteur, ni d'anciens liens.
- Attention : ce lot ne change pas le SHA épinglé du jeu Capture V2. La synchronisation des laboratoires relève d'un lot distinct et de son propriétaire.

## Critères de livraison
1. CI pertinente verte sur HEAD de cette branche et test navigateur PWA installé.
2. PR relue et fusionnée conformément à la charte ; ne pas fusionner par le seul succès d'un test statique.
3. Pages root sur le nouveau SHA, caches preview préservés, version root rafraîchie, offline et IndexedDB testés.
4. Contrôle sur Pixel, sans désinstallation ni effacement des données utilisateur.
