// Transported unchanged at build time. Never resolve a moving branch in the browser.
export const COMBAT_LAB_SOURCE_V1 = Object.freeze({
  repository: 'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
  sha: '53890e1383b33f7a0ec5bb2fafed59acf1d7a163',
  ciRun: 41948369881
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
