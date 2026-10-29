// Mount the ACTUAL pinned Laboratory Capture editor battle presentation.
// Its HTML/CSS/visual adapter, Combat UI, FX, AI and Runtime are Lab files.
// GenSrpg only maps stable actor IDs and supplies authoritative authored data.
export function createCaptureNativeLabSceneV1({
 host,siteBaseUrl,resources
}){
 if(!host||typeof host.attachShadow!=='function'||host.shadowRoot)
   throw new TypeError('Native Lab scene requires one fresh, dedicated host');
 const base=new URL(siteBaseUrl),lab=new URL('vendor/combat-lab/',base);
 if(base.origin!==globalThis.location?.origin)
   throw new TypeError('Native Lab scene requires same-origin pinned delivery');
 const source=resources?.source,catalog=resources?.catalog;
 if(!/^[a-f0-9]{40}$/.test(source?.assetsSha)||!source.assetsRepository||
    !Array.isArray(catalog?.assets)||typeof resources?.authoredSource?.buildEncounter!=='function')
   throw new TypeError('Pinned Lab author and media catalog required');
 const uri=name=>new URL(name,lab).href;
 const mediaUrl=file=>{
  if(typeof file!=='string'||!file||file.startsWith('/')||file.split('/').includes('..'))
   throw new TypeError('Invalid pinned Combat media path');
  return new URL('assets/library/'+file,
   'https://raw.githubusercontent.com/'+source.assetsRepository+'/'+source.assetsSha+'/').href;
 };
 const mediaForId=id=>{
  const entry=catalog.assets.find(asset=>asset.id===id);
  const resource=entry?.resource;
  if(!resource?.file)return null;
  return Object.freeze({
   assetId:id,url:mediaUrl(resource.file),
   frameCount:Math.max(1,Math.floor(Number(resource.frameCount)||1)),
   ...(Number(resource.frameMs)>0?{frameMs:Number(resource.frameMs)}:{}),
   playbackMode:resource.playbackMode==='loop'?'loop':'once'
  });
 };
 const actorTranslation=Object.freeze({
  'local-1':'player','local-2':'ally',
  'opponent-1':'opponent','opponent-2':'opponent-b'
 });
 const actorAttributes=['data-demo-slot','data-target-actor','data-preview-actor-ui',
  'data-combat-hp','data-combat-hp-value','data-combat-status-icons',
  'data-combat-action','data-combat-actor-charge',
  'data-combat-energy','data-combat-energy-value','data-combat-energy-orbs'];
 let used=false;
 return async function mountNativeLab(context,resolved,initialHpByActor){
  if(used)throw new Error('Official Lab arena cannot be mounted twice');
  used=true;
  const shell=host.attachShadow({mode:'open'});
  const [page,visual,preview,present,...profiles]=await Promise.all([
   fetch(uri('examples/dom-demo/capture-editor-v2.html'),{cache:'no-store'}).then(r=>{
    if(!r.ok)throw Error('Lab combat HTML missing');return r.text();
   }),
   import(uri('src/adapters/input/capture/capture-export-to-native-visual-source-v1.js')),
   import(uri('src/ui/capture-combat-preview-v1.js')),
   import(uri('src/adapters/renderer/capture-skill-presentation-assets-v2.js')),
   ...['biped','quadruped','serpentine','flying','massive'].map(name=>
    fetch(uri('data/profiles/'+name+'.profile.json'),{cache:'no-store'}).then(r=>{
     if(!r.ok)throw Error('Lab profile missing: '+name);return r.json();
    }))
  ]);
  const document=host.ownerDocument;
  const parsed=new DOMParser().parseFromString(page,'text/html');
  const template=parsed.querySelector('template[data-capture-preview-template]');
  if(!template)throw new Error('Signed Lab battle DOM template missing');
  // Preserve the EXACT selectors used by the Lab's official landscape HUD.
  // Omitting this authored shell collapses its mobile layout to a generic demo.
  const container=document.createElement('section');
  container.className='capture-preview-shell';
  container.dataset.landscapeRequired='true';
  const previewHost=document.createElement('div');
  previewHost.className='capture-preview-host';
  previewHost.append(template.content.cloneNode(true));
  container.append(previewHost);
  const root=previewHost.querySelector('[data-combat-demo]');
  if(!root||!root.querySelector('[data-combat-arena]'))
   throw new Error('Signed Lab native battle arena missing');
  for(const node of root.querySelectorAll('*')){
   for(const attr of actorAttributes){
    const old=node.getAttribute(attr);
    if(old&&Object.prototype.hasOwnProperty.call(actorTranslation,old))
      node.setAttribute(attr,actorTranslation[old]);
   }
  }
  const presentActors=new Map(resolved.nativeCombatSource.battleFormat.actors.map(a=>[a.actorId,a]));
  for(const node of root.querySelectorAll('[data-preview-actor-ui]')){
   const actor=presentActors.get(node.getAttribute('data-preview-actor-ui'));
   node.hidden=!actor;
   if(actor)for(const label of node.querySelectorAll('strong,[data-demo-label]'))
     label.textContent=actor.displayName;
  }
  if([...presentActors.keys()].some(id=>!root.querySelector('[data-demo-slot="'+id+'"]')))
   throw new Error('Lab scene does not contain all official active actor slots');
  const nativeVisual=visual.adaptCaptureExportToNativeVisualSourceV1({
   exported:resolved.exported,assetCatalog:catalog,profiles,
   assetUrlForFile:mediaUrl
  });
  const nativeAssets=present.createCaptureSkillPresentationAssetsV2({
   skillPresentations:resolved.nativeCombatSource.skillPresentations??{},
   assetForId:mediaForId
  });
  const presentationAssets=Object.freeze({
   presentationForSkill:(id,context)=>nativeAssets.presentationForSkill(id,context),
   statusPresentationFor:(id,context)=>nativeAssets.statusPresentationFor(id,context),
   audioAsset:id=>nativeAssets.audioAsset(id),
   asset:mediaForId
  });
  const links=['examples/dom-demo/demo.css','examples/dom-demo/capture-editor-v2.css'];
  await Promise.all(links.map(file=>new Promise((resolve,reject)=>{
   const link=document.createElement('link');link.rel='stylesheet';link.href=uri(file);
   link.addEventListener('load',resolve,{once:true});
   link.addEventListener('error',()=>reject(new Error('Lab CSS missing: '+file)),{once:true});
   shell.append(link);
  })));
  shell.append(container);
  host.hidden=false;
  try{
   const mounted=await preview.mountCaptureCombatPreviewV1({
    root,nativeCombatSource:resolved.nativeCombatSource,
    nativeVisualSource:nativeVisual,embeddedBattle:{initialHpByActor},
    presentationAssets
   });
   return Object.freeze({
    combat:mounted.combat,
    dispose(){mounted.dispose();shell.replaceChildren();host.hidden=true;}
   });
  }catch(error){shell.replaceChildren();host.hidden=true;throw error;}
 };
}
