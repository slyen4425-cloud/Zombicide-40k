# GenSrpG — Ordre de nettoyage et restructuration

Cette feuille de route applique `GENSRPG_CHARTE.md`. Le principe est de réduire le risque avant chaque déplacement de code. Aucun big-bang.

## Phase 0 — Geler et documenter l’état actuel

Objectif : conserver un point de comparaison fiable.

- relever le SHA de production ;
- conserver une branche de sauvegarde ;
- documenter les comportements validés actuels ;
- lister les régressions connues restantes ;
- ne pas mélanger corrections gameplay et restructuration dans le même jalon.

Critère de sortie : base sûre identifiée et reproductible.

## Phase 1 — Tests sentinelles avant tout déplacement

Créer/renforcer les scénarios qui doivent survivre à toute la restructuration :

- lancement Survie ;
- lancement Dungeon ;
- fiche héros Dungeon ;
- Save & Quit + reprise ;
- mouvement Dungeon ;
- stats canoniques ;
- dés D100/D6 ;
- calcul de touche ;
- dégâts + armure + résistances ;
- combat Tactical entrée/sortie ;
- Monster Capture ;
- Duel/PvP ;
- sauvegarde ;
- PWA/cache.

Ajouter des tests de non-interférence entre les quatre modules.

Critère de sortie : une régression majeure bloque automatiquement la CI.

## Phase 2 — Cartographie réelle du runtime

Inventorier :

- scripts réellement chargés par index.html ;
- auto-installs ;
- wrappers/monkey-patches ;
- MutationObserver ;
- listeners document/window ;
- timers/retries ;
- accès directs à localStorage/IndexedDB ;
- fonctions globales remplacées ;
- responsabilités dupliquées.

Classer chaque fichier : Core, Shell, Survie, Dungeon, Tactical, Capture, PvP, Builders, legacy/inactif.

Critère de sortie : aucun fichier runtime actif sans propriétaire connu.

## Phase 3 — Créer l’arborescence cible sans déplacer le gameplay

Créer les dossiers :

- `assets/gensrpg/core/`
- `assets/gensrpg/shell/`
- `assets/gensrpg/survival/`
- `assets/gensrpg/dungeon/`
- `assets/gensrpg/tactical/`
- `assets/gensrpg/capture/`
- `assets/gensrpg/pvp/`
- `assets/gensrpg/builders/`

Ne pas encore supprimer les anciens fichiers. Préparer les points d’entrée et contrats.

Critère de sortie : structure prête, comportement production inchangé.

## Phase 4 — Sortir les services communs de index.html

Ordre recommandé :

1. resolver d’assets ;
2. stockage/migrations ;
3. moteur de stats ;
4. inventaire/équipement/sets ;
5. dés ;
6. progression/XP ;
7. bus d’événements/utilitaires communs.

Chaque extraction doit :

- conserver exactement le comportement ;
- supprimer l’ancienne implémentation active après validation ;
- ajouter un test du vrai raccord ;
- ne pas introduire de wrapper global de compatibilité permanent.

Critère de sortie : index.html ne contient plus les moteurs communs.

## Phase 5 — Extraire le Shell et la navigation

Créer l’autorité unique pour :

- accueil ;
- changement de module ;
- navigation générale ;
- fiche personnage hors combat ;
- ouverture/fermeture des écrans ;
- état de session/module actif.

Retirer des modules toute autorité globale sur les vues qu’ils ne possèdent pas.

Critère de sortie : un seul propriétaire de navigation et fiche héros.

## Phase 6 — Isoler Survie

Déplacer progressivement le runtime Survie dans `survival/`.

- aucun appel aux fonctions privées Dungeon ;
- dés/stats/inventaire communs uniquement via Core ;
- assets Survie uniquement via contexte Survie.

Critère de sortie : Survie démarre/joue avec Dungeon/Tactical non chargés ou inactifs.

## Phase 7 — Isoler Dungeon exploration

Déplacer dans `dungeon/` :

- exploration ;
- salles/branches ;
- déplacement ;
- événements/spawn ;
- portes/coffres/pièges/énigmes ;
- déclenchement de combat ;
- sauvegarde d’état Dungeon.

Dungeon reste propriétaire du monde et décide quand Tactical démarre.

Critère de sortie : exploration complète sans dépendance UI Tactical globale.

## Phase 8 — Consolider Tactical

Revenir à l’architecture cible initiale :

- engine pur ;
- adapter ;
- UI ;
- AI ;
- bridge Dungeon.

Supprimer progressivement :

- chaînes V108/V109/V111/V112/V113 redondantes ;
- observers body ;
- heartbeats ;
- réinstallations différées ;
- multiples autorités de détection ;
- multiples autorités de rendu ;
- multiples calculateurs de dégâts/touche.

Important : avant cette phase, corriger et figer le vrai chemin stats -> snapshot -> attaque -> dégâts, plus explication détaillée des calculs.

Critère de sortie : Tactical n’existe que pendant une session de combat et se démonte proprement.

## Phase 9 — Séparer Monster Capture

Créer `capture/` comme module autonome de premier niveau, au même rang que Survie, Dungeon et Duel/PvP.

- créatures, biomes, capture, équipe/réserve ;
- monde/exploration Capture propres ;
- combat Capture propre ;
- lifecycle et UI Capture propres ;
- sauvegarde/session Capture propres ;
- Core commun uniquement pour services génériques réellement partagés ;
- aucun détournement Dungeon/Survie ;
- aucun besoin de `gameStyle="dungeon"` ou de `isDungeonMode()` comme identité fonctionnelle de Capture ;
- les compatibilités historiques Dungeon/Capture sont retirées progressivement après parité et sentinelles.

Critère de sortie : Capture peut démarrer sans runtime Dungeon/Survie actif.

Exigence renforcée de Phase 9 : Capture doit également fonctionner et se fermer comme module autonome de premier niveau, sans utiliser Dungeon comme runtime hôte ou identité fonctionnelle.

### Bilan de Phase 9 — 11 octobre 2026

**Phase 9 close fonctionnellement sur la branche de travail, sans publication sur `main`.** Les axes A/B/C ont une preuve navigateur réelle sur un même SHA (`edab672d914f929becfdba93dbfd33638b75b6ff`) : démarrage/exploration/combat Capture sans runtime Dungeon, Shell actif Capture sans hôte Survie ; rechargement, reprise et deuxième combat ; Save & Quit deux fois avec nettoyage de l'UI locale. Triple CI Architecture/Chromium, Firefox et Tactical SUCCESS. Le runtime manuellement validé reste `9ad6a3b0a8b54e6798d095e027f1770eca54f52b`. Voir `docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-11.json` et `docs/GENSRPG_PHASE9_CAPTURE_CLOSURE_2026-10-11.md`.

La présence résiduelle d'actions/UI Capture et de calculs XP/récompenses dans `index.html` demeure une dette de découpage physique **à traiter ultérieurement si justifiée**, sans conditionner la sortie fonctionnelle de Phase 9. Elle ne doit pas provoquer un nouveau micro-lot tant que les invariants sont conservés. Phase 10 n'est pas commencée et `main` demeure gelée.

### Critère d'interface racine désormais satisfait — 11 octobre 2026

Le dernier lot Phase 9 a corrigé le **routage Shell du Hub principal** en ajoutant une quatrième carte `MONSTER CAPTURE` au même rang que `SURVIE`, `DUNGEON / AVENTURE` et `DUEL / PVP`, avec sa propre famille `capture`. Les univers Capture ne sont plus listés dans `adventure`, et leur création/édition/reprise suit la famille Capture. Code de référence du lot : `53bab4060107683eb8e0f3159201ed3844849474` ; réponse de validation manuelle utilisateur « Parfait ! ». Les résultats CI et le checkpoint final de ce lot sont consignés dans `docs/GENSRPG_CURRENT_WORK.md`. Ni `main` ni la Phase 10 n'ont été modifiées.


**Validation manuelle explicite du Hub racine :** l'utilisateur a confirmé « Test validé » le 11 octobre 2026. Les adaptations des sentinelles historiques qui pointaient encore vers la famille Aventure sont cantonnées aux tests, sans correction de gameplay. Le checkpoint final ne sera créé qu'après triple CI SUCCESS sur son SHA final ; le point de reprise est `docs/GENSRPG_CURRENT_WORK.md`.

## Phase 10 — Séparer Duel/PvP

Créer `pvp/` autonome avec ses règles de session, combat et UI.

Critère de sortie : aucune fonction globale des trois autres modules n’est remplacée.

### Jalons techniques Phase 10 — 12 octobre 2026

- S0 GREEN : propriétaire de session sans gameplay, checkpoint `checkpoint/gensrpg-phase10-pvp-session-s0-green-2026-10-12`.
- S1 GREEN : provider explicite au contrat Shell, non chargé en production, checkpoint `checkpoint/gensrpg-phase10-pvp-shell-provider-s1-green-2026-10-12` sur `cb36c5f1db0a5734083b39bd9f50b40d80e1c010`.
- S2 GREEN : composition explicite du provider depuis le Shell, sans règle ou interface de combat inventée, checkpoint `checkpoint/gensrpg-phase10-pvp-shell-composition-s2-green-2026-10-12` sur `f467c2554a59f2ff7eaac55de3fd1976c3ba7059`. Conserver le placeholder PvP jusqu'au vrai gameplay et aux réglages configurables. Exiger le ZIP index certifié §26, les tests du vrai chargement et les trois CI sur le même SHA avant GREEN. Détails : `docs/GENSRPG_PHASE10_PVP_S2_SHELL_COMPOSITION_2026-10-12.md`.

- S3 GREEN TECHNIQUE : premier écran propriétaire PvP de préparation avec identifiant de session, camps et participants librement définis, règles JSON du créateur. Pas de valeurs de combat par défaut, pas de stockage direct. Le module est montable uniquement sur demande et reste non composé dans le Hub jusqu'à validation du vrai raccord utilisateur (§26 si besoin). Checkpoint `checkpoint/gensrpg-phase10-pvp-configuration-screen-s3-green-2026-10-12` sur `aebb542b7ad1c3150edbcb451a5ec2c1a9d17810` (triple CI SUCCESS, formulaire isolé mobile/PC testé). Voir `docs/GENSRPG_PHASE10_PVP_S3_SETUP_UI_2026-10-12.md`.
- S4 **GREEN — clôture architecturale** : contrat racine aligné sur le runtime réel, sentinelle de propriété des modules et non-interférence validées ; tests mobiles/PC conservés. Checkpoint `checkpoint/gensrpg-phase10-pvp-architectural-closure-s4-green-2026-10-12`, SHA `b5b16cb9d0a8def7749a32a9bfecf1ce17cd21ef` ; Architecture/Chromium [38293153357](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38293153357), Firefox [38293153182](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38293153182), Tactical [38293153214](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38293153214), toutes SUCCESS sur ce même SHA. Aucun gameplay PvP. Voir `docs/GENSRPG_PHASE10_PVP_S4_ARCHITECTURAL_EXIT_2026-10-12.md`.
- **Périmètre confirmé par l'utilisateur** : la Phase 10 consiste à préparer un module indépendant, **pas** à développer un combat PvP. Le bouton « PVP — À VENIR » est conservé ; l'UI technique S3 reste non exposée. L'absence de gameplay, de configuration publique ou de parties jouables n'est **pas** un blocage de la clôture architecturale.

**Phase 10 : clôture architecturale GREEN (S4).** Le module Duel/PvP est séparé sur le plan technique ; le mode jouable, les règles et le formulaire public restent hors périmètre et non implémentés. **Phase 11 non démarrée.**

## Phase 11 — Restructurer les assets visuels

### A0 GREEN — inventaire physique sans migration

- Checkpoint §25 : `checkpoint/gensrpg-start-phase11-asset-inventory-2026-10-12`, base triple-CI GREEN `3acd7a6112e3da9a546749e1acb39ee81cb4c9d7`.
- Branche : `work/gensrpg-phase11-asset-inventory-2026-10-12`.
- **173 images suivies par Git**, dont 134 déjà sous Dungeon, 32 `assets/img_*` non classées, 4 icônes Shell/PWA candidates et 3 images de dépendance exclues.
- Manifeste Git exact et test de non-dérive : `docs/phase11/asset-inventory-a0.json`, `tests/gens_phase11_asset_inventory_a0.test.cjs` ; collisions de basenames documentées.
- **Aucun asset déplacé et aucune référence de production réécrite.** La vérification du contenu exact de `index.html` est soumise au §26 avant audit de consommation ou migration, pour ne pas confondre emplacement et usage réel.
- **A0 validé** : checkpoint `checkpoint/gensrpg-phase11-asset-inventory-a0-green-2026-10-13` au SHA `a96cb54049648bb87619a7febdcfe0388a6fb98f` ; Architecture/Chromium [38300391035](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38300391035), Firefox [38300391129](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38300391129), Tactical [38300391095](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38300391095), SUCCESS sur le même SHA. Détails : `docs/GENSRPG_PHASE11_A0_ASSET_INVENTORY_2026-10-12.md`. **La Phase 11 n'est pas terminée** ; prochain lot : preuves de consommation réelle et cartographie `ancien → nouveau` avant migration.

### A1 en cours — traçabilité des 32 assets racine et chemins PWA

- Checkpoint de départ `checkpoint/gensrpg-start-phase11-asset-ownership-a1-2026-10-13` sur la base `dc9ad1e5396892c805ddc79c4542f29420062095`, triple-CI SUCCESS. Branche `work/gensrpg-phase11-asset-ownership-a1-2026-10-13`.
- Vérifications étayées : PWA `manifest.webmanifest` + publication `icon-*.png → _site/icons/` dans `main.yml` ; `service-worker.js` référence plusieurs images Dungeon en cache. Les 32 fichiers `assets/img_*` restent sans propriétaire confirmé.
- Scanner reproductible des seuls fichiers externes suivis Git (`tools/gensrpg_phase11_external_asset_refs_a1.cjs`) et sentinelle `tests/gens_phase11_external_asset_refs_a1.test.cjs` dans Architecture ; **`index.html` n'est jamais lu** conformément à §26. Voir `docs/GENSRPG_PHASE11_A1_ASSET_USAGE_2026-10-13.md`.
- **Résultat contrôlé dans le job Architecture A1** : 123 fichiers externes vérifiés, 32 images concernées, **zéro référence littérale externe** ; ceci ne prouve pas qu'elles sont inutilisées.
- **Matrice préparée** : `docs/phase11/asset-ownership-matrix-a1.json`, vérifiée par `tests/gens_phase11_asset_ownership_matrix_a1.test.cjs`. Elle garde les 32 propriétaires indéterminés et distingue les deux icônes racine effectivement publiées des deux fichiers `Icon/` de blobs différents.
- Aucun déplacement, aucune réécriture des images/chemins, aucun fallback Core. **Triple CI finale A1 à vérifier avant GREEN**. Classement final et table ancien → nouveau après preuve des références du vrai `index.html` par ZIP exact §26 ; aucune suppression sur une simple absence de référence.



Créer :

- `assets/common/`
- `assets/survival/`
- `assets/dungeon/`
- `assets/capture/`
- `assets/pvp/`

Sous-dossiers selon besoin : heroes, enemies, bosses, creatures, items, icons, tiles, walls, doors, traps, chests, ui, effects, biomes, arenas.

Procédure obligatoire :

1. inventaire des PNG/JPG/WebP réellement utilisés ;
2. attribution à un module ;
3. identification des vrais assets communs ;
4. table `ancien chemin -> nouveau chemin` ;
5. adaptation du resolver central ;
6. tests visuels et chemins ;
7. déplacement physique par lots ;
8. suppression des compatibilités anciennes seulement après validation.

Aucun fallback inter-module.

Critère de sortie : un asset Dungeon ne peut plus apparaître en Survie par collision de nom.

## Phase 12 — Alléger index.html

Une fois les modules extraits, index.html doit contenir principalement :

- structure HTML minimale ;
- styles racine ;
- shell/bootstrap ;
- chargement explicite des modules/services nécessaires.

Pas de moteur de combat, stats, sauvegarde ou logique de mode inline.

Critère de sortie : index.html devient lisible et stable.

## Phase 13 — CI d’architecture

Automatiser les règles importantes :

- interdire nouveaux MutationObserver body/html ;
- interdire nouveaux setInterval globaux non autorisés ;
- détecter les remplacements de fonctions protégées ;
- vérifier qu’un module n’importe pas directement un runtime privé d’un autre ;
- vérifier les assets hors périmètre ;
- vérifier les quatre scénarios sentinelles.

Critère de sortie : une future dérive architecturale échoue avant publication.

## Priorité immédiate recommandée

Avant de déplacer beaucoup de code :

1. terminer les tests sentinelles ;
2. corriger/figer le vrai calcul RPG Tactical (stats réelles, armes, dégâts, armure 50/50, explication) ;
3. cartographier les scripts actifs ;
4. extraire Core stats/storage/assets sans changement de gameplay ;
5. isoler Shell/navigation ;
6. seulement ensuite attaquer les gros déplacements Dungeon/Tactical.

Cette priorité évite de restructurer autour d’un calcul encore ambigu ou de perdre une règle pendant le déménagement.
