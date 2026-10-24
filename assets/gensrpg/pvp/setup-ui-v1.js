"use strict";

/* Phase 10 S3: owner-local PvP setup UI. Opt-in mount; not loaded by Shell. */
(function publishGensPvpSetupUiV1(root){
  const VERSION="1.0.0";
  let mounted=null;

  function element(doc,tag,text,className){
    const node=doc.createElement(tag);
    if(text!==undefined)node.textContent=text;
    if(className)node.className=className;
    return node;
  }

  function field(doc,labelText,placeholder){
    const label=element(doc,"label",labelText,"gens-pvp-setup-field");
    const input=element(doc,"input");
    input.type="text";
    input.placeholder=placeholder;
    input.autocomplete="off";
    label.appendChild(input);
    return {label,input};
  }

  function mount(options){
    if(mounted)throw new Error("PvP setup screen already mounted");
    const {container,activeModule,provider}=options||{};
    if(!container||typeof container.appendChild!=="function"||
       typeof container.removeChild!=="function"||
       !container.ownerDocument?.createElement){
      throw new TypeError("PvP setup needs a dedicated DOM container");
    }
    if(typeof activeModule!=="function"||activeModule()!=="pvp"){
      throw new Error("PvP setup may mount only in active PvP");
    }
    if(!provider||typeof provider.prepare!=="function"){
      throw new TypeError("PvP setup needs the existing session provider");
    }
    const doc=container.ownerDocument;
    const pane=element(doc,"section",undefined,"gens-pvp-setup");
    const heading=element(doc,"h2","Préparation d'un duel");
    const disclaimer=element(doc,"p","Configurer les camps et les règles. Aucun combat PvP n'est encore jouable.");
    const form=element(doc,"form");
    const sessionId=field(doc,"Identifiant de la session","ex. duel-personnalise");
    sessionId.input.required=true;
    const rulesLabel=element(doc,"label","Règles personnalisées (objet JSON)","gens-pvp-setup-field");
    const rules=element(doc,"textarea");
    rules.placeholder='{"maRegle": "maValeur"}';
    rules.required=true;
    rulesLabel.appendChild(rules);
    const sidesHeading=element(doc,"h3","Camps et participants");
    const sidesList=element(doc,"div",undefined,"gens-pvp-sides");
    const addSide=element(doc,"button","Ajouter un camp");
    addSide.type="button";
    const submit=element(doc,"button","Préparer cette session");
    submit.type="submit";
    const message=element(doc,"p","");
    message.setAttribute("role","status");
    message.setAttribute("aria-live","polite");
    const sideRows=[];
    const disposers=[];

    function addRow(){
      const wrapper=element(doc,"div",undefined,"gens-pvp-side");
      const side=field(doc,"Identifiant du camp","ex. equipe-a");
      const participants=field(doc,"Participants — identifiants séparés par des virgules","ex. perso-1,perso-2");
      const remove=element(doc,"button","Retirer ce camp");
      remove.type="button";
      wrapper.appendChild(side.label);
      wrapper.appendChild(participants.label);
      wrapper.appendChild(remove);
      sidesList.appendChild(wrapper);
      const record={wrapper,side:side.input,participants:participants.input,remove};
      sideRows.push(record);
      const onRemove=()=>{
        if(sideRows.length<=2){message.textContent="Une session PvP exige au moins deux camps.";return}
        const at=sideRows.indexOf(record);
        if(at!==-1)sideRows.splice(at,1);
        remove.removeEventListener("click",onRemove);
        sidesList.removeChild(wrapper);
        message.textContent="";
      };
      remove.addEventListener("click",onRemove);
      disposers.push(()=>remove.removeEventListener("click",onRemove));
      return record;
    }

    const onAdd=()=>{addRow();message.textContent=""};
    const onSubmit=event=>{
      event.preventDefault();
      if(activeModule()!=="pvp"){
        message.textContent="La préparation est réservée au mode PvP.";
        return;
      }
      try{
        if(!sessionId.input.value.trim())throw new TypeError("Identifiant de session obligatoire");
        if(!rules.value.trim())throw new TypeError("Des règles explicites sont obligatoires");
        const configuredRules=JSON.parse(rules.value);
        if(!configuredRules||Array.isArray(configuredRules)||
           typeof configuredRules!=="object"||Object.keys(configuredRules).length===0){
          throw new TypeError("Règles attendues : objet JSON non vide");
        }
        const sides=sideRows.map(row=>({
          id:row.side.value.trim(),
          participants:row.participants.value.split(",").map(v=>v.trim()).filter(Boolean)
        }));
        const prepared=provider.prepare({id:sessionId.input.value.trim(),sides,rules:configuredRules});
        message.textContent=prepared
          ?"Session préparée. Le gameplay de duel reste à développer."
          :"Préparation refusée par le propriétaire PvP.";
      }catch(error){
        message.textContent="Configuration invalide : "+String(error.message||error);
      }
    };

    pane.appendChild(heading);
    pane.appendChild(disclaimer);
    form.appendChild(sessionId.label);
    form.appendChild(sidesHeading);
    form.appendChild(sidesList);
    form.appendChild(addSide);
    form.appendChild(rulesLabel);
    form.appendChild(submit);
    form.appendChild(message);
    pane.appendChild(form);
    addRow();
    addRow();
    addSide.addEventListener("click",onAdd);
    form.addEventListener("submit",onSubmit);
    disposers.push(()=>addSide.removeEventListener("click",onAdd));
    disposers.push(()=>form.removeEventListener("submit",onSubmit));
    container.appendChild(pane);
    mounted={container,pane,disposers};
    return Object.freeze({root:pane});
  }

  function dispose(){
    if(!mounted)return true;
    const {container,pane,disposers}=mounted;
    for(const stop of disposers)stop();
    if(pane.parentNode===container)container.removeChild(pane);
    mounted=null;
    return true;
  }

  function status(){
    return Object.freeze({mounted:!!mounted,owner:"pvp",gameplayReady:false});
  }

  root.GensPvpSetupUiV1=Object.freeze({VERSION,mount,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
