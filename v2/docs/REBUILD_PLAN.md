# GenSrpG V2 — Rebuild plan

This branch is isolated from the stable application on `main`.

## Non-negotiable rules

1. The current GenSrpG remains the functional reference until V2 reaches parity.
2. V2 must not import or mutate gameplay runtime state from the legacy app.
3. Gameplay modes are isolated: `survival`, `rpg`, `capture`, `pvp`.
4. **Monster Capture is a fully separate mode**, with its own gameplay state, data namespaces and persistence boundaries. It must never reuse mutable RPG/Dungeon state directly.
5. Shared Core contains only neutral services: storage abstractions, assets, audio primitives, settings, import/export helpers and help/UI primitives. Shared services must not imply shared gameplay data.
6. RPG gameplay concepts must be data-driven. No hard-coded dependency on stat names such as Force, Furtivité, Mana, Feu, etc.
7. Any relationship between entities must be selected through UI controls (dropdown/search picker), never by requiring the user to type technical IDs.
8. Important editor sections expose a contextual `?` help entry explaining purpose, impact, examples and dependencies.
9. Mobile-first, clear hierarchy, advanced options collapsible.
10. Combat rules and UI animations are separated. A visual animation may fail without blocking the authoritative game state.
11. Existing behavior/assets/saves are inventoried before migration and covered by parity tests.
12. Optional/heavy mode content must be lazy-loaded or activated on demand. Monster Capture must never execute expensive bootstrap/seed work on the global home screen.

## Target structure

```text
v2/
  index.html
  src/
    core/
    modes/
      survival/
      rpg/
      capture/
      pvp/
    ui/
  assets/
  tests/
  docs/
```

## Mode boundaries

### Survival
Preserve current feature set and behavior as closely as possible while removing legacy naming and technical coupling.

### RPG
Dice-based RPG. Fully configurable stats/resources/effects, digital dungeon and physical-table assistant, World Builder, room creator, movement, combat, events, traps, puzzles, merchants, inventory, sets, progression, quests, NPC/companions and hero evolution/transformation.

### Monster Capture
Monster Capture is a **separate mode**, not an RPG submodule.

The separation is deliberate because the legacy architecture mixed shared entities, profile data and bootstrap logic in ways that could overwrite or contaminate other gameplay families. V2 must prevent that class of bug structurally.

Capture keeps its own:
- profile/world data namespace;
- creature species/forms/evolutions;
- active creature team and reserve/storage;
- capture chance and capture items;
- creature encounters and biome appearance tables;
- trainers;
- creature battle rules, including future optional dynamic/tactical combat;
- creature charges/costs, elemental/type affinities and progression rules;
- save/load lifecycle and migrations.

Capture may reuse only **neutral Core services** (for example generic storage adapters, audio playback primitives or asset loading), never RPG/Dungeon mutable state or data collections.

Historical Capture bootstrap is **not** copied. The old app automatically executed `ensureBuiltinMonsterCapture162()` during startup; later diagnostics disabled this automatic seed because it contributed to the home freeze. V2 therefore initializes/seeds Capture only when the Capture mode is explicitly opened or initialized.

### PVP / VS
Reserved as a separate future mode. It may reuse neutral Core services, but remains isolated from mutable Survival, RPG and Capture state.

## RPG data-driven principle

The RPG engine receives IDs and definitions, not semantic names. Examples:

```js
{
  statId: "user_defined_stat",
  operation: "add",
  value: 3,
  duration: 4
}
```

The same generic RPG effect engine can power RPG skills, equipment, traps, events, items and temporary statuses. This does **not** make it the authoritative engine for Monster Capture unless a future explicit adapter is designed and proven safe.

## Hero forms

RPG heroes support:
- permanent evolution;
- temporary transformation;
- configurable conditions: level, XP, resource threshold, stat threshold, quest, item, event;
- configurable art/name/stat/resource/skill changes;
- configurable cost, duration and return condition.

Creature evolution remains a Capture-only concept and must not share mutable hero-form state.

## Contextual help

Every major editor group should expose a `?` action. Help content must include:
- what the setting does;
- what it changes in play;
- valid values / dependencies;
- one concrete example;
- warning when changing it may invalidate existing content.

## Migration workflow

For every feature:

`legacy behavior -> legacy data/assets -> V2 contract -> V2 implementation -> parity test -> UX improvement`

No legacy feature is considered dropped merely because it was difficult to find in `index.html`.
