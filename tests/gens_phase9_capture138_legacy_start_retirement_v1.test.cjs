'use strict';
// TDD RED on exact pre-transfer runtime; GREEN only after a bounded owner retirement.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=process.env.GENSRPG_TEST_ROOT||path.join(__dirname,'..');
const data=fs.readFileSync(process.env.GENSRPG_INDEX_FILE||path.join(root,'index.html'));
const source=data.toString('utf8');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const old={bytes:8165398,blob:'18627cc0c5fc7945732c8a910504c59ef823b6ae'};
const next={bytes:8164674,blob:'644fc5d0ce5fd195c5496d42cc0204bd1f9a9831'};
const legacy=Buffer.from('LyogLS0tLS0tLS0tLSBkw6ltYXJyYWdlIENhcHR1cmUgOiBhcnJpdmUgZGlyZWN0ZW1lbnQgc3VyIEV4cGxvcmVyIC8gSHViIC0tLS0tLS0tLS0gKi8KY29uc3Qgc3RhcnQxMzg9d2luZG93LnN0YXJ0Q29uZmlndXJlZEdhbWU7CndpbmRvdy5zdGFydENvbmZpZ3VyZWRHYW1lPWFzeW5jIGZ1bmN0aW9uKCl7CiAgY29uc3QgY2FwPWlzQ2FwdHVyZUNvbnRleHQxMzgoKTsKICBjb25zdCByZXM9YXdhaXQgc3RhcnQxMzguYXBwbHkodGhpcyxhcmd1bWVudHMpOwogIGlmKGNhcCl7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHRyeXsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2hlZXQiKSYmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzaGVldCIpLnN0eWxlLmRpc3BsYXk9Im5vbmUiKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgibWVudSIpJiYoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIm1lbnUiKS5zdHlsZS5kaXNwbGF5PSJibG9jayIpOwogICAgICAgIHJlbmRlckNhcHR1cmVXb3JsZEh1YigpOwogICAgICAgIGNvbnN0IGh1Yj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY2FwdHVyZUdhbWVIdWIiKTsKICAgICAgICBpZihodWIpe2h1Yi5zdHlsZS5kaXNwbGF5PSJibG9jayI7aHViLnNjcm9sbEludG9WaWV3KHtibG9jazoic3RhcnQifSl9CiAgICAgIH1jYXRjaChlKXt9CiAgICB9LDMwKTsKICB9CiAgcmV0dXJuIHJlczsKfTsKCg==','base64').toString('utf8');
const anchor='/* ---------- traduction propre des éléments ---------- */';
function block(text,id){const m=text.match(new RegExp('<script\\b[^>]*\\bid=["\\x27]'+id+'["\\x27][^>]*>([\\s\\S]*?)<\\/script>','i'));assert.ok(m,'missing actual inline '+id);return m[1]}
assert.equal(data.length,next.bytes,'RED: the obsolete Capture138 global start wrapper must be retired');
assert.equal(blob(data),next.blob);
assert.equal(source.split(anchor).length-1,1);
const capture=block(source,'captureFix138');
assert.doesNotMatch(capture,/const start138=window\.startConfiguredGame|window\.startConfiguredGame\s*=/);
for(const name of ['isCaptureContext138','startTurnManagerForGame','captureElementLabel138','captureOpenCreatureOverlay134','captureNormalizeAffinities138','captureBattleSelectDefaultTarget','captureBattleApplyAbility','captureBattleRunAiUntilHuman','captureRenderBattleLive'])assert.ok(capture.includes(name),'preserve other Capture138 owner '+name);
const before=source.replace(anchor,legacy+anchor);
assert.equal(Buffer.byteLength(before),old.bytes,'byte-exact inverse size');
assert.equal(blob(Buffer.from(before)),old.blob,'byte-exact inverse git blob');
const final=fs.readFileSync(path.join(root,'assets/gensrpg/shell/module-launch-final-authority-v1.js'),'utf8');
const tag='<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>';
assert.equal(source.split(tag).length-1,1);
assert.equal(source.slice(source.lastIndexOf(tag)+tag.length,source.lastIndexOf('</body>')).trim(),'','Shell must be last production script');
assert.match(final,/window\.startConfiguredGame=async function\(\)/);
assert.match(final,/launchService\.startModuleSession\(moduleId\)/);
async function actualPublicStart(indexText){
 const events=[],timers=[],ctx={
   console,setTimeout:(cb,ms)=>{timers.push(ms);return timers.length},
   getActiveGameProfile:()=>({rpgUniverse:{gameplay:{profile:'creature'}}}),
   GensCaptureV1:{isProfile:p=>p?.rpgUniverse?.gameplay?.profile==='creature'},
   GensShellModuleLaunchV1:{activeModule:()=> 'capture',startModuleSession:async id=>{events.push('Shell:'+id);return true}},
   startConfiguredGame:async()=>{events.push('obsolete-start');return false},
   startTurnManagerForGame:()=>{},captureOpenCreatureOverlay134:()=>{},captureBattleApplyAbility:()=>{},captureBattleRunAiUntilHuman:()=>{},captureRenderBattleLive:()=>{},
   document:{getElementById:()=>null},renderCaptureWorldHub:()=>events.push('obsolete-second-render')
 };ctx.window=ctx;
 const c=vm.createContext(ctx);vm.runInContext(block(indexText,'captureFix138'),c,{timeout:2000});vm.runInContext(final,c,{timeout:2000});
 assert.equal(await ctx.startConfiguredGame(),true);
 assert.deepEqual(events,['Shell:capture'],'real public dispatcher never calls legacy chain');
 assert.equal(timers.filter(v=>v===30).length,0,'no extra 30ms repaint on public start');
 return {events,timers};
}
(async()=>{assert.deepEqual(await actualPublicStart(before),await actualPublicStart(source),'pre/post public launch parity');
 console.log(JSON.stringify({scenario:'Capture138 obsolete global launch retirement',before:old,after:next,rollback:'byte-exact',protectedOtherCapture138Owners:9}));
})().catch(e=>{console.error(e);process.exitCode=1});