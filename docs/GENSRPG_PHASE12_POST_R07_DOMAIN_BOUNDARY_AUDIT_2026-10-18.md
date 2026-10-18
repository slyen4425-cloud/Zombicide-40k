# GenSrpG — Phase 12 : bornage métier après validation R07

**Date : 18 octobre 2026. Statut : audit documenté sur branche indépendante ; aucun fichier runtime déplacé, aucun R08 ouvert, aucun EXIT Phase 12 déclaré.**

## Autorités et §25

- R07 GREEN **et accepté par l'utilisateur** (« Parfait test validé »), SHA `17a1def7a514478fec08025f354a4a1b17aa14f5`, checkpoint `checkpoint/gensrpg-phase12-r07-magic-audio-data-green-2026-10-18`.
- Quatre contrôles SUCCESS au même SHA : [preflight/rollback 39114167621](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167621), [Firefox 39114167552](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167552), [Tactical 39114167595](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167595), [Architecture/Chromium 39114167672](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39114167672).
- Checkpoint START du présent **audit seul** : `checkpoint/gensrpg-start-phase12-post-r07-domain-boundary-audit-2026-10-18`, branche `work/gensrpg-phase12-post-r07-domain-boundary-audit-2026-10-18`, tous deux au SHA exact R07 GREEN. `main` reste `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Laboratoires hors périmètre.

## Recensement post-R07 et fidélité de la source

Le R07 GREEN a un index de **2 217 805 octets**, blob Git **`aca31c540d61c81e1504d3b915b034b372103b5b`** ; l'arbre du checkpoint vérifie ces métadonnées. Une **projection locale en lecture seule** de l'archive utilisateur R06 `d3.zip`, appliquant la transformation déterministe et certifiée R07, donne **exactement** ces octets et ce blob. Elle n'est **pas** présentée comme un ZIP R07 fourni par l'utilisateur et **ne sera pas** substituée à celui-ci pour la prochaine modification physique selon §26.

| Mesure sur la projection exacte R07, diagnostic sans changement | Valeur |
|---|---:|
| Balises script | **162** |
| Scripts externes `src` | **56** |
| Inline actifs | **89** |
| Corps inline actifs cumulés | **1 326 879 octets** |
| Inline explicitement désactivés | **17**, **95 878 octets** |
| Gros anonyme mixte (ordre script 20) | **804 335 octets** |
| Autre anonyme version/Shell/édition (ordre script 22) | **180 964 octets** |
| Deux gros anonymes cumulés | **985 299 octets, soit 74,3 % de l'inline actif** |
| 80 scripts nommés historiques Dungeon | **306 771 octets** |
| 4 autres scripts nommés actifs | **28 009 octets** |

**D9 → R07 : 7 703 979 → 2 217 805 octets**, soit **5 486 174 octets retirés du HTML (71,2 %)**, sans confondre externalisation et suppression du code. Les fonctions sont toujours présentes dans les fichiers propriétaires, avec leurs règles inchangées.

## Ce que révèlent les frontières réelles

**A. Premier monolithe (804 Ko) :** il ne s'agit pas d'un module Core homogène. Il entrelace normalisation/règles Dungeon, talents, captures et combats, profils, explorations, éditeurs RPG, adversaires et vagues Survie, inventaire et interface. Les secteurs que l'on peut caractériser comme *pistes*, sans présumer de leur autorité :
- **Règles Dungeon / talents / éditeurs** dans la première partie du script, plusieurs groupes de déclarations et initialisateurs : vérifier contrats de profil, sauvegarde, menu et consommateurs.
- **RPG univers / configuration / éditeurs** autour du milieu du monolithe : vérifier où s'arrête Builders et où commencent Shell/Dungeon/Capture. **Ne pas** fusionner éditeur et runtime par commodité.
- **Bibliothèque adversaires / vagues Survie** puis **combat / équipement** dans la seconde partie : gameplay très interconnecté ; prioriser stabilité, statistiques, sauvegarde et réactions des quatre modes plutôt qu'un gain de taille artificiel.

**B. Second anonyme (181 Ko) :** mélange distinct de mécanismes de mise à jour, familles Shell, Hero Creator, bibliothèque entités/créatures partagées, affichage Capture, bibliothèque capacités/compétences et sauvegardes. Les familles Hero Creator / entités / capacités **sont candidates à un audit Builders**, mais leurs initialisations et consommateurs doivent être bornés séparément. Déplacer les 181 Ko en un seul `shell.js` ou `builders.js` recréerait une autorité mixte sous un nom trompeur.

**C. 80 scripts Dungeon nommés (307 Ko) :** classer par propriétaire concret et ne pas extraire mécaniquement chaque petit Core. **D. 17 scripts désactivés (96 Ko) :** conserver inertes et réserver leur éventuel archivage/retrait à un chantier collectif avec preuve d'absence de lectures et rollback.

## Décision opérationnelle (pas de micro-lots)

Le prochain mouvement n'est **pas** « sortir le plus gros anonyme d'un seul coup ». Priorité à un **seul ensemble métier significatif**, par exemple la famille **éditeurs RPG / configuration** ou la famille **Hero Creator / capacités** si le prochain audit de dépendances confirme **un propriétaire unique, une portée lexicalement sûre, des initialisations reproductibles et un gain réel**. Aucun « oui » automatique : si plusieurs propriétaires se mêlent, les séparer dans le plan sans inventer un nouveau runtime.

### Critères d'admission avant l'extraction

1. Sur le **ZIP exact R07 GREEN demandé au joueur**, vérifier `2 217 805` octets et blob `aca31c540d61c81e1504d3b915b034b372103b5b` avant toute nouvelle application physique.
2. Pour chaque fonction visée, relever ordre du parser, utilisations, variables `const/let`, effets d'initialisation, redéfinitions éventuelles et appels externes. Refuser une extraction qui change le hoisting, les états ou l'autorité.
3. **Nouveau** checkpoint START §25 + branche distincte d'extraction depuis le R07 GREEN. Modules JS classiques synchrones aux bons endroits, PWA/cache et carte des propriétaires cohérents, restitution R08→R07 bit-exact, aucune fonction réécrite pour simplement externaliser.
4. CI source, Architecture/Chromium, Firefox, Tactical sur **un SHA commun** ; test manuel des parcours affectés avant validation utilisateur. PvP reste placeholder, aucun gameplay inventé.
5. Mesurer la réduction nette et juger l'architecture, pas le nombre de commits. Si les dépendances empêchent un ensemble substantiel sûr, expliciter la dette et ne pas promettre EXIT prématurément.

## Prochain verrou exact

[**Index R07 GREEN — SHA `17a1def7a514478fec08025f354a4a1b17aa14f5`**](https://github.com/slyen4425-cloud/Zombicide-40k/blob/17a1def7a514478fec08025f354a4a1b17aa14f5/index.html), taille **2 217 805 octets**, Git blob **`aca31c540d61c81e1504d3b915b034b372103b5b`**. Demander son téléchargement + ZIP utilisateur pour la prochaine extraction physique. L'archive `d3.zip` correspond à la **source R06**, pas au fichier actuel, même si la projection read-only vérifiée permet ce pré-audit.

**Le bilan de ce chantier est une vraie décision de frontières et un inventaire actualisé ; aucune régression runtime introduite et aucun déplacement prématuré.**
