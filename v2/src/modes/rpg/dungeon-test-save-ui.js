import { saveDungeonTestSession, loadDungeonTestSession, clearDungeonTestSession } from './dungeon-test-save.js';

function clone(value){return structuredClone(value);}

export function mountDungeonTestSaveControls(host,{provider=null,getState=()=>null,onResume=null}={}){
  if(!host) return {dispose(){}};
  host.querySelector('[data-dungeon-test-save-controls]')?.remove();
  const state=getState?.()||null;
  const hasRuntime=Boolean(state?.roomRuntime?.currentRoomId);
  const section=document.createElement('section');
  section.className='editor-section dungeon-test-save-controls';
  section.dataset.dungeonTestSaveControls='';
  section.innerHTML=hasRuntime
    ?'<div class="section-title-row"><div><h3>💾 Partie test</h3><p class="muted">Sauvegarde locale minimale de cette session V2.</p></div><button type="button" class="secondary-button" data-save-dungeon-test>Sauvegarder</button></div><p class="muted" data-dungeon-test-save-status></p>'
    :'<div class="section-title-row"><div><h3>💾 Reprise test</h3><p class="muted">Recharge la dernière session V2 sauvegardée sur cet appareil.</p></div><button type="button" class="secondary-button" data-resume-dungeon-test>Reprendre</button></div><p class="muted" data-dungeon-test-save-status></p>';
  host.prepend(section);
  const status=section.querySelector('[data-dungeon-test-save-status]');
  const options=provider?{provider}:{};
  section.querySelector('[data-save-dungeon-test]')?.addEventListener('click',async()=>{
    const out=await saveDungeonTestSession(getState?.()||{},options);
    if(status) status.textContent=out.ok?'Partie test sauvegardée sur cet appareil.':`Sauvegarde impossible : ${out.reason}.`;
  });
  section.querySelector('[data-resume-dungeon-test]')?.addEventListener('click',async()=>{
    const out=await loadDungeonTestSession(options);
    if(!out.ok){if(status) status.textContent=out.reason==='dungeon-test-save-missing'?'Aucune partie test sauvegardée.':`Reprise impossible : ${out.reason}.`;return;}
    if(status) status.textContent='Partie test rechargée.';
    onResume?.(clone(out.snapshot));
  });
  return {dispose(){section.remove();},clear:()=>clearDungeonTestSession(options)};
}
