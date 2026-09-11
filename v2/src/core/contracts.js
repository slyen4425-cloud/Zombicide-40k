export const SCHEMA_VERSION = 1;

export function createStatDefinition(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Nouvelle statistique',
    icon: '📊',
    enabled: true,
    visible: true,
    baseValue: 0,
    min: 0,
    max: null,
    upgrade: {
      enabled: true,
      costResourceId: null,
      costPerPoint: 1,
    },
    help: '',
    ...overrides,
  };
}

export function createResourceDefinition(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Nouvelle ressource',
    icon: '◆',
    enabled: true,
    visible: true,
    min: 0,
    maxFormula: { kind: 'fixed', value: 10, statId: null, multiplier: 1, bonus: 0 },
    recovery: [],
    help: '',
    ...overrides,
  };
}

export function createConditionDefinition(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    sourceKind: 'stat',
    sourceId: null,
    operator: 'gte',
    value: 0,
    invert: false,
    label: '',
    ...overrides,
  };
}

export function createEffectDefinition(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    kind: 'stat-modifier',
    target: 'self',
    statId: null,
    resourceId: null,
    operation: 'add',
    value: 0,
    valueMode: 'fixed',
    duration: 0,
    durationMode: 'turns',
    timing: 'immediate',
    chance: 100,
    stackable: false,
    maxStacks: 1,
    conditions: [],
    conditionMode: 'all',
    icon: '',
    soundId: null,
    label: '',
    ...overrides,
  };
}

export function createHeroForm(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Nouvelle forme',
    type: 'temporary',
    artAssetId: null,
    conditions: [],
    conditionMode: 'all',
    activationCosts: [],
    duration: null,
    returnConditions: [],
    effects: [],
    addedSkillIds: [],
    removedSkillIds: [],
    ...overrides,
  };
}

export function createContextualHelp(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: 'Aide',
    summary: '',
    details: '',
    example: '',
    warning: '',
    dependencies: [],
    ...overrides,
  };
}
