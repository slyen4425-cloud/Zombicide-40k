# GenSrpG — Phase 12 / audit EXIT exact après R14 GREEN (20 octobre 2026)

**Audit de source réelle, non une estimation. La Phase 12 globale reste ouverte.**

## Gouvernance et preuve §26

- Base immuable **R14 GREEN SHA `39726aa1b00d8cf5e5a0ad5ff8af041093460fc9`** ; checkpoint `checkpoint/gensrpg-phase12-r14-builders-rpg-universe-editor-green-2026-10-20`, six contextes CI `success`.
- START documentaire §25 créé avant le chantier : `checkpoint/gensrpg-start-phase12-post-r14-exit-audit-2026-10-20` au même SHA ; branche `work/gensrpg-phase12-post-r14-exit-audit-2026-10-20`.
- `index.html` R14 exact **1 772 759 octets**, Git blob `dab5be5dedfa56c49d76d40a4cb824a0098903f0` ; fichier disponible depuis le résultat déterministe R13 utilisateur (`e1.zip`) → R14, vérifié avec `git hash-object` et les métadonnées GitHub GREEN. Pas de lecture GitHub massive §26.
- Fichier permanent : https://github.com/slyen4425-cloud/Zombicide-40k/blob/39726aa1b00d8cf5e5a0ad5ff8af041093460fc9/index.html

## Décompte observé

| R14 réellement observé | Valeur |
|---|---:|
| Tags `<script>` | **151** |
| Scripts externes avec `src` | **62** |
| Scripts inline actifs | **89** |
| Scripts désactivés par type | **0** |
| Corps inline encore présents | **978 755 octets** |
| Anonyme #25 multi-domaines | **542 293 octets**, blob `feee6ec2b17c932864b804f14ed2b3b1cd064cad` |
| Anonyme #28 multi-domaines | **94 882 octets**, blob `50e5b25ce6d3d9bf41c6e684f5548cc5842be935` |
| Blocs anonymes restants | **5** (le corps #64 est une IIFE Dungeon active, #30 et #150 sont des bootstraps) |
| Déclarations premier niveau du grand #25 | **718 fonctions** |
| Déclarations premier niveau du second #28 | **115 fonctions + 13 déclarations variables + 5 instructions d'initialisation/effet** |
| Scripts actifs à `id` | **84**, environ 335 Ko |
| Erreurs de parsing syntaxique sur le candidat du second anonyme | **0** |

Les scripts nommés et les deux gros anonymes ne se résument pas à un domaine unique. Déplacer ces blocs entiers créerait une fausse autorité, contraire aux §§1–3, 7–9, 11.

## Candidat substantiel identifié : R15 Builders / éditeurs de héros, créatures et compagnons

- Dans l'anonyme R14 **#28**, AST : **54 fonctions de déclaration top-level**, appartenant à trois ensembles d'édition complémentaires : équipement/progression du héros, bibliothèque et fiche des entités contrôlables/compagnons, ouverture/édition/enregistrement des héros.
- Volume exact des **54 déclarations originales sélectionnées : 42 990 octets** ; futur module générique **Builders seul**, `assets/gensrpg/builders/legacy-character-entity-editors-v1.js`.
- **Sélection exclue du moteur** : `showAbilityInfo` (aide partagée), `gensRefreshDynamicTagSelects` (utilitaire d'actualisation transversal), `useCustomHeroNow` (activation/session Shell), ainsi que `loadSharedEntities`/`saveSharedEntities`/`migrateSharedEntitiesToFamilyStorage` (stockage Core), `applyCustomHeroesMulti` (activation runtime), les règles et événements Capture, la graine `gensStarterCreatures` (16 963 o), les états lexicaux et tout bootstrap DOM.
- Les fonctions d'éditeur peuvent **appeler** les services Core et Capture qu'elles utilisaient déjà, sans en revendiquer la propriété ni les dupliquer. Risque d'interface : références aux `const`/`let` globales historiques laissées dans l'anonyme d'origine ; le script nouvellement externe ne porte que des **déclarations** et doit être chargé au même endroit, en script classique sans `async`/`defer`.
- Vérification locale : **54 noms uniques parmi toutes les fonctions inline actives ; 54 globals exécutables dans un contexte VM isolé ; ancien second anonyme restitutable à l'octet**. Aucune fonction sélectionnée avec collision top-level inline.
- **Simulation locale R15** (non encore appliquée au code GitHub à la date de cette analyse) : `index.html` **1 729 855 octets**, blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` (–42 904 octets) ; JS Builders **43 415 octets**, blob `318aad27b69593f338ace5f3602dfd7fa351c274` ; restant second anonyme **51 892 octets**, blob `629d27c9df8e7fea52c311248da189a065f69a6a`; **152 scripts**.
- Tout autre changement que les **4 artefacts physiques** (`index.html`, le nouvel owner, SW/PWA, manifest propriétaires), plus tests et documentation, invaliderait l'extraction.

## Décision et critères de contrôle

Ce candidat représente une responsabilité Builders cohérente et un lot plus significatif qu'une extraction isolée d'un assistant UI à quelques Ko. **Ne pas fusionner** l'audit dans une branche de runtime ; un chantier R15 physique exige son propre START §25 depuis **R14 GREEN**, son outil de transformation/rollback à empreintes exactes, ses sentinelles R09–R15, ses tests navigateur de création/édition/import des héroïnes/héros et créatures et des quatre modes, et des jobs CI verts sur un **SHA unique**. Les sauvegardes et initialisations restent là où elles étaient.

La Phase 12 ne peut pas être annoncée terminée, même si R15 obtient ensuite GREEN ; il reste un grand bloc inline multi-domaines de plus de 542 Ko. Ne pas inventer des micro-lots pour achever un pourcentage artificiel. `main` et les laboratoires restent gelés.
