# Phase 9 — Clôture du transfert de l'entrée Dungeon hors Capture

## Base, périmètre et propriétaire

Branche : `work/gensrpg-phase9-capture-dungeon-setup-entry-owner-transfer-2026-10-05`.
Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-dungeon-setup-entry-owner-transfer-2026-10-05`.
Base GREEN : `a8c9aa9934276c38fc4ca2755e65cee7116ada4e`.
Périmètre déclaré à `0975ced6a92ef6d90eb59bf77004f97cd86f9b96`, avant tests et code runtime.
Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Le pré-audit montrait trois propriétaires successifs de la même entrée : native, Capture137, V151.
Le propriétaire final est l'entrée native Shell/pré-game `openSessionDungeonSetup()`.
Le lot transfère la garde complète V151 et retire exactement ses deux wrappers Capture137/V151.
Les helpers `gensMode151()`, `gensCapturePregameMode()`, `isDungeonMode()`, l'identité publique Capture et toutes les autres responsabilités 137/151 sont protégés sans changement.

## Diff runtime exact

| État | Octets | Blob Git |
| --- | ---: | --- |
| ZIP utilisateur / base GREEN | 8166377 | `37056722bb0a27f96e26b3ef3b05e9543dc5a223` |
| Runtime appliqué | 8165906 | `1e3398755beb751786d825047bc60fe1a7179d79` |

SHA-256 final : `0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d`.
Commit runtime : [`284b4c76f333780b68c069fe0b18e610467f044a`](https://github.com/slyen4425-cloud/Zombicide-40k/commit/284b4c76f333780b68c069fe0b18e610467f044a).
Delta : -471 octets ; trois fragments seulement :
1. ajouter dans la fonction native le prédicat `try{const p=getActiveGameProfile?.();if(window.GensCaptureV1?.isProfile?.(p)||p?.gameStyle!=="dungeon")return;}catch(e){return;}` ;
2. retirer le wrapper Capture137 et son commentaire ;
3. retirer le wrapper V151 de cette entrée et son commentaire.

La garde native `if(!isDungeonMode())return;` et le corps hide -> affichage -> bibliothèque -> scroll restent identiques.
Le test dédié inverse ces trois fragments et retrouve le blob de départ byte pour byte : aucun autre changement runtime.
Une déclaration native ; zéro affectation inline `window.openSessionDungeonSetup=`.
Aucun nouveau helper, wrapper, timer, retry, observer, règle, migration ou asset.

## RED avant mutation

Le test `tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs` compare l'entrée native à la chaîne historique réelle sauvegardée dans `tests/fixtures/phase9_dungeon_setup_entry_before_transfer_v1.json`.
La fixture ne s'exécute que dans le test, jamais dans le runtime.
SHA-256 immuable : `3d925e4f3760819642b1f48d2ab2d0aba66dbd5c45d6595d0d4d4b1e3d22e7b2`.

RED local avant mutation : assertion `native owner must preserve the complete V151 entry predicate`.
RED GitHub : HEAD `54843ead4af50c5d0766f04624b922f749fdbe3a`, [run 37362473505](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37362473505), job `111940130819`, étape #270 en échec attendu.
Le log vérifié montre notamment les divergences Capture historique et identifiant Dungeon sans style.
RED confirmé sur le HEAD de transport `a0ad35074bcb7023911ad2168f9fbd5be9e48fcf`, [run 37363506670](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37363506670).

## GREEN et vrai parcours

Le test utilise l'API publique Capture et les helpers extraits du runtime réel, puis compare les effets de l'entrée native à la chaîne historique exacte sur 18 cas :
- les dix cas du pré-audit : Capture actuelle, Capture historique, identité par modules, Dungeon builtin valide, identifiant Dungeon sans style, Dungeon custom, Survie avec mauvais style, Survie, autre profil, profil absent ;
- priorité Capture sur identifiant Dungeon, identité creature seule, flags Capture partiels, erreur de profil, erreur d'identité, API optionnelle absente, erreur de stockage et élément UI absent.

Refus : aucun affichage, rendu, scroll ni écriture de stockage. Entrée valide : hide/render/scroll une fois ; retour `undefined` et profil inchangés.
La caractérisation antérieure conserve les dix résultats de production sur le propriétaire natif.

La preuve UI renforce le test existant `tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs` :
Shell -> vrai profil Dungeon -> nouveau jeu -> clic réel `sessionDungeonSetupBtn` -> page et cartes de bibliothèque visibles -> clic réel de retour -> pré-game -> héros -> provider -> Save & Quit -> rechargement/reprise.
Aucun handler ou retour de succès runtime n'est injecté dans cette preuve.

La suite navigateur conserve les appels réels refusés depuis Capture sans/avec style historique, le pré-game Capture, sa reprise persistée, victoire/reprise, Dungeon après Survie et les quatre modules.

## Exécution et CI

Application ponctuelle [37363506750](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37363506750) : première tentative annulée avant exécution, sans runner attribué ; relance ciblée ; tentative 2 / job `111948888218` SUCCESS.
Le workflow vérifie main et la base, exécute RED/GREEN, applique les trois fragments et les adaptations bornées, se supprime, commit puis déclenche la triple CI.
Les deux fichiers temporaires n'existent plus dans l'arbre appliqué et n'apparaissent pas dans le diff final.
109 fichiers non supprimés du commit runtime ont été comparés par blob Git à la préparation locale : correspondance exacte.
16 tests locaux Phase 9 et trois contrôles d'inventaire : GREEN.

État historique des contrôles au HEAD fonctionnel `e5eef857b1acad9b05d02088a89cb1cc483bf9b5`, relevé le `2026-10-05T20:42:08.237Z` avant le commit documentaire :

| Contrôle | Run | Résultat |
| --- | --- | --- |
| Architecture + Browser | [37365705449](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37365705449) | SUCCESS ; 335 + 48 étapes |
| Firefox Wall/Zoom | [37365705466](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37365705466) | SUCCESS |
| Tactical Dock | [37365705439](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37365705439) | Tentative 4 en attente de runner ; trois annulations sans étape exécutée |

Firefox et Tactical ont nécessité une relance ciblée après annulation sans étape exécutée ; aucun échec de code n'a été constaté dans ces tentatives annulées.
Cette clôture modifie uniquement deux documents et déclenche la triple CI complète sur son propre HEAD. Le runtime et tous les tests y sont identiques au HEAD fonctionnel ci-dessus : la suite complète reconfirme aussi les preuves fonctionnelles.
L'acceptation définitive repose sur SUCCESS d'Architecture + Browser, Firefox et Tactical Dock au SHA exact pointé par le checkpoint final. Ce checkpoint n'est publié qu'après ces trois succès ; ses checks GitHub sont la référence de validation finale, et les liens des runs finaux sont fournis dans le compte rendu du lot.
Cette règle permet d'avancer la documentation pendant les annulations de runner sans déclarer à tort la tentative Tactical précédente verte.
Checkpoint : `checkpoint/gensrpg-phase9-capture-dungeon-setup-entry-owner-transfer-green-2026-10-05`, à résoudre dans GitHub sur le HEAD documentaire exact validé.
Aucun merge vers main ou lab.

## Justification des attentes structurelles remplacées

Le comportement reste identique ; la propriété de la garde change volontairement.

| Test | Attente obsolète et protection actuelle |
| --- | --- |
| `tests/gens_phase9_capture_dungeon_setup_entry_ownership_characterization_v1.test.cjs` | Présence des deux wrappers / absence de garde native remplacées par mêmes dix résultats sur native ; référence historique complète conservée dans le nouveau test. |
| `tests/gens_phase9_capture_dungeon_button_owner_transfer_v1.test.cjs` | Wrappers protégés provisoirement dans le lot précédent remplacés par garde native et absence des wrappers retirés ; bouton inchangé. |
| `tests/gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs` | Même transfert d'attente de propriété ; assertions Capture139 et pré-game conservées. |
| `tests/gens_phase2_inline_global_last_owner_v11411.test.cjs` | Deux affectations supprimées : 430 globals / 744 affectations / 115 multi-propriétaires ; 119 blocs actifs inchangés. |
| `tests/gens_phase2_layered_responsibilities_v11411.test.cjs` | Une ligne d'affectations explicites retirée ; déclaration native conservée et protégée séparément. |

102 tests existants reçoivent le nouveau blob/taille, dont quatre des cinq tests ci-dessus.
98 de ces tests changent uniquement d'empreinte. Aucun invariant métier, parcours navigateur ou sauvegarde n'est assoupli.
Les cinq cartographies suivent le nouveau `sourceIndexBlob` ; la table retire exactement deux affectations et le manifeste retire uniquement l'ownership de cette entrée dans les descriptions 137/151. Les autres frontières demeurent.

## Inventaire exhaustif du diff net

115 fichiers : 1 runtime, 1 workflow, 7 documents/cartographies, 106 fichiers de tests (105 CJS + 1 fixture).

Runtime et workflow :
- `index.html` : transfert natif et retrait des deux wrappers ;
- `.github/workflows/gensrpg-architecture-sentinels.yml` : +3 lignes pour exiger le RED/GREEN dédié.

Documents et cartographies :
- `docs/GENSRPG_CURRENT_WORK.md` : point de reprise du lot ;
- `docs/GENSRPG_PHASE9_CAPTURE_DUNGEON_SETUP_ENTRY_OWNER_TRANSFER.md` : ce rapport ;
- `docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv`
- `docs/GENSRPG_PHASE2_INLINE_OWNERS.json`
- `docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json`
- `docs/GENSRPG_PHASE2_STORAGE_OWNERS.json`
- `docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json`

Tests structurels justifiés :
- `tests/gens_phase9_capture_dungeon_setup_entry_ownership_characterization_v1.test.cjs`
- `tests/gens_phase9_capture_dungeon_button_owner_transfer_v1.test.cjs`
- `tests/gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs`
- `tests/gens_phase2_inline_global_last_owner_v11411.test.cjs`
- `tests/gens_phase2_layered_responsibilities_v11411.test.cjs`

Test dédié, fixture et navigateur renforcé :
- `tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs`
- `tests/fixtures/phase9_dungeon_setup_entry_before_transfer_v1.json`
- `tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs`

98 mises à jour d'empreinte seules :
- `tests/gens_asset_resolver_final_audit_v1.test.cjs`
- `tests/gens_phase4_dice_next_raccord_preaudit_v1.test.cjs`
- `tests/gens_phase4_inventory_equipment_sets_preaudit_v1.test.cjs`
- `tests/gens_phase4_inventory_equipped_view_slot_refs_contract_v1.test.cjs`
- `tests/gens_phase4_progression_earned_skill_points_preaudit_v1.test.cjs`
- `tests/gens_phase4_progression_earned_skill_points_raccord_preaudit_v1.test.cjs`
- `tests/gens_phase4_progression_earned_skill_points_raccord_v1.test.cjs`
- `tests/gens_phase4_progression_xp_first_raccord_preaudit_v1.test.cjs`
- `tests/gens_phase4_progression_xp_into_level_contract_v1.test.cjs`
- `tests/gens_phase4_progression_xp_into_level_raccord_preaudit_v1.test.cjs`
- `tests/gens_phase4_progression_xp_into_level_raccord_v1.test.cjs`
- `tests/gens_phase4_progression_xp_next_seam_preaudit_v1.test.cjs`
- `tests/gens_phase4_progression_xp_preaudit_v1.test.cjs`
- `tests/gens_phase4_stats_s7_snapshot_audit_v1.test.cjs`
- `tests/gens_phase4_storage_challenge_history_owner_v1.test.cjs`
- `tests/gens_phase4_storage_challenge_library_owner_v1.test.cjs`
- `tests/gens_phase4_storage_dungeon_deck_owner_v1.test.cjs`
- `tests/gens_phase4_storage_dungeon_scene_owner_v1.test.cjs`
- `tests/gens_phase4_storage_economy_rules_owner_v1.test.cjs`
- `tests/gens_phase4_storage_exit_audit_13_v1.test.cjs`
- `tests/gens_phase4_storage_manual_mj_effects_owner_v1.test.cjs`
- `tests/gens_phase4_storage_mj_rules_owner_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_10_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_12_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_3_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_5_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_6_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_8_v1.test.cjs`
- `tests/gens_phase4_storage_next_audit_9_v1.test.cjs`
- `tests/gens_phase5_exit_audit_v1.test.cjs`
- `tests/gens_phase5_gomenu_final_boundary_preaudit_v1.test.cjs`
- `tests/gens_phase5_module_launch_final_shell_authority_preaudit_v1.test.cjs`
- `tests/gens_phase5_module_launch_final_shell_authority_v1.test.cjs`
- `tests/gens_phase5_module_launch_raccord_runtime_preaudit_v1.test.cjs`
- `tests/gens_phase5_module_launch_s1_shell_registry_v1.test.cjs`
- `tests/gens_phase5_module_launch_s2_survival_provider_v1.test.cjs`
- `tests/gens_phase5_module_launch_s3_capture_provider_preaudit_v1.test.cjs`
- `tests/gens_phase5_module_launch_s3_capture_provider_v1.test.cjs`
- `tests/gens_phase5_module_launch_s4_dungeon_provider_preaudit_v1.test.cjs`
- `tests/gens_phase5_module_launch_s4_dungeon_provider_v1.test.cjs`
- `tests/gens_phase5_module_screen_return_contract_v1.test.cjs`
- `tests/gens_phase5_module_screen_return_raccord_preaudit_v1.test.cjs`
- `tests/gens_phase5_openchar_authority_preaudit_v1.test.cjs`
- `tests/gens_phase5_startconfiguredgame_core200_global_retirement_preaudit_v1.test.cjs`
- `tests/gens_phase5_startconfiguredgame_core200_global_retirement_v1.test.cjs`
- `tests/gens_phase6_exit_audit_v1.test.cjs`
- `tests/gens_phase6_survival_builtin_boundary_retirement_v1.test.cjs`
- `tests/gens_phase6_survival_custom_enemy_dungeon_ensure_retirement_v1.test.cjs`
- `tests/gens_phase6_survival_custom_enemy_refresh_wrapper_retirement_v1.test.cjs`
- `tests/gens_phase6_survival_wave_auto_reserve_v1.test.cjs`
- `tests/gens_phase6_survival_wave_reserve_normalization_v1.test.cjs`
- `tests/gens_phase6_survival_zombicide_base_reserve_v1.test.cjs`
- `tests/gens_phase6_survival_zombicide_base_wave_profile_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_active_hero_resolution_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_active_hero_resolution_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_entry_movement_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_entry_movement_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_exit_edge_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_exit_edge_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_exit_lock_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_exit_lock_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_active_hero_delegation_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_active_hero_delegation_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_lock_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_lock_delegation_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_real_exit_divergence_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_terminal_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_final_exit_terminal_delegation_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_move_allowance_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_move_allowance_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_real_exit_index_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_real_exit_index_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_terminal_exit_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_authored_terminal_exit_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_branch_chance_gate_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_branch_descriptor_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_branch_descriptor_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_branch_plan_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_noncombat_room_result_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_create_restore_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_enemy_branch_normalization_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_enemy_branch_normalization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_map_boundary_characterization_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_map_boundary_v1.test.cjs`
- `tests/gens_phase7_dungeon_generated_room_materialization_characterization_v1.test.cjs`
- `tests/gens_phase7_exit_audit_v1.test.cjs`
- `tests/gens_phase8_exit_audit_v1.test.cjs`
- `tests/gens_phase9_capture139_active_enemies_retirement_v1.test.cjs`
- `tests/gens_phase9_capture139_base_profile_retirement_v1.test.cjs`
- `tests/gens_phase9_capture139_session_dependency_preaudit_v1.test.cjs`
- `tests/gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs`
- `tests/gens_phase9_capture_identity_ownership_preaudit_v1.test.cjs`
- `tests/gens_phase9_capture_participant_identity_preaudit_v1.test.cjs`
- `tests/gens_phase9_capture_participant_identity_raccord_v1.test.cjs`
- `tests/gens_phase9_capture_public_entry_ownership_preaudit_v1.test.cjs`
- `tests/gens_phase9_capture_seed_dungeon_style_retirement_v1.test.cjs`

## Test manuel et suite

[Prévisualisation figée](https://raw.githack.com/slyen4425-cloud/Zombicide-40k/e5eef857b1acad9b05d02088a89cb1cc483bf9b5/preview.html) : Dungeon -> nouveau jeu -> Aventure Dungeon -> bibliothèque -> retour pré-game ; puis Capture -> nouveau jeu -> pré-game Capture.
Le runtime de cette prévisualisation est le même que celui du HEAD documentaire final.
La vérification automatisée du clic réel est GREEN ; le lien fournit le contrôle manuel ciblé.

Le lot est limité à cette entrée. La Phase 9 reste ouverte.
Prochaine étape : pré-audit séparé du prochain couplage résiduel Capture/Dungeon, avec un nouveau checkpoint de départ avant toute modification.
