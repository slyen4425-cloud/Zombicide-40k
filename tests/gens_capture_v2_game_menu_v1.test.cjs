'use strict';
// Contract + real Shell DOM interaction, not a second Capture navigation engine.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/shell-entry-v1.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/shell-style-v1.css'),'utf8');

class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.listeners={};
  this.hidden=false;this.parent=null;this.textContent='';this.className='';this.id='';this.src='';}
 setAttribute(name,value){this.attrs[name]=value;}
 addEventListener(name,callback){this.listeners[name]=callback;}
 append(...children){for(const child of children){this.children.push(child);child.parent=this;}}
 replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];
  this.append(...children);}
 remove(){if(!this.parent)return;this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
 click(){assert.equal(typeof this.listeners.click,'function','real Shell control must be active');this.listeners.click();}
}
function all(node){return [node,...node.children.flatMap(all)];}
function scene(){
 const body=new Element('body');
 let registeredStart=null,registeredBack=null,exitCount=0;
 const rootWindow={
  document:{baseURI:'https://example.org/Zombicide-40k/preview/capture-v2-pr225/index.html',
   body,createElement:tag=>new Element(tag)},
  location:{origin:'https://example.org'},
  GensCaptureV1:{isProfile:()=>true},
  GensShellModuleLaunchV1:{activeModule:()=> 'capture',register:(id,fn)=>{registeredStart=fn;return id==='capture';}},
  GensShellScreenReturnV1:{register:(id,fn)=>{registeredBack=fn;return id==='capture';}},
  gensHideHomeLevels(){},showGensRootHome(){exitCount++}
 };
 vm.runInNewContext(source,{window:rootWindow,URL,console},{filename:'real-capture-shell.js'});
 assert.equal(registeredStart,rootWindow.GensCaptureV2.start);
 assert.equal(registeredBack,rootWindow.GensCaptureV2.home);
 const find=(key,val)=>all(body).filter(n=>n.dataset[key]===val);
 const click=(key,val)=>{const matches=find(key,val);assert.equal(matches.length,1,
  'only one visible destination for '+key+'='+val);matches[0].click();};
 return {rootWindow,body,find,click,exits:()=>exitCount};
}
test('one 2.5D editor endpoint: no duplicate Exploration Tester menu entry or second engine',()=>{
 const entries=[...source.matchAll(/path:"vendor\/exploration-lab\/sculpt-lab\.html"/g)];
 assert.equal(entries.length,1,'one distinct 2.5D editor entry must be published');
 assert.doesNotMatch(source,/\bexplore:\{label:/,'the duplicate Exploration Tester entry is retired');
 assert.match(source,/builder:\{label:/);
 assert.match(source,/world:\{label:/);
 assert.doesNotMatch(source,/vendor\/exploration-lab\/builder\.html/,
  'the 2D legacy Builder must not be substituted for native 2.5D');
});
test('real Capture Shell home is a vertical game menu, with coherent grouped editor destinations',()=>{
 const s=scene();s.rootWindow.GensCaptureV2.start();
 assert.equal(s.find('captureV2View','adventure').length,1,'one Jouer entry');
 assert.equal(s.find('captureV2Menu','editors').length,1,'one grouped Éditeurs entry');
 assert.equal(s.find('captureV2View','builder').length,1);
 assert.equal(s.find('captureV2View','world').length,1);
 assert.equal(s.find('captureV2View','explore').length,0);
 const nodes=all(s.body);
 const main=nodes.find(n=>n.className==='gensCaptureV2MainMenu');
 const editors=nodes.find(n=>n.className==='gensCaptureV2Editors');
 assert.ok(main&&editors,'main game menu and a distinct editor list must exist');
 assert.equal(main.children.filter(n=>n.tag==='button').length,2,'home only shows Jouer and Éditeurs');
 assert.match(css,/gensCaptureV2MainMenu/);
 assert.match(css,/gensCaptureV2Editors/);
 assert.match(css,/flex-direction:column/,'phone and PC keep a real vertical list');
 s.click('captureV2Menu','editors');
 assert.equal(s.rootWindow.GensCaptureV2.status().view,null);
 const grouped=all(editors);
 const worldGroup=grouped.find(n=>n.dataset?.editorGroup==='world');
 const combatGroup=grouped.find(n=>n.dataset?.editorGroup==='combat');
 assert.ok(worldGroup&&combatGroup,'world/exploration and creatures/combat must each have ONE group');
 assert.equal(all(worldGroup).filter(n=>n.dataset.captureV2View==='builder').length,1);
 assert.equal(all(worldGroup).filter(n=>n.dataset.captureV2View==='world').length,1);
 assert.equal(all(combatGroup).filter(n=>n.dataset.captureV2View==='creature').length,1);
 s.click('captureV2View','builder');
 assert.equal(s.rootWindow.GensCaptureV2.status().view,'builder');
 const frames=all(s.body).filter(n=>n.tag==='iframe');
 assert.equal(frames.length,1,'native Lab must still own its only full-screen iframe');
 assert.match(frames[0].src,/vendor\/exploration-lab\/sculpt-lab\.html$/);
 assert.equal(s.body.children[0].dataset.nativeFamily,'exploration');
 s.rootWindow.GensCaptureV2.home();
 assert.equal(s.rootWindow.GensCaptureV2.status().view,null);
 assert.equal(all(s.body).filter(n=>n.tag==='iframe').length,0);
 s.click('captureV2View','adventure');
 assert.equal(s.rootWindow.GensCaptureV2.status().view,'adventure');
 assert.match(all(s.body).find(n=>n.tag==='iframe').src,/assets\/gensrpg\/capture-v2\/adventure\.html$/);
 s.rootWindow.GensCaptureV2.stop();
 assert.equal(s.exits(),1);
});

test('Jouer is a game-facing screen: party first, advanced progression and loot folded away',()=>{
 const html=fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/adventure.html'),'utf8');
 const style=fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/adventure-style-v1.css'),'utf8');
 assert.match(html,/<h1>Jouer<\/h1>/);
 assert.match(html,/<details id="adventure-rules-panel" class="adventure-options">/);
 assert.match(html,/<details id="adventure-loot-panel" class="adventure-options">/);
 assert.doesNotMatch(html,/<details[^>]*open(?:=|\s|>)/i,
  'advanced authoring settings must be folded for a normal player');
 for(const id of ['adventure-create','adventure-resume','adventure-play',
  'adventure-world-builder','adventure-save-rules','adventure-xp-base',
  'adventure-drop-species']){
  assert.ok(html.includes('id="'+id+'"'),'do not remove native save/game or creator option '+id);
 }
 assert.doesNotMatch(html,/Le monde doit être créé ou importé depuis le World Builder|Ces paramètres appartiennent à Aventure|Le calcul de niveau utilise le Core/);
 assert.match(style,/adventure-options>summary/);
 assert.match(style,/adventure-columns>section:first-child/);
});
