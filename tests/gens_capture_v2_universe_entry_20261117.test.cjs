const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

test('Capture module explicitly chooses an independent universe before opening native Adventure',()=>{
 const registered={};
 function element(tag){
  const node={tag,dataset:{},style:{},children:[],handlers:{},attributes:{},
   setAttribute(key,val){this.attributes[key]=val;},
   addEventListener(kind,handler){this.handlers[kind]=handler;},
   append(...children){this.children.push(...children);},
   replaceChildren(...children){this.children=[...children];},
   remove(){},
   click(){this.handlers.click?.();}
  };
  return node;
 }
 const doc={baseURI:'https://example.test/preview/capture-v2-pr225/',
   body:element('body'),createElement:element,fullscreenElement:null};
 const root={document:doc,location:{origin:'https://example.test'},
   GensCaptureV1:{isProfile:()=>true},
   GensShellModuleLaunchV1:{activeModule:()=> 'capture',register(key,handler){registered[key]=handler;return true;}},
   GensShellScreenReturnV1:{register(){return true;}},
   addEventListener(){},gensHideHomeLevels(){}};
 vm.runInNewContext(source('assets/gensrpg/capture-v2/shell-entry-v1.js'),
   {window:root,globalThis:root,URL,Error,RangeError,Object,Promise});
 assert.equal(root.GensCaptureV2.start(),true);
 const host=doc.body.children[0],nav=host.children[1],stage=host.children[5];
 const names=nav.children.map(button=>button.textContent);
 assert.deepEqual(names,['Créer un univers','Reprendre / gérer mes univers','Éditeurs']);
 assert.equal(stage.children.length,0,'no world or saved game launched on module entry');
 nav.children[0].click();
 assert.match(stage.children[0].src,/\/assets\/gensrpg\/capture-v2\/adventure\.html\?start=new$/);
 assert.equal(host.dataset.view,'adventure');
 root.GensCaptureV2.home();
 assert.equal(stage.children.length,0);
 nav.children[1].click();
 assert.match(stage.children[0].src,/\/assets\/gensrpg\/capture-v2\/adventure\.html\?start=load$/);
 assert.equal(host.dataset.view,'adventure');
 root.GensCaptureV2.home();
 nav.children[2].click();
 assert.equal(host.dataset.menu,'editors');
 assert.equal(stage.children.length,0);
});

test('the existing single Adventure portfolio owns new/load flows and ignores unknown URL requests',()=>{
 const app=source('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const html=source('assets/gensrpg/capture-v2/adventure.html');
 const shell=source('assets/gensrpg/capture-v2/shell-entry-v1.js');
 assert.match(app,/createAdventurePortfolioStoreV1/);
 assert.match(app,/setAdventureStartView\(requestedStartView==='new'\|\|requestedStartView==='load'\?requestedStartView:'choice'\)/);
 assert.match(html,/data-adventure-start-view="choice"/);
 assert.match(shell,/if\(kind==='adventure'&&\['new','load'\]\.includes\(startView\)\)/);
 assert.doesNotMatch(shell,/localStorage|indexedDB|window\.location\.replace|location\.reload/);
});
