// Actual Capture editor/skill/rules/bestiary navigation to the unmodified
// official Combat Lab main modules delivered and verified in the GenSrpg Pages artifact.
// This is a viewport host, NOT an editor, catalog writer or second combat Core.
// The game retains its own saved profile and only consumes CI-verified/pinned
// Lab author exports when a release is published.
import {createCaptureLabAuthorUiProviderV1} from './capture-lab-author-ui-provider-v1.mjs';

const root=globalThis;
let active=null;
const LABELS=Object.freeze({
 creature:'Créatures',skill:'Compétences',rules:'Règles de combat',
 bestiary:'Bestiaire'
});
function owners(){
 const port=root.GensCaptureLabOwnershipPortV1;
 if(!port||typeof port.install!=='function'||typeof port.openAuthoring!=='function')
  throw new Error('Port officiel unique du Labo Combat indisponible');
 if(root.GensCaptureV1?.isProfile?.(root.getActiveGameProfile?.())!==true)
  throw new Error('Ce panneau appartient exclusivement au mode Monster Capture');
 return port;
}
function makeHost(info){
 const doc=root.document;
 if(!doc?.createElement||!doc.body)throw new Error('Interface du jeu indisponible');
 const backdrop=doc.createElement('section');
 backdrop.id='gensCaptureLabAuthorHost';
 backdrop.setAttribute('role','dialog');
 backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-label','Labo Combat officiel — '+LABELS[info.kind]);
 backdrop.style.cssText='position:fixed;inset:0;z-index:700000;background:#07131d;display:flex;flex-direction:column;min-height:0;color:white';
 const bar=doc.createElement('div');
 bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:48px;padding:5px 10px;background:#14222e';
 const title=doc.createElement('strong');
 title.textContent='Labo Combat officiel — '+LABELS[info.kind];
 title.style.cssText='font:700 15px system-ui;flex:1;min-width:150px';
 const note=doc.createElement('small');
 note.textContent='Les modifications deviennent disponibles dans GenSrpg après publication et validation du Labo.';
 note.style.cssText='font:11px system-ui;color:#c3ccd3;max-width:440px';
 const close=doc.createElement('button');
 close.type='button';close.textContent='✕ Retour au jeu';
 close.style.cssText='font:700 13px system-ui;min-height:37px;padding:7px 12px;border-radius:8px;background:#36556a;color:white';
 const frame=doc.createElement('iframe');
 frame.title='Éditeur ou bestiaire original du Labo Combat';
 frame.src=info.url;
 frame.setAttribute('referrerpolicy','same-origin');
 frame.style.cssText='width:100%;height:100%;min-height:0;flex:1;border:0;background:#0c131d';
 bar.append(title,note,close);backdrop.append(bar,frame);
 const owner=doc.body;owner.append(backdrop);
 const key=e=>{if(e.key==='Escape'){e.preventDefault();root.GensCaptureLabAuthorUiV1?.close();}};
 doc.addEventListener('keydown',key);
 close.addEventListener('click',()=>root.GensCaptureLabAuthorUiV1?.close());
 return Object.freeze({dispose(){
  doc.removeEventListener('keydown',key);
  frame.src='about:blank';backdrop.remove();
 }});
}
function open(kind){
 if(active)return false;
 const port=owners();
 if(port.status().installed)throw new Error('Une session Labo est déjà active; termine-la avant de changer de domaine');
 const provider=createCaptureLabAuthorUiProviderV1({
  labBaseUrl:new URL('vendor/combat-lab/',new URL('./',root.document?.baseURI||root.location.href)).href,
  hostOrigin:root.location.origin,mountLabPage:makeHost
 });
 let handle;
 try{
  port.install(provider);
  handle=port.openAuthoring(kind,{source:'GenSrpg-Monster-Capture'});
  if(!handle)throw new Error('Le Labo officiel ne peut pas ouvrir ce domaine');
  active={provider,handle,port};
  return true;
 }catch(error){
  try{port.closeEditor();}catch(_){}
  if(port.status().installed&&!port.status().battleActive)try{port.uninstall(provider);}catch(_){}
  throw error;
 }
}
function close(){
 if(!active)return false;
 const a=active;
 a.port.closeEditor();
 a.port.uninstall(a.provider);
 active=null;
 return true;
}
function status(){return Object.freeze({active:!!active,kind:active?.port.status().editorKind??null});}
if(root.GensCaptureLabAuthorUiV1)throw new Error('Double installation du propriétaire auteur Capture');
root.GensCaptureLabAuthorUiV1=Object.freeze({open,close,status});
