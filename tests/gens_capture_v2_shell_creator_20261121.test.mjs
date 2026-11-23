import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 normalizeCaptureShellCreatorSettingsV1,
 captureShellCreatorSettingsKeyV1,
 validateCaptureShellMediaV1,CAPTURE_SHELL_MEDIA_SLOTS_V1
} from '../assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs';
import {
 captureArtUniverseIdV1,LEGACY_CAPTURE_ART_UNIVERSE_ID_V1,
 CAPTURE_LOADING_SCENES_V1
} from '../assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs';
const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const read=n=>readFileSync(new URL(n,root),'utf8');

test('Creator is a real fourth top-level Capture menu and never owns the game iframe',()=>{
 const shell=read('shell-entry-v1.js'),css=read('shell-style-v1.css');
 assert.match(shell,/creator\.textContent="Créateur"/);
 assert.match(shell,/nav\.append\(play,editing,creator,change\)/);
 assert.match(shell,/function showCreator\(\)/);
 assert.match(shell,/createCaptureShellCreatorV1/);
 assert.match(shell,/host\.dataset\.menu='creator'/);
 assert.match(css,/data-menu="creator"/);
 assert.match(css,/gensCaptureV2CreatorPanel/);
 assert.doesNotMatch(shell,/creator:\{label:.*family:"combat"/);
 assert.doesNotMatch(shell,/new Audio\(/);
});
test('universe-scoped settings reject unsupported fields and unsafe values',()=>{
 const defaults=normalizeCaptureShellCreatorSettingsV1({});
 assert.equal(defaults.menuVolume,35);
 assert.equal(defaults.interfaceVolume,55);
 assert.equal(defaults.ambienceEnabled,false,'no unexpected autoplay in new worlds');
 assert.equal(defaults.backgroundShade,55);
 assert.ok(Object.isFrozen(defaults));
 const id='unv_12345678-aaaa';
 assert.notEqual(captureShellCreatorSettingsKeyV1(id),
  captureShellCreatorSettingsKeyV1('monster-invoc'));
 assert.equal(captureArtUniverseIdV1(),LEGACY_CAPTURE_ART_UNIVERSE_ID_V1);
 assert.throws(()=>captureArtUniverseIdV1('../other'),/Univers/);
 assert.throws(()=>normalizeCaptureShellCreatorSettingsV1({
  menuVolume:130}),/Volume/);
 assert.throws(()=>normalizeCaptureShellCreatorSettingsV1({
  combatMusic:'secret'}),/invalides/);
});
test('interface media imports are local, bounded and separate from the in-game soundtrack',()=>{
 assert.deepEqual(CAPTURE_SHELL_MEDIA_SLOTS_V1,
  ['background','ambience','click','confirm','back','error']);
 assert.equal(validateCaptureShellMediaV1('background',{
  type:'image/png',size:5000,name:'mon-fond.png'}),true);
 assert.equal(validateCaptureShellMediaV1('click',{
  type:'audio/mpeg',size:333,name:'clic.mp3'}),true);
 assert.throws(()=>validateCaptureShellMediaV1('background',{
  type:'audio/mpeg',size:5000}),/Fond/);
 assert.throws(()=>validateCaptureShellMediaV1('ambience',{
  type:'audio/mpeg',size:22*1024*1024}),/Son/);
 assert.throws(()=>validateCaptureShellMediaV1('combat',{
  type:'audio/mpeg',size:4}),/média/i);
 const owner=read('shell-creator-presentation-v1.mjs');
 assert.match(owner,/createAdventureLoadingArtLibraryV1/);
 assert.match(owner,/universeId:universe/);
 assert.match(owner,/root\.localStorage/);
 assert.match(owner,/indexedDB\.open\(DB,1\)/);
 assert.match(owner,/leaveHome\(\)/);
 assert.match(owner,/stopAmbient\(\)/);
 assert.doesNotMatch(owner,/\bimport\s*\{[^}]*?(?:AdventureRules|CombatResult|createAdventureSessionV1)/);
});
test('loading art uses the canonical three-scene library scoped to each universe',()=>{
 const library=read('adventure-loading-art-v1.mjs');
 const game=read('adventure-app-v1.mjs'),shell=read('shell-entry-v1.js');
 assert.deepEqual(CAPTURE_LOADING_SCENES_V1,['launch','zone','combat']);
 assert.match(library,/r\.universeId\?\?LEGACY_CAPTURE_ART_UNIVERSE_ID_V1/);
 assert.match(library,/universeId:universe/);
 assert.match(library,/MAX_PER_SCENE=12/);
 assert.match(game,/universeId:selectedUniverseId\?\?'monster-invoc'/);
 assert.match(shell,/universeId:selectedUniverse\?\.id\?\?'monster-invoc'/);
 assert.match(shell,/mountCaptureLoadingArtCrossfadeV1/);
 assert.doesNotMatch(library,/localStorage/);
});

test('Creator alone configures all loading art while preserving legacy scene-tagged images',()=>{
 const shell=read('shell-creator-presentation-v1.mjs');
 const game=read('adventure-app-v1.mjs');
 const html=read('adventure.html');
 assert.match(shell,/const images=await loading\.list\(\)/);
 assert.match(shell,/await loading\.add\('launch',artInput\.files\)/);
 assert.match(shell,/loading\?\.close\(\);loading=null/);
 // The official gallery must remain available even if IndexedDB fails.
 assert.match(game,/const entries=library\?\(await library\.list\(\)\)\.slice\(0,12\):\[\]/);
 assert.doesNotMatch(html,/id="adventure-loading-art-files"/);
 assert.doesNotMatch(game,/refreshLoadingArtEditor/);
});

test('official audio chooser resolves immutable existing Combat/Exploration files, never copies them',async()=>{
 const {createCaptureShellOfficialAudioChoicesV1}=
  await import('../assets/gensrpg/capture-v2/shell-official-audio-catalog-v1.mjs');
 const moduleUrl=new URL('../assets/gensrpg/capture-v2/shell-official-audio-catalog-v1.mjs',import.meta.url);
 const combat=new URL('../../../vendor/exploration-lab/combat-preview/',moduleUrl);
 const exploration=new URL('../../../vendor/exploration-lab/',moduleUrl);
 const sfx='gensrpg:sound:divers_mp3-a1ca84e9';
 const song='gensrpg:music:combat:battle-01';
 const sounds=[{assetId:sfx,label:'Clic interface',runtimeFile:'private-v1/divers_mp3-a1ca84e9.mp3',roles:['ui']}];
 const resolveEffect=assetId=>({assetId,url:new URL('assets/runtime/audio/private-v1/divers_mp3-a1ca84e9.mp3',combat).href});
 const resolveMusic=assetId=>({assetId,url:new URL('assets/runtime/audio/music-v1/battle-01-cb4ed87d.mp3',combat).href});
 const choices=createCaptureShellOfficialAudioChoicesV1({
  soundEntries:sounds,resolveEffect,
  musicAssets:[{assetId:song,kind:'music',title:'Battle 1'}],
  resolveMusic,explorationIds:['gensrpg:music:exploration:01'],
  explorationTracks:[{file:'exploration-01.mp3'}]
 });
 assert.equal(choices.effects.length,1);
 assert.equal(choices.music.length,2);
 assert.equal(choices.get(sfx).roles[0],'ui');
 assert.equal(choices.get(song).url,resolveMusic(song).url);
 assert.equal(choices.get('gensrpg:music:exploration:01').url,
  new URL('assets/runtime/audio/exploration-v1/exploration-01.mp3',exploration).href);
 assert.equal(choices.get('evil:external'),null);
 assert.throws(()=>createCaptureShellOfficialAudioChoicesV1({
  soundEntries:[{...sounds[0],runtimeFile:'../../other.mp3'}],resolveEffect,
  musicAssets:[],resolveMusic,explorationIds:[],explorationTracks:[]
 }),/non officielle/);
});

test('the Creator imports personal audio OR stores official asset IDs in one universe-scoped owner',()=>{
 const creator=read('shell-creator-presentation-v1.mjs');
 const official=read('shell-official-audio-catalog-v1.mjs');
 assert.match(creator,/loadCaptureShellOfficialAudioCatalogV1/);
 assert.match(creator,/async putCatalog\(universeId,slot,assetId,name\)/);
 assert.match(creator,/await media\.putCatalog\(universe,slot,choice\.assetId,choice\.label\)/);
 assert.match(creator,/await media\.put\(universe,slot,file\.files\[0\]\)/);
 assert.match(creator,/const choice=\(await officialCatalog\(\)\)\.get\(record\.assetId\)/);
 assert.match(creator,/Sons d’interface/);
 assert.match(creator,/▶ Préécouter/);
 assert.match(creator,/Utiliser ce son/);
 assert.match(official,/data\/presentation\/audio\/private-audio-runtime\.v1\.json/);
 assert.match(official,/soundtrack-starter-catalog-v1\.js/);
 assert.match(official,/exploration-soundtrack-v1\.js/);
 assert.doesNotMatch(creator,/audio\/private-v1\/[^'"]+\.mp3/);
 assert.doesNotMatch(creator,/new Audio\(/);
});


test('official audio transport is safe under localhost browser tests AND HTTPS Pages',async()=>{
 const {isCaptureShellAudioTransportUrlV1}=await import(
  '../assets/gensrpg/capture-v2/shell-official-audio-catalog-v1.mjs');
 assert.equal(isCaptureShellAudioTransportUrlV1('http://127.0.0.1:1234/private.mp3'),true);
 assert.equal(isCaptureShellAudioTransportUrlV1('https://slyen4425-cloud.github.io/audio.mp3'),true);
 assert.equal(isCaptureShellAudioTransportUrlV1('file:///tests/official.mp3'),true);
 assert.equal(isCaptureShellAudioTransportUrlV1('javascript:alert(1)'),false);
 assert.equal(isCaptureShellAudioTransportUrlV1('data:audio/mpeg;base64,abcd'),false);
 assert.equal(isCaptureShellAudioTransportUrlV1('blob:https://example.test/foo'),false);
});

test('native editor UI clicks reuse the same Capture creator sound, but not Adventure gameplay',()=>{
 const shell=read('shell-entry-v1.js');
 assert.match(shell,/function bindNativeEditorAudio\(nativeFrame,nativeKind\)/);
 assert.match(shell,/nativeFrame\.contentDocument/);
 assert.match(shell,/editorDoc\.addEventListener\('click',onClick,true\)/);
 assert.match(shell,/creatorOwner\?\.play\('click'\)/);
 assert.match(shell,/editorDoc\.removeEventListener\('click',onClick,true\)/);
 assert.match(shell,/if\(kind==='adventure'\)bindAdventureMenuPresentation\(frame\)/);
 assert.match(shell,/if\(playing\(\)\)creatorOwner\?\.leaveHome\(\)/);
 assert.match(shell,/else creatorOwner\?\.enterHome\(\)/);
 assert.match(shell,/if\(nativeKind==="adventure"\)return/);
 assert.match(shell,/editorDoc\.fullscreenElement/);
 assert.doesNotMatch(shell,/new Audio\(/);
});
test('music retries after gesture on Android and choosing music enables its universe preference',()=>{
 const creator=read('shell-creator-presentation-v1.mjs');
 assert.match(creator,/function startAmbient\(\)/);
 assert.match(creator,/error\?\.name!=='NotAllowedError'/);
 assert.match(creator,/doc\.addEventListener\('pointerdown',resumeOnGesture,true\)/);
 assert.match(creator,/doc\.addEventListener\('keydown',resumeOnGesture,true\)/);
 assert.match(creator,/doc\.removeEventListener\('pointerdown',resumeOnGesture,true\)/);
 assert.match(creator,/if\(slot==='ambience'\)\{\s*\/\/ Choosing a track/);
 assert.match(creator,/if\(slot==='ambience'\)\{\s*settings=normalizeCaptureShellCreatorSettingsV1/);
 assert.match(creator,/startAmbient,\s*wallpaper:\(\)=>backgroundUrl\?Object\.freeze\(/);
 assert.match(creator,/async reload\(/);
 assert.match(creator,/function leaveHome\(\)\{\s*active=false;stopAmbient\(/);
});


test('Creator wallpaper and ambience stay in Shell menus and Adventure preparation, not live play',()=>{
 const shell=read('shell-entry-v1.js'),creator=read('shell-creator-presentation-v1.mjs');
 const css=read('shell-style-v1.css'),adventureCss=read('adventure-style-v1.css');
 assert.match(shell,/function bindAdventureMenuPresentation\(nativeFrame\)/);
 assert.match(shell,/adventureDoc\.body\.dataset\.adventurePlaying==='true'/);
 assert.match(shell,/attributeFilter:\['data-adventure-playing'\]/);
 assert.match(shell,/if\(playing\(\)\)creatorOwner\?\.leaveHome\(\)/);
 assert.match(shell,/else creatorOwner\?\.enterHome\(\)/);
 assert.match(shell,/if\(kind==='adventure'\)bindAdventureMenuPresentation\(frame\)/);
 assert.match(shell,/adventureDoc\.documentElement\.style\.removeProperty\('--capture-shell-wallpaper'\)/);
 assert.match(shell,/creatorOwner\?\.play\('click'\)/);
 assert.match(creator,/wallpaper:\(\)=>backgroundUrl\?Object\.freeze\(/);
 assert.match(css, /data-view="home"\]\[data-menu="main"\] > \.gensCaptureV2MainMenu button/);
 assert.match(css, /rgba\(28,88,96,\.81\)/);
 assert.doesNotMatch(css,/data-menu="editors"\]\s*> \.gensCaptureV2MainMenu button\s*\{/);
 assert.match(adventureCss,/body\[data-capture-shell-wallpaper="true"\]:not\(\[data-adventure-playing="true"\]\) main/);
 assert.doesNotMatch(shell,/new Audio\(/);
});

// The Creator owns exactly one image URL. An opaque gradient canvas fills
// portrait margins; the historic GenSRPG hub must never bleed through.
test('Creator wallpaper uses ONE complete image and opaque backgrounds in both orientations',()=>{
 const shell=read('shell-style-v1.css');
 const game=read('adventure-style-v1.css');
 const home=shell.match(/#gensCaptureV2Root\[data-view="home"\]\[data-creator-wallpaper="true"\]\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(home,'real Capture home wallpaper style exists');
 assert.match(home,/background-color:#08121b/);
 assert.match(home,/background-size:cover,contain,cover/);
 assert.equal((home.match(/var\(--capture-home-art\)/g)||[]).length,1,
  'the SAME transparent hero image must never render at two scales');
 assert.match(home,/radial-gradient\(/,'gutter fill is geometry, not another monster image');
 const intro=shell.slice(shell.indexOf('#gensCaptureV2Root \.gensCaptureV2Loading{'));
 assert.match(intro,/background-size:contain,100% 100%,cover/);
 assert.match(game,/#adventure-launch-loading\{[^}]*background-size:contain,cover/s);
 const prep=game.match(/body\[data-capture-shell-wallpaper="true"\]:not\(\[data-adventure-playing="true"\]\) main\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(prep,'real Adventure preparation wallpaper style exists');
 assert.match(prep,/background-color:#08131c/);
 assert.match(prep,/background-size:cover,contain,cover/);
 assert.equal((prep.match(/var\(--capture-shell-wallpaper\)/g)||[]).length,1);
 assert.match(prep,/radial-gradient\(/);
 // Preserve the existing single authority; never export the local Creator image to gameplay.
 assert.doesNotMatch(game,/background-image:.*gensrpg\.capture\.shell\.creator\.settings/);
});
test('portrait Capture header wraps title above the button and back link',()=>{
 const shell=read('shell-style-v1.css');
 const portrait=shell.match(/@media \(orientation:portrait\) and \(max-width:650px\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(portrait,'portrait-only layout defined');
 assert.match(portrait,/> header\{/);
 assert.match(portrait,/grid-template-columns:max-content minmax\(0,1fr\)/);
 assert.match(portrait,/> header strong\{\s*grid-column:1\/-1/);
 assert.match(portrait,/\.gensCaptureReturnToMain\{/);
 assert.match(portrait,/text-overflow:ellipsis/);
});
