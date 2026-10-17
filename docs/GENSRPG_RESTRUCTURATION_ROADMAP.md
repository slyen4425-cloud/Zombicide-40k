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
- **A1 GREEN — audit et conservation des images** : checkpoint `checkpoint/gensrpg-phase11-asset-ownership-a1-green-2026-10-13` au SHA `7ef5060a72b883ecee23ddee9c381a300f8be1b9` ; Architecture/Chromium [38377948215](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38377948215), Firefox [38377948201](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38377948201), Tactical [38377948264](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38377948264), toutes SUCCESS sur le même SHA. L'utilisateur suspend expressément tout déplacement des 32 images historiques et des assets des deux laboratoires ; le statut "conserver en place" est protégé dans la matrice et son test. **Aucune migration globale n'est revendiquée.**



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

### Orientation du propriétaire — 13 octobre 2026 : conservation sans déménagement

- Les 32 `assets/img_*` historiques possiblement issus de Survie doivent **rester à leurs emplacements actuels**. Aucun déplacement, suppression ou reclassification forcée ; éventuelle recréation seulement sur décision ultérieure.
- Les laboratoires combat dynamique (`slyen4425-cloud/GenSrpg_labo_combat_dynamique`) et exploration dynamique (`slyen4425-cloud/laboratoire_dynamique_exploration-`) conservent leur propre organisation d'assets. Ne pas les intégrer à cet inventaire du dépôt principal, ni leur imposer une arborescence commune.
- **Réduire la Phase 11 aux garde-fous utiles** : A0 inventaire et A1 traçabilité/gel des images connues ; ne pas entreprendre de migration générale ni multiplier les micro-audits pour atteindre artificiellement une structure cible. La séparation par module reste la règle des nouveaux assets et des futures intégrations explicites.
- A1 peut être validé comme **lot de conservation et cartographie externe**, sans prétendre avoir vérifié les consommateurs internes à `index.html` ni terminé un transfert d'assets. Aucun ZIP de l'index n'est requis tant qu'aucune consultation exacte n'est nécessaire.
- Les déplacements historiques deviennent **reportés, non bloquants pour l'étude de la Phase 12**, sous réserve de préserver les chemins chargés par l'application et les protections de la charte. Ne pas annoncer une migration complète de Phase 11.

## Phase 12 — Alléger index.html

### D1 GREEN — extraction physique Dungeon Core01

- Base : dernier checkpoint A1 GREEN `7ef5060a72b883ecee23ddee9c381a300f8be1b9`, départ `checkpoint/gensrpg-start-phase12-dungeon-core01-extraction-2026-10-13`, branche `work/gensrpg-phase12-dungeon-core01-extraction-2026-10-13`.
- Extraction visée, sans modifier le comportement : le bloc autonome `<script id="gensDungeonCore01Js">` devient un JS externe au même emplacement de chargement, propriété exclusive Dungeon (`assets/gensrpg/dungeon/core01-session-ui-v1.js`). L'original doit être reconstructible **octet par octet** ; tests sur le vrai index, browser et CI triple requise.
- Source exacte fournie précédemment par l'utilisateur et de nouveau vérifiée sur le SHA : `index.html` 7 934 204 octets / Git blob `bf996ec4e748a4927ac6dd57cceaeaf2afcd9441` (§26). Aucun extrait de copie inconnue, aucune modification de `main` ou des laboratoires.
- L'extraction est un **lot isolé**, pas une refonte générale des moteurs ni du Shell. Pas de déplacement des assets historiques de Survie, aucune règle de gameplay ou compatibilité fictive.

- **D1 GREEN le 13 octobre 2026** : extraction publiée, rollback octet exact vérifié, ancien propriétaire inline absent ; checkpoint `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13` sur `5d8d0d37982ac2987bd4c72326de28318a4687c6`. Triple CI sur cet exact SHA : Architecture/Chromium [38419138287](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138287), Firefox [38419138332](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138332), Tactical [38419138470](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138470), toutes SUCCESS. D1 représente 22 715 octets nets retirés de l'index ; la Phase 12 complète reste ouverte. D2 exige son propre checkpoint/branche et le prochain index exact selon §26.

### D2 GREEN — extraction physique Dungeon Core051 (13 octobre 2026)

- Départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-core051-extraction-2026-10-13` sur `11813ebc8d40ba976041f0be78d698cf2314b2dc` ; branche `work/gensrpg-phase12-dungeon-core051-extraction-2026-10-13`.
- Source exacte §26 : ZIP utilisateur `a3.zip` vérifié (7 911 489 octets, blob `2921ebadacf6f660e815d9ff7712e44cd765fbdd`).
- `dungeonCore051ExplorationPolish` extrait sans modification de son IIFE : **47 962 octets** de JS vers `assets/gensrpg/dungeon/core051-exploration-polish-v1.js`, même emplacement parser ; index final **7 863 589 octets** (blob `e5f8895495f969597a6c209fcc29afd66b7a0636`), retour D2 → D1 → original exact garanti par les tests.
- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-dungeon-core051-d2-green-2026-10-13` au SHA `06c3608f36d020ac4f470de4dbe4ca272da3b897`, Architecture/Chromium [38428721362](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721362), Firefox [38428721028](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721028), Tactical [38428721250](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38428721250) **SUCCESS sur le même SHA**.
- Phase 12 globale **non terminée**. Prochaine extraction D3 seulement après checkpoint de départ propre, cartographie propriétaire et nouvel index exact demandé §26. Aucun autre domaine, labos ni assets Survie modifiés.

### D3 GREEN — extraction Dungeon MJ72 Scene (13 octobre 2026)

- Lot isolé `work/gensrpg-phase12-dungeon-mj72-d3-extraction-2026-10-13`, checkpoint de départ `checkpoint/gensrpg-start-phase12-dungeon-mj72-d3-extraction-2026-10-13` sur la base triple CI GREEN `370da67fc163576c8e1a78f8b01e5beaf9236d64`.
- Source §26 certifiée : ZIP utilisateur `ar.zip`, ancien index après D2, 7 863 589 octets, blob `e5f8895495f969597a6c209fcc29afd66b7a0636`.
- Extraction **byte-exact** du propriétaire Dungeon actif `dungeonMj72_2Script` : 27 511 octets vers `assets/gensrpg/dungeon/mj72-scene-v1.js` ; même endroit parser, script classique, globals conservés ; index 7 836 124 octets, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`. Rollback D3→D2→D1 protégé.
- Application contrôlée [38459404192](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38459404192) SUCCESS ; **checkpoint final GREEN** `checkpoint/gensrpg-phase12-dungeon-mj72-d3-green-2026-10-13` au SHA `2ec9e6dc5f13e9ea19234f6167641f6ccfd61dbb`.
- Triple CI sur ce SHA exact : [Architecture/Chromium 38460988097](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988097), [Firefox 38460988091](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988091), [Tactical 38460988049](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38460988049), toutes SUCCESS. Aucun changement de `main`, des labos ou des assets Survie.
- **Phase 12 globale toujours ouverte** : D1+D2+D3 = 98 241 octets JS externalisés et 98 080 octets nets retirés de l'index initial. D4 nécessite son propre checkpoint §25 ainsi que le nouvel index exact reçu en ZIP (§26) avant lecture/transfert.


### D4 GREEN — extraction physique Dungeon Core200 (14 octobre 2026)

- Départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-core200-d4-extraction-2026-10-13` au SHA triple-CI GREEN `9fa3729d0ae4f3531d53221a9d1021277a1c7382` ; lot sur `work/gensrpg-phase12-dungeon-core200-d4-extraction-2026-10-13`.
- Source §26 : `a4.zip` (index après D3) vérifié, 7 836 124 octets, blob `972f0e0be12fac14427853fbcd7abe5233eb5a8c`.
- `dungeonCore200Rebuild` : 55 842 octets de code Dungeon byte-identique transférés vers `assets/gensrpg/dungeon/core200-rebuild-v1.js`, chargement classique synchrone à sa position initiale. Le nouvel index fait 7 780 333 octets (blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`) ; rollback D4→D3→D2→D1 vérifié.
- [Application contrôlée 38470070484](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38470070484) SUCCESS. **Checkpoint final GREEN** `checkpoint/gensrpg-phase12-dungeon-core200-d4-green-2026-10-14` sur le SHA `be7f159a189d1f14579707ba67eb024be4238487` après succès de la triple CI exacte : [Architecture/Chromium 38543038090](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038090), [Firefox 38543037973](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543037973) et [Tactical 38543038142](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38543038142). Les sentinelles d'effets de bord et de points d'entrée historiques ont été préservées en comptant le nouveau propriétaire physique.
- **D1+D2+D3+D4 = 154 083 octets externalisés ; 153 871 octets nets retirés de l'index. Phase 12 toujours ouverte.** D5 exige nouveau ZIP index à ce SHA (§26), checkpoint et branche séparés (§25). Aucun changement de `main` ou des deux laboratoires.


### D5 GREEN — Dungeon Core211 Consolidation (14 octobre 2026)

- Départ §25 `checkpoint/gensrpg-start-phase12-dungeon-core211-d5-extraction-2026-10-14` sur base triple CI GREEN `00022b60a5b9dea8bc8bc281a7705d94b31ff09a` ; branche unique `work/gensrpg-phase12-dungeon-core211-d5-extraction-2026-10-14`.
- Source §26 vérifiée, `b1.zip` et `b2.zip`, index après D4 7 780 333 octets, blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`.
- Un seul propriétaire actif Dungeon `dungeonCore211Consolidation` externalisé **byte-identique** : **17 511 octets** vers `assets/gensrpg/dungeon/core211-consolidation-v1.js`, même chargement classique parser ; index **7 762 879 octets** (blob `2ad1961efb9733037b7753ffd4a308baa1b00b64`), rollback D5→D1 exact.
- Application contrôlée [38581987594](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38581987594) SUCCESS ; **checkpoint final GREEN** `checkpoint/gensrpg-phase12-dungeon-core211-d5-green-2026-10-14` sur **`50715c1b150fbd8d9829b90d88a983e6550ff63d`**.
- Triple CI complète même SHA : [Architecture/Chromium 38584005349](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005349), [Firefox 38584005102](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005102), [Tactical 38584005388](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38584005388), toutes SUCCESS.
- **Phase 12 encore ouverte**, D1–D5 : **171 594 octets externalisés**, **171 325 octets nets en moins**. D6 demande son propre checkpoint et un nouveau ZIP exact (§25, §26). `main`/laboratoires/Survie historique inchangés.


### D6 GREEN — Dungeon Core213 Stability (15 octobre 2026)

- Départ §25 : `checkpoint/gensrpg-start-phase12-dungeon-core213-d6-extraction-2026-10-15` sur base triple GREEN `db64f0aa2334d75c556fb9a122f5da51271419ec` ; branche dédiée `work/gensrpg-phase12-dungeon-core213-d6-extraction-2026-10-15`.
- §26 : ZIP `b3.zip` (`index.html(8).txt`) certifié, 7 762 879 octets, blob `2ad1961efb9733037b7753ffd4a308baa1b00b64`.
- Seul propriétaire Dungeon actif `dungeonCore213Stability` déplacé **byte-identique**, 17 519 octets (blob `af4bf724315180becd80833af251504130751ad3`) vers `assets/gensrpg/dungeon/core213-stability-v1.js`. Script classique synchrone, même emplacement.
- Index final 7 745 413 octets, blob `b5271e44dc4c14834a7725a869fb3c12386f2437`. Rollback D6→D5→D4→D3→D2→D1 exact.
- [Application contrôlée 38657162683](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38657162683) SUCCESS ; SHA code `3e85b6071cec57748782454de35d8b76c373e3cd`. Ancien arrêt de propagation protégé par empreinte, sans changement de gameplay.
- **Clôture D6 GREEN** : SHA validé `4b93ee9f8ceb9850097421b54db8c43a8df2862a`, triple CI [Architecture/Chromium 38658003954](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658003954), [Firefox 38658003956](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658003956), [Tactical 38658004148](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38658004148), toutes SUCCESS sur le même SHA ; checkpoint final §25 `checkpoint/gensrpg-phase12-dungeon-core213-d6-green-2026-10-15` créé sur ce SHA. Script externe et index byte-identiques aux blobs verrouillés.
- Bilan D1–D6 : **189 113 octets JS externalisés** et **188 791 octets nets retirés** de l'index ; index actuel de **7 745 413 octets**. Phase 12 toujours ouverte. D7 exige nouveau checkpoint de départ, propriétaire identifié, source exacte de ce SHA suivant §26. Le ZIP `b4.zip` reçu le 15 octobre correspond au D4 (7 780 333 octets, blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43`) et n'est pas une source valide D7.

### D7 GREEN — Dungeon Core214 Single Authority (15 octobre 2026)

- §25 base triple CI GREEN `ac1e3c8be76732bdc7f389d0d9258cf283d65a84`, départ `checkpoint/gensrpg-start-phase12-dungeon-core214-d7-extraction-2026-10-15`, branche `work/gensrpg-phase12-dungeon-core214-d7-extraction-2026-10-15`.
- §26 ZIP `b5.zip` (entrée `index.html(10).txt`) vérifié exact D6 : 7 745 413 octets, blob `b5271e44dc4c14834a7725a869fb3c12386f2437`.
- Candidat propriétaire actif unique `dungeonCore214SingleAuthority` : IIFE de 15 795 octets, blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88`. Extraction envisagée byte-identique vers `assets/gensrpg/dungeon/core214-single-authority-v1.js`, à sa place parser ; index attendu 7 729 678 octets, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`.
- Application contrôlée [38761613784](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38761613784) **SUCCESS**, code SHA `821d2c3f91c2f238fc223c8dd73ff1cebac6181b`. Index D7 confirmé 7 729 678 octets / blob `6e1cb9b82126409b633306b0e77a7e45badb0f79` ; rollback intégral byte exact validé ; sentinelle Architecture D7 intégrée.
- **GREEN officiel** : triple CI [Architecture/Chromium 38763178917](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178917), [Firefox 38763178876](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178876), [Tactical 38763178850](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38763178850) **SUCCESS sur le même SHA** `20048a1b1059c0c2ad31df72d17c399065a1da49`. Checkpoint final §25 : `checkpoint/gensrpg-phase12-dungeon-core214-d7-green-2026-10-15`, vérifié sur ce SHA. Aucune évolution gameplay, `main` ou labos.
- **Bilan D1–D7** : 204 908 octets de JS externalisés ; 204 526 octets nets retirés de l'index initial ; index actuel de 7 729 678 octets. Phase 12 toujours ouverte, D8 non ouvert. Pour une nouvelle extraction, source exacte du checkpoint D7 exigée §26.

### D8 GREEN — Dungeon Core201 Stability (16 octobre 2026)

- **Départ §25** : source D7 GREEN `20048a1b1059c0c2ad31df72d17c399065a1da49`, checkpoint `checkpoint/gensrpg-start-phase12-dungeon-d8-extraction-2026-10-15`, branche `work/gensrpg-phase12-dungeon-d8-extraction-2026-10-15`.
- **Source §26 exacte :** `c1.zip` / `index.html(11).txt`, 7 729 678 octets, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`.
- **Extraction byte-identique :** `dungeonCore201Stability` 13 990 octets, blob `7edf731fd1aa209ec96490fb8e2cb7af04afd627`, vers `assets/gensrpg/dungeon/core201-stability-v1.js`, même position parser et chargement synchrone. Nouvel index 7 715 741 octets, blob `f56dc5bbb368b176509ab16477bd4b24dd000497`; net −13 937 octets.
- **Application contrôlée** [38801893284](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38801893284) SUCCESS. JS syntaxique, rollback strict D8→D1, manifest de 101 fichiers atteignables et frontières Dungeon/Survie/Capture/Tactical validés.
- **D8 GREEN :** commit validé `dd3f127041a78b9e7539ab1735cb188557a50ccc`, CI [Architecture/Chromium 38803573910](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573910), [Firefox 38803573894](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573894), [Tactical 38803573930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573930) toutes **SUCCESS sur le même SHA** ; checkpoint final `checkpoint/gensrpg-phase12-dungeon-core201-d8-green-2026-10-16` sur ce SHA. Aucun nouveau gameplay, aucune modification de `main` ni des labos.
- **Cumul D1–D8 :** 218 898 octets de JS externalisés ; 218 463 octets nets de moins dans `index.html` ; Phase 12 non terminée, D9 pas encore ouvert.
- **Préparation D9 :** vérifier le prochain ZIP correspondant à l'index D8 au blob `f56dc5bbb368b176509ab16477bd4b24dd000497` (§26), puis créer checkpoint et branche D9 dédiée (§25), un seul propriétaire actif isolé par lot.

### D9 GREEN — Dungeon Core202 Content Density (16 octobre 2026)

- **Démarrage §25 :** base D8 GREEN `dd3f127041a78b9e7539ab1735cb188557a50ccc`, checkpoint `checkpoint/gensrpg-start-phase12-dungeon-d9-extraction-2026-10-16`, branche `work/gensrpg-phase12-dungeon-d9-extraction-2026-10-16`.
- **Source exacte §26 certifiée :** `c2.zip` / `index.html(12).txt`, 7 715 741 octets, blob `f56dc5bbb368b176509ab16477bd4b24dd000497`.
- **Un propriétaire Dungeon déplacé byte-identiquement :** `dungeonCore202ContentDensity`, 11 821 octets, blob `364673f3dd35bfa8be7f378152f775656c9243e2`, vers `assets/gensrpg/dungeon/core202-content-density-v1.js` à l'emplacement parser initial, synchrone. Frontière `authored202` préservée.
- **Application contrôlée [38866855495](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38866855495) SUCCESS** ; index D9 réel 7 703 979 octets, blob `fce949665fea47a2aa2a535ede7289b06936f986`. Réduction nette 11 762 octets, restauration historique D9→D1, 102 propriétaires JS atteignables et tests de frontières préservés.
- **Validation D9 GREEN :** triple CI [Architecture/Chromium 38867846431](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846431), [Firefox 38867846444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846444), [Tactical 38867846636](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846636), **SUCCESS au SHA commun `83d6683896cdb58a63f98cf2fc3e360c23423f76`**. Checkpoint final §25 `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16` créé sur ce SHA. Les sentinelles historiques adaptent strictement les inventaires et les restaurations sans réécrire le moteur ni le gameplay.
- **Cumul Phase 12 D1–D9 :** 230 719 octets JS externalisés ; 230 225 octets nets retirés. Phase 12 toujours ouverte, D10 non ouvert ; nouvelle source D9 exacte obligatoire (§26).
- `main` gelée ; labs et autres modes hors périmètre, aucun changement fonctionnel.

### R01 GREEN — Manifeste PWA externe (16 octobre 2026)

- **Base §25 :** `checkpoint/gensrpg-start-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16` depuis l'audit après D9 GREEN ; branche `work/gensrpg-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16`. §26 : `c4.zip`, D9 7 703 979 octets / blob `fce949665fea47a2aa2a535ede7289b06936f986`.
- **Source déplacée byte-identique :** IIFE anonyme du manifeste dynamique 734 440 octets / blob `778e3acf2f77b3c7680bf70a0c6a846b84826235` vers `assets/gensrpg/shell/pwa-manifest-dynamic-v1.js` ; script classique synchrone, URL Blob, images et manifeste statique non modifiés. Service worker actualisé (pré-cache fichier nouveau et cache versionné) pour hors-ligne.
- **Index R01 exact :** 6 969 593 octets, blob `caf31c121d926b7b76b9bb05688fab8f2839814e` : **−734 386 octets nets**. Rollback R01→D9 byte exact prouvé, inventaire **103** propriétaires externes atteignables. Application contrôlée [38895240370](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38895240370) SUCCESS.
- **Triple CI GREEN au même SHA `1b0fa3a718059242507d3e95de45033bba57ea24` :** Architecture/Chromium [38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), Firefox [38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), Tactical [38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747), toutes SUCCESS. **Checkpoint final §25** `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16` créé/vérifié à cet exact SHA.
- **D1–D9 + R01 :** 965 159 octets JS externalisés ; 964 611 octets nets retirés du HTML. Phase12 toujours ouverte ; pas d'ouverture automatique du prochain Core Dungeon.
- **R02 prochain candidat, non ouvert :** sous-audit du monolithe multi-domaines 5 364 441 octets (~4,10 Mo images base64), avec ZIP du **nouvel index R01** au SHA GREEN (§26), checkpoint/branche propres (§25), séparation par autorité à prouver avant toute mutation du runtime.

### R02 GREEN technique — Cinq chaînes visuelles extraites (16 octobre 2026)

- Checkpoint départ §25 `checkpoint/gensrpg-start-phase12-r02-legacy-visual-data-extraction-2026-10-16` au SHA R01 GREEN `1b0fa3a718059242507d3e95de45033bba57ea24`, branche `work/gensrpg-phase12-r02-legacy-visual-data-extraction-2026-10-16`.
- Source §26 certifiée `c5.zip` : 6 969 593 octets / blob `caf31c121d926b7b76b9bb05688fab8f2839814e`.
- Cinq valeurs `data:image` extraites vers fournisseur de données **sans moteur** `assets/gensrpg/core/legacy-visual-data-v1.js` (4 100 559 octets), conservées comme URL base64 originales et accessibles via variable lexicale commune ; monolithe original n'est pas découpé en plusieurs moteurs.
- **Index réel certifié** : **2 869 485 octets** / blob `062c4cd37634f504cc75ce3329d6e69e19b5f547` ; économie **4 100 108 octets**. Retour R02→R01 byte-exact, JS de données et service worker pré-caché validés. **R02 GREEN technique** sur `b5f923fa0426467827c12696ad9a4a02f24e3b6f` ; checkpoint §25 `checkpoint/gensrpg-phase12-r02-legacy-visual-data-extraction-green-2026-10-16` créé le 16 octobre.
- **Preuves** : [application ciblée et rollback 38933052158](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38933052158) SUCCESS ; Architecture [38934318213](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318213), Firefox [38934318235](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318235), Tactical [38934318218](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38934318218) toutes SUCCESS sur le même SHA `b5f923fa0426467827c12696ad9a4a02f24e3b6f`. Pas de test manuel Android/hors-ligne attesté : la publication reste distincte.
- **Arbitrage des R02 concurrents** : garder l'historique de `work/gensrpg-phase12-r02-legacy-multidomain-boundary-2026-10-16` sans fusion (Architecture FAILURE, mélange Survie/Dungeon/Capture/Shell/stockage) et les deux pistes d'audit `r02-megablock-boundary-audit` / `r02-monolith-exit-scoping` en attente. **Une seule branche retenue**, aucun nouveau lot R02.
- **Après R02** : monolithe métier résiduel **1 264 265 octets** ; prochains chantiers R03–R07 à borner par propriétaire avec checkpoint indépendant. Nouveau fichier source si nécessité §26 : [index.html au SHA R02 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/b5f923fa0426467827c12696ad9a4a02f24e3b6f/index.html) ; `c5.zip` est seulement R01.
- Rapport `docs/GENSRPG_PHASE12_R02_LEGACY_VISUAL_DATA_2026-10-16.md`.

### R03 Shell Hub Family UI — GREEN technique (16 octobre 2026)

- **Départ §25** : `checkpoint/gensrpg-start-phase12-r03-shell-hub-family-ui-extraction-2026-10-16` sur `e8700f10aca7d4f3b9c85aa3cd4dc11aae6530ab`, branche unique `work/gensrpg-phase12-r03-shell-hub-family-ui-extraction-2026-10-16`.
- **Source exacte §26** : `c6.zip` / `index.html(15).txt` vérifié, index R02 2 869 485 octets, blob `062c4cd37634f504cc75ce3329d6e69e19b5f547`.
- **Transfert limité au Shell Hub** : six fonctions contiguës de sélection/présentation des familles, 6 651 octets JS, vers `assets/gensrpg/shell/legacy-hub-family-ui-v1.js`, blob `e45f3b4e419a10b030c47bc921bded1ec0dc723b` ; anciennes fonctions retirées de l'inline, aucune autorité de session ou stockage déplacée, même ordre parser synchrone.
- **Index R03 vérifié** : 2 862 906 octets, blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b` ; gain net 6 579 octets. Cache PWA versionné avec pré-cache de ce fichier ; rollback exact R03→R02 et chaîne des instantanés historiques maintenus.
- **Application** [38942880813](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38942880813) SUCCESS. Triple CI au **même SHA `afab707dad385450fdf296f7b2b6b41da376929b`** : [Architecture/Chromium 38946742376](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742376), [Firefox 38946742392](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742392), [Tactical 38946742410](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742410), toutes SUCCESS ; sentinelles historiques R03→R02 et quatre modes validées dans les pipelines.
- **Checkpoint final §25 GREEN technique** : `checkpoint/gensrpg-phase12-r03-shell-hub-family-ui-extraction-green-2026-10-16` exactement sur ce SHA. Sans fusion sur `main`, sans test Android manuel revendiqué. Ce lot valide la partie Shell Hub traitée, **pas la séparation complète du monolithe**. Prochaine responsabilité R03–R07 à délimiter avant code ; pas de nouveau D10 mécanique.
- **Source pour futur §26** : [index R03 au SHA code GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/afab707dad385450fdf296f7b2b6b41da376929b/index.html) ; `c6.zip` reste la source R02. Rapport : `docs/GENSRPG_PHASE12_R03_SHELL_HUB_FAMILY_UI_2026-10-16.md`.

### R04 Builders / bibliothèque et éditeur d'équipements — GREEN technique (17 octobre 2026)

- Source §26 : `c7.zip` (`index.html(16).txt`), 2 862 906 octets, blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b`, identique au R03 GREEN.
- Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase12-r04-builders-equipment-library-2026-10-17` sur `c311e8b721fcb789c89f2d1035a60f7e3ca3eec2` ; branche dédiée `work/gensrpg-phase12-r04-builders-equipment-library-2026-10-17`.
- **26 fonctions Builders équipement** déplacées sans réécriture vers `assets/gensrpg/builders/equipment-library-editor-v1.js` (**27 860 octets**, blob `27cadba87c766b5293ac3a7fe3ddffb8510adc40`). Le démarrage `refreshCustomEquipmentIntoItems();` demeure dans le gros script au même ordre historique ; pas de transfert de responsabilité gameplay.
- Index R04 **2 835 125 octets**, blob `554bf6100aeb0f40bfc098dc90863af7d2d5e439`, soit 27 781 octets de moins. Cache PWA versionné et asset pré-caché ; owner `builders` explicitement inscrit, aucune modification du `main` ni des labos.
- R04→R03→R02→R01 : restauration exacte via les helpers de test et contrôles historiques. Application [38988466500](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988466500) SUCCESS ; adaptation des tests [38988745257](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988745257) SUCCESS.
- **Triple CI finale sur le même SHA `645f5fa9b849c1732e2c11f625548665067294ec`** : [Architecture + Chromium 38989338985](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338985), [Firefox 38989339009](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989339009), [Tactical 38989338929](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338929) toutes SUCCESS, six checks au SHA SUCCESS.
- **Checkpoint final GREEN** : `checkpoint/gensrpg-phase12-r04-builders-equipment-library-green-2026-10-17` sur le SHA certifié. Aucun test manuel Android/PWA installée hors ligne revendiqué et aucune publication de `main`. Phase 12 non achevée.
- Prochain chantier **non ouvert** : rebornage par propriétaire du monolithe restant. Source §26 future [nouvel index R04](https://github.com/slyen4425-cloud/Zombicide-40k/blob/645f5fa9b849c1732e2c11f625548665067294ec/index.html), pas `c7.zip`.
- Rapport : `docs/GENSRPG_PHASE12_R04_BUILDERS_EQUIPMENT_LIBRARY_2026-10-17.md`.

### REMAINING INLINE / EXIT BOUNDARY AUDIT — après D9 GREEN (16 octobre 2026)

- **Changement explicite de plan :** ne pas ouvrir D10 sur le prochain Core Dungeon par inertie. D9 est réellement GREEN au SHA `83d6683896cdb58a63f98cf2fc3e360c23423f76` ; checkpoint final `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16`. Audit documentaire isolé sur `work/gensrpg-phase12-remaining-inline-exit-boundary-audit-2026-10-16` et checkpoint de départ `checkpoint/gensrpg-start-phase12-remaining-inline-exit-boundary-audit-2026-10-16`.
- **Source §26/reconstruction certifiée :** `c2.zip` D8 (7 715 741 octets / blob `f56dc5bbb368b176509ab16477bd4b24dd000497`) → D9 exact (7 703 979 octets / blob `fce949665fea47a2aa2a535ede7289b06936f986`). 158 scripts au total : 32 externes, 126 inline = 109 actifs (6 814 878 octets) + 17 désactivés (95 878 octets). 7 anonymes = 6 340 391 octets, 102 nommés = 474 487 octets.
- **A — actifs à externaliser :** cinq gros anonymes (5 364 441, 734 440, 180 964, 53 746, 6 337 octets = **6 339 928 octets** au total) et les 102 nommés groupés par domaines **après** preuve des frontières. Le monolithe 5,36 Mo contient 4 100 280 caractères base64 d'images mais mêle aussi plusieurs domaines ; ne pas le traiter comme bootstrap ni autorité unique.
- **B — bootstrap minimal :** candidats anonymes de 219 octets (IndexedDB) et 244 octets (Shell PvP), sous tests et justification explicite. Pas de moteur/sauvegarde/donnée massive inline à EXIT.
- **C — désactivés :** 17 scripts / 95 878 octets ; **un** lot de caractérisation/retrait ou archive par famille, pas 17 lots de refactoring.
- **Premier candidat à fort rendement (R01) :** script PWA de **734 440 octets** ; **externalisation byte-identique** en conservant `Blob`, ordre de chargement et remplacement du lien du manifeste. Ses deux PNG sont identiques aux fichiers racine `icon-192.png`/`icon-512.png`, mais les manifestes statique/dynamique ont des champs différents : **ne pas remplacer le manifeste dynamique par le statique avant tests PWA réels**.
- **Bornage de sortie :** 17 enveloppes thématiques R01–R17 détaillées dans `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md` ; environ **12–20 lots réels** comme hypothèse à confirmer, PAS un engagement. Si un regroupement franchit une frontière de propriétaire ou met en cause l'ordre parser / les sauvegardes, scinder en petits lots. Un lot = branche/checkpoint distinct + rollback/tests/CI triple ; aucun empilement opportuniste.
- **Exit réel Phase 12 :** structure HTML + styles racine + chargement explicite + seuls bootstraps B justifiés ; zéro moteur ou gameplay actif inline, zéro C laissé sans disposition, parité PWA et sauvegardes, modules séparés et CI Architecture/Chromium, Firefox, Tactical GREEN avant checkpoint final de la Phase.
- `main`, laboratoires et 32 visuels historiques Survie intacts. **Aucune extraction code lors de l'audit documentaire.**

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
