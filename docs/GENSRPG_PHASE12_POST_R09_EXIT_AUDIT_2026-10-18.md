# GenSrpG — Phase 12 / audit du véritable EXIT après R09

Date : 18 octobre 2026. **Chantier documentaire et instrument de recensement seulement. Aucun changement de gameplay, aucune extraction physique supplémentaire et aucun faux GREEN/EXIT.**

## 1. Référence et protocole

- Dernier code et CI certifiés : R09 `8580587f2aab5bc3918950bc152b4a56e4d79a8d` ; checkpoint `checkpoint/gensrpg-phase12-r09-survival-wave-spawn-green-2026-10-18`. Retour de test humain positif du 18 octobre 2026 sur le mode Survie.
- Base de départ documentaire post-validation : `17f7a7ad424c2b8d4d27838cfd13366035e42dd7` (même code que R09 certifié).
- **START §25 antérieur au premier commit :** `checkpoint/gensrpg-start-phase12-post-r09-exit-audit-2026-10-18` ; branche `work/gensrpg-phase12-post-r09-exit-audit-2026-10-18`.
- Source exacte nécessaire pour la phase de constat détaillé §26 : `index.html` à ce [permalien de code R09](https://github.com/slyen4425-cloud/Zombicide-40k/blob/8580587f2aab5bc3918950bc152b4a56e4d79a8d/index.html), taille **2 093 066 octets**, blob **`4dbe3314d5048f2def404ed674498c0670c04fc1`**. Demander à l'utilisateur son téléchargement ZIP et vérifier ces deux empreintes. Aucune réutilisation directe de `d7.zip` (source R08).
- `main` reste verrouillée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de fusion et pas de modification des deux laboratoires ou des 32 images Survie historiques.

## 2. Éléments établis, sans simulation d'un inventaire R09

| État certifié | index.html | Rapport / portée |
|---|---:|---|
| D9 | 7 703 979 octets | Ancien audit de bornage (16 octobre) |
| R06 | 2 643 155 octets | **Inventaire réel R06** : 161 scripts, 55 externes, 89 inline actifs (1 752 298 o de corps), 17 désactivés (95 878 o). Ce sont des données **historiques**, pas les totaux R09. |
| R07 | 2 217 805 octets | Extraction données magiques/audio |
| R08 | 2 131 805 octets | Bibliothèque commune de compétences |
| **R09** | **2 093 066 octets** | 72 fonctions d'éditeur de vagues/spawn Survie déplacées, corps exact restant non recensé dans ce présent audit |

Depuis D9, le HTML est plus petit de **5 610 913 octets**. Depuis R06, il a diminué de **550 089 octets**. Ces gains physiques ne signifient pas que les responsabilités extraites sont mortes : elles restent actives dans des propriétaires externes.

Le diagnostic R06 avait identifié un très grand script anonyme multi-domaines et un second anonyme partagé important, ainsi que des scripts nommés Dungeon et des scripts désactivés. R07/R08/R09 ont changé l'état physique. **Aucune quantité actuelle de scripts actifs, désactivés, anonymes ou de corps JS ne doit être inférée mécaniquement des nombres R06.**

## 3. Questions d'EXIT à trancher sur l'index R09 exact

1. **A — scripts actifs** : compter et mesurer réellement les déclarations et blocs restant inline. Pour chaque groupe candidat, distinguer propriétaire fonctionnel unique, initialisations, lexical bindings, listeners globaux, UI et contrats entre modes. Ne jamais déplacer le dernier grand monolithe multi-domaines en un unique fichier « Core » : cela ne résout pas la multi-autorité.
2. **B — véritables bootstraps** : prouver si les quelques corps minuscules (ex. IndexedDB, Shell/PvP) restent admissibles. Aucun calcul de jeu, sauvegarde ou contrôleur de module inline ne doit être rebaptisé « bootstrap ».
3. **C — scripts inertes** : recompter exactement les scripts explicitement désactivés et confirmer qu'aucun runtime/éditeur ne lit encore leurs corps. Si possible, grouper archive/retrait en **un seul** chantier contrôlé, sans jamais les réactiver.
4. **Rentabilité** : sélectionner un ensemble réellement significatif en octets **et** mono-propriétaire, ou conclure explicitement que le prochain déplacement est trop risqué. Pas de R10/D10 automatique ou de collection de micro-lots.
5. **Preuves** : pour un éventuel lot d'extraction, créer un NOUVEAU START §25, recevoir la source correspondante §26, verrouiller byte-exact/parsing/rollback et repasser les quatre pipelines (R09 source historique, Architecture + Chromium, Firefox et Tactical) sur un seul SHA. Tester réellement le mode concerné.

## 4. Critères mesurables pour annoncer la fin de la Phase 12

- **Zéro code de gameplay actif inline** dans le HTML principal ; seul un bootstrap minimal documenté peut subsister.
- **Zéro script inerte C** oublié ou susceptible d'être exécuté accidentellement.
- **Propriétaire unique** des responsabilités ; graphe réel des scripts et ordre parser conservés, aucune injection parallèle de modules.
- Sauvegardes, reprise, éditeurs, PWA/cache, chemin réel de Survie/Dungeon authored et generated/Tactical/Capture/PvP placeholder protégés.
- Résultat reproductible, rapport de recensement courant, sentinelles sans relâchement, CI GREEN sur SHA fixé et test humain ciblé.

**État à la date du présent document : audit préparatoire, pas un constat définitif des corps R09.** La Phase 12 n'est pas déclarée terminée.

## 5. Point de reprise

`docs/GENSRPG_CHARTE.md` → `docs/GENSRPG_CURRENT_WORK.md` → START ci-dessus → ce rapport. Avant inventaire exact : récupérer [l'index R09 certifié](https://github.com/slyen4425-cloud/Zombicide-40k/blob/8580587f2aab5bc3918950bc152b4a56e4d79a8d/index.html), le compresser si nécessaire et vérifier taille/blob.
