const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const patch=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-room-visual-config-167826.js'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');

function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
function classList(){const s=new Set();return {add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},contains(x){return s.has(x)},values(){return [...s]}}}
function element(tag='div'){
  return {tagName:String(tag).toUpperCase(),id:'',value:'',innerHTML:'',dataset:{},style:{setProperty(){}},classList:classList(),children:[],parentNode:null,onpointerdown:null,onclick:null,setAttribute(){},appendChild(child){child.parentNode=this;this.children.push(child);if(child.id)elements.set(child.id,child);return child},insertBefore(child){return this.appendChild(child)},remove(){if(this.id)elements.delete(this.id)},querySelectorAll(){return []}};
}
const elements=new Map();
const body=element('body'),head=element('head'),documentElement=element('html');
const document={readyState:'loading',body,head,documentElement,addEventListener(){},createElement:element,getElementById(id){return elements.get(id)||null}};
function input(id,value){const e=element('input');e.id=id;e.value=String(value);elements.set(id,e);return e}
input('drc100Name','Crypte');input('drc100Width',4);input('drc100Height',4);

const room={id:'room-a',name:'Crypte',width:4,height:4,cells:Array.from({length:16},()=>({terrain:'floor',object:null}))};
room.cells[5].object='enemy';room.cells[9].object='chest';
const graph={id:'world-1',name:'Monde test',nodes:[{id:'zone-1',roomId:'room-a',label:'Crypte entrée'}],edges:[]};
let content={mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]};
const localStorage=storage({gensrpg_zone_graphs_v1:JSON.stringify([graph])});
const context={console,Math,Date,localStorage,document,setTimeout(){return 1},MutationObserver:function(){this.observe=()=>{}},PointerEvent:function(){},showToast(){},DungeonRoomCreator100:{findRoom(id){return id==='room-a'?JSON.parse(JSON.stringify(room)):null},loadLibrary(){return [JSON.parse(JSON.stringify(room))]}},DungeonZoneContent167824:{getZoneContent(){return JSON.parse(JSON.stringify(content))},saveZoneContent(d,n,c){assert.equal(d,'world-1');assert.equal(n,'zone-1');content=JSON.parse(JSON.stringify(c));return content},parseRewardItems(text){return String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>({itemId:s,qty:1}))},rewardItemsText(items){return items.map(x=>x.itemId).join('\n')}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(patch,context);
const api=context.DungeonRoomVisualConfig167826;
assert.ok(api,'API V16.78.26 absente');
assert.equal(api.APP_VERSION,'16.78.26');
assert.equal(api.setVisualMode(true),true,'le mode visuel doit pouvoir réellement s’activer quand la pièce est utilisée dans une zone');

const cell=element('button');cell.dataset.drcIndex='5';
api.bindCell(cell,5,'enemy');
assert.equal(typeof cell.onpointerdown,'function','la case doit recevoir son propre gestionnaire pointerdown');
let prevented=false,stopped=false,immediate=false;
cell.onpointerdown({preventDefault(){prevented=true},stopPropagation(){stopped=true},stopImmediatePropagation(){immediate=true}});
assert.equal(prevented,true,'le toucher doit bloquer le comportement de peinture');
assert.equal(stopped,true);assert.equal(immediate,true);
const modal=elements.get('drv167826Modal');
assert.ok(modal,'la fiche de configuration doit être créée après un toucher sur l’ennemi');
assert.equal(modal.classList.contains('open'),true,'la fiche de configuration doit réellement s’ouvrir');

api.configureElement('world-1','zone-1','room-a',9,'chest',{rarity:'epic',gold:25,itemsText:'potion_soin'});
assert.equal(content.mode,'fixed');assert.equal(content.chests.length,1);assert.equal(content.chests[0].cell,9);
assert.match(patch,/el\.onpointerdown=handler/,'le correctif doit brancher directement chaque case');
assert.doesNotMatch(patch,/DOC\.addEventListener\("pointerdown",intercept,true\)/,'l’ancien intercepteur global fragile ne doit plus être utilisé');
assert.match(loader,/DungeonZoneContent167824/,'le loader doit attendre le runtime de contenu exact');
assert.match(loader,/drv167826Script/,'le loader doit charger la V16.78.26');
assert.match(loader,/dzc167824Launch/,'l’ancien launcher doit être neutralisé');
assert.doesNotMatch(loader,/dungeon-room-visual-config-167825\.js/,'l’ancien asset V16.78.25 ne doit plus être chargé');
console.log('Dungeon Room visual configuration V16.78.26 pointer regression: OK');
