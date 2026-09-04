const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-multiplayer-entry-167831.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const elements=new Map();
function el(tag='div'){
  const x={tagName:String(tag).toUpperCase(),id:'',className:'',innerHTML:'',textContent:'',style:{removeProperty(){}},children:[],parentNode:null,firstChild:null,onclick:null,
    appendChild(c){c.parentNode=this;this.children.push(c);this.firstChild=this.children[0]||null;if(c.id)elements.set(c.id,c);return c},
    insertBefore(c,b){c.parentNode=this;const i=this.children.indexOf(b);if(i>=0)this.children.splice(i,0,c);else this.children.push(c);this.firstChild=this.children[0]||null;if(c.id)elements.set(c.id,c);return c},
    querySelector(q){if(q==='button'){if(!this._button){this._button=el('button')}return this._button}if(q==='.homeTop')return this._homeTop||null;if(q==='.onlineBtn')return this._onlineBtn||null;return null}};
  return x;
}
const head=el('head'),body=el('body');
for(const id of ['gensRootHome','gensFamilyHome','gensGameHome']){const h=el('div');h.id=id;const top=el('div');top.className='homeTop';top.parentNode=h;h._homeTop=top;h.children=[top];h.firstChild=top;elements.set(id,h)}
const document={readyState:'loading',head,body,createElement:el,getElementById(id){return elements.get(id)||null},addEventListener(){}};
let opened=0;const context={console,document,z40kOpenOnline(){opened++},showToast(){}};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'gens-multiplayer-entry-167831.js'});
const api=context.GenSrpGMultiplayerEntry167831;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.31');assert.equal(api.install(),3,'les trois niveaux d’accueil doivent recevoir un accès multijoueur');
const rootEntry=elements.get('gmp167831_gensRootHome');assert.ok(rootEntry);rootEntry.querySelector('button').onclick();assert.equal(opened,1,'le bouton doit appeler le multijoueur existant');
assert.equal(api.ensureAll(),3,'réinstaller ne doit pas créer de doublons');
assert.doesNotMatch(src,/createClient\s*\(/,'le bridge ne doit pas recréer Supabase');assert.doesNotMatch(src,/z40kCreateRoom\s*=/,'le bridge ne doit pas recréer le moteur hôte');assert.doesNotMatch(src,/z40kEnterRoom\s*=/,'le bridge ne doit pas recréer le moteur rejoindre');
assert.match(src,/z40kOpenOnline/);assert.match(loader,/gens-multiplayer-entry-167831\.js\?v=167833/);assert.match(sw,/gens-multiplayer-entry-167831\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','gensrpg','gens-multiplayer-entry-167831.js')),'le bridge multijoueur doit être présent dans le site final');const built=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');assert.match(built,/gens-multiplayer-entry-167831\.js\?v=167833/)}
console.log('GenSrpG multiplayer entry retained in V16.78.33: OK');
require('./dungeon_random_library_content_v167832.test.cjs');
require('./dungeon_world_session_bridge_v167832.test.cjs');
