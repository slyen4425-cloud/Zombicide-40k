import { grantRoomCreatureDropsToRecipient } from './spawn-engine.js';

function clone(value){return structuredClone(value);}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function lootRecipientKey(recipient={}){
  return `${String(recipient.kind||'inventory')}:${recipient.id==null?'':String(recipient.id)}`;
}

export function normalizeLootRecipients(recipients=[]){
  return (recipients||[])
    .filter(recipient=>recipient&&recipient.enabled!==false&&recipient.inventory)
    .map(recipient=>({
      ...clone(recipient),
      kind:String(recipient.kind||'inventory'),
      id:recipient.id==null?null:String(recipient.id),
      name:String(recipient.name||recipient.label||'Inventaire'),
      icon:recipient.icon==null?null:String(recipient.icon),
    }));
}

export function lootRecipientOptions(recipients=[],selectedKey=null){
  const normalized=normalizeLootRecipients(recipients);
  if(!normalized.length) return '<option value="">— Aucun inventaire disponible —</option>';
  return normalized.map(recipient=>{
    const key=lootRecipientKey(recipient);
    const prefix=recipient.icon?`${esc(recipient.icon)} `:'';
    const kindLabel=recipient.kind==='group'?'Groupe':recipient.kind==='hero'?'Héros':'Inventaire';
    return `<option value="${esc(key)}" ${String(key)===String(selectedKey||'')?'selected':''}>${prefix}${esc(recipient.name)} · ${kindLabel}</option>`;
  }).join('');
}

export function findLootRecipient(recipients=[],selectedKey=null){
  const normalized=normalizeLootRecipients(recipients);
  if(!normalized.length) return null;
  return normalized.find(recipient=>lootRecipientKey(recipient)===String(selectedKey||''))||normalized[0];
}

export function grantCreatureLootToSelectedRecipient(roomRuntime,instanceId,recipients=[],selectedKey=null,definitions={}){
  const normalized=normalizeLootRecipients(recipients);
  const selected=findLootRecipient(normalized,selectedKey);
  if(!selected) return {ok:false,reason:'loot-recipient-missing',roomRuntime,recipients:normalized,recipient:null,drops:[]};
  const granted=grantRoomCreatureDropsToRecipient(roomRuntime,instanceId,selected,definitions);
  if(!granted.ok) return {...granted,recipients:normalized};
  const key=lootRecipientKey(selected);
  const nextRecipients=normalized.map(recipient=>lootRecipientKey(recipient)===key?clone(granted.recipient):recipient);
  return {...granted,recipients:nextRecipients,selectedKey:key};
}

export function renderLootRecipientPicker(recipients=[],selectedKey=null){
  return `<label>Donner le butin à<select data-loot-recipient>${lootRecipientOptions(recipients,selectedKey)}</select></label>`;
}
