# GenSrpG V2 — Rebuild plan

This branch is isolated from the stable application on `main`.

## Non-negotiable rules

1. The current GenSrpG remains the functional reference until V2 reaches parity.
2. V2 must not import or mutate gameplay runtime state from the legacy app.
3. Top-level gameplay engines are isolated: `survival`, `rpg`, `pvp`. **Monster Capture is an optional RPG content/gameplay module**, not a fourth Core-level engine.
4. Shared Core contains only neutral services: storage, profiles, assets, audio, settings, import/export, help/UI primitives.
5. RPG gameplay concepts must be data-driven. No hard-coded dependency on stat names such as Force, Furtivité, Mana, Feu, etc.
6. Any relationship between entities must be selected through UI controls (dropdown/search picker), never by requiring the user to type technical IDs.
7. Important editor sections expose a contextual `?` help entry explaining purpose, impact, examples and dependencies.
8. Mobile-first, clear hierarchy, advanced options collapsible.
9. Combat rules and UI animations are separated. A visual animation may fail without blocking the authoritative game state.
10. Existing behavior/assets/saves are inventoried before migration and covered by parity tests.
11. Optional RPG modules must be lazy-loaded or activated on demand. They must never execute expensive bootstrap/seed work on the global home screen.

## Target structure

```text
v2/
  index.html
  src/
    core/
    modes/
      survival/
      rpg/
        modules/
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

RPG can activate optional content/gameplay modules. These modules reuse the generic RPG foundations where appropriate, while keeping their specialized state and rules isolated.

### Monster Capture — RPG module
Monster Capture is **not** a separate Core-level mode in V2. It is an optional RPG module/family that can be enabled for a world/profile.

It reuses the generic RPG foundations when they fit: configurable stats/resources, effects, skills, items, progression, audio, assets, storage and generic combat primitives. It adds Capture-specific contracts only where needed:
- creature species/forms/evolutions;
- active creature team and reserve/storage;
- capture chance and capture items;
- creature encounters and biome appearance tables;
- trainers;
- creature-specific battle rules, including the future optional dynamic/tactical variant;
- creature charges/costs, elemental/type affinities and Capture-specific progression rules.

Capture data must stay namespaced from ordinary Dungeon hero/monster state so enabling the module never mutates a normal RPG world unexpectedly.

Historical Capture bootstrap is **not** copied. The old app automatically executed `ensureBuiltinMonsterCapture162()` during startup; later diagnostics disabled this automatic seed because it contributed to the home freeze. V2 therefore initializes/seeds Capture only when the module is explicitly enabled or opened.

### PVP
Reserved as a separate future mode. It may reuse neutral Core services and generic battle contracts, but remains isolated from mutable RPG/Capture state.

## RPG data-driven principle

The engine receives IDs and definitions, not semantic names. Examples:

```js
{
  statId: "user_defined_stat",
  operation: "add",
  value: 3,
  duration: 4
}
```

The same generic effect engine will power skills, equipment, traps, events, items and temporary statuses, including compatible Monster Capture content.

## Hero forms

RPG heroes support:
- permanent evolution;
- temporary transformation;
- configurable conditions: level, XP, resource threshold, stat threshold, quest, item, event;
- configurable art/name/stat/resource/skill changes;
- configurable cost, duration and return condition.

Creature evolution remains a Capture-module concept even if it can reuse generic transformation/effect primitives internally.

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
