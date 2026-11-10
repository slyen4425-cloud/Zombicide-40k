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
  function open(kind){
    if(!host)return false;
    const info=VIEWS[kind],url=urlFor(kind);
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
    frame.src=url.href;
    stage.replaceChildren(frame);
    current=kind;
    nativeTitle.textContent=info.label;
    notice.textContent=info.label;
    host.dataset.view=kind;
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
  // Exploration only sees merchant names. No second shop registry or input ID.
  root.addEventListener("message",async event=>{
    if(!host||current!=="builder"||!frame||
       event.source!==frame.contentWindow||event.origin!==root.location.origin||
       event.data?.schema!=="gensrpg.exploration.npc.merchant.catalog.request.v1")return;
    const requestId=event.data.requestId;
    if(typeof requestId!=="string"||!/^[a-z0-9-]{1,80}$/i.test(requestId))return;
    const responder=event.source;
    let merchants=[],error=null;
    try{
      const owner=await import(new URL(
        "assets/gensrpg/capture-v2/adventure-merchant-catalog-bridge-v1.mjs",base));
      merchants=owner.availableAdventureMerchantsForNpcV1({
        storage:root.localStorage,coreStorage:root.GensStorageV1});
    }catch(failure){error=String(failure?.message??failure).slice(0,180);}
    if(frame?.contentWindow!==responder||current!=="builder")return;
    responder.postMessage({
      schema:"gensrpg.capture.v2.npc.merchant.catalog.response.v1",
      requestId,merchants,error
    },root.location.origin);
  });
  function home(){
    if(!host)return false;
    if(gameFullscreenActive())void exitGameFullscreen();
    if(frame){frame.src="about:blank";frame.remove();frame=null;}
    stage.replaceChildren();
    current=null;host.dataset.view="home";host.dataset.menu="main";
    delete host.dataset.nativeFamily;
    nativeTitle.textContent="";
    notice.textContent="Choisis comment commencer.";
    return true;
  }
  function editors(){
    if(!home())return false;
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
    host.dataset.menu="main";
    const header=doc.createElement("header");
    const name=doc.createElement("strong");name.textContent="Monster Capture";
    const exit=doc.createElement("button");
    exit.type="button";exit.textContent="Quitter le mode";
    exit.addEventListener("click",stop);
    header.append(name,exit);
    // Two choices on the actual game home screen. The tools are not a
    // row of development/debug shortcuts; they live in ONE grouped editor list.
    const nav=doc.createElement("nav");
    nav.className="gensCaptureV2MainMenu";
    nav.setAttribute("aria-label","Menu principal Monster Capture");
    const play=doc.createElement("button");play.type="button";
    play.dataset.captureV2View="adventure";
    play.textContent="Jouer";
    play.addEventListener("click",()=>open("adventure"));
    const editing=doc.createElement("button");editing.type="button";
    editing.dataset.captureV2Menu="editors";
    editing.textContent="Éditeurs";
    editing.addEventListener("click",editors);
    nav.append(play,editing);
    const editorPanel=doc.createElement("section");
    editorPanel.className="gensCaptureV2Editors";
    editorPanel.setAttribute("aria-label","Éditeurs Monster Capture");
    const menuBack=doc.createElement("button");menuBack.type="button";
    menuBack.className="gensCaptureV2MenuBack";
    menuBack.dataset.captureV2MenuBack="main";
    menuBack.textContent="← Menu principal";
    menuBack.addEventListener("click",home);
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
        button.addEventListener("click",()=>open(kind));
        li.append(button);entries.append(li);
      }
      section.append(title,entries);editorPanel.append(section);
    }
    notice=doc.createElement("p");notice.setAttribute("role","status");
    // Native Lab pages own the whole viewport; this menu never overlays gameplay.
    const nativeBar=doc.createElement("div");
    nativeBar.className="gensCaptureV2NativeBar";
    const nativeBack=doc.createElement("button");
    nativeBack.type="button";
    nativeBack.className="gensCaptureV2NativeBack";
    nativeBack.textContent="← Monster Capture";
    nativeBack.addEventListener("click",home);
    nativeTitle=doc.createElement("span");
    nativeTitle.className="gensCaptureV2NativeTitle";
    nativeBar.append(nativeBack,nativeTitle);
    stage=doc.createElement("div");stage.className="gensCaptureV2Stage";
    host.append(header,nav,editorPanel,notice,nativeBar,stage);
    doc.body.append(host);
    root.gensHideHomeLevels?.();
    home();
    return true;
  }
  function stop(){
    if(!host)return false;
    if(gameFullscreenActive())void exitGameFullscreen();
    if(frame){frame.src="about:blank";frame.remove();}
    frame=null;stage=null;notice=null;nativeTitle=null;current=null;
    host.remove();host=null;
    // Only the already-established Shell returns to the four-mode home.
    root.showGensRootHome?.();
    return true;
  }
  function status(){return Object.freeze({active:!!host,view:current});}
  if(shell.register("capture",start)!==true)throw new Error("Capture Shell registration refused");
  if(returnShell.register("capture",home)!==true)throw new Error("Capture return registration refused");
  root.GensCaptureV2=Object.freeze({start,stop,open,home,status,
    requestGameFullscreen,exitGameFullscreen,gameFullscreenActive,onGameFullscreenChange});
})(typeof window!=="undefined"?window:globalThis);
