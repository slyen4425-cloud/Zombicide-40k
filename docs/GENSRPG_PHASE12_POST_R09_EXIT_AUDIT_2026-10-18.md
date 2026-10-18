# GenSrpG — Phase 12 / audit du véritable EXIT après R09

Date : 18 octobre 2026. **Inventaire R09 exact certifié à partir de l'archive utilisateur `d8.zip`. Chantier documentaire seulement : aucun changement de gameplay, aucune extraction physique supplémentaire et aucun faux EXIT.**

## 1. Référence et protocole

- Dernier code et CI certifiés : R09 `8580587f2aab5bc3918950bc152b4a56e4d79a8d` ; checkpoint `checkpoint/gensrpg-phase12-r09-survival-wave-spawn-green-2026-10-18`. Retour de test humain positif du 18 octobre 2026 sur le mode Survie.
- Base de départ documentaire post-validation : `17f7a7ad424c2b8d4d27838cfd13366035e42dd7` (même code que R09 certifié).
- **START §25 antérieur au premier commit :** `checkpoint/gensrpg-start-phase12-post-r09-exit-audit-2026-10-18` ; branche `work/gensrpg-phase12-post-r09-exit-audit-2026-10-18`.
- Source exacte pour le constat §26 : `index.html` à ce [permalien de code R09](https://github.com/slyen4425-cloud/Zombicide-40k/blob/8580587f2aab5bc3918950bc152b4a56e4d79a8d/index.html), taille **2 093 066 octets**, blob **`4dbe3314d5048f2def404ed674498c0670c04fc1`**. **Gate franchi :** archive utilisateur `d8.zip`, membre `index.html(6).txt`, exactement **2 093 066 octets**, blob Git **`4dbe3314d5048f2def404ed674498c0670c04fc1`**. La lecture locale a comparé les octets et le blob à R09 GREEN. `d7.zip` (source R08) n'a pas été substitué.
- `main` reste verrouillée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de fusion et pas de modification des deux laboratoires ou des 32 images Survie historiques.

## 2. Éléments établis, sans simulation d'un inventaire R09

| État certifié | index.html | Rapport / portée |
|---|---:|---|
| D9 | 7 703 979 octets | Ancien audit de bornage (16 octobre) |
| R06 | 2 643 155 octets | **Inventaire réel R06** : 161 scripts, 55 externes, 89 inline actifs (1 752 298 o de corps), 17 désactivés (95 878 o). Ce sont des données **historiques**, pas les totaux R09. |
| R07 | 2 217 805 octets | Extraction données magiques/audio |
| R08 | 2 131 805 octets | Bibliothèque commune de compétences |
| **R09** | **2 093 066 octets** | Source `d8.zip` certifiée ; inventaire réel détaillé ci-après |

Depuis D9, le HTML est plus petit de **5 610 913 octets**. Depuis R06, il a diminué de **550 089 octets**. Ces gains physiques ne signifient pas que les responsabilités extraites sont mortes : elles restent actives dans des propriétaires externes.

Le diagnostic R06 avait identifié un très grand script anonyme multi-domaines et un second anonyme partagé important, ainsi que des scripts nommés Dungeon et des scripts désactivés. R07/R08/R09 ont changé l'état physique. Les totaux R09 suivants sont issus **uniquement de la source utilisateur exacte**, jamais inférés des nombres R06.

## 3. Questions d'EXIT à trancher sur l'index R09 exact

1. **A — scripts actifs** : compter et mesurer réellement les déclarations et blocs restant inline. Pour chaque groupe candidat, distinguer propriétaire fonctionnel unique, initialisations, lexical bindings, listeners globaux, UI et contrats entre modes. Ne jamais déplacer le dernier grand monolithe multi-domaines en un unique fichier « Core » : cela ne résout pas la multi-autorité.
2. **B — véritables bootstraps** : prouver si les quelques corps minuscules (ex. IndexedDB, Shell/PvP) restent admissibles. Aucun calcul de jeu, sauvegarde ou contrôleur de module inline ne doit être rebaptisé « bootstrap ».
3. **C — scripts inertes** : recompter exactement les scripts explicitement désactivés et confirmer qu'aucun runtime/éditeur ne lit encore leurs corps. Si possible, grouper archive/retrait en **un seul** chantier contrôlé, sans jamais les réactiver.
4. **Rentabilité** : sélectionner un ensemble réellement significatif en octets **et** mono-propriétaire, ou conclure explicitement que le prochain déplacement est trop risqué. Pas de R10/D10 automatique ou de collection de micro-lots.
5. **Preuves** : pour un éventuel lot d'extraction, créer un NOUVEAU START §25, recevoir la source correspondante §26, verrouiller byte-exact/parsing/rollback et repasser les quatre pipelines (R09 source historique, Architecture + Chromium, Firefox et Tactical) sur un seul SHA. Tester réellement le mode concerné.


## 3 bis. Résultat exact de l'inventaire R09 (archive d8.zip validée)

| Mesure réelle, 18 octobre 2026 | Résultat |
|---|---:|
| Balises script | **164** |
| Scripts externes | **58** |
| Scripts inline actifs | **89**, soit **1 201 978 octets** |
| Scripts inline désactivés (type spécial) | **17**, soit **95 878 octets** |
| Inline actifs anonymes | **5**, soit **867 198 octets** |
| Inline actifs identifiés | **84**, soit **334 780 octets** |

Les **deux** anonymes principaux restent le n°**21** : **765 516 octets** (blob du corps `db8e91c0e1d9fea04f4c19ad6e84d69ea7259509`) et le n°**24** : **94 882 octets** (`50e5b25ce6d3d9bf41c6e684f5548cc5842be935`). Ensemble **860 398 octets**, soit **71,6 %** du code inline actif. Le n°21 possède **976 déclarations de fonctions de premier niveau et 1 120 statements** (parseur TypeScript, zéro erreur de syntaxe) ; il mélange Survie, Dungeon, Capture, éditeurs, profils, règles de jeu, Core et navigation. Le n°24 contient **115 fonctions de premier niveau et 133 statements**, avec version/update, éditeur héros, créatures, entités partagées et Capture. **Interdiction de rebaptiser l'un de ces scripts « Core » ou de l'externaliser en bloc.**

Les **trois** autres anonymes : n°26 **219 octets**, candidat **B** bootstrap IndexedDB, pas encore démontré ; n°63 **6 337 octets**, **A**, feedback IA Dungeon Core 0.24 exécuté dans une IIFE ; n°163 **244 octets**, candidat **B** Shell/PvP à caractériser. Les 84 scripts identifiés se répartissent par **indices de noms historiques seulement**, jamais par propriété prouvée : 78 identifiants Dungeon (**295 787 octets**) et six autres (**38 993 octets**).

**Scripts désactivés C** : 17 corps, **95 878 octets**, regroupés principalement autour des anciennes corrections de ciblage et Dungeon 0.91–0.105. La vérification dans `index.html` hors des corps désactivés a trouvé pour certains des **identifiants de styles CSS** apparentés ; cela n'autorise surtout pas à supprimer les styles actifs. La non-utilisation par les fichiers JS externes ou par un outillage historique doit encore être prouvée. Si elle l'est, **un seul lot collectif d'archivage/retrait C** avec rollback byte-exact et tests réels ; jamais 17 micro-lots, jamais réactivation des scripts.

## 3 ter. Arbitrage de la suite et risques

1. **Priorité architecture A :** investiguer et borner un groupe **substantiel et monodomaine** à l'intérieur du n°21 (765 516 octets). Les noms seuls ne sont pas une preuve : établir AST/contrats, états lexicaux, ordre des initialisations, effets de bord et appels inter-modules, puis garantir le rollback exact. Le n°24 doit être fractionné par familles de propriétaires si une extraction est justifiée, pas déplacé en un seul bloc.
2. **Candidat collectif à faible risque :** les 17 scripts C (**95 878 octets**), mais seulement après vérification des références dans **tous les scripts externes**, du style associé, de l'absence de lecture de `textContent`/DOM des balises et de la compatibilité des sauvegardes. Les tests navigateur multi-modes et PWA restent exigés.
3. **Dette résiduelle :** 84 scripts actifs nommés (**334 780 octets**) et l'IIFE Dungeon 0.24 (6 337 octets). Éviter 85 lots. Regrouper uniquement selon une responsabilité démontrée et une économie/risque raisonnable ; les deux candidats B totalisent seulement 463 octets, sans validation automatique.
4. **Gate de code :** AUCUNE extraction engagée dans cet audit. Tout futur déplacement doit posséder son START §25, sa branche propre, son propriétaire explicite, l'archive source exacte du checkpoint, un comparateur SHA/rollback et quatre CI sur un même commit. Si le risque est trop élevé, ne pas publier de faux EXIT.

Le rapport machine ne contient **ni corps de scripts, ni images, ni secrets** : `docs/GENSRPG_PHASE12_POST_R09_D8_VERIFIED_CENSUS_2026-10-18.json`.

## 4. Critères mesurables pour annoncer la fin de la Phase 12

- **Zéro code de gameplay actif inline** dans le HTML principal ; seul un bootstrap minimal documenté peut subsister.
- **Zéro script inerte C** oublié ou susceptible d'être exécuté accidentellement.
- **Propriétaire unique** des responsabilités ; graphe réel des scripts et ordre parser conservés, aucune injection parallèle de modules.
- Sauvegardes, reprise, éditeurs, PWA/cache, chemin réel de Survie/Dungeon authored et generated/Tactical/Capture/PvP placeholder protégés.
- Résultat reproductible, rapport de recensement courant, sentinelles sans relâchement, CI GREEN sur SHA fixé et test humain ciblé.

**État à la date du présent document : inventaire quantitatif R09 certifié ; audit de dépendances et de propriété fonctionnelle restant à approfondir avant un déplacement.** La Phase 12 n'est pas déclarée terminée.

## 5. Point de reprise

`docs/GENSRPG_CHARTE.md` → `docs/GENSRPG_CURRENT_WORK.md` → START ci-dessus → ce rapport. Inventaire exact obtenu de l'archive utilisateur `d8.zip`, octets et blob vérifiés. Source de référence immuable : [index R09](https://github.com/slyen4425-cloud/Zombicide-40k/blob/8580587f2aab5bc3918950bc152b4a56e4d79a8d/index.html) ; manifeste sans corps de code : `docs/GENSRPG_PHASE12_POST_R09_D8_VERIFIED_CENSUS_2026-10-18.json`.
