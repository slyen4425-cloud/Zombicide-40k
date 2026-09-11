# GenSrpG V2 — Rebuild plan

This branch is isolated from the stable application on `main`.

## Non-negotiable rules

1. The current GenSrpG remains the functional reference until V2 reaches parity.
2. V2 must not import or mutate gameplay runtime state from the legacy app.
3. Modes are isolated: `survival`, `rpg`, `capture`, `pvp`.
4. Shared Core contains only neutral services: storage, profiles, assets, audio, settings, import/export, help/UI primitives.
5. RPG gameplay concepts must be data-driven. No hard-coded dependency on stat names such as Force, Furtivité, Mana, Feu, etc.
6. Any relationship between entities must be selected through UI controls (dropdown/search picker), never by requiring the user to type technical IDs.
7. Important editor sections expose a contextual `?` help entry explaining purpose, impact, examples and dependencies.
8. Mobile-first, clear hierarchy, advanced options collapsible.
9. Combat rules and UI animations are separated. A visual animation may fail without blocking the authoritative game state.
10. Existing behavior/assets/saves are inventoried before migration and covered by parity tests.

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

### Capture
Kept separate for now. Historical implementation must be recovered before rewrite. Native type/element mechanics remain Capture-specific. Future combat can be dynamic.

### PVP
Reserved as a separate future mode.

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

The same generic effect engine will power skills, equipment, traps, events, items and temporary statuses.

## Hero forms

RPG heroes support:
- permanent evolution;
- temporary transformation;
- configurable conditions: level, XP, resource threshold, stat threshold, quest, item, event;
- configurable art/name/stat/resource/skill changes;
- configurable cost, duration and return condition.

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