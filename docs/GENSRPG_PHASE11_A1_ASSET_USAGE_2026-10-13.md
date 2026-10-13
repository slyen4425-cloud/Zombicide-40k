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

## Premier résultat observé en CI sur le vrai checkout Git

Exécution du contrôle A1 dans le job Architecture sur le commit `cc88eaec8ff423dc1c5334fb428e7ec339feed50` :

- **123 fichiers externes inspectés** : sources Git suivies réellement présentes dans le checkout ;
- **32 images racine prises en compte** ;
- **0 image avec référence littérale externe** et **0 occurrence** ;
- test `gens_phase11_external_asset_refs_a1.test.cjs` : SUCCESS.

Ce constat **n'autorise ni suppression, ni renommage, ni attribution à un module**. Les chemins peuvent être formés dynamiquement, figurer dans `index.html` ou dans des données de profils/imports qui sont délibérément hors périmètre de ce scanner. Il exclut les fichiers de documentation/test pour ne pas confondre mentions historiques et consommation de runtime.

Cette preuve peut conclure le **sous-lot d'audit externe** une fois triple CI sur un SHA final, mais **pas la classification complète A1/Phase 11** tant que l'index exact n'est pas inspecté (§26).

## Preuves automatiques A1

Le script de diagnostic `tools/gensrpg_phase11_external_asset_refs_a1.cjs` lit les fichiers externes suivis par Git (`assets/*` JS/JSON/CSS/HTML et manifests/PWA/preview) et produit :
- nombre de sources effectivement inspectées ;
- pour chacune des 32 images, le fichier et la ligne des références **littérales** trouvées dans ce périmètre ;
- le nombre de références et le statut explicite de source manquante pour `index.html`.

Il exclut `index.html`, `docs/`, `tests/`, `node_modules/`, les exports utilisateurs et les contenus non suivis. Le test `tests/gens_phase11_external_asset_refs_a1.test.cjs` valide l'inventaire de 32 images, la provenance fichier/ligne, l'absence de faux propriétaire attribué et l'interdiction de migration ; il est raccordé à la CI Architecture.

**Important :** ce lot est une preuve *partielle* ; il n'autorise aucune migration physique, décision de suppression ou transfert de propriétaire non étayé.

## Matrice versionnée et décisions fondées sur preuves

La matrice `docs/phase11/asset-ownership-matrix-a1.json` lie les **32 images racine** à leur blob Git, à l'absence constatée de littéraux externes, aux preuves manquantes et à une destination volontairement **non définie** (aucun chemin arbitraire inventé).

Pour les icônes PWA, elle distingue :
- deux fichiers **racine** effectivement copiés sous `icons/` lors du déploiement : `icon-192.png`, `icon-512.png` ;
- deux fichiers sous `Icon/` dont les **SHA diffèrent** de ceux des racines et pour lesquels aucune utilisation publique n'est prouvée.

Le test `tests/gens_phase11_asset_ownership_matrix_a1.test.cjs` bloque tout glissement silencieux de cette matrice : liens vers manifest, commande exacte de publication GitHub Pages, empreintes Git et interdiction de migration sans preuve. Ces assertions ne prouvent pas pour autant qu'aucun ancien export ou profil n'utilise les fichiers.

**Verdict du lot** : traçabilité externe et flux d'icônes identifiés, mais propriétaires des 32 images encore non établis. La migration reste bloquée jusqu'au contrôle exact de l'index et des données concernées.

## Suite prévue, en conservant la charte

1. Lire les résultats des tests CI externes sur la branche A1 et fixer les preuves validées pour chaque référence trouvée.
2. Si la classification ne peut se conclure sans `index.html`, demander **uniquement le ZIP exact correspondant au SHA de la branche**, conformément au §26 ; ce ZIP sert d'entrée de lecture, l'utilisateur n'a rien à publier.
3. Compléter la matrice `asset → consommateur → propriétaire → ancien chemin → destination candidate` sur preuves complètes et ouvrir un **autre** lot pour migrer un petit groupe si nécessaire.
4. Triple CI Architecture/Chromium, Firefox et Tactical sur le même SHA avant checkpoint GREEN ; aucune interface de combat ou mécanisme PvP n'entre dans ce chantier.

`main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de modification des laboratoires.

## Décision utilisateur — conservation des images historiques (13 octobre 2026)

Le propriétaire du projet demande de **laisser les 32 `assets/img_*` exactement en place**. Ces premières ressources Survie pourraient être insérées dans le code historique ou être recréées plus tard. Leur déplacement, suppression, renommage, transfert ou remplacement n'est **pas** un objectif actuel. Cette décision ne requiert pas d'attribuer un propriétaire définitif à chacune des 32 images ni de demander le ZIP `index.html` pour une migration qui n'aura pas lieu. Les réserves techniques sur les consommateurs non prouvés restent consignées, sans blocage artificiel de la restructuration.

Les deux dépôts `slyen4425-cloud/GenSrpg_labo_combat_dynamique` et `slyen4425-cloud/laboratoire_dynamique_exploration-` disposent déjà de leur propre classement d'assets : **ils ne sont pas dans le périmètre de la Phase 11 du dépôt principal**. Aucun déplacement entre dépôts, regroupement forcé ni partage implicite par fallback ne doit être engagé. Une éventuelle future intégration de données ou d'assets sera un chantier explicite, avec contrat/chemins et tests distincts.

**Livraison admissible du lot A1** : conserver l'inventaire et l'audit des 123 sources externes, enregistrer le statut « préservé en place » dans la matrice et ses tests. L'absence d'analyse exacte de `index.html` ne doit pas être transformée en prétexte à poursuivre les audits de ces 32 images, tant que leur migration est suspendue. La Phase 11 ne prétend pas avoir réalisé sa cible idéale de déplacement ; le plan se poursuit sur les travaux utiles, en rouvrant la migration seulement à la demande.
