// Transported unchanged at build time. Never resolve a moving branch in the browser.
export const COMBAT_LAB_SOURCE_V1 = Object.freeze({
  repository: 'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
  sha: '65e21792ff74aea9862e528c8dbfdb22797b6693',
  ciRun: 40477906275
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
