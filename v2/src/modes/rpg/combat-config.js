function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function defaultCombatConfig(universe={}){
  return {
    initiative:{mode:'stat',source:{kind:'stat',id:universe.stats?.[0]?.id||null},base:0,die:20,modifier:0},
    defeatRule:{enabled:Boolean(universe.resources?.[0]),kind:universe.resources?.[0]?'resource':'none',sourceId:universe.resources?.[0]?.id||null,operator:'lte',threshold:0},
    checkDefaults:{die:100,mode:'roll-under'},
    interaction:{directCombat:true,gmFullControl:false},
  };
}

export function ensureCombatConfig(universe){
  universe.combat=universe.combat||defaultCombatConfig(universe);
  universe.combat.initiative=universe.combat.initiative||defaultCombatConfig(universe).initiative;
  universe.combat.defeatRule=universe.combat.defeatRule||defaultCombatConfig(universe).defeatRule;
  universe.combat.checkDefaults=universe.combat.checkDefaults||defaultCombatConfig(universe).checkDefaults;
  universe.combat.interaction={...defaultCombatConfig(universe).interaction,...(universe.combat.interaction||{})};
  return universe.combat;
}

export function combatInteractionPolicy(universe={}){
  const cfg=ensureCombatConfig(universe);
  const gmFullControl=cfg.interaction?.gmFullControl===true;
  const directCombat=cfg.interaction?.directCombat!==false;
  return {
    directCombat,
    gmFullControl,
    automaticPlayerActions:directCombat&&!gmFullControl,
    automaticEnemyTurns:!gmFullControl,
    manualCombatControls:gmFullControl,
  };
}

function statOptions(universe,selected){return ['<option value="">— Aucune —</option>',...(universe.stats||[]).map(s=>`<option value="${esc(s.id)}" ${String(s.id)===String(selected||'')?'selected':''}>${esc(s.icon||'')} ${esc(s.name)}</option>`)].join('');}
function resourceOptions(universe,selected){return ['<option value="">— Aucune —</option>',...(universe.resources||[]).map(r=>`<option value="${esc(r.id)}" ${String(r.id)===String(selected||'')?'selected':''}>${esc(r.icon||'')} ${esc(r.name)}</option>`)].join('');}

export function mountCombatConfigEditor(host,universe,onChange){
  const cfg=ensureCombatConfig(universe);
  const init=cfg.initiative;
  const defeat=cfg.defeatRule;
  const interaction=cfg.interaction;
  const sourceOptions=init.source?.kind==='resource'?resourceOptions(universe,init.source?.id):statOptions(universe,init.source?.id);
  const defeatOptions=defeat.kind==='stat'?statOptions(universe,defeat.sourceId):resourceOptions(universe,defeat.sourceId);
  host.innerHTML=`<section class="editor-section"><div class="section-title-row"><div><h3>Règles de combat</h3><p class="muted">Initiative, règle de KO, jet par défaut et niveau d'automatisation sont configurables sans nom imposé.</p></div><button class="help-button tiny" type="button" data-help="rpg-combat-config">?</button></div>
  <div class="editor-card"><div class="editor-card-head"><strong>🎮 Contrôle du combat</strong></div><div class="toggle-row"><label><input data-cfg="interaction.directCombat" type="checkbox" ${interaction.directCombat!==false?'checked':''}> Combat direct des héros</label><label><input data-cfg="interaction.gmFullControl" type="checkbox" ${interaction.gmFullControl===true?'checked':''}> MJ contrôle total</label></div><p class="muted">Combat direct OFF conserve la timeline mais coupe les actions automatiques du joueur. MJ contrôle total réserve les résolutions automatiques au MJ et empêchera les tours ennemis automatiques dans la vue Donjon.</p></div>
  <div class="editor-card"><div class="editor-card-head"><strong>⏱️ Initiative</strong></div><div class="form-grid">
  <label>Mode<select data-cfg="initiative.mode"><option value="stat" ${init.mode==='stat'?'selected':''}>Valeur liée</option><option value="roll" ${init.mode==='roll'?'selected':''}>Jet + valeur liée</option><option value="fixed" ${init.mode==='fixed'?'selected':''}>Valeur fixe</option></select></label>
  <label>Type de source<select data-cfg="initiative.source.kind"><option value="stat" ${init.source?.kind==='stat'?'selected':''}>Statistique</option><option value="resource" ${init.source?.kind==='resource'?'selected':''}>Ressource</option><option value="fixed" ${init.source?.kind==='fixed'?'selected':''}>Aucune</option></select></label>
  <label>Source<select data-cfg="initiative.source.id">${sourceOptions}</select></label><label>Base<input data-cfg="initiative.base" type="number" value="${Number(init.base)||0}"></label><label>Dé du jet<input data-cfg="initiative.die" type="number" min="2" value="${Number(init.die)||20}"></label><label>Modificateur<input data-cfg="initiative.modifier" type="number" value="${Number(init.modifier)||0}"></label></div></div>
  <div class="editor-card"><div class="editor-card-head"><strong>💀 KO / défaite individuelle</strong></div><div class="form-grid">
  <label>Type<select data-cfg="defeatRule.kind"><option value="resource" ${defeat.kind==='resource'?'selected':''}>Ressource</option><option value="stat" ${defeat.kind==='stat'?'selected':''}>Statistique</option><option value="none" ${defeat.kind==='none'?'selected':''}>Désactivée</option></select></label>
  <label>Valeur surveillée<select data-cfg="defeatRule.sourceId">${defeatOptions}</select></label><label>Condition<select data-cfg="defeatRule.operator"><option value="lte" ${defeat.operator==='lte'?'selected':''}>≤</option><option value="lt" ${defeat.operator==='lt'?'selected':''}>&lt;</option><option value="eq" ${defeat.operator==='eq'?'selected':''}>=</option><option value="gte" ${defeat.operator==='gte'?'selected':''}>≥</option><option value="gt" ${defeat.operator==='gt'?'selected':''}>&gt;</option></select></label><label>Seuil<input data-cfg="defeatRule.threshold" type="number" value="${Number(defeat.threshold)||0}"></label></div><div class="toggle-row"><label><input data-cfg="defeatRule.enabled" type="checkbox" ${defeat.enabled!==false?'checked':''}> Active</label></div></div>
  <div class="editor-card"><div class="editor-card-head"><strong>🎲 Jet par défaut</strong></div><div class="form-grid"><label>Dé<input data-cfg="checkDefaults.die" type="number" min="2" value="${Number(cfg.checkDefaults.die)||100}"></label><label>Mode<select data-cfg="checkDefaults.mode"><option value="roll-under" ${cfg.checkDefaults.mode==='roll-under'?'selected':''}>Réussite sous le seuil</option><option value="roll-over" ${cfg.checkDefaults.mode==='roll-over'?'selected':''}>Réussite au-dessus du seuil</option></select></label></div></div></section>`;
  const set=(path,value)=>{const parts=path.split('.');let cur=cfg;while(parts.length>1){const k=parts.shift();cur[k]=cur[k]||{};cur=cur[k];}cur[parts[0]]=value;};
  host.querySelectorAll('[data-cfg]').forEach(el=>el.addEventListener('change',()=>{let v=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?null:Number(el.value)):el.value;set(el.dataset.cfg,v);onChange?.(universe,true);}));
}
