import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableAdventureMerchantsForNpcV1}
 from '../assets/gensrpg/capture-v2/adventure-merchant-catalog-bridge-v1.mjs';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,createAdventureStoreV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {createAdventureRulesDraftStoreV1}
 from '../assets/gensrpg/capture-v2/adventure-rules-draft-v1.mjs';

const source=p=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+p,import.meta.url),'utf8');
const storage=()=>{
 const data=new Map();
 return {getItem:key=>data.get(key)??null,setItem:(key,v)=>data.set(key,String(v)),
  removeItem:key=>data.delete(key),key:i=>[...data.keys()][i]??null,
  get length(){return data.size;}};
};
const coreStorage={
 readJson:(s,key,fallback)=>s.getItem(key)===null?fallback:JSON.parse(s.getItem(key)),
 writeJson:(s,key,value)=>s.setItem(key,JSON.stringify(value))
};
const catalog=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
 economy:{currency:{singular:'jeton',plural:'jetons'},merchants:[
  {id:'merchant-forest',name:'Marchand des bois',buysItems:true,offers:[]},
  {id:'merchant-rare',name:'Marchand rare',buysItems:false,offers:[]}]}
});
const published=[{id:'crea_nat_1',name:'Grainou',skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}];
test('NPC merchant list is read ONLY from the Core-owned rules draft or active AdventureSession',async()=>{
 const s=storage();
 assert.deepEqual(await availableAdventureMerchantsForNpcV1({storage:s,coreStorage}),[]);
 const draft=createAdventureRulesDraftStoreV1({storage:s,coreStorage});
 draft.save(catalog);
 assert.deepEqual(await availableAdventureMerchantsForNpcV1({storage:s,coreStorage}),
  [{id:'merchant-forest',name:'Marchand des bois'},{id:'merchant-rare',name:'Marchand rare'}]);
 const session=createAdventureSessionV1({bestiaryCards:published,starterId:'crea_nat_1',
  rules:normalizeAdventureRulesV1({...catalog,economy:{
   ...catalog.economy,merchants:[{...catalog.economy.merchants[0],name:'Marchand renommé'}]}}),
  ids:{sessionId:'shop-session',instanceId:'shop-creature'},now:'2026-11-10T19:54:00.000Z'});
 createAdventureStoreV1({storage:s,coreStorage}).create(session);
 assert.deepEqual(await availableAdventureMerchantsForNpcV1({storage:s,coreStorage}),
  [{id:'merchant-forest',name:'Marchand renommé'}],
  'session owner wins over draft and rename preserves stable internal reference');
});
test('Shell transports catalog by name, never stores merchant inventory or shows raw identifiers',()=>{
 const shell=source('shell-entry-v1.js');
 assert.match(shell,/gensrpg.exploration.npc.merchant.catalog.request.v1/);
 assert.match(shell,/availableAdventureMerchantsForNpcV1/);
 assert.match(shell,/event.source!==frame.contentWindow/);
 assert.match(shell,/event.origin!==root.location.origin/);
 assert.doesNotMatch(shell,/merchant\.id.*textContent|merchant\.id.*innerText/);
});
test('in-game shop listens only to its active Explorer iframe and uses canonical locked trades',()=>{
 const shop=source('adventure-merchant-play-v1.mjs'),html=source('adventure.html'),
  app=source('adventure-app-v1.mjs');
 for(const name of ['adventure-merchant-dialog','adventure-merchant-close',
  'adventure-merchant-trades','adventure-merchant-message'])
  assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(shop,/gensrpg.exploration.npc.merchant.open.v1/);
 assert.match(shop,/event.origin!==window.location.origin\|\|event.source!==frame.contentWindow/);
 assert.match(shop,/gensrpg.capture.v2.npc.merchant.open-ack.v1/);
 assert.match(shop,/gensrpg.capture.v2.npc.merchant.closed.v1/);
 assert.match(shop,/window\.navigator\.locks\.request/);
 assert.match(shop,/gensrpg.capture.v2.adventure-combat:/);
 assert.match(shop,/tradeAdventureMerchantV1/);
 assert.match(shop,/save\(result.session\)/);
 assert.match(shop,/hasPendingCombat\(openedSession\)/);
 assert.match(app,/installAdventureMerchantPlayV1/);
 assert.doesNotMatch(shop,/localStorage|sessionStorage/);
});
