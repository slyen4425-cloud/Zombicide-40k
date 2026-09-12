function optionEntries(select){
  return [...(select?.options||[])].map(option=>({value:String(option.value),label:String(option.textContent||option.value),disabled:Boolean(option.disabled)}));
}

function button(label,value,kind,active=false,disabled=false){
  const node=document.createElement('button');
  node.type='button';
  node.className=`combat-command-card combat-command-${kind}${active?' active':''}`;
  node.dataset[`combat${kind[0].toUpperCase()}${kind.slice(1)}`]=value;
  node.textContent=label;
  node.disabled=disabled;
  return node;
}

function syncActiveButtons(panel,kind,value){
  panel.querySelectorAll(`[data-combat-${kind}]`).forEach(node=>node.classList.toggle('active',String(node.dataset[`combat${kind[0].toUpperCase()}${kind.slice(1)}`])===String(value)));
}

function buildTargetButtons(actions,panel,targetSelect){
  const host=panel.querySelector('[data-combat-target-buttons]');
  if(!host) return;
  host.innerHTML='';
  const entries=optionEntries(targetSelect);
  if(!entries.length){
    const empty=document.createElement('p');
    empty.className='muted combat-command-empty';
    empty.textContent='Aucune cible valide depuis cette position.';
    host.append(empty);
    return;
  }
  for(const entry of entries){
    const node=button(entry.label,entry.value,'target',String(targetSelect.value)===entry.value,entry.disabled);
    node.addEventListener('click',()=>{
      targetSelect.value=entry.value;
      targetSelect.dispatchEvent(new Event('change',{bubbles:true}));
      syncActiveButtons(panel,'target',targetSelect.value);
    });
    host.append(node);
  }
}

function polishActions(actions){
  const skillSelect=actions.querySelector('[data-dungeon-combat-skill]');
  const targetSelect=actions.querySelector('[data-dungeon-combat-target]');
  const useButton=actions.querySelector('[data-dungeon-use-skill]');
  if(!skillSelect||!targetSelect||!useButton) return false;

  actions.classList.add('combat-actions-polished');
  skillSelect.closest('label')?.classList.add('combat-native-control');
  targetSelect.closest('label')?.classList.add('combat-native-control');
  useButton.classList.add('combat-command-launch');
  useButton.textContent='⚔️ Lancer l’action';

  let panel=actions.querySelector('[data-combat-command-panel]');
  if(!panel){
    panel=document.createElement('div');
    panel.className='combat-command-panel';
    panel.dataset.combatCommandPanel='';
    panel.innerHTML='<section class="combat-command-step"><span class="combat-command-step-label">1 · Compétence</span><div class="combat-command-list" data-combat-skill-buttons></div></section><section class="combat-command-step"><span class="combat-command-step-label">2 · Cible</span><div class="combat-command-list combat-target-list" data-combat-target-buttons></div></section>';
    actions.insertBefore(panel,useButton);
  }

  const skillHost=panel.querySelector('[data-combat-skill-buttons]');
  skillHost.innerHTML='';
  for(const entry of optionEntries(skillSelect)){
    const node=button(entry.label,entry.value,'skill',String(skillSelect.value)===entry.value,entry.disabled);
    node.addEventListener('click',()=>{
      skillSelect.value=entry.value;
      skillSelect.dispatchEvent(new Event('change',{bubbles:true}));
      syncActiveButtons(panel,'skill',skillSelect.value);
      queueMicrotask(()=>buildTargetButtons(actions,panel,targetSelect));
    });
    skillHost.append(node);
  }
  buildTargetButtons(actions,panel,targetSelect);
  return true;
}

function resourceMeter(card){
  for(const chip of card.querySelectorAll('.combat-chip')){
    if(chip.querySelector('.combat-resource-meter')) continue;
    const text=String(chip.textContent||'').replace(/\s+/g,' ').trim();
    const match=text.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if(!match) continue;
    const current=Number(match[1]),max=Number(match[2]);
    if(!Number.isFinite(current)||!Number.isFinite(max)||max<=0) continue;
    const meter=document.createElement('span');
    meter.className='combat-resource-meter';
    meter.setAttribute('aria-hidden','true');
    const fill=document.createElement('span');
    fill.style.width=`${Math.max(0,Math.min(100,(current/max)*100))}%`;
    meter.append(fill);
    chip.append(meter);
  }
}

function polishCombatants(root){
  for(const card of root.querySelectorAll('.dungeon-combat-section .combatant-card')){
    const title=String(card.querySelector('strong')?.textContent||'');
    card.classList.toggle('combatant-hero',title.includes('🛡️'));
    card.classList.toggle('combatant-enemy',title.includes('👹'));
    resourceMeter(card);
  }
  root.querySelectorAll('.dungeon-combat-section .combat-turn').forEach((turn,index)=>{
    turn.dataset.turnPosition=String(index+1);
  });
}

export function polishDungeonCombat(root=document){
  if(!root?.querySelectorAll) return 0;
  let count=0;
  for(const actions of root.querySelectorAll('.dungeon-combat-section .dungeon-combat-actions')) if(polishActions(actions)) count+=1;
  polishCombatants(root);
  return count;
}

let scheduled=false;
function schedule(){
  if(scheduled) return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;polishDungeonCombat(document);});
}

if(typeof document!=='undefined'){
  polishDungeonCombat(document);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
}
