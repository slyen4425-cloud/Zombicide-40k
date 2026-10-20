# GenSrpG — Phase 12 / Pré-audit EXIT après R13

**20 octobre 2026 — pré-audit documentaire, pas encore audit du contenu exact R13.** Interdiction d'appeler ce travail GREEN ou de déclarer Phase 12 terminée avant les preuves requises.

## 1. Autorité, charte, séparation du chantier

- Base de code R13 GREEN : `checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20`, `e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`, 7/7 checks SUCCESS d'après la certification R13.
- START §25 créé **sur ce SHA avant la moindre modification** : `checkpoint/gensrpg-start-phase12-post-r13-exit-audit-2026-10-20`. Branche : `work/gensrpg-phase12-post-r13-exit-audit-2026-10-20`.
- Aucun nouveau lot physique R14 ouvert. Aucun changement de gameplay, de la PWA, de `main`, de Survie/Capture/Dungeon/PvP/Tactical ou des deux laboratoires.
- Charte de référence : `docs/GENSRPG_CHARTE.md`, §§1–5, 9, 14–21, 25–26. Les 32 visuels historiques Survie restent gelés.

## 2. Sources et limite de preuve

- **R10 exact documenté** : `E1.zip`, 2 031 649 octets / Git blob `b8ef8dcb497cad94c91094ed008136a5d9800155` ; audit source dans `docs/GENSRPG_PHASE12_POST_R10_EXIT_ASSESSMENT_2026-10-19.md`.
- **R11 certifié** : retrait *collectif* de 17 tags scripts désactivés (97 396 octets d'index, 95 878 de corps inertes), en conservant les cinq CSS actifs associés ; nouveaux corps inline actifs strictement inchangés.
- **R12 certifié** : 96 déclarations Dungeon RPG/talents déplacées, 70 586 octets de déclarations ; index 1 863 745 octets / blob `b0d0c73292e4374fc4f23e86edffad5c1b39a7b6`.
- **R13 certifié** : 31 déclarations Builders déplacées, 43 725 octets de déclarations ; index **1 820 094 octets** / blob **`b5a39705baf83e9782695c14bede8b9dde6ddf52`** ; propriétaire `assets/gensrpg/builders/legacy-enemy-editor-v1.js` ; rollback certifié.
- **Limite expresse** : les nombres ci-dessous sont **des déductions** de ces rapports historiques attestés, non le résultat d'une lecture du HTML R13. La charte §26 exige la réception/vérification de son fichier exact avant un recensement ou un AST présenté comme courant.

## 3. Projection après R13 (NON certifiée par inspection directe)

| Mesure | R10 observé et certifié | Projection après R11 → R13 | Qualification |
|---|---:|---:|---|
| Taille `index.html` | 2 031 649 octets | **1 820 094** | R13 Git blob certifié |
| Scripts désactivés | 17 | **0** | retrait R11 certifié |
| Scripts externes | 59 | **61** | +1 R12 et +1 R13 ; à recompter |
| Scripts inline actifs | 89 | **89** | aucun tag actif supprimé, corps diminués ; à recompter |
| Octets des corps inline actifs | 1 140 482 | **≈1 026 171** | calcul 1 140 482 − 70 586 − 43 725 ; à contrôler |
| Grand anonyme historique R10 n°22 | 704 020 | **≈589 709** | mêmes retraits R12/R13, à vérifier AST et ordre |
| Autre grand anonyme R10 n°25 | 94 882 | **≈94 882** | aucune extraction de ce corps attestée entre R10 et R13 |
| Scripts nommés inline R10 | 84 / 334 780 octets | **probablement inchangés** | les lots R12/R13 ciblaient des fonctions du grand anonyme |

**Important** : ces projections ne remplacent pas le fichier R13 exact et ne prouvent aucun propriétaire. On ne peut ni dire « Phase 12 proche de 100 % », ni la fermer en déplaçant mécaniquement des fonctions. La baisse d'octets dans l'index ne signifie pas une baisse de code métier.

## 4. Décision technique préliminaire et risques

1. **Priorité au grand anonyme résiduel** : environ 590 Ko, mais mêlant encore Shell, Core, Survie, Dungeon, Builders et autres règles ; refuser de l'externaliser entier en le présentant comme propriétaire unique.
2. **Reconstituer l'AST exact** : fonctions de premier niveau par domaine, variables et closures, références lexicales, ordre du parser, appels et effets de démarrage ; cartographier les vrais contrats entre modules. Ne pas classer sur un seul préfixe nominal.
3. **Choisir un groupe à rendement réel** : si l'analyse révèle un ensemble significatif d'un même propriétaire sans états/initialisations déplacés ni conflit d'autorité, justifier un **unique lot physique suivant** avec nouveaux START/branche, outil réversible, CI. Dans le cas contraire, documenter le blocage au lieu d'inventer des micro-lots.
4. **Ne pas oublier le deuxième anonyme** (≈95 Ko) transversal et les scripts nommés actifs historiques (≈335 Ko). Le petit feedback IA Dungeon (6 337 octets) ne justifie pas une extraction par inertie.
5. **Zone C déjà traitée** : ne pas planifier un deuxième retrait des 17 scripts désactivés. Rester vigilant pour les cinq feuilles CSS historiques conservées.
6. **Zone B** : deux très petits fragments de 219 et 244 octets peuvent rester uniquement comme vrais bootstraps, après preuve sur le chemin d'initialisation. Aucun moteur ou sauvegarde active ne doit rester inline lors de la fermeture réelle.
7. **Risques à protéger** : fonctions globales, DOM/overlays, stats/sauvegarde, pipeline Dungeon↔Tactical, Capture autonome, PWA/installation/hors-ligne et rollback d'octets. Les sept succès CI R13 ne valident pas manuellement tous les parcours utilisateur.

## 5. Gate §26 pour passer du pré-audit à l'audit exact

**Télécharger le seul `index.html` de ce permalink de code GREEN :**

https://github.com/slyen4425-cloud/Zombicide-40k/blob/e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec/index.html

Réception ZIP recommandée. À contrôler **avant** la lecture des blocs : 1 820 094 octets, Git blob `b5a39705baf83e9782695c14bede8b9dde6ddf52`, puis AST et inventaire effectif. `E1.zip` est une source exacte R10, **pas** un index R13 direct.

La prochaine étape du présent chantier consiste à produire l'EXIT audit substantiel, avec tableau des propriétaires/dépendances, bornage des groupes candidats, estimation de rendement/coût, tests d'acceptation et décision justifiée (prochaine extraction ou arrêt). Aucun GREEN d'audit ni création d'un lot R14 avant ce gate.

## 6. Critères de clôture Phase 12 inchangés

Le shell contient principalement HTML, styles racine, chargements externes et petits bootstraps prouvés ; aucune logique active de gameplay/édition/sauvegarde non triviale inline, aucune autorité dupliquée ; CSS/hors-ligne/installation/sauvegardes/parcours réels préservés ; rollback reproductible et tests Architecture/Chromium, Firefox, Tactical, autres sentinelles sur **le même SHA**. Validation manuelle distincte de CI. `main` gelée.
