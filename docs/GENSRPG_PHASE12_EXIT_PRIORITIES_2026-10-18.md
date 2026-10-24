# GenSrpG — Phase 12 / Audit prioritaire de sortie après R06

Date : 18 octobre 2026. **Audit de décision et diagnostic seulement : aucun déplacement du runtime, aucune clôture prématurée de la Phase 12.**

## Source d'autorité et reprise (§§25–26)

- Dernier code CI GREEN et accepté manuellement : SHA immuable **41a709f3478ded45b12b770435a96ad3f344faf3** ; checkpoint `checkpoint/gensrpg-phase12-r06-capture-legacy-patches-green-2026-10-18`. L'utilisateur a confirmé « Yes c est ok 👍 » le 18 octobre 2026. La documentation de validation manuelle existe sur le commit ultérieur `0cb41f048f36a9e6293b36c2f6589abf6c90baca`, sans différence de code.
- Checkpoint START audit `checkpoint/gensrpg-start-phase12-exit-priorities-2026-10-18` et branche distincte `work/gensrpg-phase12-exit-priorities-2026-10-18`, tous deux ouverts à partir **exactement** du SHA GREEN ci-dessus.
- L'index de départ est le même que R06 GREEN : **2 643 155 octets**, blob Git **12fc91df4ee4c7989a172baa96f9790da6dc57f7**. [Permalien de téléchargement](https://github.com/slyen4425-cloud/Zombicide-40k/blob/41a709f3478ded45b12b770435a96ad3f344faf3/index.html).
- **Gate §26 pour établir l'inventaire réel** : recevoir ce fichier exact (ZIP conseillé), vérifier taille + Git blob avant de lire son contenu. Les anciennes archives R05/R06 et la source d'entrée R06 de 2 782 155 octets ne sont **pas** réutilisables pour établir l'inventaire courant. Pas d'accès au contenu de ce gros index par tentatives GitHub répétées.
- `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; les deux laboratoires ne sont pas concernés.

## Bilan physique vérifié (sans compter des scripts inconnus)

| Jalon | Taille de index.html après jalon | Changement majeur |
|---|---:|---|
| D9 | 7 703 979 o | Dernier Dungeon Core202 |
| R01 | 6 969 593 o | Manifeste PWA dynamique externalisé |
| R02 | 2 869 485 o | Données visuelles base64 sorties du grand script |
| R03 | 2 862 906 o | Six fonctions d'accueil Shell sorties |
| R04 | 2 835 125 o | Bibliothèque/éditeur équipement Builders sortis |
| R05 | 2 781 436 o | Core synchronisation/sauvegardes sorti |
| Correction Dungeon validée | 2 782 155 o | Murs générés corrigés, pas une extraction |
| **R06 GREEN** | **2 643 155 o** | 18 scripts Capture historiques externalisés |

Du D9 à R06 : **5 060 824 octets de moins dans le HTML**, soit **65,7 %** de sa taille D9. Cela n'est pas une preuve que 65,7 % de la logique métier aurait disparu : les fonctions continuent de vivre dans les scripts externes, avec les mêmes autorités.

Les chiffres « 109 scripts inline actifs, 17 désactivés » appartiennent à l'audit D9 du **16 octobre**, avant R01–R06. **Interdiction de les présenter comme comptage actuel.** Le graphe des propriétaires externes a atteint 125 à R06, dont 18 propriétaires Capture nouvellement visibles.

## Recensement ACTUEL certifié par d2.zip (18 octobre 2026)

**§26 franchi.** Archive utilisateur `d2.zip`, membre unique `index.html(2).txt` ; **2 643 155 octets**, Git blob **`12fc91df4ee4c7989a172baa96f9790da6dc57f7`** = index du checkpoint R06 GREEN `41a709f3478ded45b12b770435a96ad3f344faf3`. Le contrôle a été effectué directement sur les octets de cette archive, sans substitution de copie Git ni HTML tronqué.

| Mesure exacte, état R06 GREEN | Valeur |
|---|---:|
| Balises `script` totales | **161** |
| Scripts externes `src` | **55** |
| Scripts inline actifs | **89** |
| Corps JS inline actifs | **1 752 298 octets** |
| Scripts inline explicitement désactivés | **17** |
| Corps désactivés | **95 878 octets** |
| Scripts anonymes actifs | **5**, total **1 417 518 octets** |
| Scripts actifs à identifiant Dungeon (tri indicatif) | **80**, total **306 771 octets** |
| Autres scripts actifs nommés (tri indicatif) | **4**, total **28 009 octets** |

Les deux principaux anonymes sont le **n°19 : 1 229 754 octets** (blob de corps `a277677ff96eb8bb62dcffcbe84e74f5d255b73a`), et le **n°21 : 180 964 octets** (blob `3667baf92d27696569286870403c96d6e5428779`). À eux seuls, ils représentent **1 410 718 octets, soit 80,5 % du code inline actif**. Les trois autres anonymes actifs sont de 6 337, 219 et 244 octets ; les deux derniers peuvent relever d'un bootstrap minimal sous preuve.

**Diagnostic du vrai contenu** : le n°19 comprend environ 14 300 lignes / plus de 1 000 déclarations de fonctions nommées, mêlant bibliothèques et personnages, progression Dungeon, logique Capture, profils/navigation Shell, éditeurs, vagues Survie, combat, équipement et inventaire. Le n°21 (~2 600 lignes / ~170 fonctions nommées) mêle version/update, familles Shell et éditeur des héros/compétences. **Aucun des deux ne forme à lui seul un propriétaire mono-domaine**. Les externaliser intacts en leur donnant artificiellement une seule autorité ne résoudrait pas la dette architecturale.

Les **80** scripts nommés Dungeon ne doivent pas être déplacés en bloc mécaniquement : cela ajouterait jusqu'à 80 requêtes synchrones sans éliminer le n°19. Les balises désactivées (17 / 95 878 octets) doivent être caractérisées puis traitées **collectivement**, sans leur rendre l'exécution.

**Frontière à travailler en premier :** produire une cartographie des *fonctions et dépendances* du gros n°19 pour isoler un groupe substantiel, véritablement monodomaine, avec ordre d'initialisation conservé et capacité de rollback octet-exact. Priorité à une portion métier de grande taille plutôt qu'au n°21 transverse, aux 80 petits Dungeon ou au n°60 de 6 337 octets. Cette cartographie doit distinguer les fonctions déclarées, les constantes/initialisateurs et les appels inter-modules ; ne pas inférer la propriété du seul préfixe d'identifiant.

**État de cette étape** : source vérifiée, chiffres exacts et priorité établie. Aucune modification de code de production. Prochain chantier de déplacement requiert son propre START §25, un périmètre de déclarations dûment vérifié, l'application depuis **ce fichier d2.zip certifié**, quatre suites CI sur un seul SHA, rollback et revue manuelle si nécessaire.

## Décision de priorité : pas de D10 ni 17 micro-lots

1. **Priorité A : bornage par contrats du grand script historique multi-domaines.** Après R02 son corps représentait 1 264 265 octets ; R03 et R04 en ont sorti des parties (6 651 et 27 860 octets de corps). Il reste donc un bloc potentiellement supérieur à 1 Mo, et son poids actuel est désormais certifié à **1 229 754 octets** sur le R06 GREEN ; ses frontières métier restent à démontrer. Il ne constitue **pas** un seul propriétaire Core. Rechercher dans ce bloc les ensembles cohérents Shell/Core/Survie/Dungeon/Capture/Builders ; choisir uniquement un groupe de réelle portée avec dépendances et même domaine vérifiés.
2. **Priorité B : grouper les scripts nommés actifs restants par propriétaire réel.** L'ancien audit D9 inventoriait 102 scripts nommés et des groupes Dungeon volumineux ; R06 a déjà sorti 18 Capture, D1–D9 ont déjà sorti plusieurs Dungeon. Ne pas réextraire un propriétaire existant. Si un groupe de scripts encore inline, autonome et majoritaire en octets a la meilleure rentabilité/risque, le préférer au découpage interne du monolithe.
3. **Priorité C : nettoyage final collectif des désactivés et bootstrap minimal.** Le recensement exact R06 GREEN confirme **17 scripts inertes / 95 878 octets**. Aucun retrait avant preuve d'inertie et traçabilité/rollback ; un seul chantier collectif au plus, pas un lot par script. N'admettre les scripts actifs minuscules inline que s'ils sont de vrais bootstraps sans logique métier.

**Règle de décision** : retenir une ou quelques extractions substantielles, mono-propriétaire, entièrement réversibles, qui améliorent l'architecture ou allègent significativement le HTML ; ne pas lancer un lot juste pour décrémenter un compteur de scripts. Si le risque de séparation dépasse le gain, expliquer ce blocage et ne pas publier un faux EXIT.

## Instrument de preuve prêt pour le fichier utilisateur

`tools/gensrpg_phase12_exit_inventory.py` accepte le `index.html` exact ou un ZIP ne contenant qu'un `index.html` identifiable. Il refuse toute archive dont taille ou blob diffèrent de **2 643 155 / 12fc91df4ee4c7989a172baa96f9790da6dc57f7**, sans ouvrir d'autre source. Sortie : comptage **actuel** des balises chargées, corps inline actifs/désactivés, nombre/poids des anonymes, classement des plus gros fragments, empreinte de chaque corps et regroupement **indicatif seulement** d'après l'ID. Il ne reproduit aucun corps JS, secret ni image. Test synthétique : `tests/gens_phase12_exit_inventory_v1.test.py`.

Le ZIP d2.zip est maintenant reçu et certifié ; utiliser ce recensement pour fixer une frontière concrète et l'ordre parser ; si un déplacement est justifié, créer **un nouveau checkpoint START et une nouvelle branche spécifique** à ce déplacement, en respectant §§25–26. Le présent audit n'autorise aucune modification de `index.html`.

## Critère de sortie réelle Phase 12

HTML essentiellement structurel, CSS et références externes, **aucune logique de jeu active inline**, hormis petits bootstraps prouvés ; aucun désactivé oublié ; aucun double propriétaire. Rollback byte-identique, PWA/cache, sauvegardes et parcours vrais des quatre modes, Dungeon generated/authored, Tactical, Firefox et Chromium. La fin de Phase 12 n'est **pas encore prononcée** : elle dépend de cet inventaire et des éventuels derniers groupes à fort effet. Les 32 assets historiques de Survie et les dépôts de laboratoires restent hors périmètre.
