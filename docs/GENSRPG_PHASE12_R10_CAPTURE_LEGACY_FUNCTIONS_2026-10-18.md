# GenSrpG — Phase 12 R10 / 90 fonctions historiques Capture

**18 octobre 2026 — code appliqué sur la branche R10 ; CI complète et validation manuelle encore en attente.** Ne pas annoncer GREEN ou EXIT par anticipation.

## Protocole et source §§25–26

- Dernier jalon d'audit GREEN : `checkpoint/gensrpg-phase12-post-r09-exit-audit-green-2026-10-18` → `62a77e8e2b7fd9a4452cfb23c970957f2f8a37f4`.
- Point de départ documentaire R10 : `f2d5f954fc8e678bbf6819d2358964f47c61783f`, sans différence de runtime avec le checkpoint d'audit. **START avant toute modification** `checkpoint/gensrpg-start-phase12-r10-capture-legacy-functions-2026-10-18`; branche `work/gensrpg-phase12-r10-capture-legacy-functions-2026-10-18`.
- Source exacte vérifiée par les octets de l'archive utilisateur **`d8.zip`**, membre `index.html(6).txt` : **2 093 066 octets**, blob Git `4dbe3314d5048f2def404ed674498c0670c04fc1`. Référence du code R09 : `8580587f2aab5bc3918950bc152b4a56e4d79a8d`.
- `main` verrouillée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun laboratoire concerné.

## Périmètre strict

Le grand script anonyme R09 d'ordre **n°21** (après 20 scripts précédents) contenait **765 516 octets** de JS multi-domaines (blob de corps `db8e91c0e1d9fea04f4c19ad6e84d69ea7259509`). Un parseur AST a relevé **90 déclarations globales de premier niveau `function capture*`**, toutes distinctes et appartenant à la famille Capture du dépôt principal : règles de créatures et progression/XP, combat historique, talents et capacités, inventaire, soin, boutiques, profils et rencontres. Les **constantes lexicales, états, initialisations et fonctions non Capture restent à leur emplacement**. Aucune modification de gameplay, aucun nouveau moteur.

Le code exact des 90 fonctions a été externalisé **sans réécriture** dans `assets/gensrpg/capture/legacy-monolith-functions-v1.js`, avec une balise `script` classique synchrone insérée immédiatement avant l'ancien script. Les fonctions continuent de référencer au moment de leur appel les services et états existants ; pas d'import ES ni nouvelle couche d'autorité.

| Fichier | Octets | Blob |
|---|---:|---|
| `index.html` avant R10 (R09) | **2 093 066** | `4dbe3314d5048f2def404ed674498c0670c04fc1` |
| `index.html` après R10 | **2 031 649** | `b8ef8dcb497cad94c91094ed008136a5d9800155` |
| `assets/gensrpg/capture/legacy-monolith-functions-v1.js` | **61 943** | `c6ea3c101a6861b99f8bc064d2d1fec874e7266b` |

**Gain net HTML : 61 417 octets.** Les 90 fonctions restent actives dans leur propriétaire ; aucun flux Capture n'est retiré. `service-worker.js` pré-cache le nouveau script avec un marqueur de cache versionné, `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` classe le nouveau fichier en `capture`. Préserver les 32 images Survie historiques.

## Contrôles techniques et retour arrière

L'outil `tools/gensrpg_phase12_r10_capture_extract_apply.cjs` intègre **les 90 intervalles AST UTF-16 certifiés** et refuse toute source dont taille ou blob diffèrent de R09. Il vérifie la compilation du JS extrait et du JS restant, le numéro du script, les 90 noms de fonction Capture uniques, le nombre exact d'octets de la sortie et les blobs attendus. **`--restore-r09` recompose à l'octet près le `index.html` validé**. `--verify` reconstruit à partir de l'index de départ Git historique, compare tous les fichiers de code et vérifie PWA/owner. Le test `tests/gensrpg_phase12_r10_capture_sentinel.test.cjs` exerce également les fonctions Capture simples (XP, PV, affichage), le global classique et le rollback historique.

Application GitHub Actions sur branche R10 (tests de source, application, restauration, sentinelle R10 et sentinelle R09) : [R10 guarded Capture apply](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39161452910) **SUCCESS**. Commit runtime produit : `148844a8ccc524a06a08ac8f6a8039b8f8e0c6c1`. Fichiers runtime réellement modifiés : uniquement `index.html`, nouveau JS Capture, `service-worker.js` et manifeste d'owners. Les deux laboratoires n'ont subi aucune modification.

## Gates avant GREEN final

- Exécuter les sentinelles R10 et le rollback source R09 byte-exact.
- Conserver les anciens tests Survie, Dungeon, Capture, Shell, sauvegardes et PWA **sans effacer de couverture** ; adapter leurs fixtures si elles requièrent l'index historique à un instant R09, en utilisant **`--restore-r09`**, sans changer les règles de gameplay.
- Obtenir **SUCCESS sur un seul et même SHA** pour source/rollback, Firefox, Tactical Firefox+Chromium et Architecture statique+Chromium navigateur réel. Aucune tolérance à une CI rouge.
- Créer seulement alors `checkpoint/gensrpg-phase12-r10-capture-legacy-functions-green-2026-10-18`, demander une validation manuelle ciblée Capture et conserver Phase 12 ouverte.

**Statut initial : CODE APPLIQUÉ, PAS ENCORE GREEN.**
