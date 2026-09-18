# GenSrpG — Audit des sentinelles Phase 1

Date de clôture documentaire : 2026-09-18.

Base auditée : `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`  
Checkpoint de départ rétroactif conforme à la charte : `checkpoint/gensrpg-start-phase1-sentinel-gap-audit-2026-09-18`.

## Règle du lot

Audit uniquement. Aucun runtime, gameplay, asset ou valeur de règle n'est modifié dans ce lot.

## Matrice Phase 1

| Ligne roadmap | État | Preuve actuelle | Manque restant |
| --- | --- | --- | --- |
| Lancement Survie | PARTIEL | `gens_survival_mode_isolation_v1678104.test.cjs` protège l'isolation et la reprise Survie face à un runtime Dungeon stale | pas de sentinelle navigateur qui traverse le vrai shell Survie |
| Lancement Dungeon | PARTIEL FORT | `dungeon_world_session_bridge_v167832.test.cjs` traverse `startConfiguredGame()` et le handoff authored ; plusieurs tests protègent le runtime | pas de sentinelle navigateur depuis le shell racine jusqu'au lancement Dungeon |
| Fiche héros Dungeon | COUVERT | `gens_v11411_native_ui_browser.test.cjs`, `gens_hero_sheet_art_runtime_v11411.test.cjs`, `gens_hero_sheet_talent_flash_v11411.test.cjs` | aucun manque Phase 1 identifié |
| Save & Quit + reprise | PARTIEL | `gens_v11411_native_ui_browser.test.cjs` vérifie Save & Quit, retour accueil et non-réapparition Dungeon après mutation DOM | aucune vraie recréation/rechargement de session suivie d'un clic Reprendre |
| Mouvement Dungeon | COUVERT | `dungeon_runtime_regression.test.cjs` + sentinelles spatiales/authored | aucun manque Phase 1 identifié |
| Stats canoniques | COUVERT | consolidation/runtime-link/editor semantics + snapshot Tactical | aucun manque Phase 1 identifié |
| Dés D100/D6 | COUVERT | `gens_mobile_combat_performance_v16781022.test.cjs` exécute D6 et D100 et vérifie aussi la délégation Survie ; `gens_rpg_tactical_wall_dice_stats_v16781145.test.cjs` protège le D100 Tactical | aucun manque Phase 1 identifié |
| Calcul de touche | COUVERT | `gens_agility_ranged_hit_attribution_v11411.test.cjs`, `gens_hit_scaling_authority_extract_v11411.test.cjs` | aucun manque Phase 1 identifié |
| Dégâts + armure + résistances | COUVERT | `gens_v11411_final_melee_damage_contract.test.cjs`, `gens_rpg_tactical_damage_v167811411.test.cjs`, sentinelles d'explication | aucun manque Phase 1 identifié |
| Combat Tactical entrée/sortie | COUVERT FORT | Bridge, V113, callsites 4K/4L/4M, Dock, browser Tactical | aucun manque Phase 1 identifié |
| Monster Capture | PARTIEL | `gens_world_summary_v167820.test.cjs` protège seulement les données Capture ; le runtime actif contient exploration, équipe/réserve, combats et capture | aucune sentinelle de lancement/gameplay Capture ; ne pas restaurer/réécrire Capture pendant Phase 1 |
| Duel/PvP | MANQUE CIBLÉ | le shell actuel affiche explicitement `PVP — À VENIR` et « Le moteur PvP n'est pas encore construit » | pas de sentinelle dédiée protégeant ce placeholder ; ne pas inventer un moteur |
| Sauvegarde | COUVERT AU NIVEAU PERSISTANCE, REPRISE PARTIELLE | `dungeon_authored_return_persist_v167862.test.cjs` protège la persistance spatiale ; progression manuelle persiste ; plusieurs runtimes relisent l'état sauvegardé | le round-trip shell complet reste le manque de la ligne Save & Quit + reprise |
| PWA/cache | COUVERT | `gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs` + preview composition/browser | aucun manque Phase 1 identifié |
| Non-interférence 4 modules | PARTIEL | Survival/Dungeon et Tactical/legacy sont fortement isolés ; Capture est filtré dans plusieurs données Dungeon | aucune sentinelle unique couvrant les frontières Survie/Dungeon/Capture/PvP |

## Propriétaires vérifiés

Le shell actuel utilise :
- `openGensFamily(family)` pour afficher la famille ;
- `openGensBuiltInGame(profileId,family)` pour sélectionner le profil/famille ;
- `startConfiguredGame()` comme chemin commun de lancement ;
- `resumeGame()` comme reprise shell générique.

Les futurs tests doivent traverser ces propriétaires réels et ne pas recopier leur logique.

## Plus petit manque suivant

Premier lot test-only retenu : **sentinelle de lancement Survie par le vrai shell**.

Périmètre :
- tests/workflow uniquement ;
- aucun changement runtime ;
- traverser le vrai chemin `openGensFamily('survival') -> openGensBuiltInGame(...,'survival')` puis le chemin de préparation/lancement utile ;
- vérifier que le guard de famille reste Survie et qu'aucun écran/runtime Dungeon ne prend l'autorité ;
- brancher la sentinelle dans `gensrpg-architecture-sentinels.yml`.

Après ce lot : Save & Quit + reprise réelle, PvP placeholder, Capture actuel, puis non-interférence 4 modules, un lot homogène à la fois.

## Signalement hors périmètre conservé

Doute utilisateur : détection des ennemis hors embuscade semble parfois ne pas fonctionner.

Ce point n'est pas corrigé pendant Phase 1. Il devra avoir un lot de caractérisation dédié après les sentinelles.
