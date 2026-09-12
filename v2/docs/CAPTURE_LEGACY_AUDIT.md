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
- Moussado ;
- Voltige -> Fulguros ;
- Ailevent ;
- Lumino ;
- Nocteceoc ;
- Rocorne ;
- Luciéclaire ;
- Mirachat ;
- Maremachoire ;
- Descendre.

Avant création des données V2, rechercher les doublons/alias éventuels de chacune de ces entrées dans les définitions legacy et dans les sauvegardes historiques.

## À ne pas recopier

- bootstrap global au chargement de l'accueil ;
- clés de stockage partagées RPG/Capture ;
- wrappers et migrations qui réécrivent silencieusement les bibliothèques d'autres modes ;
- duplication de définitions de créatures ;
- dépendance à l'ancien `index.html` comme runtime ;
- chargement de Monster Capture tant que l'utilisateur n'ouvre pas ce mode.

## Prochaine passe d'audit

1. extraire les définitions Capture du gros `index.html` historique et des commits antérieurs ;
2. construire une table brute des espèces/IDs/évolutions/assets ;
3. détecter les doublons et alias ;
4. inventorier les clés de stockage et flux de sauvegarde ;
5. inventorier les règles de combat/capture ;
6. seulement ensuite définir les contrats `v2/src/modes/capture/`.
