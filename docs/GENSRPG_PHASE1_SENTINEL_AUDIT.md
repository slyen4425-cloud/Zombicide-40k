# GenSrpG — Audit des sentinelles Phase 1

Date de clôture documentaire : 2026-09-18.

Base auditée : `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`  
Checkpoint de départ rétroactif conforme à la charte : `checkpoint/gensrpg-start-phase1-sentinel-gap-audit-2026-09-18`.

## Règle du lot

Audit uniquement. Aucun runtime, gameplay, asset ou valeur de règle n'est modifié dans ce lot.

## Matrice Phase 1

| Ligne roadmap | État | Preuve actuelle | Manque restant |
| --- | --- | --- | --- |
| Lancement Survie | COUVERT | `gens_survival_mode_isolation_v1678104.test.cjs` protège le guard ; `gens_survival_shell_launch_browser_v11411.test.cjs` traverse le vrai Shell, le profil Survie, le pré-game et `startConfiguredGame()` | aucun manque Phase 1 identifié |
| Lancement Dungeon | COUVERT | `gens_savequit_resume_shell_browser_v11411.test.cjs` traverse le vrai Shell depuis l'accueil jusqu'au profil Dungeon, au pré-game, à la sélection héros et à `startConfiguredGame()` ; les tests Dungeon existants protègent ensuite le runtime | aucun manque Phase 1 identifié |
| Fiche héros Dungeon | COUVERT | `gens_v11411_native_ui_browser.test.cjs`, `gens_hero_sheet_art_runtime_v11411.test.cjs`, `gens_hero_sheet_talent_flash_v11411.test.cjs` | aucun manque Phase 1 identifié |
| Save & Quit + reprise | COUVERT | `gens_savequit_resume_shell_browser_v11411.test.cjs` lance une vraie session Dungeon, traverse `DungeonCore01.quit`, recrée la page avec le stockage navigateur conservé puis clique réellement sur `Reprendre` et vérifie la restauration | aucun manque Phase 1 identifié |
| Mouvement Dungeon | COUVERT | `dungeon_runtime_regression.test.cjs` + sentinelles spatiales/authored | aucun manque Phase 1 identifié |
| Stats canoniques | COUVERT | consolidation/runtime-link/editor semantics + snapshot Tactical | aucun manque Phase 1 identifié |
| Dés D100/D6 | COUVERT | `gens_mobile_combat_performance_v16781022.test.cjs` exécute D6 et D100 et vérifie aussi la délégation Survie ; `gens_rpg_tactical_wall_dice_stats_v16781145.test.cjs` protège le D100 Tactical | aucun manque Phase 1 identifié |
| Calcul de touche | COUVERT | `gens_agility_ranged_hit_attribution_v11411.test.cjs`, `gens_hit_scaling_authority_extract_v11411.test.cjs` | aucun manque Phase 1 identifié |
| Dégâts + armure + résistances | COUVERT | `gens_v11411_final_melee_damage_contract.test.cjs`, `gens_rpg_tactical_damage_v167811411.test.cjs`, sentinelles d'explication | aucun manque Phase 1 identifié |
| Combat Tactical entrée/sortie | COUVERT FORT | Bridge, V113, callsites 4K/4L/4M, Dock, browser Tactical | aucun manque Phase 1 identifié |
| Monster Capture | COUVERT | `gens_capture_current_shell_browser_v11411.test.cjs` traverse le vrai Shell jusqu’au profil Monster Capture, le reload V16.155, le pré-game, le choix dresseur/créature, `startConfiguredGame()`, le Hub Capture et la progression Jour 1 -> Jour 2 | aucun manque Phase 1 identifié |
| Duel/PvP | COUVERT | `gens_pvp_placeholder_shell_browser_v11411.test.cjs` traverse la vraie carte PvP du Shell et protège `PVP — À VENIR`, le message moteur non construit et l'absence de session/runtime parasite | aucun manque Phase 1 identifié |
| Sauvegarde | COUVERT | `dungeon_authored_return_persist_v167862.test.cjs` protège la persistance spatiale ; `gens_savequit_resume_shell_browser_v11411.test.cjs` protège désormais le round-trip Shell complet Save & Quit -> recréation de page -> Reprendre | aucun manque Phase 1 identifié |
| PWA/cache | COUVERT | `gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs` + preview composition/browser | aucun manque Phase 1 identifié |
| Non-interférence 4 modules | RED CARACTÉRISÉ | `gens_four_module_noninterference_shell_browser_v11411.test.cjs` traverse Survie -> Dungeon -> Survie -> Capture -> PvP et révèle une fuite de classes de contexte au passage Capture -> PvP | `gensDungeonTheme` et `gensCapturePregame` restent actifs sur `body` ; correctif Shell dédié requis avant sortie Phase 1 |

## Propriétaires vérifiés

Le shell actuel utilise :
- `openGensFamily(family)` pour afficher la famille ;
- `openGensBuiltInGame(profileId,family)` pour sélectionner le profil/famille ;
- `startConfiguredGame()` comme chemin commun de lancement ;
- `resumeGame()` comme reprise shell générique.

Les futurs tests doivent traverser ces propriétaires réels et ne pas recopier leur logique.

Preuve de fermeture Save & Quit / reprise : SHA fonctionnel `47d84f35c802dbe5f15d2f0bca158b82583ed9a8`, Architecture `35317905997`, Firefox `35317906010`, Tactical Dock `35317905939` — tous SUCCESS.\n\n## Plus petit manque suivant

Les lots **lancement Survie par le vrai Shell** et **Save & Quit + vraie reprise complète par le Shell** sont désormais couverts et branchés à la CI. La sentinelle Save/Resume couvre également le lancement Dungeon depuis le Shell racine.

Le placeholder PvP actuel et le comportement actuel Monster Capture sont désormais couverts et branchés à la CI.

Preuve Capture : SHA fonctionnel `97ad8aa05ccd7422f08c1bf1715fcb487d98c0ef`, Architecture `35321411358`, Firefox `35321411333`, Tactical Dock `35321411366` — tous SUCCESS.

Le lot de non-interférence a désormais une sentinelle unique et un RED fonctionnel caractérisé sur la transition **Capture -> PvP**. Le Shell affiche bien le placeholder PvP sans session/runtime parasite, mais conserve les classes `gensDungeonTheme` et `gensCapturePregame` du contexte précédent.

Prochain lot : **correctif Shell dédié de nettoyage de contexte**, avec `openGensFamily()` comme propriétaire identifié. Aucun correctif n’est appliqué dans le lot sentinelle lui-même.

Après ce correctif GREEN : relancer la sentinelle quatre modules, refaire la matrice Phase 1 complète et décider du passage en Phase 2.

## Signalement hors périmètre conservé

Doute utilisateur : détection des ennemis hors embuscade semble parfois ne pas fonctionner.

Ce point n'est pas corrigé pendant Phase 1. Il devra avoir un lot de caractérisation dédié après les sentinelles.
