"use strict";
// Clean Capture shell: composition/navigation ONLY. No historic Capture scripts,
// monster catalog, skill definitions, battle engine, rewards or world simulator.
(function(root){
  const base=new URL("./",root.document.baseURI);
  const VIEWS=Object.freeze({
    // Two genuinely distinct World owners: World Assembler, and ONE native
    // 2.5D Sculpt editor. The former duplicate "Exploration · Tester" button
    // opened exactly the same Sculpt URL, so it is removed from the game menu.
    builder:{label:"Terrain et exploration 2,5D",path:"vendor/exploration-lab/sculpt-lab.html",family:"exploration"},
    world:{label:"Carte du monde",path:"vendor/exploration-lab/world-assembler.html",family:"exploration"},
    heroes:{label:"Héros et apparences",path:"vendor/exploration-lab/hero-editor.html",family:"exploration"},
    npc:{label:"PNJ et dresseurs",path:"vendor/exploration-lab/npc-editor.html",family:"exploration"},
    // Four native entry points, ONE actual Lab Combat editor. Combat main
    // (SHA-pinned PR #156) owns ?tab= routing, native state and all rules.
    // Never click tabs from the consumer or implement a parallel editor.
    creature:{label:"Créatures",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=creature",family:"combat"},
    skills:{label:"Capacités",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=skills",family:"combat"},
    combat:{label:"Règles de combat",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=combat",family:"combat"},
    music:{label:"Musiques",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=music",family:"combat"},
    bestiary:{label:"Bestiaire",path:"vendor/combat-lab/examples/dom-demo/bestiary.html",family:"combat"},
    items:{label:"Objets et drops",path:"assets/gensrpg/capture-v2/adventure.html?editor=items",family:"capture"},
    adventure:{label:"Jouer",path:"assets/gensrpg/capture-v2/adventure.html",family:"capture"}
  });
  // Navigation is presentation-only: one destination per native owner,
  // grouped by the player's task rather than by implementation laboratory.
  const EDITOR_GROUPS=Object.freeze([
    Object.freeze({id:"world",title:"Monde",items:Object.freeze(["world","builder"])}),
    Object.freeze({id:"heroes",title:"Héros",items:Object.freeze(["heroes"])}),
    Object.freeze({id:"npc",title:"PNJ",items:Object.freeze(["npc"])}),
    Object.freeze({id:"combat",title:"Créatures et combat",items:Object.freeze(
      ["creature","skills","combat","bestiary","music"])}),
    Object.freeze({id:"economy",title:"Objets et économie",items:Object.freeze(["items"])})
  ]);
  const shell=root.GensShellModuleLaunchV1;
  const returnShell=root.GensShellScreenReturnV1;
  if(!shell||!returnShell||!root.GensCaptureV1?.isProfile)
    throw new Error("Clean Capture requires the existing four-mode Shell");
  if(root.GensCaptureV2)throw new Error("Duplicate Capture module authority");
  let host=null,frame=null,stage=null,notice=null,current=null,nativeTitle=null;
  let selectedUniverse=null,universePanel=null,universeUi=null,universeLoadEpoch=0;
  let creatorPanel=null,creatorOwner=null,creatorPromise=null;
  let nativeLoading=null;
  const officialLoadingArt=new URL('vendor/combat-lab/assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png',base).href;
  function dismissNativeLoading(){
    if(!nativeLoading)return;
    const previous=nativeLoading;nativeLoading=null;
    previous.crossfade?.dispose();
    for(const url of previous.urls)root.URL.revokeObjectURL(url);
    previous.overlay.remove();
    if(host)delete host.dataset.nativeLoading;
  }
  async function decorateNativeLoading(state){
    let urls=[];
    try{
      // The existing Capture art owner is the ONLY source of player
      // artwork. Read all three legacy categories as ONE simple gallery.
      const [libraryOwner,fadeOwner]=await Promise.all([
        import(new URL('assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs',base).href),
        import(new URL('vendor/exploration-lab/src/play/exploration-loading-art-v1.js',base).href)
      ]);
      const library=await libraryOwner.createAdventureLoadingArtLibraryV1({
        universeId:selectedUniverse?.id??'monster-invoc'
      });
      try{
        const records=await library.list();
        urls=records.slice(0,12).map(record=>root.URL.createObjectURL(record.blob));
      }finally{library.close();}
      if(nativeLoading!==state){
        for(const url of urls)root.URL.revokeObjectURL(url);
        return;
      }
      state.urls=urls;
      const artwork=urls.length?urls:[officialLoadingArt];
      if(typeof fadeOwner.mountCaptureLoadingArtCrossfadeV1==='function')
        state.crossfade=fadeOwner.mountCaptureLoadingArtCrossfadeV1({
          host:state.overlay,images:artwork,documentRef:root.document,windowRef:root
        });
      else state.overlay.style.backgroundImage='url('+JSON.stringify(artwork[0])+')';
    }catch(error){
      for(const url of urls)if(!state.urls.includes(url))root.URL.revokeObjectURL(url);
      // Failure of decoration never blocks the REAL native iframe readiness.
      console.warn('Illustrations de chargement indisponibles',error);
    }
  }
  function showNativeLoading(nativeFrame,label){
    dismissNativeLoading();
    const overlay=root.document.createElement('div');
    overlay.className='gensCaptureV2Loading';
    overlay.setAttribute('role','status');
    overlay.setAttribute('aria-live','polite');
    const message=root.document.createElement('span');
    message.className='gensCaptureV2LoadingLabel';
    message.textContent='Chargement · '+label;
    overlay.append(message);
    stage.append(overlay);
    const state={overlay,urls:[],crossfade:null};
    nativeLoading=state;
    host.dataset.nativeLoading='true';
    void decorateNativeLoading(state);
    // Lab documents are not reconstructed by Capture: their own iframe load
    // completes the Shell transition after the browser has painted twice.
    nativeFrame.addEventListener('load',()=>{
      if(nativeLoading!==state)return;
      const afterPaint=typeof root.requestAnimationFrame==='function'
        ?root.requestAnimationFrame.bind(root)
        :callback=>root.setTimeout(callback,0);
      afterPaint(()=>afterPaint(()=>{
        if(nativeLoading===state)dismissNativeLoading();
      }));
    },{once:true});
    nativeFrame.addEventListener('error',()=>{
      if(nativeLoading===state){
        message.textContent='Chargement indisponible · '+label;
        state.crossfade?.dispose();state.crossfade=null;
      }
    },{once:true});
  }
  function urlFor(kind){
    const info=VIEWS[kind];
    if(!info)throw new RangeError("Unknown Capture native owner");
    // The Adventure controls are owned by GenSrpg Capture itself. This is
    // NOT a third Lab or an alternate creature/battle editor.
    if(info.family==="capture"){
      const url=new URL(info.path,base);
      const ownRoot=new URL("assets/gensrpg/capture-v2/",base);
      if(url.origin!==ownRoot.origin || !url.pathname.startsWith(ownRoot.pathname))
        throw new Error("Adventure UI escaped the Capture V2 owner");
      const externalPreview=root.__GENSRPG_PREVIEW__===true &&
        root.location.origin==="https://html-preview.github.io";
      if(!externalPreview && url.origin!==root.location.origin)
        throw new Error("Adventure UI must be same-origin with its active Capture session");
      return url;
    }
    // Dedicated external *preview* only. The real Pages app still requires
    // same-origin /vendor/ documents and never reads a cross-origin override.
    // The preview source is derived from official exact-main pins by preview.html.
    const preview=root.GensCaptureV2PreviewTransportV1;
    if(root.__GENSRPG_PREVIEW__===true &&
       root.location.origin==="https://html-preview.github.io" && preview){
      const canonical=info.family==="combat"
        ?"slyen4425-cloud/GenSrpg_labo_combat_dynamique"
        :"slyen4425-cloud/laboratoire_dynamique_exploration-";
      const nativePrefix=info.family==="combat"?"vendor/combat-lab/":"vendor/exploration-lab/";
      const officialRoot=new URL(preview[info.family]);
      const pathPrefix="/"+canonical+"/";
      const sha=officialRoot.pathname.startsWith(pathPrefix)
        ?officialRoot.pathname.slice(pathPrefix.length,-1):"";
      if(officialRoot.origin!=="https://raw.githack.com" ||
         !/^[a-f0-9]{40}$/.test(sha) ||
         officialRoot.pathname!==pathPrefix+sha+"/" ||
         !info.path.startsWith(nativePrefix))
        throw new Error("External preview must use a validated official Lab main SHA");
      const url=new URL(info.path.slice(nativePrefix.length),officialRoot);
      if(url.origin!==officialRoot.origin||!url.pathname.startsWith(officialRoot.pathname))
        throw new Error("Native preview path escaped its immutable Lab owner");
      return url;
    }
    const url=new URL(info.path,base);
    if(url.origin!==root.location.origin||!url.pathname.startsWith(base.pathname+"vendor/"))
      throw new Error("Capture authority must be same-origin and SHA-pinned");
    return url;
  }
  function open(kind,{startView=null}={}){
    if(!host)return false;
    if(!selectedUniverse){
      notice.textContent='Sélectionne d’abord un univers avant de jouer ou d’ouvrir ses éditeurs.';
      return false;
    }
    const info=VIEWS[kind],url=urlFor(kind);
    if(!selectedUniverse.legacy)url.searchParams.set('universe',selectedUniverse.id);
    // Capture already owns one Adventure portfolio: present its native new/load
    // screens, never create a world or choose a saved session in the Shell.
    if(kind==='adventure'&&['new','load'].includes(startView))
      url.searchParams.set('start',startView);
    creatorOwner?.leaveHome();
    dismissNativeLoading();
    if(frame){frame.src="about:blank";frame.remove();frame=null;}
    frame=root.document.createElement("iframe");
    frame.title=info.label;
    frame.setAttribute("referrerpolicy","same-origin");
    // The official Combat main editor calls requestFullscreen on its own
    // document when launching a battle. An embedded cross-origin Lab must
    // receive explicit permission; otherwise Android shows a tiny 16:9 game.
    frame.setAttribute("allow","fullscreen");
    frame.setAttribute("allowfullscreen","");
    frame.setAttribute("data-capture-v2-native",info.family);
    stage.replaceChildren(frame);
    showNativeLoading(frame,info.label);
    frame.src=url.href;
    current=kind;
    nativeTitle.textContent=info.label;
    notice.textContent=info.label;
    host.dataset.view=kind;
    host.dataset.adventureCombatActive='false';
    host.dataset.adventureLoadingActive='false';
    // Presentation-only placement of the shared return control: Combat's
    // official editor footer and Exploration's toolbars use different corners.
    // This derived family does not own or inspect either Lab's DOM.
    host.dataset.nativeFamily=info.family;
    return true;
  }
  // The existing Shell owns its entire Capture viewport, including the
  // native Back control. An Adventure iframe must NEVER fullscreen itself:
  // that would place its document above the Shell and hide the return button.
  // The same user gesture crosses the same-origin owner API before awaits.
  function gameFullscreenActive(){
    return Boolean(host&&root.document.fullscreenElement===host);
  }
  function requestGameFullscreen(){
    if(!host||current!=="adventure")return Promise.resolve(false);
    if(gameFullscreenActive())return Promise.resolve(true);
    if(!root.document.fullscreenEnabled||typeof host.requestFullscreen!=="function")
      return Promise.resolve(false);
    try{
      return Promise.resolve(host.requestFullscreen({navigationUI:"hide"})).then(async()=>{
        if(!gameFullscreenActive())return false;
        try{await root.screen?.orientation?.lock?.("landscape");}
        catch{ /* Landscape lock may be denied by the mobile browser. */ }
        return true;
      }).catch(()=>false);
    }catch{return Promise.resolve(false);}
  }
  function exitGameFullscreen(){
    if(!gameFullscreenActive())return Promise.resolve(false);
    return Promise.resolve(root.document.exitFullscreen?.()).then(()=>true).catch(()=>false);
  }
  function onGameFullscreenChange(callback){
    if(typeof callback!=="function")throw new TypeError("Fullscreen callback required");
    root.document.addEventListener("fullscreenchange",callback);
    return ()=>root.document.removeEventListener("fullscreenchange",callback);
  }
  // The Shell transports a READ-ONLY request to the Capture rules owner.
  // Exploration only sees the authoring labels. The wallet, item catalog,
  // transactions and inventory are NEVER copied or owned by this Shell.
  root.addEventListener?.("message",async event=>{
    const schema=event.data?.schema;
    const isMerchant=schema==="gensrpg.exploration.npc.merchant.catalog.request.v1";
    const isReward=schema==="gensrpg.exploration.npc.reward.catalog.request.v1";
    if(!host||(current!=="builder"&&current!=="world"&&current!=="npc")||!frame||
       event.source!==frame.contentWindow||event.origin!==root.location.origin||
       (!isMerchant&&!isReward))return;
    const requestId=event.data.requestId;
    if(typeof requestId!=="string"||!/^[a-z0-9-]{1,80}$/i.test(requestId))return;
    const responder=event.source;
    let merchants=[],items=[],currencyLabel="pièces",error=null;
    try{
      const owner=await import(new URL(
        "assets/gensrpg/capture-v2/adventure-merchant-catalog-bridge-v1.mjs",base));
      if(isMerchant)merchants=await owner.availableAdventureMerchantsForNpcV1();
      else{
        const catalog=await owner.availableAdventureItemsForNpcRewardV1();
        items=catalog.items;currencyLabel=catalog.currencyLabel;
      }
    }catch(failure){error=String(failure?.message??failure).slice(0,180);}
    if(frame?.contentWindow!==responder||(current!=="builder"&&current!=="world"&&current!=="npc"))return;
    responder.postMessage({
      schema:isMerchant?"gensrpg.capture.v2.npc.merchant.catalog.response.v1":
        "gensrpg.capture.v2.npc.reward.catalog.response.v1",
      requestId,...(isMerchant?{merchants}:{items,currencyLabel}),error
    },root.location.origin);
  });
  // The Shell alone owns this bar. A native Portal's scoped presentation
  // signal is projected by Capture, never by Exploration touching Shell DOM.
  function setAdventureLoadingVisibility(visible){
    if(!host||current!=="adventure"||typeof visible!=="boolean")return false;
    host.dataset.adventureLoadingActive=String(visible);
    return true;
  }
  // The Shell alone owns this bar: the child only requests combat visibility.
  function setAdventureCombatVisibility(visible){
    if(!host||current!=="adventure"||typeof visible!=="boolean")return false;
    host.dataset.adventureCombatActive=String(visible);
    return true;
  }
  function home(){
    if(!host)return false;
    dismissNativeLoading();
    if(gameFullscreenActive())void exitGameFullscreen();
    if(frame){frame.src="about:blank";frame.remove();frame=null;}
    stage.replaceChildren();
    current=null;host.dataset.view="home";
    host.dataset.menu=selectedUniverse?'main':'universes';
    creatorPanel.dataset.active='false';creatorOwner?.hide();
    if(selectedUniverse)creatorOwner?.enterHome();
    else creatorOwner?.leaveHome();
    delete host.dataset.nativeFamily;
    delete host.dataset.adventureCombatActive;
    delete host.dataset.adventureLoadingActive;
    nativeTitle.textContent="";
    notice.textContent=selectedUniverse
      ?'Univers '+selectedUniverse.name+' · choisis Jouer, Éditeurs ou Créateur.'
      :'Choisis un univers. Monster InvoC conserve toutes tes parties historiques.';
    return true;
  }
  function showUniverses(){
    if(!host)return false;
    selectedUniverse=null;
    home();
    universeUi?.showList();
    return true;
  }
  function selectUniverse(project){
    if(!host)return false;
    selectedUniverse=project;
    const ready=home();
    // Non-blocking Shell presentation; no Combat/Exploration authority.
    void createShellCreator().then(async owner=>{
      if(!owner||!host||selectedUniverse?.id!==project.id)return;
      await owner.selectUniverse(project.id,project.name);
      if(host?.dataset.view==='home'&&selectedUniverse?.id===project.id)
       owner.enterHome();
    }).catch(error=>
      console.warn('Personnalisation du menu indisponible',error));
    return ready;
  }
  function loadUniverseHub(){
    const epoch=++universeLoadEpoch;
    const load=root.GensCaptureV2UniverseUiLoaderV1??(
      ()=>import(new URL('assets/gensrpg/capture-v2/universe-hub-ui-v1.mjs',base).href)
    );
    void Promise.resolve().then(load).then(module=>{
      if(!host||epoch!==universeLoadEpoch)return;
      return module.createCaptureUniverseHubUiV1({
        document:root.document,root,container:universePanel,
        notice,onSelect:selectUniverse
      }).then(ui=>{
        if(!host||epoch!==universeLoadEpoch){ui.stop();return;}
        universeUi=ui;
      });
    }).catch(error=>{
      if(!host||epoch!==universeLoadEpoch)return;
      notice.textContent='Bibliothèque des univers non chargée : '+String(error?.message??error);
      notice.dataset.error='true';
    });
  }
  // Lazy presentation module: no extra page, no second Capture view/game owner.
  // Tests and embedded previews may supply the official loader explicitly.
  function createShellCreator(){
    if(creatorOwner)return Promise.resolve(creatorOwner);
    if(creatorPromise)return creatorPromise;
    const expected=host;
    const load=root.GensCaptureV2CreatorUiLoaderV1??(
      ()=>import(new URL('assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs',base).href)
    );
    creatorPromise=Promise.resolve().then(load).then(module=>{
      if(host!==expected||!creatorPanel)return null;
      creatorOwner=module.createCaptureShellCreatorV1({
        root,host,container:creatorPanel,notice
      });
      return creatorOwner;
    }).catch(error=>{
      creatorPromise=null;
      console.warn('Créateur du menu non chargé',error);
      return null;
    });
    return creatorPromise;
  }
  function showCreator(){
    if(!selectedUniverse||!home())return false;
    host.dataset.menu='creator';
    creatorPanel.dataset.active='true';
    notice.textContent='Habillage de '+selectedUniverse.name+
      ' · les réglages ne changent pas le gameplay.';
    void createShellCreator().then(owner=>{
      if(!owner){
        if(host?.dataset.menu==='creator')
          notice.textContent='Créateur indisponible : aucune préférence modifiée.';
        return;
      }
      if(host?.dataset.menu==='creator')return owner.show();
    }).catch(error=>{
      if(host?.dataset.menu==='creator')notice.textContent=
        'Créateur indisponible : '+String(error?.message??error);
    });
    return true;
  }
  function editors(){
    if(!selectedUniverse||!home())return false;
    host.dataset.menu="editors";
    notice.textContent="Choisis un outil de création.";
    return true;
  }
  function start(){
    if(shell.activeModule()!=="capture")return false;
    if(host){home();return true;}
    const doc=root.document;
    host=doc.createElement("section");
    host.id="gensCaptureV2Root";
    host.setAttribute("aria-label","Monster Capture");
    host.dataset.view="home";
    host.dataset.menu="universes";
    const header=doc.createElement("header");
    const name=doc.createElement("strong");name.textContent="Monster Capture";
    const exit=doc.createElement("button");
    exit.type="button";exit.textContent="Quitter le mode";
    exit.addEventListener("click",stop);
    header.append(name,exit);
    // Module home shows worlds before any session. Adventure itself remains
    // the only owner of new saves, the existing portfolio and selected WorldDocument.
    const nav=doc.createElement("nav");
    nav.className="gensCaptureV2MainMenu";
    nav.setAttribute("aria-label","Menu principal Monster Capture");
    const play=doc.createElement("button");play.type="button";
    play.dataset.captureV2View="adventure";
    play.textContent="Jouer";
    play.addEventListener("click",()=>{creatorOwner?.play('confirm');open("adventure");});
    const editing=doc.createElement("button");editing.type="button";
    editing.dataset.captureV2Menu="editors";
    editing.textContent="Éditeurs";
    editing.addEventListener("click",()=>{creatorOwner?.play('click');editors();});
    const creator=doc.createElement("button");creator.type="button";
    creator.dataset.captureV2Menu="creator";
    creator.textContent="Créateur";
    creator.addEventListener("click",()=>{creatorOwner?.play('click');showCreator();});
    const change=doc.createElement("button");change.type="button";
    change.dataset.captureV2Menu="universes";
    change.textContent="Changer d’univers";
    change.addEventListener("click",()=>{creatorOwner?.play('back');showUniverses();});
    nav.append(play,editing,creator,change);
    // This real library precedes play/editor choice; a saved PARTY never
    // masquerades as a separate GAME UNIVERSE.
    universePanel=doc.createElement('section');
    universePanel.className='gensCaptureV2UniversePanel';
    universePanel.setAttribute('aria-label','Univers Monster Capture');
    universePanel.textContent='Chargement des univers…';
    const editorPanel=doc.createElement("section");
    editorPanel.className="gensCaptureV2Editors";
    editorPanel.setAttribute("aria-label","Éditeurs Monster Capture");
    const menuBack=doc.createElement("button");menuBack.type="button";
    menuBack.className="gensCaptureV2MenuBack";
    menuBack.dataset.captureV2MenuBack="main";
    menuBack.textContent="← Menu principal";
    menuBack.addEventListener("click",()=>{creatorOwner?.play('back');home();});
    editorPanel.append(menuBack);
    for(const group of EDITOR_GROUPS){
      const section=doc.createElement("section");
      section.className="gensCaptureV2EditorGroup";
      section.dataset.editorGroup=group.id;
      const title=doc.createElement("h2");title.textContent=group.title;
      const entries=doc.createElement("ul");
      for(const kind of group.items){
        const li=doc.createElement("li");
        const button=doc.createElement("button");button.type="button";
        button.dataset.captureV2View=kind;
        button.textContent=VIEWS[kind].label;
        button.addEventListener("click",()=>{creatorOwner?.play('confirm');open(kind);});
        li.append(button);entries.append(li);
      }
      section.append(title,entries);editorPanel.append(section);
    }
    creatorPanel=doc.createElement("section");
    creatorPanel.className="gensCaptureV2CreatorPanel";
    creatorPanel.dataset.active='false';
    creatorPanel.setAttribute("aria-label","Créateur de l’habillage de l’univers");
    notice=doc.createElement("p");notice.setAttribute("role","status");
    // Native Lab pages own the whole viewport; this menu never overlays gameplay.
    const nativeBar=doc.createElement("div");
    nativeBar.className="gensCaptureV2NativeBar";
    const nativeBack=doc.createElement("button");
    nativeBack.type="button";
    nativeBack.className="gensCaptureV2NativeBack";
    nativeBack.textContent="← Monster Capture";
    nativeBack.addEventListener("click",()=>{creatorOwner?.play('back');home();});
    nativeTitle=doc.createElement("span");
    nativeTitle.className="gensCaptureV2NativeTitle";
    nativeBar.append(nativeBack,nativeTitle);
    stage=doc.createElement("div");stage.className="gensCaptureV2Stage";
    host.append(header,nav,editorPanel,creatorPanel,notice,nativeBar,stage,universePanel);
    doc.body.append(host);
    root.gensHideHomeLevels?.();
    home();
    loadUniverseHub();
    return true;
  }
  function stop(){
    if(!host)return false;
    dismissNativeLoading();
    if(gameFullscreenActive())void exitGameFullscreen();
    if(frame){frame.src="about:blank";frame.remove();}
    frame=null;stage=null;notice=null;nativeTitle=null;current=null;
    ++universeLoadEpoch;
    universeUi?.stop();universeUi=null;universePanel=null;selectedUniverse=null;
    creatorOwner?.stop();creatorOwner=null;creatorPromise=null;creatorPanel=null;
    host.remove();host=null;
    // Only the already-established Shell returns to the four-mode home.
    root.showGensRootHome?.();
    return true;
  }
  function status(){return Object.freeze({active:!!host,view:current});}
  if(shell.register("capture",start)!==true)throw new Error("Capture Shell registration refused");
  if(returnShell.register("capture",home)!==true)throw new Error("Capture return registration refused");
  root.GensCaptureV2=Object.freeze({start,stop,open,home,showUniverses,showCreator,status,
    requestGameFullscreen,exitGameFullscreen,gameFullscreenActive,onGameFullscreenChange,
    setAdventureCombatVisibility,setAdventureLoadingVisibility});
})(typeof window!=="undefined"?window:globalThis);
