// Transported unchanged at build time. Never resolve a moving branch in the browser.
export const COMBAT_LAB_SOURCE_V1 = Object.freeze({
  repository: 'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
  sha: '92e2f75ff6e9b3e03d460115d53b5604adf0e718',
  ciRun: 40822055142
});

export async function loadCombatLabEngineV1(baseUrl) {
  const base = new URL(baseUrl);
  if (!base.pathname.endsWith('/')) throw new TypeError('Combat module base must end with /');
  const paths = [
    'src/core/combat/combat-session.js',
    'src/core/combat/combat-runtime.js',
    'src/core/combat/roster-session.js',
    'src/core/combat/battle-actor-ai-controller.js',
    'src/adapters/input/capture/capture-export-adapter-stack-v1.js'
  ];
  const modules = await Promise.all(paths.map(path => import(new URL(path, base).href)));
  return Object.freeze(Object.assign({source: COMBAT_LAB_SOURCE_V1}, ...modules));
}
