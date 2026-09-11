function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function ensureTrapDefinitions(universe={}){
  universe.traps=Array.isArray(universe.traps)?universe.traps:[];
  return universe;
}

export function newTrapDefinition(){
  return {id:uid(),name:'Nouveau piège',enabled:true,reusable:false,hidden:true,detectionCheckId:null,disarmCheckId:null,detectionCheck:null,disarmCheck:null,effectIds:[],eventId:null,audioId:null};
}

export function trapCheckOptions(checks=[],selected=null,none='— Aucun jet —'){
  const enabled=(checks||[]).filter(check=>check&&check.enabled!==false&&check.id);
  return [`<option value="">${esc(none)}</option>`,...enabled.map(check=>`<option value="${esc(check.id)}" ${String(check.id)===String(selected||'')?'selected':''}>${esc(check.name||'Jet')} · D${Math.max(2,Number(check.die)||100)}</option>`)].join('');
}

function trapCard(trap,checks=[]){
  return `<article class="editor-card compact" data-trap-id="${esc(trap.id)}">
    <div class="editor-card-head"><strong>⚠️ ${esc(trap.name)}</strong><button class="help-button tiny" type="button" data-help="rpg-trap">?</button></div>
    <div class="form-grid">
      <label>Nom<input data-trap-field="name" value="${esc(trap.name)}"></label>
      <label>Jet de détection<select data-trap-field="detectionCheckId">${trapCheckOptions(checks,trap.detectionCheckId,'— Détection automatique —')}</select></label>
      <label>Jet de désarmement<select data-trap-field="disarmCheckId">${trapCheckOptions(checks,trap.disarmCheckId,'— Désarmement automatique —')}</select></label>
    </div>
    <div class="toggle-row"><label><input data-trap-field="enabled" type="checkbox" ${trap.enabled!==false?'checked':''}> Actif</label><label><input data-trap-field="hidden" type="checkbox" ${trap.hidden!==false?'checked':''}> Caché</label><label><input data-trap-field="reusable" type="checkbox" ${trap.reusable?'checked':''}> Réutilisable</label></div>
    <button class="danger-button" type="button" data-delete-trap="${esc(trap.id)}">Supprimer</button>
  </article>`;
}

function valueOf(input){if(input.type==='checkbox')return input.checked;return input.value||null;}

export function mountTrapEditor(host,universe,onChange){
  ensureTrapDefinitions(universe);
  const checks=Array.isArray(universe.checks)?universe.checks:[];
  host.innerHTML=`<section class="editor-section"><div class="section-title-row"><div><h3>Pièges</h3><p class="muted">La détection et le désarmement utilisent les jets/tests réutilisables configurés plus haut. Aucun ID technique à saisir.</p></div><button class="primary-button" id="addRpgTrap" type="button">+ Piège</button></div><div class="editor-list">${universe.traps.map(trap=>trapCard(trap,checks)).join('')||'<p class="muted">Aucun piège configuré.</p>'}</div></section>`;
  const rerender=()=>onChange?.(universe,true);
  host.querySelector('#addRpgTrap')?.addEventListener('click',()=>{universe.traps.push(newTrapDefinition());rerender();});
  host.querySelectorAll('[data-trap-id]').forEach(card=>{
    const trap=universe.traps.find(x=>String(x.id)===String(card.dataset.trapId));if(!trap)return;
    card.querySelectorAll('[data-trap-field]').forEach(input=>input.addEventListener('change',()=>{trap[input.dataset.trapField]=valueOf(input);rerender();}));
  });
  host.querySelectorAll('[data-delete-trap]').forEach(button=>button.addEventListener('click',()=>{universe.traps=universe.traps.filter(x=>String(x.id)!==String(button.dataset.deleteTrap));rerender();}));
}
