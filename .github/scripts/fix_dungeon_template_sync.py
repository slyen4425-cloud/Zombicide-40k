from pathlib import Path
import re

runtime=Path('assets/dungeon/dungeon-authored-runtime-167839.js')
s=runtime.read_text(encoding='utf-8')
old='try{return z.saveZoneContent?.(g.id,node.id,tpl)||tpl}catch(e){return tpl}'
if old not in s:
    raise SystemExit('authored runtime materialization hook not found')
s=s.replace(old,'return clone(tpl)',1)
runtime.write_text(s,encoding='utf-8')

p=Path('assets/dungeon/dungeon-room-template-content-167828.js')
s=p.read_text(encoding='utf-8')
pattern=r'function configureTemplate\(roomId,cell,obj,data\)\{.*?\nfunction ensureStyles\(\)'
replacement=r'''function uid(prefix){return String(prefix||"tpl")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function contentSignature(content){const c=clone(content)||emptyContent();delete c.updatedAt;return JSON.stringify(c)}
function defaultSpec(obj,cell){const i=Number(cell);if(obj==="enemy"||obj==="boss")return {id:uid("enemy"),enemyId:"dng_skeleton",qty:1,cell:i,role:obj==="boss"?"boss":"enemy",hasKey:false};if(obj==="chest")return {id:uid("chest"),cell:i,rarity:"common",gold:0,items:[],label:""};if(obj==="trap")return {id:uid("trap"),cell:i,trapType:"damage",damage:0,refId:"",label:"",once:true};if(obj==="puzzle")return {id:uid("puzzle"),cell:i,refId:"",targetType:"cell",label:""};return null}
function reconcileTemplate(roomId,previousTemplate){
  const id=String(roomId||inferRoomId()),r=id?roomApi()?.findRoom?.(id):null,z=zoneApi();if(!id||!r||!z?.saveZoneContent)return null;
  const before=previousTemplate?clone(previousTemplate):templateContent(id),next=clone(templateContent(id));next.mode="fixed";
  const keep=(list,obj)=>{const out=[];for(const spec of Array.isArray(list)?list:[]){const cell=Number(spec?.cell),actual=String(r.cells?.[cell]?.object||"");const ok=obj==="enemy"?(actual==="enemy"&&String(spec?.role||"enemy")!=="boss"):(obj==="boss"?(actual==="boss"&&String(spec?.role||"enemy")==="boss"):actual===obj);if(ok)out.push(spec)}return out};
  next.enemies=[...keep(next.enemies,"enemy"),...keep(next.enemies,"boss")];next.chests=keep(next.chests,"chest");next.traps=keep(next.traps,"trap");next.puzzles=keep(next.puzzles,"puzzle");
  for(let i=0;i<r.cells.length;i++){const obj=String(r.cells[i]?.object||"");if(!CONFIGURABLE.has(obj))continue;if(!specAt(next,obj,i)){const spec=defaultSpec(obj,i);if(obj==="enemy"||obj==="boss")next.enemies.push(spec);else if(obj==="chest")next.chests.push(spec);else if(obj==="trap")next.traps.push(spec);else if(obj==="puzzle")next.puzzles.push(spec)}}
  const saved=saveTemplate(id,next);propagateToInheritedZones(id,before);return saved
}
function configureTemplate(roomId,cell,obj,data){const id=String(roomId||inferRoomId()),api=visualApi();if(!id||!api?.configureElement)return null;const before=templateContent(id),out=api.configureElement(TEMPLATE_DUNGEON_ID,id,id,Number(cell),String(obj),data||{});reconcileTemplate(id,before);return out}
function removeTemplate(roomId,cell,obj){const id=String(roomId||inferRoomId()),api=visualApi();if(!id||!api?.removeElement)return null;const before=templateContent(id),out=api.removeElement(TEMPLATE_DUNGEON_ID,id,Number(cell),String(obj));reconcileTemplate(id,before);return out}
function copyTemplateToZone(dungeonId,nodeId,roomId,force){
  const z=zoneApi();if(!z?.getZoneContent||!z?.saveZoneContent)return false;const current=z.getZoneContent(String(dungeonId||""),String(nodeId||""));
  if(force||current?.mode==="inherit"){if(force&&current?.mode!=="inherit")z.saveZoneContent(String(dungeonId||""),String(nodeId||""),emptyContent());return true}return false
}
function propagateToInheritedZones(roomId,previousTemplate){
  const b=builderApi(),z=zoneApi();if(!b?.loadLibrary||!z?.getZoneContent||!z?.saveZoneContent)return 0;let n=0;const previous=previousTemplate?contentSignature(previousTemplate):"";
  for(const g of b.loadLibrary()||[])for(const node of g.nodes||[])if(String(node.roomId||"")===String(roomId||"")){const current=z.getZoneContent(g.id,node.id);if(current?.mode==="inherit"){n++;continue}if(previous&&contentSignature(current)===previous){z.saveZoneContent(g.id,node.id,emptyContent());n++}}
  return n
}
function wrapRoomSaves(){const api=roomApi();if(!api||api.__drt167828SaveWrapped||typeof api.saveCurrent!=="function")return false;const old=api.saveCurrent;api.saveCurrent=function(){const beforeId=inferRoomId(),before=beforeId?templateContent(beforeId):null,out=old.apply(this,arguments),id=String(out?.id||beforeId||"");if(id)try{reconcileTemplate(id,before)}catch(e){console.warn("GenSrpG template reconcile",e)}return out};api.__drt167828SaveWrapped=true;return true}
function wrapBuilder(){
  wrapRoomSaves();const b=builderApi();if(!b||b.__drt167828Wrapped||typeof b.addRoomInstance!=="function")return false;
  const old=b.addRoomInstance;b.addRoomInstance=function(dungeonId,roomId,label){const out=old.apply(this,arguments);try{const node=out?.node;if(node?.id){const z=zoneApi(),current=z?.getZoneContent?.(dungeonId,node.id);if(current?.mode!=="inherit")z?.saveZoneContent?.(dungeonId,node.id,emptyContent())}}catch(e){console.warn("GenSrpG V16.78.45 template inherit",e)}return out};b.__drt167828Wrapped=true;return true;
}
function ensureStyles()'''
ns,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'template block replacement count={n}')
p.write_text(ns,encoding='utf-8')

test=Path('tests/dungeon_room_template_content_v167828.test.cjs')
t=test.read_text(encoding='utf-8')
old_assert="assert.equal(copied.mode,'fixed','le contenu du modèle doit être copié dans la nouvelle instance de zone');assert.equal(copied.enemies[0].enemyId,'dng_orc');assert.equal(copied.enemies[0].cell,5);"
new_assert="assert.equal(copied.mode,'inherit','une nouvelle zone doit rester liée dynamiquement à sa pièce source');assert.equal(copied.enemies.length,0,'aucune copie figée du contenu du modèle ne doit être créée dans la zone');"
if old_assert not in t:
    raise SystemExit('template copy assertion not found')
t=t.replace(old_assert,new_assert,1)
marker="assert.equal(zoneApi.getZoneContent('world-1',added.node.id).enemies[0].enemyId,'dng_lich');"
extra="""assert.equal(zoneApi.getZoneContent('world-1',added.node.id).enemies[0].enemyId,'dng_lich');
activeRoom.cells[5].object=null;roomApi.saveCurrent();assert.equal(api.templateContent('room-direct').enemies.length,0,'effacer un ennemi de la grille doit supprimer son ancien réglage fantôme');assert.equal(zoneApi.getZoneContent('world-1',added.node.id).enemies[0].enemyId,'dng_lich','une variante divergente doit rester indépendante');
activeRoom.cells[3].object='enemy';activeRoom.cells[4].object='enemy';roomApi.saveCurrent();const synced=api.templateContent('room-direct');assert.equal(synced.enemies.length,2,'les nouveaux ennemis placés sur la pièce doivent devenir le contenu du modèle');assert.equal(synced.enemies.every(e=>e.enemyId==='dng_skeleton'),true,'un élément non configuré reçoit un réglage par défaut cohérent');"""
if marker not in t:
    raise SystemExit('variant assertion marker not found')
t=t.replace(marker,extra,1)
t=t.replace("assert.match(src,/setTimeout\\(refreshEditor,0\\)/,'les rafraîchissements doivent suivre uniquement les actions du Créateur');","assert.match(src,/reconcileTemplate/,'la pièce source doit nettoyer et reconstruire son contenu exact');assert.match(src,/wrapRoomSaves/,'la sauvegarde de pièce doit resynchroniser le modèle');assert.match(src,/setTimeout\\(refreshEditor,0\\)/,'les rafraîchissements doivent suivre uniquement les actions du Créateur');",1)
test.write_text(t,encoding='utf-8')

wf=Path('.github/workflows/main.yml')
w=wf.read_text(encoding='utf-8')
anchor='      - name: Tester le créateur de pièces Dungeon V2\n        run: node tests/dungeon_room_creator_v2_v167819.test.cjs\n'
add=anchor+'\n      - name: Tester la synchronisation pièce source et variantes\n        run: node tests/dungeon_room_template_content_v167828.test.cjs\n'
if 'Tester la synchronisation pièce source et variantes' not in w:
    if anchor not in w:
        raise SystemExit('main workflow anchor not found')
    w=w.replace(anchor,add,1)
    wf.write_text(w,encoding='utf-8')
