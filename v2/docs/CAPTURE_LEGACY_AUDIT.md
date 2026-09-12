# GenSrpG V2 — Audit legacy Monster Capture

Date : 2026-09-12
Branche : `rebuild/v2`

## Règle d'architecture

Monster Capture est un **mode autonome** au même niveau que Survie, RPG et VS/PVP.

Il possède son propre état gameplay, ses propres profils, bibliothèques, inventaires, progression, sauvegardes et migrations. Aucun mode ne peut lire ou écrire directement les données gameplay mutables d'un autre mode.

Le Core partagé reste limité aux services techniques neutres : stockage abstrait, assets, audio, paramètres, import/export, primitives UI et services génériques sans état gameplay propre à un mode.

## Traces legacy confirmées

- L'ancien `index.html` reste un monolithe très volumineux (~8,2 Mo sur `main`) contenant encore une partie du comportement Capture inline.
- `ensureBuiltinMonsterCapture162()` était exécuté automatiquement au démarrage dans l'ancien système.
- Le diagnostic V121 a désactivé ce bootstrap automatique pour isoler un gel de l'accueil. La V2 ne doit donc jamais initialiser Monster Capture depuis l'accueil global.
- `notes/capture-recovery-2026-09-08.md` confirme l'existence historique de : stockage/réserve, équipe active, combats de créatures, objets de capture, dresseurs, `starter_capture`, `gensrpg_shared_entities_v1__<profileId>` et `gensrpg_shared_entities_v1__family__creature`.
- `gens-world-summary-167820.js` lisait encore plusieurs données Capture depuis des structures partagées avec le reste de GenSrpG : cette architecture doit être remplacée par un stockage Capture strictement isolé.
- Le bloc inline `builtinMonsterCapture162` contient lui-même plusieurs générations de données Capture mêlées dans `MC162_ENTITIES` et `MC162_ABILITIES`.
- Le profil legacy `MC162_PROFILE` reste marqué `gameStyle:"dungeon"`, embarque `rpgUniverse` et contient dans son deck des IDs 40K, Dungeon et Capture à la fois. Cette contamination inter-modes ne doit pas survivre en V2.
- Le dresseur seed `MC162_TRAINER` utilise encore `gameMode:"dungeon"` et `contentFamily:"creature"`, autre preuve que les frontières du mode étaient insuffisantes.

## Bibliothèque de créatures — règle de nettoyage

La reconstruction de la bibliothèque V2 ne doit pas recopier aveuglément toutes les entrées legacy.

Avant import, chaque créature doit passer par une étape de canonicalisation :
1. normaliser le nom et l'identifiant ;
2. comparer les IDs legacy et alias ;
3. comparer les types/éléments ;
4. comparer les relations d'évolution ;
5. comparer les stats/compétences principales ;
6. comparer les assets art principal / icône ;
7. distinguer un vrai doublon d'une variante ou évolution légitime.

Pour chaque groupe de doublons :
- conserver une seule créature canonique ;
- choisir un `canonicalId` stable V2 ;
- conserver `legacyAliases` avec tous les anciens IDs/noms ;
- conserver les meilleurs assets validés ;
- créer une table de migration `legacyId -> canonicalId` afin qu'une ancienne sauvegarde ne perde aucune créature capturée ;
- ne jamais additionner automatiquement deux exemplaires simplement parce que deux définitions legacy représentent la même espèce.

## Doublons legacy confirmés dans `MC162_ENTITIES`

Ces groupes sont confirmés par le nom et le rôle fonctionnel. La version V2 devra sélectionner une définition canonique et conserver l'autre ID comme alias de migration :

| Espèce | Ancienne définition | Définition plus récente / structurée | Décision d'audit |
|---|---|---|---|
| Braiseau | `crea_embercub` | `crea_braiseau` | doublon confirmé ; privilégier la lignée récente après validation des assets |
| Ailevent | `crea_galewing` | `crea_ailevent` | doublon confirmé ; version récente possède une lignée d'évolution |
| Lumilo | `crea_lumipup` | `crea_lumilo` | doublon confirmé ; version récente possède une lignée d'évolution |
| Noctecroc | `crea_nightfang` | `crea_noctecroc` | doublon confirmé ; version récente possède une lignée d'évolution |
| Rocorne | `crea_rockhorn` | `crea_rocorne` | doublon confirmé ; version récente est l'évolution de `crea_rocabri` |
| Luciéclair | `crea_sparkmoth` | `crea_lucieclair` | doublon confirmé ; version récente possède une évolution |
| Mirachat | `crea_miragecat` | `crea_mirachat` | doublon confirmé ; version récente possède une évolution |
| Dracendre | `crea_ashdrake` | `crea_dracendre` | doublon confirmé ; version récente possède une évolution |

Cas à vérifier avant fusion :
- `Aquafin` utilise déjà `crea_aquafin` dans la donnée legacy et mène vers `crea_maraileron` ; vérifier s'il existe plusieurs versions du même ID dans les seeds/migrations avant de conclure.
- `Moussados` (`crea_mossback`) ne doit pas être fusionné automatiquement avec la lignée `Pouss'Roc -> Moussegarde -> Sylvaroc` : ressemblance thématique seulement à ce stade.
- `Marémâchoire` (`crea_tidejaw`) ne doit pas être fusionné automatiquement avec `Aquafin -> Maraileron -> Léviambre` ou les lignées Eau générées.
- les lignées générées par type (`crea_feu_*`, `crea_mer_*`, etc.) sont des candidats de bibliothèque distincts tant qu'aucune preuve de doublon sémantique/visuel n'est établie.

## Lignées d'évolution legacy déjà identifiées

À inventorier comme lignées, pas comme doublons :
- `Braiseau -> Pyrolynx -> Infernox` ;
- `Aquafin -> Maraileron -> Léviambre` ;
- `Pouss'Roc -> Moussegarde -> Sylvaroc` ;
- `Voltige -> Fulguro -> Raijag` ;
- `Ailevent -> Rafalcor -> Ouraganis` ;
- `Lumilo -> Solarys -> Héliarque` ;
- `Noctecroc -> Ombrage -> Noxferal` ;
- `Vénipic -> Toxironce -> Vénéflore` ;
- `Rocabri -> Rocorne` ;
- `Luciéclair -> Foudrillon` ;
- `Mirachat -> Chimérage` ;
- `Dracendre -> Volcadrake`.

D'autres lignées seed/génériques existent dans le bloc legacy. Elles doivent être inventoriées séparément avant décision de conservation afin de ne pas confondre contenu volontaire et génération de remplissage.

## Clés/règles Capture legacy déjà confirmées

Le seed embarque notamment :
- `gensrpg_capture_wild_rules_v1_gp_mt7ker7t_m2iw9` : nombre/slots de créatures sauvages et coût de rappel ;
- `gensrpg_capture_mj_rules_v137_gp_mt7ker7t_m2iw9` : multiplicateurs XP/or, difficulté, mode de combat, contrôle ennemi, timeline, limite de starters, coût de soin et soin journalier ;
- `gensrpg_capture_battle_mode_v1_gp_mt7ker7t_m2iw9` : mode de combat `classic`.

Ces clés servent uniquement de source de migration. La V2 doit utiliser un namespace Capture propre et versionné, sans réutiliser directement les clés legacy.

## Contenu Capture à inventorier avant reconstruction

- bibliothèque d'espèces ;
- évolutions ;
- art principal + icône ;
- statistiques et types/éléments ;
- compétences, coûts et charges ;
- taux de capture ;
- bonus de capture selon PV ;
- niveaux/qualités des objets de capture ;
- équipe active (6) ;
- réserve ;
- invocation/changement de créature ;
- biomes et tables d'apparition ;
- rareté d'apparition ;
- dresseurs ;
- combats VS IA ;
- combats VS joueurs ;
- mode tactique/dynamique prévu ;
- progression des créatures ;
- objets spécifiques Capture ;
- profils/joueurs Capture ;
- sauvegardes et anciennes clés de stockage ;
- import/export ;
- assets audio/visuels propres au mode.

## Créatures déjà connues à conserver dans l'inventaire fonctionnel

Cette liste est un repère de travail, pas encore la bibliothèque canonique finale :
- Braiseau ;
- Aquafin -> Maraileron ;
- Moussado / Moussados (orthographe à confirmer depuis la version validée) ;
- Voltige -> Fulguro (nom legacy ; comparer avec le nom validé utilisateur « Fulguros ») ;
- Ailevent ;
- Lumilo / Lumino (nom à réconcilier avec l'art validé) ;
- Noctecroc / Nocteceoc (nom à réconcilier avec l'art validé) ;
- Rocorne ;
- Luciéclair / Luciéclaire (nom à réconcilier) ;
- Mirachat ;
- Marémâchoire ;
- Dracendre / « Descendre » (vérifier le nom final validé avant migration).

Avant création des données V2, rechercher les doublons/alias éventuels de chacune de ces entrées dans les définitions legacy et dans les sauvegardes historiques.

## À ne pas recopier

- bootstrap global au chargement de l'accueil ;
- clés de stockage partagées RPG/Capture ;
- profil Capture basé sur `gameStyle:dungeon` ;
- inventaire/deck Capture contenant des objets Survie/40K ou Dungeon ;
- dresseur Capture stocké comme héros Dungeon ;
- bibliothèque de compétences mélangeant sans frontière les capacités RPG et Capture ;
- wrappers et migrations qui réécrivent silencieusement les bibliothèques d'autres modes ;
- duplication de définitions de créatures ;
- dépendance à l'ancien `index.html` comme runtime ;
- chargement de Monster Capture tant que l'utilisateur n'ouvre pas ce mode.

## Prochaine passe d'audit

1. construire une table brute complète des espèces/IDs/évolutions depuis `MC162_ENTITIES` ;
2. classifier chaque entrée : canonique candidate / alias-doublon / évolution / générée / à vérifier ;
3. inventorier les assets associés et choisir les arts/icônes validés ;
4. inventorier toutes les clés de stockage Capture et flux de sauvegarde ;
5. inventorier les règles de combat/capture et les objets `capture_orb_*` ;
6. seulement ensuite définir les contrats `v2/src/modes/capture/`.
