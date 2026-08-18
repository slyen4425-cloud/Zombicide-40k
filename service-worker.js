const CACHE='z40k-v16.15.2';

const ASSETS=[
  "./",
  "./index.html",
  "./sound_01_5a7aa6fd210f.mp3",
  "./sound_02_44507b85805d.mp3",
  "./sound_03_b042f7eaca4f.mp3",
  "./sound_04_c2d84fde5f22.mp3",
  "./sound_05_cc33c084140a.mp3",
  "./sound_06_bd36391a0314.mp3",
  "./sound_07_06c11a42f47b.mp3",
  "./sound_08_1791f0b1ebdf.mp3",
  "./sound_09_6a481f714ffa.mp3",
  "./sound_10_63c7b3b5ac3d.mp3",
  "./sound_11_1a85bb45b510.mp3",
  "./sound_12_c96232709a91.mp3",
  "./sound_13_b3188e5b590f.mp3",
  "./sound_14_518d762b6854.mp3",
  "./sound_15_b8c8ebe2b96a.mp3",
  "./sound_16_f4ff78900d6f.mp3",
  "./sound_17_2bab4ef9acf8.mp3",
  "./sound_18_83355cfb9962.mp3",
  "./sound_19_282d13f089b4.mp3",
  "./sound_20_ada83f3e030f.mp3",
  "./sound_21_9fa2e8181c53.mp3",
  "./sound_22_6c998e99a122.mp3",
  "./sound_23_226592b0abd8.mp3",
  "./sound_24_72c8b78a5c4a.mp3",
  "./sound_25_fffe5abdbae1.mp3",
  "./sound_26_dbb01bd021d2.mp3"
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(k=>k!==CACHE)
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',e=>{
  if(e.data && e.data.type==='SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;

  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r=>
      r || fetch(e.request).then(resp=>{
        const copy=resp.clone();

        caches.open(CACHE).then(c=>{
          c.put(e.request,copy);
        });

        return resp;
      })
    )
  );
});
