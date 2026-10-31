'use strict';
// Exercise the REAL deployed service-worker source in an isolated service
// worker event context. No second cache controller, no gameplay simulation,
// no storage stub that could hide a user save mutation.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const sw=fs.readFileSync(path.resolve(__dirname,'../service-worker.js'),'utf8');
const scope='https://gensrpg.example/';
const assetSha='e6ef519b062e9e590faae63130ec12bfab263bac';
const imageUrl='https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/'+
 assetSha+'/assets/library/creatures/kitsune/front.png';
const cachedUrls=new Map();

function harness(){
 const callbacks=new Map();
 let online=true;
 const seen=[];
 const cache={
  async put(request,response){
   cachedUrls.set(request.url, response.clone());
  },
  async match(request){
   return cachedUrls.get(typeof request==='string'?request:request.url)?.clone();
  }
 };
 const caches={
  async open(name){
   assert.match(name,/^gensrpg-cache-/,'only one existing PWA cache owner');
   return cache;
  },
  match:request=>cache.match(request)
 };
 const opaque={
  ok:false,type:'opaque',
  clone(){return {...this};}
 };
 const network=async request=>{
  seen.push(request.url);
  if(!online)throw new Error('Network offline');
  if(new URL(request.url).origin!==new URL(scope).origin)return opaque.clone();
  return new Response('native app script',{status:200});
 };
 const self={
  location:{origin:new URL(scope).origin},
  registration:{scope,update:async()=>{}},
  skipWaiting(){},
  clients:{claim:async()=>{}},
  addEventListener(name,fn){callbacks.set(name,fn)}
 };
 vm.runInNewContext(sw,{self,URL,Request,Response,caches,fetch:network,console,
  setTimeout,clearTimeout},{filename:'service-worker.js'});
 assert.ok(callbacks.get('fetch'),'real PWA fetch event owner required');
 async function send(url,{method='GET',destination='image',mode='no-cors'}={}){
  let promise;
  const request={
   url,method,destination,mode,
   clone(){return {...this};}
  };
  const event={
   request,respondWith(result){
    assert.equal(promise,undefined,'SW must respond only once');
    promise=Promise.resolve(result);
   },waitUntil(){}
  };
  callbacks.get('fetch')(event);
  return promise?{handled:true,response:await promise}:{handled:false};
 }
 return {send,setOnline(value){online=value},seen,cachedUrls};
}

test('official immutable Lab sprite is warmed online and playable again offline via the ONLY PWA cache',async()=>{
 cachedUrls.clear();
 const h=harness();
 const online=await h.send(imageUrl);
 assert.equal(online.handled,true,'current SW must intercept official pinned creature image GET');
 assert.equal(online.response.type,'opaque','valid raw image may have an opaque no-cors response');
 assert.ok(cachedUrls.has(imageUrl),'one approved SHA-pinned image cached on first actual request');
 h.setOnline(false);
 const offline=await h.send(imageUrl);
 assert.equal(offline.handled,true);
 assert.equal(offline.response.type,'opaque','warm-offline image must be served unchanged from cache');
 assert.ok(h.seen.filter(x=>x===imageUrl).length>=1,'SW may attempt network before fallback');
});

test('PWA never becomes a proxy for arbitrary cross-origin data or moving main media',async()=>{
 cachedUrls.clear();
 const h=harness();
 for(const url of [
  'https://example.com/unrelated.webp',
  'https://raw.githubusercontent.com/other-owner/another-repo/'+assetSha+'/assets/library/a.png',
  'https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/main/assets/library/a.webp',
  'https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/'+assetSha+'/src/core/engine.js',
  'https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/'+assetSha+'/assets/library/secret.json'
 ]){
  assert.equal((await h.send(url)).handled,false,'do not intercept '+url);
 }
 assert.equal(cachedUrls.size,0,'unrelated media cannot enter Capture PWA cache');
 assert.equal((await h.send(imageUrl,{method:'POST'})).handled,false);
});

test('existing same-origin scripts retain their proven network-first/offline-cache path',async()=>{
 cachedUrls.clear();
 const h=harness();
 const url=scope+'assets/gensrpg/capture/legacy-monolith-functions-v1.js';
 const first=await h.send(url,{destination:'script',mode:'cors'});
 assert.equal(first.handled,true);
 assert.equal(first.response.ok,true);
 assert.ok(cachedUrls.has(url),'game scripts remain cached by existing SW, no second runtime');
 h.setOnline(false);
 const offline=await h.send(url,{destination:'script',mode:'cors'});
 assert.equal(offline.handled,true);
 assert.equal(await offline.response.text(),'native app script');
});
