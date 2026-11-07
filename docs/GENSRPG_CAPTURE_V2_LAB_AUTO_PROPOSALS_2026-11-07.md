# Capture V2 — proposition automatique des Laboratoires certifiés (7 novembre 2026)

## Base, branche et propriétaire
- Production `main` au checkpoint START : `9537ee28a626522246b7be16c690375cd8e4e164`.
- Checkpoint : `checkpoint/gensrpg-start-capture-v2-certified-autopropose-2026-11-07`.
- Branche du lot : `work/gensrpg-capture-v2-certified-autopropose-2026-11-07`.
- Propriétaire unique : `tools/watch_capture_v2_official_main.mjs` et son workflow existant ; aucun second publisher, aucun code Combat/Exploration modifié.
- Cette automatisation n'agit **que sur les SHAs officiels `main` à CI verte**, avec contrôle d'ascendance fast-forward, aucun `gh-pages` moteur et aucune source flottante dans le navigateur.

## Chaîne automatique
1. Surveiller `main` Combat et Exploration selon l'horaire existant, comparer avec les SHA immuables du dernier candidat Capture V2.
2. Lorsque le nouveau SHA est certifié sur `main`, construire un *nouveau candidat source* dans une branche dédiée dérivée exactement du candidat précédent ; modifier uniquement `assets/gensrpg/capture-v2/source-pins-v1.json`.
3. Créer une *branche publisher distincte* depuis le `main` intact, mettre à jour uniquement `tools/capture_v2_pages_preview_pin.json` avec le nouveau SHA source.
4. Ouvrir une PR **DRAFT** vers `main`, jamais fusionnée ni publiée automatiquement. Déclencher explicitement les six workflows C2 de validation : les PR créées par `GITHUB_TOKEN` ne déclenchent pas seules les workflows `pull_request`.
5. Si l'API refuse les PR ou les écritures, conserver `main` inchangé et produire une issue d'examen ; ne jamais masquer cet échec.

## Sécurité, TDD et gates
- Test RED ajouté : `tests/gens_capture_v2_certified_autopropose_20261107.test.mjs` ; tests historiques watcher ajustés sans supprimer leurs gardes.
- Un nouveau SHA doit être celui du dépôt officiel et du run CI exact. L'autre laboratoire non modifié garde sa version.
- Aucun ZIP, média, moteur, sauvegarde, cache PWA ou ressource supplémentaire ne doit être ajouté. Le candidat n'est pas une deuxième autorité de combat ; les labs restent propriétaires.
- La CI et le navigateur doivent prouver absence de régression, budget Pages, source unique, import/export et vrai parcours mobile.
- **NON GREEN jusqu'à validation du SHA exact**, puis PR de livraison approuvée, Pages HTTPS et test Pixel. Les mises à jour ont vocation à être proposées automatiquement, pas à écraser sans examen les parties utilisateur.
- Ce lot reste indépendant du chantier « mode Jouer » et de la PR PWA.

## Mode de reprise
- Une exécution répétée ignore une PR déjà ouverte avec la même branche cible ; une branche existante non documentée n'est jamais écrasée.
- Ne jamais fusionner directement `main` depuis le robot.
