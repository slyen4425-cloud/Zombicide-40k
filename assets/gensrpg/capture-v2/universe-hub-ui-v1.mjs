// Capture-owned UI for selecting a GAME UNIVERSE, never a saved adventure.
// Shell remains the only navigation controller and owns the native frames.
import {createCaptureUniverseProjectStoreV1} from './universe-project-store-v1.mjs';
import {loadCaptureUniverseNativeBridgeV1} from './universe-native-bridge-v1.mjs';
const el=(doc,tag,className,text)=>{
 const node=doc.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
};
export async function createCaptureUniverseHubUiV1({
 document,root,container,notice,onSelect,load=loadCaptureUniverseNativeBridgeV1
}={}){
 if(!document||!container||typeof onSelect!=='function')
  throw new TypeError('Container Shell et callback de sélection requis');
 // Legacy Monster InvoC must be selectable even while native Lab bundles
 // are loading. Project management remains Capture/Core Storage's owner.
 const projectStore=createCaptureUniverseProjectStoreV1({
  storage:root.localStorage,coreStorage:root.GensStorageV1,
  makeId:()=>root.crypto.randomUUID()
 });
 let nativePromise=null;
 const native=()=>nativePromise??=Promise.resolve().then(()=>load({root}));
 let current=null;
 const surface=el(document,'div','capture-universe-library');
 container.replaceChildren(surface);
 const err=message=>{notice.textContent=message;notice.dataset.error='true'};
 const inform=message=>{notice.textContent=message;notice.dataset.error='false'};
 function projectCard(project){
  const row=el(document,'div','capture-universe-card');
  row.dataset.universeId=project.id;
  const action=el(document,'button','capture-universe-select',
   project.name+(project.status==='pending'?' · Initialisation incomplète':''));
  action.type='button';
  action.dataset.captureUniverseSelect=project.id;
  action.addEventListener('click',async()=>{
   action.disabled=true;
   try{
    const item=project.status==='pending'?await (await native()).resume(project.id):projectStore.select(project.id);
    const selected=projectStore.select(item.id);
    current=selected;
    onSelect(selected);
    inform('Univers '+selected.name+' sélectionné. Choisis Jouer ou Éditeurs.');
   }catch(error){err('Univers non ouvert : '+String(error?.message??error));}
   finally{action.disabled=false;}
  });
  const rename=el(document,'button','capture-universe-rename','Renommer');
  rename.type='button';
  rename.addEventListener('click',()=>{
   surface.replaceChildren();
   const form=el(document,'form','capture-universe-form');
   const label=el(document,'label',null,'Nouveau nom de cet univers');
   const input=el(document,'input');input.type='text';input.required=true;
   input.maxLength=80;input.value=project.name;input.autocomplete='off';
   label.append(input);
   const submit=el(document,'button',null,'Enregistrer le nom');submit.type='submit';
   const back=el(document,'button',null,'Annuler');back.type='button';
   back.addEventListener('click',()=>render());
   form.append(label,submit,back);
   form.addEventListener('submit',event=>{
    event.preventDefault();
    try{projectStore.rename(project.id,input.value);inform('Nom d’univers enregistré, aucune partie modifiée.');render();}
    catch(error){err(String(error?.message??error));}
   });
   surface.append(form);
  });
  row.append(action,rename);
  return row;
 }
 function showCreate(){
  surface.replaceChildren();
  const form=el(document,'form','capture-universe-form');
  const label=el(document,'label',null,'Nom du nouvel univers');
  const name=el(document,'input');name.required=true;name.maxLength=80;
  name.autocomplete='off';name.placeholder='Ex. Héros Manga';
  label.append(name);
  const method=el(document,'label',null,'Point de départ');
  const select=el(document,'select');
  const blank=el(document,'option',null,'Univers vierge — personnages et règles personnalisables');
  blank.value='';select.append(blank);
  for(const p of projectStore.list().filter(p=>p.status==='ready'&&!p.legacy)){
   const option=el(document,'option',null,'Copier les réglages de '+p.name);
   option.value=p.id;select.append(option);
  }
  // Legacy Monster InvoC is never silently cloned: its authored data still
  // requires an explicit official Combat export, not a database shortcut.
  method.append(select);
  const submit=el(document,'button',null,'Créer cet univers');
  submit.type='submit';
  const cancel=el(document,'button',null,'Retour aux univers');
  cancel.type='button';cancel.addEventListener('click',()=>render());
  form.append(label,method,submit,cancel);
  form.addEventListener('submit',async event=>{
   event.preventDefault();submit.disabled=true;
   try{
    const parent=select.value;
    if(parent&&!root.confirm('Copier les données du projet choisi dans un nouvel univers indépendant ?')){
     inform('Copie annulée, les deux univers sont conservés.');return;
    }
    const bridge=await native();
    const created=parent
     ?await bridge.createCopy(name.value,parent,{confirmed:true})
     :await bridge.createBlank(name.value);
    const selected=projectStore.select(created.id);
    current=selected;onSelect(selected);
    inform('Univers '+selected.name+' créé. Les autres univers sont inchangés.');
   }catch(error){
    err('Création non terminée : '+String(error?.message??error)+'. Aucun contenu historique supprimé.');
    render();
   }finally{submit.disabled=false;}
  });
  surface.append(form);
 }
 function render(){
  surface.replaceChildren();
  const heading=el(document,'h2',null,'Mes univers Monster Capture');
  const explain=el(document,'p',null,
   'Choisis Monster InvoC ou crée un univers indépendant avec ses propres éditeurs et parties.');
  surface.append(heading,explain);
  for(const project of projectStore.list())surface.append(projectCard(project));
  const create=el(document,'button','capture-universe-create','＋ Créer un univers');
  create.type='button';create.dataset.captureUniverseCreate='true';
  create.addEventListener('click',showCreate);surface.append(create);
 }
 render();
 return Object.freeze({
  showList(){current=null;render();},
  showCreate,
  selected:()=>current,
  stop(){container.replaceChildren();current=null;}
 });
}
