"use strict";
// Clean Capture shell: composition/navigation ONLY. No historic Capture scripts,
// monster catalog, skill definitions, battle engine, rewards or world simulator.
(function(root){
  const base=new URL("./",root.document.baseURI);
  const VIEWS=Object.freeze({
    explore:{label:"Exploration 2.5D",path:"vendor/exploration-lab/index.html",family:"exploration"},
    builder:{label:"World Builder",path:"vendor/exploration-lab/builder.html",family:"exploration"},
    world:{label:"Carte du monde",path:"vendor/exploration-lab/world-assembler.html",family:"exploration"},
    // Four native entry points, ONE actual Lab Combat editor. Combat main
    // (SHA-pinned PR #156) owns ?tab= routing, native state and all rules.
    // Never click tabs from the consumer or implement a parallel editor.
    creature:{label:"Créatures · Labo Combat",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=creature",family:"combat"},
    skills:{label:"Capacités · Labo Combat",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=skills",family:"combat"},
    combat:{label:"Règles de combat · Labo Combat",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=combat",family:"combat"},
    music:{label:"Musiques · Labo Combat",path:"vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab=music",family:"combat"},
    bestiary:{label:"Bestiaire · Labo Combat",path:"vendor/combat-lab/examples/dom-demo/bestiary.html",family:"combat"}
  });
  const shell=root.GensShellModuleLaunchV1;
  const returnShell=root.GensShellScreenReturnV1;
  if(!shell||!returnShell||!root.GensCaptureV1?.isProfile)
    throw new Error("Clean Capture requires the existing four-mode Shell");
  if(root.GensCaptureV2)throw new Error("Duplicate Capture module authority");
  let host=null,frame=null,stage=null,notice=null,current=null,nativeTitle=null;
  function urlFor(kind){
    const info=VIEWS[kind];
    if(!info)throw new RangeError("Unknown Capture native owner");
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
    notice.textContent=info.label+" · modules officiels des laboratoires";
    host.dataset.view=kind;
    return true;
  }
  function home(){
    if(!host)return false;
    if(frame){frame.src="about:blank";frame.remove();frame=null;}
    stage.replaceChildren();
    current=null;host.dataset.view="home";
    nativeTitle.textContent="";
    notice.textContent="Socle neuf. L'équipe, les rencontres, l'XP, la capture et les marchands seront raccordés ultérieurement.";
    return true;
  }
  function start(){
    if(shell.activeModule()!=="capture")return false;
    if(host){home();return true;}
    const doc=root.document;
    host=doc.createElement("section");
    host.id="gensCaptureV2Root";
    host.setAttribute("aria-label","Monster Capture — nouveau module");
    host.dataset.view="home";
    const header=doc.createElement("header");
    const name=doc.createElement("strong");name.textContent="Monster Capture";
    const exit=doc.createElement("button");
    exit.type="button";exit.textContent="Quitter le mode";
    exit.addEventListener("click",stop);
    header.append(name,exit);
    const nav=doc.createElement("nav");
    nav.setAttribute("aria-label","Fonctions officielles Monster Capture");
    const back=doc.createElement("button");back.type="button";back.textContent="Accueil Capture";
    back.addEventListener("click",home);nav.append(back);
    for(const [key,info] of Object.entries(VIEWS)){
      const button=doc.createElement("button");button.type="button";
      button.dataset.captureV2View=key;button.textContent=info.label;
      button.addEventListener("click",()=>open(key));nav.append(button);
    }
    notice=doc.createElement("p");notice.setAttribute("role","status");
    // Full native tool viewport. The 8-button Capture hub is only the home view.
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
    host.append(header,nav,notice,nativeBar,stage);
    doc.body.append(host);
    root.gensHideHomeLevels?.();
    home();
    return true;
  }
  function stop(){
    if(!host)return false;
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
  root.GensCaptureV2=Object.freeze({start,stop,open,home,status});
})(typeof window!=="undefined"?window:globalThis);
