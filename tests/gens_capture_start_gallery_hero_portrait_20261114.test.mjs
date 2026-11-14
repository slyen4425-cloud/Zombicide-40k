import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adventureSaveDisplayNameV1} from '../assets/gensrpg/capture-v2/adventure-save-list-presentation-v1.mjs';
import {officialHeroPortraitUrlV1} from '../assets/gensrpg/capture-v2/adventure-hero-portrait-v1.mjs';
const src=p=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+p,import.meta.url),'utf8');

test('only derived World_Hero labels are visible, never session identifiers',()=>{
 assert.equal(adventureSaveDisplayNameV1({worldName:'Plaine 1',heroName:'Slyen'}),'Plaine 1_Slyen');
 assert.equal(adventureSaveDisplayNameV1({worldName:'Neige',heroName:'Aurore'}),'Neige_Aurore');
 assert.equal(adventureSaveDisplayNameV1({}),'Monde local_Héros');
 const index=src('adventure-portfolio-store-v1.mjs');
 assert.match(index,/worldId:state\.world\?\.mapRef/);
 assert.match(index,/heroName:state\.hero\?\.displayName/);
 assert.match(index,/const slot=id=>createAdventureStoreV1/);
 assert.doesNotMatch(index,/sessionId\.slice/);
 const app=src('adventure-app-v1.mjs');
 assert.match(app,/portfolioTitle\(entry\)/);
 assert.match(app,/activeSaveTitle\(state\)/);
 assert.doesNotMatch(app,/'Partie '\+state\.sessionId\.slice/);
 assert.doesNotMatch(app,/document\.querySelector\('.adventure-save-picker'/);
});
test('portrait belongs to official library and is verified against stored hero sprite bytes',async()=>{
 const root='https://example.org/preview/native/vendor/exploration-lab/';
 const reference=new Uint8Array([1,6,12,3,0,4]);
 const record={name:'Heros bleu',mapVisual:{animation:{mode:'directions'},assetId:'hero.user.sample.base'},
  assets:[{id:'hero.user.sample.base',blob:new Blob([reference])},
   ...Array.from({length:48},(_,i)=>({id:'frame'+i,blob:new Blob([reference])}))]};
 const catalog={heroes:[{name:'Heros bleu',
  thumbnail:'assets/exploration/actors/official/01_heros_bleu/modele_face.png',
  directions:{S:['assets/exploration/actors/official/01_heros_bleu/S_0.png']}}]};
 const fetchAsset=async()=>({ok:true,arrayBuffer:async()=>reference.buffer});
 assert.equal(await officialHeroPortraitUrlV1({record,catalog,rootUrl:root,fetchAsset}),
  root+'assets/exploration/actors/official/01_heros_bleu/modele_face.png');
 const changed={...record,assets:[{id:record.mapVisual.assetId,
  blob:new Blob([new Uint8Array([1,6,12,3,0,5])])},...record.assets.slice(1)]};
 assert.equal(await officialHeroPortraitUrlV1({record:changed,catalog,rootUrl:root,fetchAsset}),null);
 assert.equal(await officialHeroPortraitUrlV1({record:{...record,name:'Héros personnel'},catalog,rootUrl:root,fetchAsset}),null);
});
test('real startup has two center choices, a card list, and no old dropdown UI',()=>{
 const html=src('adventure.html'),css=src('adventure-style-v1.css'),app=src('adventure-app-v1.mjs');
 for(const id of ['adventure-start-new','adventure-start-load','adventure-save-gallery',
  'adventure-save-select','adventure-save-load','adventure-save-delete',
  'adventure-new-config','adventure-session-panel','adventure-open-sheet'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/id="adventure-save-select"[^>]*hidden/);
 assert.doesNotMatch(html,/id="adventure-resume"/);
 assert.equal((html.match(/id="adventure-return-title"/g)||[]).length,1);
 assert.match(css,/body\[data-adventure-start-view="choice"\] \.adventure-columns\{display:none!important\}/);
 assert.match(css,/#adventure-play-hud\{position:fixed;z-index:15;bottom:/);
 assert.match(css,/left:50%;right:auto;transform:translateX\(-50%\)/);
 assert.match(app,/setAdventureStartView\('choice'\)/);
 assert.match(app,/portfolio\.select\(chosen\)/);
 assert.match(app,/officialHeroPortraitUrlV1\(/);
});
