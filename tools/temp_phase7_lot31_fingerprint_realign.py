from pathlib import Path
import subprocess

OLD_SIZE="8169856"
OLD_BLOB="454b2e12cde591c2db19023d1b76055ebac8e1b1"
NEW_SIZE="8169442"
NEW_BLOB="a37acaabcb3202a8527c2d545f9e2ff4466ea1db"

STRICT=[
  "tests/gens_asset_resolver_final_audit_v1.test.cjs",
  "tests/gens_phase2_inline_global_last_owner_v11411.test.cjs",
  "tests/gens_phase4_dice_next_raccord_preaudit_v1.test.cjs",
  "tests/gens_phase4_inventory_equipment_sets_preaudit_v1.test.cjs",
  "tests/gens_phase4_inventory_equipped_view_slot_refs_contract_v1.test.cjs",
  "tests/gens_phase4_progression_earned_skill_points_preaudit_v1.test.cjs",
  "tests/gens_phase4_progression_earned_skill_points_raccord_preaudit_v1.test.cjs",
  "tests/gens_phase4_progression_earned_skill_points_raccord_v1.test.cjs",
  "tests/gens_phase4_progression_xp_first_raccord_preaudit_v1.test.cjs",
  "tests/gens_phase4_progression_xp_into_level_contract_v1.test.cjs",
  "tests/gens_phase4_progression_xp_into_level_raccord_preaudit_v1.test.cjs",
  "tests/gens_phase4_progression_xp_into_level_raccord_v1.test.cjs",
  "tests/gens_phase4_progression_xp_next_seam_preaudit_v1.test.cjs",
  "tests/gens_phase4_progression_xp_preaudit_v1.test.cjs",
  "tests/gens_phase4_stats_s7_snapshot_audit_v1.test.cjs",
  "tests/gens_phase4_storage_challenge_history_owner_v1.test.cjs",
  "tests/gens_phase4_storage_challenge_library_owner_v1.test.cjs",
  "tests/gens_phase4_storage_dungeon_deck_owner_v1.test.cjs",
  "tests/gens_phase4_storage_dungeon_scene_owner_v1.test.cjs",
  "tests/gens_phase4_storage_economy_rules_owner_v1.test.cjs",
  "tests/gens_phase4_storage_exit_audit_13_v1.test.cjs",
  "tests/gens_phase4_storage_manual_mj_effects_owner_v1.test.cjs",
  "tests/gens_phase4_storage_mj_rules_owner_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_10_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_12_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_3_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_5_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_6_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_8_v1.test.cjs",
  "tests/gens_phase4_storage_next_audit_9_v1.test.cjs",
  "tests/gens_phase5_exit_audit_v1.test.cjs",
  "tests/gens_phase5_gomenu_final_boundary_preaudit_v1.test.cjs",
  "tests/gens_phase5_module_launch_final_shell_authority_v1.test.cjs",
  "tests/gens_phase5_module_launch_raccord_runtime_preaudit_v1.test.cjs",
  "tests/gens_phase5_module_launch_s1_shell_registry_v1.test.cjs",
  "tests/gens_phase5_module_launch_s2_survival_provider_v1.test.cjs",
  "tests/gens_phase5_module_launch_s3_capture_provider_preaudit_v1.test.cjs",
  "tests/gens_phase5_module_launch_s3_capture_provider_v1.test.cjs",
  "tests/gens_phase5_module_launch_s4_dungeon_provider_preaudit_v1.test.cjs",
  "tests/gens_phase5_module_launch_s4_dungeon_provider_v1.test.cjs",
  "tests/gens_phase5_module_screen_return_contract_v1.test.cjs",
  "tests/gens_phase5_module_screen_return_raccord_preaudit_v1.test.cjs",
  "tests/gens_phase5_openchar_authority_preaudit_v1.test.cjs",
  "tests/gens_phase5_startconfiguredgame_core200_global_retirement_preaudit_v1.test.cjs",
  "tests/gens_phase6_exit_audit_v1.test.cjs",
  "tests/gens_phase6_survival_builtin_boundary_retirement_v1.test.cjs",
  "tests/gens_phase6_survival_custom_enemy_dungeon_ensure_retirement_v1.test.cjs",
  "tests/gens_phase6_survival_custom_enemy_refresh_wrapper_retirement_v1.test.cjs",
  "tests/gens_phase6_survival_wave_auto_reserve_v1.test.cjs",
  "tests/gens_phase6_survival_wave_reserve_normalization_v1.test.cjs",
  "tests/gens_phase6_survival_zombicide_base_reserve_v1.test.cjs",
  "tests/gens_phase6_survival_zombicide_base_wave_profile_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_active_hero_resolution_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_active_hero_resolution_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_entry_movement_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_entry_movement_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_exit_edge_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_exit_edge_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_exit_lock_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_exit_lock_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_active_hero_delegation_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_active_hero_delegation_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_lock_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_lock_delegation_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_real_exit_divergence_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_terminal_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_final_exit_terminal_delegation_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_move_allowance_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_move_allowance_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_real_exit_index_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_real_exit_index_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_terminal_exit_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_authored_terminal_exit_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_boss_policy_post_authority_sweep_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_branch_chance_gate_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_branch_descriptor_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_branch_descriptor_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_branch_plan_characterization_v1.test.cjs",
  "tests/gens_phase7_dungeon_generated_room_create_restore_characterization_v1.test.cjs"
]
HISTORICAL=[
  "tests/gens_phase5_module_launch_final_shell_authority_preaudit_v1.test.cjs",
  "tests/gens_phase5_startconfiguredgame_core200_global_retirement_v1.test.cjs"
]
METADATA=[
  "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json",
  "docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv",
  "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
  "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json"
]

changed=[]

for name in STRICT:
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if OLD_SIZE not in text and OLD_BLOB not in text:
        raise SystemExit(f"missing stale current-runtime fingerprint in {name}")
    text=text.replace(OLD_SIZE,NEW_SIZE).replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

old_pair=f"[{OLD_SIZE},'{OLD_BLOB}']"
new_pair=f"[{NEW_SIZE},'{NEW_BLOB}']"
for name in HISTORICAL:
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if old_pair not in text:
        raise SystemExit(f"historical old pair missing in {name}")
    if new_pair not in text:
        text=text.replace(old_pair,old_pair+",\n  "+new_pair,1)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

for name in METADATA:
    p=Path(name)
    text=p.read_text(encoding="utf-8")
    if OLD_BLOB not in text:
        raise SystemExit(f"metadata sourceIndexBlob missing in {name}")
    text=text.replace(OLD_BLOB,NEW_BLOB)
    p.write_text(text,encoding="utf-8")
    changed.append(name)

actual=sorted(subprocess.check_output(["git","diff","--name-only"],text=True).splitlines())
expected=sorted(set(changed))
if actual!=expected:
    raise SystemExit("bounded realignment diff mismatch\nactual="+repr(actual)+"\nexpected="+repr(expected))

# New runtime exact fingerprint must be present in every strict guard.
for name in STRICT:
    text=Path(name).read_text(encoding="utf-8")
    if NEW_BLOB not in text and NEW_SIZE not in text:
        raise SystemExit(f"new fingerprint missing after realignment in {name}")

print(f"Lot31 fingerprint realignment prepared: {len(expected)} files")
