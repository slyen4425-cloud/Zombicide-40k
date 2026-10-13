# GenSrpG — Phase 11 / A1 : preuves de consommation des assets graphiques
Date : 13 octobre 2026.

## Périmètre / procédure
Base triple-CI GREEN `dc9ad1e5396892c805ddc79c4542f29420062095`, checkpoint initial `checkpoint/gensrpg-start-phase11-asset-ownership-a1-2026-10-13` et branche `work/gensrpg-phase11-asset-ownership-a1-2026-10-13`. Précédent jalon GREEN A0 : `checkpoint/gensrpg-phase11-asset-inventory-a0-green-2026-10-13`, SHA `a96cb54049648bb87619a7febdcfe0388a6fb98f`.

**Objectif** : connaître les consommateurs réels avant de déplacer ou renommer quoi que ce soit. Le test ne consulte, ne copie et ne transforme **jamais** `index.html` ; la charte §26 exige une copie ZIP exacte fournie par l'utilisateur pour l'inspection de ce fichier de ~8 Mo. Le moteur et les graphismes restent inchangés.

## Constats de fichiers réels vérifiés

- **32 images racine `assets/img_01_…` à `assets/img_32_…`** : leurs blobs/tailles sont connus grâce à l'inventaire A0, mais leurs consommateurs définitifs ne peuvent pas être déduits de leur nom. Une référence littérale dans un fichier externe n'est qu'un *indice vérifiable* ; l'absence de référence externe n'est pas une preuve d'inutilisation, puisque `index.html`, les sauvegardes et les imports peuvent les référencer.
- **Icônes publiques de la PWA** : `manifest.webmanifest` référence `./icons/icon-192.png` et `./icons/icon-512.png`. Le workflow de déploiement `.github/workflows/main.yml` copie les **fichiers racine** `icon-192.png` et `icon-512.png` vers `_site/icons/`. Il s'agit d'un chemin explicitement traçable, distinct des doublons de noms contenus dans `Icon/` ; il ne faut fusionner ni supprimer ces derniers sans preuve additionnelle.
- **Dungeon/Cache** : `service-worker.js` déclare explicitement plusieurs ressources `assets/dungeon/creatures/` dans `CORE_FILES`, notamment `dng_wall_block.jpg` et des sols. Ce sont des dépendances PWA réelles ; elles ne peuvent pas être déplacées comme de simples images orphelines.
- **Resolver Core** : `assets/gensrpg/core/asset-resolver-v1.js` définit des chemins Dungeon explicitement ; ni ce fichier, ni le `service-worker.js` ne doivent être court-circuités par un nouveau fallback entre modules.

## Preuves automatiques A1

Le script de diagnostic `tools/gensrpg_phase11_external_asset_refs_a1.cjs` lit les fichiers externes suivis par Git (`assets/*` JS/JSON/CSS/HTML et manifests/PWA/preview) et produit :
- nombre de sources effectivement inspectées ;
- pour chacune des 32 images, le fichier et la ligne des références **littérales** trouvées dans ce périmètre ;
- le nombre de références et le statut explicite de source manquante pour `index.html`.

Il exclut `index.html`, `docs/`, `tests/`, `node_modules/`, les exports utilisateurs et les contenus non suivis. Le test `tests/gens_phase11_external_asset_refs_a1.test.cjs` valide l'inventaire de 32 images, la provenance fichier/ligne, l'absence de faux propriétaire attribué et l'interdiction de migration ; il est raccordé à la CI Architecture.

**Important :** ce lot est une preuve *partielle* ; il n'autorise aucune migration physique, décision de suppression ou transfert de propriétaire non étayé.

## Suite prévue, en conservant la charte

1. Lire les résultats des tests CI externes sur la branche A1 et fixer les preuves validées pour chaque référence trouvée.
2. Si la classification ne peut se conclure sans `index.html`, demander **uniquement le ZIP exact correspondant au SHA de la branche**, conformément au §26 ; ce ZIP sert d'entrée de lecture, l'utilisateur n'a rien à publier.
3. Compléter la matrice `asset → consommateur → propriétaire → ancien chemin → destination candidate` sur preuves complètes et ouvrir un **autre** lot pour migrer un petit groupe si nécessaire.
4. Triple CI Architecture/Chromium, Firefox et Tactical sur le même SHA avant checkpoint GREEN ; aucune interface de combat ou mécanisme PvP n'entre dans ce chantier.

`main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de modification des laboratoires.
