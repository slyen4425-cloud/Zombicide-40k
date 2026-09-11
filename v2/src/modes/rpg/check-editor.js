function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function ensureCheckDefinitions(universe){
  universe.checks=Array.isArray(universe.checks)?universe.checks:[];
  universe.checks=universe.checks.map(check=>({
    id:String(check?.id||uid()),
    name:String(check?.name||'Nouveau jet'),
    enabled:check?.enabled!==false,
    die:Math.max(2,Math.floor(Number(check?.die)||100)),
    mode:check?.mode==='roll-over'?'roll-over':'roll-under',
    statId:check?.statId==null?null:String(check.statId),
    difficulty:Number(check?.difficulty??50)||0,
    modifier:Number(check?.modifier)||0,
    description:String(check?.description||''),
  }));
  return universe;
}

export function createCheckDefinition({id=uid(),name='Nouveau jet',enabled=true,die=100,mode='roll-under',statId=null,difficulty=50,modifier=0,description=''}={}){
  return {id:String(id),name:String(name||'Nouveau jet'),enabled:enabled!==false,die:Math.max(2,Math.floor(Number(die)||100)),mode:mode==='roll-over'?'roll-over':'roll-under',statId:statId==null?null:String(statId),difficulty:Number(difficulty)||0,modifier:Number(modifier)||0,description:String(description||'')};
}

export function checkStatOptions(stats=[],selected=null){
  const active=(stats||[]).filter(stat=>stat?.enabled!==false);
  return [`<option value="">— Aucune statistique —</option>`,...active.map(stat=>`<option value="${esc(stat.id)}" ${String(stat.id)===String(selected||'')?'selected':''}>${esc(stat.icon||'📊')} ${esc(stat.name||'Statistique')}</option>`)].join('');
}

export function renderCheckCard(check,stats=[]){
  return `<article class="editor-card compact" data-check-id="${esc(check.id)}"><div class="editor-card-head"><strong>🎲 ${esc(check.name)}</strong><button class="help-button tiny" data-help="rpg-check" type="button">?</button></div><div class="form-grid"><label>Nom<input data-check-field="name" value="${esc(check.name)}"></label><label>Dé<select data-check-field="die"><option value="20" ${Number(check.die)===20?'selected':''}>D20</option><option value="100" ${Number(check.die)===100?'selected':''}>D100</option><option value="6" ${Number(check.die)===6?'selected':''}>D6</option><option value="8" ${Number(check.die)===8?'selected':''}>D8</option><option value="10" ${Number(check.die)===10?'selected':''}>D10</option><option value="12" ${Number(check.die)===12?'selected':''}>D12</option></select></label><label>Mode<select data-check-field="mode"><option value="roll-under" ${check.mode==='roll-under'?'selected':''}>Réussir sous le seuil</option><option value="roll-over" ${check.mode==='roll-over'?'selected':''}>Réussir au-dessus du seuil</option></select></label><label>Statistique<select data-check-field="statId">${checkStatOptions(stats,check.statId)}</select></label><label>Difficulté / seuil<input data-check-field="difficulty" type="number" value="${Number(check.difficulty)||0}"></label><label>Modificateur<input data-check-field="modifier" type="number" value="${Number(check.modifier)||0}"></label></div><label class="wide-label">Description<textarea data-check-field="description" rows="2">${esc(check.description)}</textarea></label><div class="toggle-row"><label><input data-check-field="enabled" type="checkbox" ${check.enabled!==false?'checked':''}> Actif</label></div><button class="danger-button" data-delete-check="${esc(check.id)}" type="button">Supprimer</button></article>`;
}

function fieldValue(input){if(input.type==='checkbox')return input.checked;if(['number','range'].includes(input.type))return input.value===''?null:Number(input.value);if(input.dataset.checkField==='die')return Number(input.value)||100;return input.value||null;}

export function mountCheckEditor(host,universe,onChange){
  ensureCheckDefinitions(universe);
  const render=()=>{
    host.innerHTML=`<section class="editor-section"><div class="section-title-row"><div><h3>Jets & tests</h3><p class="muted">Crée des jets D100, D20 ou autres règles réutilisables pour pièges, compétences, événements et interactions.</p></div><button class="primary-button" id="addRpgCheck" type="button">+ Jet / test</button></div><div class="editor-list">${universe.checks.map(check=>renderCheckCard(check,universe.stats)).join('')||'<p class="muted">Aucun jet configuré.</p>'}</div></section>`;
    host.querySelector('#addRpgCheck')?.addEventListener('click',()=>{universe.checks.push(createCheckDefinition());onChange?.(universe);});
    host.querySelectorAll('[data-check-id]').forEach(card=>{
      const check=universe.checks.find(item=>String(item.id)===String(card.dataset.checkId));if(!check)return;
      card.querySelectorAll('[data-check-field]').forEach(input=>input.addEventListener('change',()=>{check[input.dataset.checkField]=fieldValue(input);onChange?.(universe);}));
    });
    host.querySelectorAll('[data-delete-check]').forEach(button=>button.addEventListener('click',()=>{universe.checks=universe.checks.filter(item=>String(item.id)!==String(button.dataset.deleteCheck));onChange?.(universe);}));
  };
  render();
}
