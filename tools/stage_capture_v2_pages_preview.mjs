// Single existing GitHub Pages publisher: the approved immutable candidate is
// staged only under /preview/capture-v2-pr225/. No second runtime/publisher.
// The exact Combat and Exploration owners are both read from the candidate's
// canonical pins and checked against their published main branch SHAs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertOfficialMainHistoryPin} from './verify_official_main_pin.mjs';
import {stageOfficialCaptureEncounterBridge} from './stage_capture_v2_encounter_bridge.mjs';
import {releasePreviewPwaForCommit,enableAutomaticPreviewActivation} from './capture_v2_pwa_release.mjs';

const [sourceArg,combatArg,explorationArg,siteArg,visualsArg]=process.argv.slice(2);
if(!sourceArg||!combatArg||!explorationArg||!siteArg||!visualsArg)
  throw Error('Usage: stage_capture_v2_pages_preview.mjs <capture-pr-SHA> <combat-main> <exploration-main> <_site> <approved-visuals>');
const source=path.resolve(sourceArg),combat=path.resolve(combatArg),
  exploration=path.resolve(explorationArg),site=path.resolve(siteArg),visuals=path.resolve(visualsArg);
const trial=path.join(site,'preview','capture-v2-pr225');
const previewPin=JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),
  'capture_v2_pages_preview_pin.json'),'utf8'));
if(previewPin.schema!=='gensrpg-capture-v2-pages-source-pin-v1'||
   previewPin.repository!=='slyen4425-cloud/Zombicide-40k'||
   previewPin.publicPath!=='/preview/capture-v2-pr225/'||
   !/^[a-f0-9]{40}$/.test(previewPin.sha))throw Error('Invalid canonical preview pin');
const expectedPreviewSha=previewPin.sha;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const head=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const bytes=(dir,rel)=>fs.readFileSync(path.join(dir,rel));
const sourcePin=JSON.parse(bytes(source,'assets/gensrpg/capture-v2/source-pins-v1.json'));
const owners={combat,exploration};
if(head(source)!==expectedPreviewSha)
  throw Error('Capture V2 preview may use only the approved immutable candidate SHA');
if(sourcePin.legacyCaptureRuntime!==false)
  throw Error('Old Capture cannot enter isolated preview');
for(const [owner,dir] of Object.entries(owners)){
  const pin=sourcePin[owner];
  if(pin.ref!=='main'||!/^[a-f0-9]{40}$/.test(pin.sha)||head(dir)!==pin.sha)
    throw Error(owner+' checkout does not match the certified preview main pin');
  assertOfficialMainHistoryPin({repository:pin.repository,sha:pin.sha});
}
if(!fs.existsSync(path.join(site,'index.html')))
  throw Error('Canonical Pages production root must be assembled first');
const preserved={};
for(const rel of ['index.html','service-worker.js','manifest.webmanifest']){
  preserved[rel]=digest(bytes(site,rel));
}
const relative=path.relative(site,trial);
if(relative!==path.join('preview','capture-v2-pr225'))
  throw Error('Preview escaped its isolated subdirectory');
fs.rmSync(trial,{recursive:true,force:true});
fs.mkdirSync(path.join(trial,'assets'),{recursive:true});
const copyFile=(rel,dst=rel)=>{
  const input=path.join(source,rel),output=path.join(trial,dst);
  if(!fs.statSync(input).isFile())throw Error('Missing original GenSrpg file: '+rel);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.copyFileSync(input,output);
};
for(const rel of ['index.html','service-worker.js','manifest.webmanifest'])
  copyFile(rel);

 // The preview is a distinct installable app: its ORIGINAL manifest shares
 // the GenSRPG name/icon although its start URL and scope are Capture-only.
 // Change staged presentation labels, never its persistent identity/scope.
 const previewManifestFile=path.join(trial,'manifest.webmanifest');
 const previewManifest=JSON.parse(fs.readFileSync(previewManifestFile,'utf8'));
 if(previewManifest.id!=='./'||previewManifest.scope!=='./'||
    previewManifest.start_url!=='./'||previewManifest.display!=='standalone'||
    previewManifest.name!=='GenSrpG'||previewManifest.short_name!=='GenSrpG')
   throw Error('Unexpected Capture preview manifest identity; refuse to alter PWA scope or ID');
 previewManifest.name='Monster InvoC — Capture';
 previewManifest.short_name='InvoC Capture';
 previewManifest.description='Mode Capture distinct de la PWA GenSRPG principale (Dungeon et Survie).';
 fs.writeFileSync(previewManifestFile,JSON.stringify(previewManifest,null,2)+'\n');
// The immutable Capture source is NOT the release version. Every main or PR
// deploy must install a new worker and publish matching HTML version markers
// even if tools/capture_v2_pages_preview_pin.json is unchanged. Cache scopes
// remain isolated on the shared github.io origin (no other PWA's cache deletion).
const publisherCommit=process.env.GITHUB_SHA;
const stagedPwa=releasePreviewPwaForCommit(
  bytes(source,'service-worker.js').toString('utf8'),
  bytes(source,'index.html').toString('utf8'),
  publisherCommit
);
fs.writeFileSync(path.join(trial,'service-worker.js'),stagedPwa.worker);
const previewHtml=enableAutomaticPreviewActivation(stagedPwa.html);
const handoffTag='<script src="assets/gensrpg/shell/capture-v2-from-main-entry-v1.js"></script>';
// The handoff MUST run before the heavy preview bootstrap, otherwise an
// installed stale shortcut opens Capture first and exposes only a footer link.
if(previewHtml.split('</body>').length!==2||
   (previewHtml.match(/<head\b[^>]*>/gi)||[]).length!==1||
   previewHtml.includes(handoffTag))
  throw Error('Official Capture V2 preview must expose exactly one early main-app arrival seam');
fs.writeFileSync(path.join(trial,'index.html'),
  previewHtml.replace(/<head\b[^>]*>/i,tag=>tag+'\n'+handoffTag));
for(const filename of fs.readdirSync(source).filter(x=>/^sound_.*\.mp3$/.test(x)))
  copyFile(filename);
for(const filename of ['icon-192.png','icon-512.png']){
  if(!fs.existsSync(path.join(source,filename)))continue;
  copyFile(filename);
  copyFile(filename,'icons/'+filename);
}
// Copy ONLY the original candidate's static assets. Exclude the retired
// Capture runtime; no invented rule/data registry is allowed in this stage.
const assetsRoot=path.join(source,'assets');
fs.cpSync(assetsRoot,path.join(trial,'assets'),{
  recursive:true,force:true,errorOnExist:false,
  filter(p){
    if(fs.lstatSync(p).isSymbolicLink())
      throw Error('Symlink in preview assets: '+p);
    const rel=path.relative(assetsRoot,p).split(path.sep).join('/');
    return rel!=='gensrpg/capture'&&!rel.startsWith('gensrpg/capture/');
  }
});
// One tiny Shell handoff is staged from the CURRENT main publisher. No Lab
// bundle, source owner, game state or second Capture engine is copied.
const mainEntrySource=path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../assets/gensrpg/shell/capture-v2-from-main-entry-v1.js');
const mainEntryTarget=path.join(trial,'assets/gensrpg/shell/capture-v2-from-main-entry-v1.js');
if(fs.existsSync(mainEntryTarget))throw Error('Duplicate main Capture V2 handoff owner');
fs.copyFileSync(mainEntrySource,mainEntryTarget);
const exploreDest=path.join(trial,'vendor/exploration-lab');
fs.mkdirSync(exploreDest,{recursive:true});
// Author archives stay in the Exploration repository. Browser Pages ships
// the live sheets and frames, not the ZIPs originally used to build them.
const explorationSourceArchivePattern=
  /^exploration\/objects\/animated\/(windmill|wind_turbine)\/(front|three_quarters_left|three_quarters_right)\/source\.zip$/;
const excludedSourceArchives=[];
for(const folder of ['src','assets']){
  const sourceDir=path.join(exploration,folder);
  fs.cpSync(sourceDir,path.join(exploreDest,folder),{
    recursive:true,filter(p){
      if(fs.lstatSync(p).isSymbolicLink())
        throw Error('Symlink in official Exploration: '+p);
      const relative=path.relative(sourceDir,p).split(path.sep).join('/');
      if(folder==='assets'&&explorationSourceArchivePattern.test(relative)){
        if(!fs.statSync(p).isFile())throw Error('Expected source ZIP file: '+relative);
        excludedSourceArchives.push(relative);
        return false;
      }
      return true;
    }
  });
}
if(excludedSourceArchives.length!==6)
  throw Error('Unexpected official Exploration author ZIP count: '+excludedSourceArchives.length);
console.log('Excluded 6 non-runtime Exploration source ZIPs from Pages:',excludedSourceArchives.join(', '));
for(const filename of ['index.html','builder.html','world-assembler.html','sculpt-lab.html','hero-editor.html','npc-editor.html','play.html','manifest.webmanifest']){
  const from=path.join(exploration,filename);
  if(filename==='npc-editor.html'&&!fs.existsSync(from))
    throw Error('Certified Exploration NPC editor is missing from source');
  if(fs.existsSync(from))fs.copyFileSync(from,path.join(exploreDest,filename));
}
// Delegate the native Combat transport and the derived official Showcase to
// the candidate staging script, at the SAME exact immutable SHA.
const officialStage=path.join(source,'tools/stage_capture_v2_labs.mjs');
execFileSync(process.execPath,[officialStage,combat,exploration,trial],
  {stdio:'inherit',timeout:180000});
const delivery=JSON.parse(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json'));
if(delivery.combat.sha!==sourcePin.combat.sha||
   delivery.exploration.sha!==sourcePin.exploration.sha||
   delivery.legacyCaptureRuntime!==false)
  throw Error('Certified native delivery differs from approved pins');
// Complete the original Lab Exploration handoff contract. Exploration owns
// integration/combat-bridge and Combat owns its original runtime. Never
// invent the missing page or redirect to another engine/legacy renderer.
// Visual art has its OWN official immutable author branch, separate from
// Combat main's rule authority. The preview release pin is its single
// explicitly certified source. Never borrow the older production catalog
// whose Heriplante IDs are absent, and never read a moving branch at runtime.
const mediaAuthority=previewPin.officialVisuals;
const approvedVisuals=mediaAuthority?.sha;
if(mediaAuthority?.repository!==sourcePin.combat.repository||
   mediaAuthority.ref!=='global-assets'||
   !Number.isInteger(mediaAuthority.certifiedCiRun)||mediaAuthority.certifiedCiRun<=0||
   !/^[a-f0-9]{40}$/.test(approvedVisuals)||head(visuals)!==approvedVisuals)
  throw Error('Encounter media must use the single certified immutable official visual library SHA');
// Immutable official Monster InvoC background set. Preserve the original art
// already staged above; only add these three user-approved PNGs from ONE visual
// owner. Never copy the source archive, a whole Lab library or a second engine.
const officialWallpaperSource='assets/library/capture/';
const officialWallpaperDest='vendor/combat-lab/assets/library/capture/';
const extraOfficialWallpapers=[
 {file:'file_00000000ee088210a7c5cb3bea4d5068.png',size:2272467,blob:'8b4cf837d74643abf6e7d6246db716691f941222'},
 {file:'file_0000000090d481f48cc94001c7925590.png',size:2936672,blob:'f3a8f75eed0d8d0f1f670d343107f53ec9bfc83b'},
 {file:'raiiven_sous_la_lune_violette.png',size:2530477,blob:'1bce6ae819d19e64370f65e1f6dc811eb063d2f3'}
];
const historicalWallpaper=officialWallpaperDest+'file_0000000089ec81f4a7bdfd03220f487c.png';
if(!fs.existsSync(path.join(trial,historicalWallpaper)))
 throw Error('Historical Monster InvoC loading artwork missing: never replace it');
const officialWallpaperDelivery=[];
for(const art of extraOfficialWallpapers){
 const src=path.join(visuals,officialWallpaperSource+art.file);
 if(!fs.existsSync(src))throw Error('Official visual missing from approved SHA: '+art.file);
 const raw=fs.readFileSync(src);
 const blob=crypto.createHash('sha1').update('blob '+raw.length+String.fromCharCode(0)).update(raw).digest('hex');
 if(raw.length!==art.size||blob!==art.blob||
   !raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))
  throw Error('Unexpected or altered approved wallpaper: '+art.file);
 const rel=officialWallpaperDest+art.file,out=path.join(trial,rel);
 if(fs.existsSync(out))throw Error('Duplicate/overwritten official art transport: '+rel);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.copyFileSync(src,out);
 if(!fs.readFileSync(out).equals(raw))throw Error('Wallpaper transport drift: '+art.file);
 officialWallpaperDelivery.push({file:rel,gitBlob:blob,size:raw.length,sha256:digest(raw)});
}
const wallpaperReport={
 schema:'gensrpg-capture-official-wallpapers-v1',
 visualOwner:{repository:mediaAuthority.repository,ref:mediaAuthority.ref,sha:approvedVisuals},
 historicalArt:{file:historicalWallpaper,preserved:true},
 additions:officialWallpaperDelivery
};
const wallpaperReportFile=path.join(trial,'assets/gensrpg/capture-v2/official-art-provenance.v1.json');
fs.writeFileSync(wallpaperReportFile,JSON.stringify(wallpaperReport,null,2)+String.fromCharCode(10));

const bridge=stageOfficialCaptureEncounterBridge({
  previewRoot:trial,combatRoot:combat,explorationRoot:exploration,visualsRoot:visuals,
  combatSha:sourcePin.combat.sha,explorationSha:sourcePin.exploration.sha,
  visualsSha:approvedVisuals
});
// Audio regression guard: the Capture shell used the lightweight Combat editor
// transport, which ships ONLY the victory track. The real Exploration bridge
// already stages the exact same Combat SHA and its COMPLETE signed audio graph.
// Reuse that existing transport for all five official Combat editor routes;
// do not duplicate SFX/music, modify Lab source or add a second sound owner.
if(bridge.combat?.sha!==sourcePin.combat.sha)
 throw Error('Editor and encounter Combat SHA mismatch');
const legacyEditor='vendor/combat-lab/examples/dom-demo/';
const completeEditor='vendor/exploration-lab/combat-preview/examples/dom-demo/';
for(const name of ['capture-editor-v2.html','capture-editor-v2.js','bestiary.html']){
 const original=bytes(trial,legacyEditor+name);
 if(digest(original)!==digest(bytes(trial,completeEditor+name)))
  throw Error('Official editor transport differs from the signed encounter Combat main: '+name);
}
const canonicalAudio='vendor/exploration-lab/combat-preview/assets/runtime/';
for(const name of [
 'audio/music-v1/battle-01-cb4ed87d.mp3',
 'audio/music-v1/victory-01-0b52ce2b.mp3',
 'audio-test/fire_cast.mp3',
 'audio-test/melee_impact.mp3',
 'audio-test/teleport.mp3'
])if(!fs.statSync(path.join(trial,canonicalAudio+name)).isFile())
 throw Error('Official Combat editor audio missing: '+name);
if(!fs.readdirSync(path.join(trial,canonicalAudio,'audio/private-v1'))
  .some(name=>name.endsWith('.mp3')))
 throw Error('Official Combat private skill SFX bank missing');
const nativeShellPath=path.join(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js');
const nativeShell=fs.readFileSync(nativeShellPath,'utf8');
const fromRoute='path:"'+legacyEditor;
const toRoute='path:"'+completeEditor;
if(nativeShell.split(fromRoute).length!==6||nativeShell.includes(toRoute))
 throw Error('Expected exactly five original official Combat editor routes');
fs.writeFileSync(nativeShellPath,nativeShell.split(fromRoute).join(toRoute));
// Only the PWA's generated, already-verified Combat editor launcher needs an
// Android iframe integration adjustment. The native Lab remains byte-for-byte
// original in its light transport; no game rules, assets, saves or Lab pin
// change. On some Android installed PWAs, the nested requestFullscreen() or
// orientation lock promise resolves only after system Back. It MUST NOT gate
// session.launch(), otherwise the first Tester tap appears to do nothing.
const officialEditorJs=bytes(trial,legacyEditor+'capture-editor-v2.js').toString('utf8');
const editorJsPath=path.join(trial,completeEditor,'capture-editor-v2.js');
const editorJs=fs.readFileSync(editorJsPath,'utf8');
if(digest(Buffer.from(officialEditorJs))!==digest(Buffer.from(editorJs)))
 throw Error('PWA adapter expected an identical certified Combat editor JS');
const blockingFullscreenGate='    await displayModePromise;\n';
const nonblockingFullscreenGate=
 '    // PWA Android: fullscreen can settle only after system Back. Never gate battle launch.\n'+
 '    void displayModePromise.catch(error => console.warn("PWA fullscreen unavailable", error));\n';
if(editorJs.split(blockingFullscreenGate).length!==2||
   editorJs.includes(nonblockingFullscreenGate))
 throw Error('Official Combat editor fullscreen gate changed; refuse unsupported PWA integration');
const pwaEditorJs=editorJs.replace(blockingFullscreenGate,nonblockingFullscreenGate);
if(pwaEditorJs.replace(nonblockingFullscreenGate,blockingFullscreenGate)!==officialEditorJs)
 throw Error('PWA integration changed content outside the one fullscreen-await seam');
fs.writeFileSync(editorJsPath,pwaEditorJs);
// The source Capture candidate pins one certified Exploration main revision.
// Legacy 13bb release alone reconstructs the officially corrected south backing;
// all newer main revisions (including the Pixel seam painter) must be consumed
// byte-for-byte with their independently certified Git blob, never rewritten.
// No other engine, scene, save, asset or browser route is modified.
const southRendererRel='src/render/sculpt-height-renderer.js';
const southRendererPath=path.join(exploreDest,southRendererRel);
const pinnedSouthRenderer=fs.readFileSync(southRendererPath,'utf8');
const gitBlobSha=data=>crypto.createHash('sha1')
 .update('blob '+Buffer.byteLength(data)+String.fromCharCode(0)).update(data).digest('hex');
const sourceSouthBlob='cc8dd1190eee4956e1b647d3825b526fcd66fc53';
const officialSouthBlob='e20f6ccf4c717574f0e0260bc481c839e66444f8';
const legacyExplorationSha='13bbd8230d8dfcef612586974b2dcb54e18e16c4';
const currentExplorationSha='4df91fdc4d5eedcf421e4767e175cba80e469bb1';
// Exact official main release: renderer now includes mobile seam underpaint.
const pixelExplorationSha='1efa72151701a144687fbece77aad8e4a1052d42';
const warmupAudioExplorationSha='42d0f9608c17f6d56d65038ac895564252126d5e';
const crossfadeExplorationSha='e0175760e686c4c911e0b91d5614aab2d0b708fe';
const authorExportCameraExplorationSha='f17e4aea75a49da42f7c9b945cc26e8934fc1424';
const pixelSouthBlob='53545186122ce963f66cdb15172d8b145728caa7';
const fringeRoadExplorationSha='0128e69c290b43014a5a899804c588d805e2b4b0';
const fringeRoadSouthBlob='1a0869afc5b258e8f403f43cd26b3f417a6c8786';
const recoveredWorldExplorationSha='da4420cef7ff4666d93fb492f246518e0c6803f9';
const stairsExplorationSha='2cb75a601cadcd26d33ffdd093a07badaaa9e86f';
// 21 Nov main: CI #44883868089 and Pages #44883868068 SUCCESS; renderer Git blob is identical to stairs / recovery release.
const certifiedNov21ExplorationSha='abe51d7f0634684d29772e0730719b2eb347fa98';
// 22 Nov PR #518 merged into official Exploration main: CI 45009116871; exact same renderer blob.
const certifiedNov22NpcExplorationSha='c3b69270919923d130c74af1a8577fa40476eff2';
// 22 Nov canonical Exploration asset-only replacement (CI main #45012201761, Pages GREEN).
// Its south terrain renderer is byte-identical; preserve the owner and its verified Git blob.
const certifiedNov22CleanedAssetsSha='de86b04f35f96df3783f1f953c7f138bc44a28f8';
// #520 merged Exploration main: main CI 45015697925, Pages 45015697997.
// The certified renderer Git blob is unchanged, only NPC and source assets move.
const certifiedNov22NpcInlineSha='1553c0e8f9bab89f5c1badfa64c5d41fb75cff73';
// #522 merged official Exploration main: CI 45043998646 and Pages 45043998629 GREEN.
// The multiplayer overlap correction changes ONLY peer visual projection and
// the native Play screen, not the height renderer. Both official main commits
// expose byte-identical south renderer Git blob 6c101756bdf9c58a9ae8cf3fe104e49575145748.
const certifiedNov22MultiplayerOverlapSha='77bebb83ff176f49edff7ae49c03ba48c28202ca';
// 22 Nov sculpt palette (#521) merged; certified main CI 45050483870 and Pages 45050483881 GREEN.
// The native sculpt-height renderer Git blob remains exactly 6c101756...
// Only the Exploration main source pin and this strict immutable certification change.
const certifiedNov22SculptPaletteSha='a8d9f8bd61bee7a14ab4e71e6cedc85250457f5c';
// #523: five new canonical terrain WebP surfaces; same reviewed south renderer blob.
const certifiedNov22FiveTerrainTexturesSha='1b69d62a88e77c545ab9a476a6a2b7f81ad4dd90';
// #524: Exploration main auto portals/marker visuals; official height renderer byte-identical.
const certifiedNov23AutoPortalsSha='98e3f67700494d76ab12628ee52d498e7cc24606';
// #538/#539 merged main: CI 45260398784 and Pages 45260398731 GREEN.
// Source owner adds a native invisible navigation-only corridor. All older
// renderer blobs remain authorized only at their exact historic main refs.
const certifiedNov23NavigationAllowSha='b0f52e23bea6e9eaf359fc7faf206c13386bdb4a';
// #540: selected stair foot/summit is per-WorldObject; renderer unchanged (Git blob proven).
// Post-merge owner CI 45266578823 and Pages GREEN. No new raster authority.
const certifiedNov23StairsAuthoringSha='35dbe475e53abcc7ba8f4c5ee3be972390232584';
// Exploration #541, CI 45422631920 and HTTPS release 45422631766.
const certifiedMerchantDialogSha='d55dd4d4f565baefc66bc5ccbde2f10e501f67fe';
const navigationAllowSouthBlob='98c70979a719b2bad48a35df972bb880b6a62f5e';
const recoveredWorldSouthBlob='6c101756bdf9c58a9ae8cf3fe104e49575145748';
const oldSouthBacking="  ctx.fillStyle=baseColor;ctx.fillRect(0,0,totalWidth,totalHeight);";
const officialSouthBacking="  // The outer cliff is deliberately disabled in the canonical 2.5D editor\n  // and its Tester, including the decorative south fringe. Raised last-row\n  // tops end BEFORE the bottom of this backing rectangle; a solid baseColor\n  // leaked through as the broad grey/green slanted strip on Android. Carry\n  // the EXACT same Material Registry texture underneath the raised tops.\n  // Keep the original backing for callers that explicitly draw a cliff rim.\n  // This is visual-only: no new cells, heights, collisions or saved paint.\n  ctx.fillStyle=!drawOuterSouthRim&&pattern?pattern:baseColor;\n  ctx.fillRect(0,0,totalWidth,totalHeight);";
let southRendererOriginSha;
let releasedSouthBlob=officialSouthBlob;
if(sourcePin.exploration.sha===legacyExplorationSha){
 if(gitBlobSha(pinnedSouthRenderer)!==sourceSouthBlob||
    pinnedSouthRenderer.split(oldSouthBacking).length!==2)
  throw Error('Legacy Exploration renderer differs from original certified input');
 const correctedSouthRenderer=pinnedSouthRenderer.replace(oldSouthBacking,officialSouthBacking);
 if(gitBlobSha(correctedSouthRenderer)!==officialSouthBlob||
    correctedSouthRenderer.replace(officialSouthBacking,oldSouthBacking)!==pinnedSouthRenderer)
  throw Error('Legacy south renderer adapter cannot reproduce certified official source');
 fs.writeFileSync(southRendererPath,correctedSouthRenderer);
 southRendererOriginSha='ea336f885fa7fb7e1ea43ebf95c58504874d852a';
}else if(sourcePin.exploration.sha===currentExplorationSha){
 // New canonical Exploration contains this fix; do not fork or mutate it.
 if(gitBlobSha(pinnedSouthRenderer)!==officialSouthBlob||
    !pinnedSouthRenderer.includes(officialSouthBacking))
  throw Error('Latest official Exploration renderer is not the certified south correction');
 southRendererOriginSha=currentExplorationSha;
}else if([pixelExplorationSha,warmupAudioExplorationSha,crossfadeExplorationSha,authorExportCameraExplorationSha].includes(sourcePin.exploration.sha)){
 // Consume this exact official Exploration file unchanged. The native painter
 // owns mobile seams; the PWA may only certify its byte-identical Git blob.
 if(gitBlobSha(pinnedSouthRenderer)!==pixelSouthBlob||
    !pinnedSouthRenderer.includes(officialSouthBacking)||
    !pinnedSouthRenderer.includes('ctx.rect(x-seam,y-seam,w+2*seam,2*seam)'))
  throw Error('Exploration mobile seam renderer differs from certified main');
 releasedSouthBlob=pixelSouthBlob;
 southRendererOriginSha=sourcePin.exploration.sha;
}else if(sourcePin.exploration.sha===fringeRoadExplorationSha){
 // The owner fixed southern decorative-object depth and pixel-snapped
 // elevation tint in ONE official renderer, without a new WorldSurface.
 // Ship the exact Git blob, never an adapted or copied rendering algorithm.
 if(gitBlobSha(pinnedSouthRenderer)!==fringeRoadSouthBlob||
    !pinnedSouthRenderer.includes('sculptPaintCellBoundsV1(ctx,x,y,w,h)')||
    !pinnedSouthRenderer.includes('ctx.fillRect(rect.x,rect.y,rect.width,rect.height)')||
    !pinnedSouthRenderer.includes('ctx.rect(x-seam,y-seam,w+2*seam,2*seam)')||
    !pinnedSouthRenderer.includes(officialSouthBacking))
   throw Error('Certified raised-road renderer differs from official Exploration main');
 releasedSouthBlob=fringeRoadSouthBlob;
 southRendererOriginSha=sourcePin.exploration.sha;
}else if([recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha,certifiedNov22MultiplayerOverlapSha,certifiedNov22SculptPaletteSha,certifiedNov22FiveTerrainTexturesSha,certifiedNov23AutoPortalsSha].includes(sourcePin.exploration.sha)){
 // Official owner removed tile-by-tile height tint, preserving native road
 // paint at raised elevations and the strict WorldDocument save contract.
 // PR #506 adds side/oblique stair travel and display exclusively outside
 // this byte-identical renderer (blob 6c101756... at BOTH main commits).
 // Approved new main is still required through official-main ancestry + CI pin.
 // Only ship the immutable official bytes, never patch the renderer here.
 if(gitBlobSha(pinnedSouthRenderer)!==recoveredWorldSouthBlob||
    pinnedSouthRenderer.includes('ctx.fillRect(rect.x,rect.y,rect.width,rect.height)')||
    !pinnedSouthRenderer.includes('for(const {side,opacity} of info.contactShadows)')||
    !pinnedSouthRenderer.includes('sculptPaintCellClipV1(ctx,x,y,w,h)')||
    !pinnedSouthRenderer.includes('ctx.rect(x-seam,y-seam,w+2*seam,2*seam)')||
    !pinnedSouthRenderer.includes(officialSouthBacking))
   throw Error('Certified native elevated-ground renderer differs from Exploration main');
 releasedSouthBlob=recoveredWorldSouthBlob;
 southRendererOriginSha=sourcePin.exploration.sha;
}else if([certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha].includes(sourcePin.exploration.sha)){
 // The canonical owner intentionally hides navigationOnly ramps in play.
 // Certify its EXACT Git blob; preserve all physical passages in Collision
 // World, and NEVER modify/copy the original native renderer in the PWA.
 if(gitBlobSha(pinnedSouthRenderer)!==navigationAllowSouthBlob||
    !pinnedSouthRenderer.includes('if(ramp.navigationOnly)continue;')||
    !pinnedSouthRenderer.includes(officialSouthBacking)||
    !pinnedSouthRenderer.includes('for(const {side,opacity} of info.contactShadows)'))
  throw Error('Exploration navigation-only renderer differs from reviewed official main');
 releasedSouthBlob=navigationAllowSouthBlob;
 southRendererOriginSha=sourcePin.exploration.sha;
}else throw Error('Unreviewed Exploration renderer version; certification required');
const provenance={
  schema:'gensrpg-capture-v2-isolated-pages-preview-v1',
  publicPath:previewPin.publicPath,
  publisherCommit,
  source:{repository:'slyen4425-cloud/Zombicide-40k',
    ref:'approved-immutable-commit',commit:expectedPreviewSha},
  combat:{repository:sourcePin.combat.repository,ref:'main',sha:sourcePin.combat.sha},
  exploration:{repository:sourcePin.exploration.repository,ref:'main',sha:sourcePin.exploration.sha},
  explorationSouthRenderer:{repository:sourcePin.exploration.repository,
    mainSha:southRendererOriginSha,
    officialBlobSha:releasedSouthBlob,
    path:'vendor/exploration-lab/'+southRendererRel},
  legacyCaptureRuntime:false,
  productionRootSha256:preserved['index.html'],
  productionServiceWorkerSha256:preserved['service-worker.js'],
  previewServiceWorkerSha256:digest(bytes(trial,'service-worker.js')),
  productionManifestSha256:preserved['manifest.webmanifest'],
  previewIndexSha256:digest(bytes(trial,'index.html')),
  deliveryManifestSha256:digest(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json')),
  encounterBridgeManifestSha256:digest(bytes(trial,'bridge-transport-manifest.v1.json'))
};
fs.writeFileSync(path.join(trial,'release-provenance.v1.json'),JSON.stringify(provenance,null,2)+'\n');
for(const [rel,hash] of Object.entries(preserved))
  if(digest(bytes(site,rel))!==hash)
    throw Error('Preview mutated the protected production root: '+rel);
if(fs.existsSync(path.join(trial,'assets/gensrpg/capture')))
  throw Error('Retired Capture was transported into preview');
console.log('Immutable Capture V2 staged under '+provenance.publicPath+
  ' with two official main-only Lab owners and production root protected');
