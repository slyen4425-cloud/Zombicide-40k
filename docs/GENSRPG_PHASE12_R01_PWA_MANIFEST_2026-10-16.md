# GenSrpG — Phase12 R01 / PWA Dynamic Manifest — Préflight (16 octobre 2026)

## Gouvernance

- Lot R01 unique : **externalisation sans modification du script anonyme qui crée le manifeste dynamique de la PWA**. Aucune déduplication et aucun changement de manifeste statique / icônes.
- Base de code dernier GREEN : SHA D9 `83d6683896cdb58a63f98cf2fc3e360c23423f76`, checkpoint `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16`; triple CI [Architecture/Chromium 38867846431](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846431), [Firefox 38867846444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846444), [Tactical 38867846636](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846636), toutes SUCCESS à ce SHA.
- Base documentaire du nouveau lot : commit audit `d26f4a3219d34aac229c0ee71a0f489915c83129` (documents exclusivement, même Git blob d'index que D9 GREEN). Checkpoint de départ §25 `checkpoint/gensrpg-start-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16` créé sur ce commit **avant** toute modification ; branche dédiée `work/gensrpg-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16`.
- **État actuel : Préflight uniquement. R01 NON GREEN.** Interdiction de déclencher une application ou de créer un checkpoint final tant que la source exacte §26 n'est pas reçue, certifiée et que les sentinelles et la triple CI n'ont pas validé le vrai code déplacé.

## Source §26 et preuve locale de réversibilité

- Permalink de source exacte à fournir : https://github.com/slyen4425-cloud/Zombicide-40k/blob/83d6683896cdb58a63f98cf2fc3e360c23423f76/index.html
- Index D9 Git certifié : **7 703 979 octets**, blob `fce949665fea47a2aa2a535ede7289b06936f986`.
- Pré-analyse uniquement : `c2.zip` (D8 certifié) + remplacement en mémoire du Core202 déjà déplacé produisent bit-à-bit ce blob D9. L'utilisateur doit transmettre le **ZIP D9 exact** au titre du §26 avant l'application : ne pas substituer une ancienne archive au fichier demandé.
- Un seul bloc anonyme historique `<script>...</script>` ; corps IIFE **734 440 octets**, blob Git `778e3acf2f77b3c7680bf70a0c6a846b84826235`, sans identifiant ni attribut async/defer.
- Transformation de référence **non appliquée** : copie du corps vers `assets/gensrpg/shell/pwa-manifest-dynamic-v1.js` ; remplacement exact de la balise source par `<script src="assets/gensrpg/shell/pwa-manifest-dynamic-v1.js"></script>`, script classique, synchrone, même position parser. Résultat calculé en mémoire uniquement : **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e` ; réduction nette **734 386 octets**. Réinsertion de `<script>` + corps original + `</script>` doit reconstruire l'index D9 **bit pour bit**.
- Outil de préparation : `tools/gensrpg_phase12_r01_pwa_manifest_extract_apply.py`. Ne pas exécuter `--apply` avant source §26 et mise à jour de toutes les sentinelles affectées ; ne pas créer de workflow d'application prématuré. Test préalable : `tests/gens_phase12_r01_pwa_manifest_source_characterization_v1.test.cjs`.

## PWA : comportement à préserver

- Le HTML possède `<link id="gensManifestLink" rel="manifest" href="manifest.webmanifest?v=1738">` placé avant l'IIFE. À l'exécution, l'IIFE crée un `Blob` JSON de type `application/manifest+json` et assigne `URL.createObjectURL(blob)` à `link.href`. Éviter `async`, `defer`, `type=module`, déplacement ou substitution du manifeste statique.
- Les deux icônes base64 du script correspondent exactement aux PNG racine : `icon-192.png` (71 694 octets, blob `a8e5c257eb91e77d805708393d2af24ab4a06a72`) et `icon-512.png` (478 559 octets, blob `34ff30639e8cbc0f2c366c6d82049772d38934fd`). **Ne pas les supprimer pendant R01.**
- `manifest.webmanifest` statique diffère (description, `background_color`, orientation, chemins PNG) et pointe vers `./icons/*`, non présents au niveau racine du checkpoint Git. **Pas de suppression / réaffectation du manifeste dynamique avant parité navigateur PWA certifiée.**
- Propriétaires protégés : création de manifeste seulement ; aucun changement au bootstrap IndexedDB, au Shell/PvP, aux quatre moteurs, aux sauvegardes/import/export, au cache SW, aux médias ou au comportement Android.

## Tests et gates

1. Réception du ZIP D9 exact, taille ET blob vérifiés ; corps IIFE hashé exact et unique.
2. Déplacer uniquement le JS du propriétaire PWA sans changement, position script inchangée ; rollback R01→D9 exact, D9→D1 historiques intacts.
3. Tests de composition : script externe chargé exactement une fois, ordre parser, inventaires et manifestes propriétaires actualisés sans diminuer les gardes, tests des anciennes vues de source sur D9 restauré.
4. Test navigateur sur vrai PWA : lien Blob, champs et icônes actifs, installation, cache/hors ligne, retour écran. Au minimum sentinelles Architecture/Chromium + Firefox + Tactical toutes SUCCESS au **même SHA** et checkpoint R01 GREEN §25 seulement ensuite.
5. `main` gelée, laboratoires inchangés. Aucune branche différente ni refonte parallèle.

## Préflight GitHub en lecture seule (SUCCESS)

- [Workflow R01 preflight 38883525975](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38883525975) SUCCESS au SHA `2ec208c798b5dfef30c4cb0202987d8354cca4a1`. Aucun `--apply` exécuté : `index.html` et les assets runtime du checkpoint D9 restent inchangés.
- La comparaison depuis D9 GREEN montre uniquement documentation, test, utilitaire Python et workflow read-only ; pas de modification de source runtime. Test Node historique du `Blob`, du `href`, des 2 PNG et de la différence manifeste statique/dynamique vert ; prévision réversible de l'extraction prouvée.
- **Prochain gate bloquant §26 : recevoir le ZIP du vrai `index.html` D9 GREEN, 7 703 979 octets / blob `fce949665fea47a2aa2a535ede7289b06936f986`**, contrôler l'empreinte, puis préparer et exécuter l'application contrôlée et la triple CI. R01 NON GREEN.
