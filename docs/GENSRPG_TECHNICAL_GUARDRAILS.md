# GenSrpG — Garde-fous techniques obligatoires

Ce document complète `GENSRPG_DEVELOPMENT_RULES.md`. Il s’applique à tout nouveau développement, correctif, refactor ou migration.

Objectif : empêcher qu’un système terminé soit silencieusement cassé par une nouvelle couche, un wrapper, un cache, un test incomplet ou une duplication de logique.

## 1. Une seule source de vérité par donnée

Chaque donnée importante doit avoir un propriétaire unique et documenté.

Exemples :
- Force finale : moteur de stats commun ;
- équipement porté : inventaire commun ;
- position Dungeon : état Dungeon ;
- PV pendant Tactical : état du combat, puis résultat retourné au Dungeon ;
- règles RPG : configuration normalisée ;
- écran actif : Shell / routeur ;
- cache PWA : service worker.

Interdit : recopier une valeur dans plusieurs états puis essayer de les resynchroniser en permanence.

## 2. Une seule implémentation active par responsabilité

Deux versions d’un même système peuvent exister dans Git pour historique ou rollback, mais une seule doit être chargée et active en production.

Interdit :
- V108 + V109 + V112 + V113 qui possèdent simultanément la même détection ;
- plusieurs renderers qui repeignent la même vue ;
- plusieurs calculateurs de dégâts ;
- plusieurs systèmes de navigation actifs en parallèle.

Lorsqu’un nouveau propriétaire remplace un ancien, l’ancien sort du runtime dans le même chantier ou dans un jalon explicitement planifié.

## 3. Aucun wrapper permanent sans contrat

Toute fonction globale protégée ne peut être wrappée que si :
- le propriétaire du système autorise explicitement le hook ;
- le wrapper a un nom et une version identifiables ;
- le wrapper est idempotent ;
- un moyen de restauration existe ;
- un test vérifie qu’un seul wrapper est actif ;
- le wrapper ne modifie pas le comportement d’un autre module.

Les chaînes de `__original -> wrapper -> wrapper -> wrapper` sont considérées comme dette critique et doivent être consolidées.

## 4. Aucun auto-install caché

Un fichier chargé ne doit pas modifier l’application par simple effet de bord, sauf petit utilitaire explicitement autorisé.

Un module complexe doit exposer :
- `install()` ;
- `dispose()` ;
- `status()` si nécessaire.

L’installation appartient au bootstrap du module, pas au fichier lui-même.

## 5. Tout comportement temporaire doit être démontable

Tout module qui crée un observer, listener, timer, animation longue ou ressource temporaire doit les libérer à la sortie du module ou de la vue.

Obligation : `dispose()` doit nettoyer intégralement ce qui a été installé.

Après `dispose()`, aucun callback du module ne doit pouvoir réactiver une ancienne vue ou modifier un autre écran.

## 6. Pas de timers pour maintenir une autorité

`setInterval`, heartbeat, retries répétés et boucles de « réparation » ne doivent jamais servir à imposer continuellement un état UI ou runtime.

Un timer est acceptable pour :
- animation bornée ;
- délai utilisateur ;
- watchdog local clairement limité.

Un timer n’est pas acceptable pour :
- réinstaller une fonction ;
- rescanner toute l’application ;
- réafficher une vue ;
- corriger périodiquement un autre renderer.

## 7. Pas de scan global du DOM

Un module ne doit rechercher ou modifier que les éléments du conteneur qu’il possède.

Interdit par défaut :
- `document.body` comme zone fonctionnelle ;
- `document.querySelectorAll('*')` ou sélecteurs globaux pour retrouver des boutons d’un autre système ;
- observer `document.body` / `document.documentElement` pour piloter le gameplay.

Chaque module doit disposer d’un root DOM explicite.

## 8. Les événements globaux doivent être nommés et documentés

Les communications cross-module doivent utiliser des événements nommés ou des API explicites.

Exemple :
- `gensrpg:tactical-combat-started` ;
- `gensrpg:tactical-combat-finished`.

Tout événement global doit documenter :
- émetteur ;
- consommateurs autorisés ;
- payload ;
- durée de validité ;
- effets permis.

Interdit : un listener global générique qui intercepte tous les clics et décide ensuite quoi faire.

## 9. Contrats de données versionnés

Les snapshots et résultats échangés entre modules doivent avoir un numéro de version.

Exemple :
`CombatSnapshot.version = 1`
`CombatResult.version = 1`

Si le format change :
- migration ou compatibilité explicite ;
- test ancien format -> nouveau runtime ;
- aucune supposition silencieuse.

## 10. Un test doit couvrir le chemin réel, pas seulement la dernière fonction

Tout système critique doit avoir au moins deux niveaux de test :
- test unitaire du calcul ;
- test d’intégration du vrai chemin de données.

Exemple dégâts mêlée :
`héros Force 16 -> moteur stats -> snapshot Tactical -> arme -> attaque -> armure -> résultat affiché`.

Injecter directement `physicalDamageBonus: 1` ne suffit pas à prouver que le raccord réel fonctionne.

## 11. Tests sentinelles des systèmes terminés

Une fonctionnalité considérée comme validée doit obtenir un test sentinelle permanent.

Exemples :
- fiche héros s’ouvre et reste ouverte ;
- Save & Quit quitte réellement le Dungeon ;
- reprise restaure l’état ;
- mouvement reste correct ;
- Force 16 donne le bonus attendu ;
- armure applique la règle configurée ;
- un héros non entré ne participe pas au combat ;
- Survie n’est pas affecté par Tactical.

Un nouveau chantier ne peut pas supprimer un test sentinelle sans justification écrite.

## 12. Tests de frontière obligatoires

Chaque module doit avoir des tests garantissant ce qu’il n’a PAS le droit de faire.

Exemples :
- Tactical ne peut pas masquer l’accueil ;
- Tactical ne peut pas ouvrir/fermer la fiche héros d’exploration ;
- Dungeon ne modifie pas Monster Capture ;
- Monster Capture ne remplace pas les dés de Survie ;
- World Builder ne devient pas une autorité runtime.

## 13. Toute correction de régression ajoute un garde permanent

Lorsqu’un bug réel est trouvé :
1. écrire un test qui reproduit le bug ;
2. corriger la cause ;
3. garder le test définitivement.

On ne considère pas le bug comme terminé tant que le test ne protège pas son retour.

## 14. Diff minimal obligatoire

Un correctif ciblé doit modifier le minimum de fichiers nécessaires.

Si une petite correction commence à toucher de nombreux domaines, arrêter et lancer un audit avant de continuer.

Une PR doit expliquer pourquoi chaque fichier modifié est nécessaire.

## 15. Budget de dépendances

Un module ne doit dépendre que :
- du Core commun ;
- de ses propres sous-modules ;
- de contrats publics explicitement documentés.

Interdit : dépendre d’une fonction interne historique d’un autre module simplement parce qu’elle existe globalement.

## 16. Pas de logique gameplay dans le service worker, le loader ou les assets

Le service worker gère cache/version/offline.
Le loader charge les modules.
Le resolver d’assets résout les ressources.

Aucun de ces systèmes ne doit :
- calculer les dégâts ;
- choisir des participants ;
- modifier les stats ;
- décider d’un combat ;
- piloter une vue de gameplay.

## 17. Bootstrap séparé du métier

Chaque module doit tendre vers :
- `bootstrap` : charge et installe ;
- `engine` : logique pure ;
- `adapter` : transforme les données ;
- `ui` : affiche ;
- `storage` : persiste via API commune ;
- `tests` : protègent les contrats.

Un fichier de performance ne doit pas devenir en même temps le loader général du combat.

## 18. Le moteur calcule, l’UI explique

Le moteur retourne les détails du calcul ; l’UI ne les réinvente pas.

Pour une attaque, le résultat doit pouvoir contenir :
- valeur de l’arme ;
- stat utilisée ;
- bonus de stat ;
- dégâts bruts ;
- armure / résistance ;
- jet éventuel de blocage ;
- critique ;
- dégâts finaux.

Cela rend toute divergence visible et testable.

## 19. Paramètres de gameplay centralisés

Toute règle configurable doit venir d’une configuration normalisée unique.

Interdit : une valeur par défaut différente dans trois fichiers.

Si `armorZeroBlockChance = 50`, aucun module ne doit avoir un fallback codé en dur à 75 sans passer par la même normalisation.

## 20. Invariants documentés

Les règles qui ne doivent jamais être violées sont écrites comme invariants et testées.

Exemples :
- un héros hors Dungeon ne participe pas au combat ;
- un héros hors portée ne participe pas ;
- une salle déjà visitée ne respawn pas arbitrairement ;
- un module inactif ne modifie pas le DOM ;
- un changement de vue n’est possédé que par le Shell ;
- une sauvegarde ne soigne pas implicitement le héros.

## 21. Compatibilité sauvegardes obligatoire

Avant modification d’un schéma persistant :
- identifier le format actuel ;
- versionner le nouveau ;
- écrire la migration ;
- tester ancienne sauvegarde -> nouvelle version ;
- tester sauvegarde/rechargement après migration.

Aucun nettoyage ne doit rendre une sauvegarde existante inutilisable sans décision explicite.

## 22. Retour arrière garanti

Avant chaque publication importante :
- SHA exact de `main` ;
- branche backup ;
- PR isolée ;
- cache/version identifiables.

Le rollback doit être possible sans reconstruire manuellement un état ancien.

## 23. Ne jamais modifier un test pour cacher une régression

Un test peut être modifié uniquement si son contrat est devenu volontairement obsolète.

Avant de le modifier, il faut prouver :
- quelle règle a changé ;
- pourquoi elle a changé ;
- quel nouveau test couvre mieux la règle actuelle.

Interdit : assouplir un test uniquement pour faire passer la CI.

## 24. Règle de gel fonctionnel

Quand un système est déclaré stable, ses invariants deviennent gelés.

Tout changement futur qui touche ce système doit :
- déclarer explicitement qu’il le touche ;
- expliquer pourquoi ;
- faire tourner ses tests sentinelles ;
- obtenir un résultat fonctionnel équivalent ou une décision explicite de changement.

## 25. Critère de fin d’un chantier

Un chantier n’est terminé que lorsque :
- code actif propre ;
- ancienne autorité retirée du runtime ;
- tests unitaires verts ;
- tests d’intégration verts ;
- tests de frontières verts ;
- documentation mise à jour ;
- CI `main` verte ;
- Pages déployé ;
- test utilisateur ciblé validé pour les fonctions concernées.

Le fait que « ça marche une fois » ne suffit pas.

## 26. Principe final

La priorité n’est pas de corriger le plus vite possible.

La priorité est de rendre chaque correction définitive, localisée, compréhensible, testable et impossible à casser silencieusement par un futur module.
