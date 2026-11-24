const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

test('Capture opens an actual universe picker before any native game/editor, then isolates URL routing',async()=>{
 let select,selectedViews=0;
 function element(tag){
  return {tag,dataset:{},style:{},children:[],handlers:{},attributes:{},textContent:'',
   setAttribute(key,val){this.attributes[key]=val;},
   addEventListener(kind,handler){this.handlers[kind]=handler;},
   append(...children){this.children.push(...children);},
   replaceChildren(...children){this.children=[...children];},
   remove(){},click(){this.handlers.click?.();}
  };
 }
 const doc={baseURI:'https://example.test/preview/capture-v2-pr225/',
  body:element('body'),createElement:element,fullscreenElement:null};
 const root={document:doc,location:{origin:'https://example.test'},
  GensCaptureV1:{isProfile:()=>true},
  GensShellModuleLaunchV1:{activeModule:()=> 'capture',register(){return true;}},
  GensShellScreenReturnV1:{register(){return true;}},
  GensCaptureV2UniverseUiLoaderV1:()=>Promise.resolve({
   createCaptureUniverseHubUiV1:async({onSelect})=>{
    select=onSelect;
    return{showList(){selectedViews++},stop(){}};
   }
  }),addEventListener(){},gensHideHomeLevels(){}};
 vm.runInNewContext(source('assets/gensrpg/capture-v2/shell-entry-v1.js'),
  {window:root,globalThis:root,URL,Error,RangeError,Object,Promise});
 assert.equal(root.GensCaptureV2.start(),true);
 const host=doc.body.children[0];
 const nav=host.children.find(el=>el.className==='gensCaptureV2MainMenu');
 const stage=host.children.find(el=>el.className==='gensCaptureV2Stage');
 assert.equal(host.dataset.menu,'universes');
 assert.equal(stage.children.length,0);
 for(let n=0;n<8;n++)await Promise.resolve();
 assert.equal(typeof select,'function','the real universe owner must mount asynchronously');
 assert.deepEqual(nav.children.map(b=>b.textContent),['Jouer','Éditeurs','Créateur','Changer d’univers']);
 assert.equal(root.GensCaptureV2.open('builder'),false,'no editor without selected universe');
 select({legacy:true,id:'monster-invoc',name:'Monster InvoC'});
 assert.equal(host.dataset.menu,'main');
 nav.children[0].click();
 assert.match(stage.children[0].src,/\/assets\/gensrpg\/capture-v2\/adventure\.html$/);
 root.GensCaptureV2.home();
 nav.children[1].click();assert.equal(host.dataset.menu,'editors');
 const panel=host.children.find(el=>el.className==='gensCaptureV2Editors');
 const world=panel.children.find(x=>x.tag==='section').children.find(x=>x.tag==='ul').children[0].children[0];
 world.click();
 assert.match(stage.children[0].src,/vendor\/exploration-lab\/world-assembler\.html$/);
 root.GensCaptureV2.showUniverses();
 assert.equal(host.dataset.menu,'universes');
 assert.ok(selectedViews>0,'the same owner redraws the list');
 select({legacy:false,id:'unv_abcdefgh',name:'Manga',status:'ready'});
 root.GensCaptureV2.open('skills');
 assert.match(stage.children[0].src,/vendor\/combat-lab\/examples\/dom-demo\/capture-editor-v2\.html\?tab=skills&universe=unv_abcdefgh$/);
 root.GensCaptureV2.home();
 root.GensCaptureV2.open('adventure');
 assert.match(stage.children[0].src,/adventure\.html\?universe=unv_abcdefgh$/);
});

test('projects are NOT adventure slots and the Shell never owns persistence',()=>{
 const app=source('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const shell=source('assets/gensrpg/capture-v2/shell-entry-v1.js');
 const project=source('assets/gensrpg/capture-v2/universe-project-store-v1.mjs');
 assert.match(app,/createAdventurePortfolioStoreV1/);
 assert.match(app,/projects\.requireReady\(universeId\)/);
 assert.match(shell,/showUniverses/);
 assert.match(shell,/GensCaptureV2UniverseUiLoaderV1/);
 assert.match(shell,/url\.searchParams\.set\('universe',selectedUniverse\.id\)/);
 assert.doesNotMatch(shell,/localStorage|indexedDB|new WorldDocument|createAdventureStore/);
 assert.match(project,/const SCHEMA='gensrpg\.capture\.v2\.universes\.index\.v1'/);
});
