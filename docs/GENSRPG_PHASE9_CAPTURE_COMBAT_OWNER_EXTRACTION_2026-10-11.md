# Phase 9 — Capture : transfert physique du propriétaire combat (ouverture gouvernée)

Date : 11 octobre 2026. **Statut : propriétaire Combat Core extrait physiquement, contrôles de sortie du lot encore ouverts.** Ce document reste un point de reprise borné, non une preuve GREEN tant que les trois CI du commit documentaire final et la validation utilisateur ne sont pas acquises.

## Gouvernance et validation précédente

- Dernier GREEN **fonctionnel** : `checkpoint/gensrpg-phase9-capture-team-roster-extraction-green-2026-10-11` à `f7d64ba8c5b2539ce8ee65ab3db3d51828229965`. Validation manuelle explicite de l'utilisateur du 11 octobre (« tout fonctionne parfaitement »).
- CI sur ce SHA : Architecture + navigateur `38130847051`, Firefox `38130847008`, Tactical Dock `38130847003`, trois SUCCESS.
- Départ de ce chantier : `checkpoint/gensrpg-start-phase9-capture-combat-owner-extraction-2026-10-11` à `f7d64ba8c5b2539ce8ee65ab3db3d51828229965`.
- Branche dédiée : `work/gensrpg-phase9-capture-combat-owner-extraction-2026-10-11` ; production `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Pas de fusion avec d'anciennes branches Capture, Dungeon, lifecycle ou travaux de laboratoires.

## Source index selon charte §26

- Git tree exact au SHA de départ : `index.html`, **7 950 873 octets**, Git blob **`57415a1071475cc10f0c79e092897190577127e8`**.
- L'utilisateur avait fourni `indexa.zip` du checkpoint précédent : 7 959 089 octets, blob `e777d484ab10049650440fee04f47cf2dfdc3043`, contrôlé byte-exact. Application locale **de la transformation déjà validée** `gensrpg_phase9_capture_team_roster_extraction_apply.py` et rollback exact ; le nouvel index reconstitué correspond byte-exactement à GitHub : 7 950 873 octets, blob `57415a1071475cc10f0c79e092897190577127e8`.
- Source immuable de référence : https://github.com/slyen4425-cloud/Zombicide-40k/blob/f7d64ba8c5b2539ce8ee65ab3db3d51828229965/index.html
- Toute inspection/édition future du HTML doit rester fondée sur cette preuve d'identité ; ne pas prendre une branche divergente comme source.

## Frontières réellement repérées à l'ouverture du chantier

Les fonctions du combat Capture demeurent dans le HTML historique et sont **distinctes** du module Équipe / Réserve extrait :
1. Bloc démarrage/configuration du combat Capture autour de `captureBattleModeKey`, `captureWildBattleRules`, `captureStartBattleAutomatic`.
2. Bloc exécution/UI Capture autour de `captureBattleAbilityById`, `captureBattleApplyAbility`, `captureBattleUseAbility`, `captureBattleRunAiUntilHuman`, `captureBattleFinishAndClose`, `captureRenderBattleLive`, `captureStartWildBattle`, `captureLaunchTrainerBattle`.
3. Bloc noyau Capture autour de `GENS_CAPTURE_BATTLE_TARGETS`, `gensCreateCaptureBattle`, `GENS_CAPTURE_BATTLE_SAVE_KEY`, `gensCaptureBattleInit`, `gensCaptureBattleRecall`, `gensCaptureBattleTargets` et `gensCaptureAbilityTargetMode`.
4. Les expressions d'XP et de progression `captureXpForDefeat`, `captureAwardBattleXp` et la fiche créature sont des dépendances à **préserver**, non à réécrire ou retirer implicitement.

Les API existantes sont appelées par le monde, l'équipe/réserve, les éditeurs, le Shell et des sentinelles. Le futur transfert doit déplacer les **corps propriétaires** en une seule composition Capture, retirer les corps inline, garder temporairement les mêmes signatures globales historiques de fonctions classiques et la sauvegarde `gensrpg_capture_battle_current_v1`. Aucun second moteur, wrapper d'interception, timer de réparation ou nouveau schéma de profil.

## Critères de mutation et sortie

- **Avant mutation :** test RED de propriété unique et frontière de charge du combat ; comparer strictement source, chemin de chargement et dépendances déjà initialisées.
- Migration **soustractive et réversible** dans `assets/gensrpg/capture/`, rollback byte-exact au SHA de départ, aucun gameplay/valeur de règle/persisté modifié.
- **Parité** de l'équipe, réserve, statuts et buffs, cibles, cooldowns/charges, Pv, KO, sauvegarde/reprise bataille et récompenses ; conserver choix de règle editable et créatures utilisateur.
- E2E navigateur vrai Capture vierge : équipe → exploration → combat → victoire → quitter → reprise → deuxième combat. Vérifier aucune autorité Dungeon/Survie active ; toujours tester Dungeon Builder, Survie, PvP, Tactical, Core/Storage.
- Triple CI Architecture/Firefox/Tactical **SUCCESS sur un SHA identique**, checkpoint technique puis preview smartphone et validation utilisateur **avant** tout checkpoint fonctionnel GREEN.
- **Phase 10 non ouverte**. Après ce transfert, évaluer les critères de sortie de Phase 9 sans inventer des micro-lots : si les 3 axes d'autonomie et propriétaires Capture sont démontrés, finaliser Phase 9 au lieu de prolonger indéfiniment.

**Interdits** : toucher `main`, modifier les dépôts de laboratoires, fusionner les branches divergentes, changer la carte monde ou ses règles, créer un nouveau moteur combat, remplacer le système de sauvegarde, introduire le Dungeon Builder dans Capture.


## Exécution contrôlée — propriétaire Combat Core réellement déplacé

- GitHub Actions [38136340298](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38136340298) **SUCCESS**. Commit runtime `36727d526c374fe4072a7655a6ce91747347dc7f`. Aucun déploiement sur `main`.
- Source `index.html` vérifiée à **7 950 873 octets** et Git blob `57415a1071475cc10f0c79e092897190577127e8`. Le script de transfert `tools/gensrpg_phase9_capture_combat_core_apply.py` impose cette provenance et le checkpoint de départ.
- `assets/gensrpg/capture/combat-core-v1.js` : **18 894 octets**, Git blob `129e0af81d7454ed9f7697d40454a5e32bb8e580`, **39 fonctions originales**, sauvegarde `gensrpg_capture_battle_current_v1` inchangée.
- Nouvel `index.html` : **7 932 251 octets**, Git blob `b64eae3650081af624155c8a4b8e47e4a1791658`; ancien propriétaire inline supprimé, nouveau chargeur classique synchrone immédiatement après Équipe / Réserve.
- Restauration à l'octet de la source GREEN démontrée, sentinelle `gens_phase9_capture_combat_core_owner_v1.test.cjs` et parité VM de ciblage. Ancien propriétaire Équipe/Réserve et ses snapshots historiques intégralement reconstruits en **test uniquement** (aucun fallback runtime).
- Dans le même workflow, test navigateur réel Capture profil persistant sans Dungeon, victoire, retour Hub, reprise, test Axe B, frontières quatre modules et Dungeon Builder : **SUCCESS**.
- Anomalie d'entrée Hub préexistante : `assets/gensrpg/capture/hub-entry-v1.js` délègue désormais le masquage des trois écrans de sélection à l'unique fonction propriétaire Shell `gensHideHomeLevels()` ; test frontière dédié `gens_phase9_capture_shell_home_return_boundary_v1.test.cjs`. Aucune seconde écriture de visibilité Capture.
- UI/actions de combat Capture `captureBattleApplyAbility`, `captureBattleUseAbility`, `captureBattleFinishAndClose`, combat de dresseurs et XP/récompenses restent encore dans le propriétaire historique inline. Ne pas les compter comme physiquement extraits.
- **Étape de sortie restante** : triple CI Architecture+Browser/Firefox/Tactical sur **un même SHA final** avec contrat, tests et documentation, checkpoint technique, validation smartphone utilisateur ; GREEN fonctionnel seulement après validation. Les responsabilités UI encore inline doivent être évaluées contre le critère d'autonomie de Phase 9 et déplacées seulement si ce critère l'exige. Phase 10 toujours fermée.
