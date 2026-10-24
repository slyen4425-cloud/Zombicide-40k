/* Opt-in diagnostic launch and report UI; does not edit user/game saves. */
(function(){
"use strict";
const KEY="gensrpg_mobile_diag_v1";
const HISTORY_KEY="gensrpg_mobile_diag_history_v2",STAGE_KEY="gensrpg_mobile_diag_script_stage_v2",LAUNCH_KEY="gensrpg_mobile_diag_launch_stage_v2";
const $=id=>document.getElementById(id);
let last=null;
function getLog(){
 try{let s=localStorage.getItem(KEY);return s?JSON.parse(s):null}catch(_){return null}
}
function getStage(session){
 try{
   const x=JSON.parse(localStorage.getItem(STAGE_KEY)||"null");
   return x&&x.session===session?x:null;
 }catch(_){return null}
}
function getHistory(){
 try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");return Array.isArray(a)?a.slice(0,3):[]}catch(_){return []}
}
function snapshot(){const current=getLog();let launcherStage=null;try{launcherStage=JSON.parse(localStorage.getItem(LAUNCH_KEY)||"null")}catch(_){}return {format:"gensrpg-chrome-diag-v2",current,scriptStage:current?getStage(current.id):null,launcherStage,previous:getHistory()}}
function stageLine(s){return s?"Dernier script : n°"+s.script+" · "+s.source+" · "+(s.phase==="before"?"juste avant son exécution":"après son exécution"):"Pas de jalon de script enregistré"}
function show(){
 last=getLog();
 const status=$("status"),out=$("report");
 if(!last){status.textContent="Aucun journal enregistré.";out.textContent="Lance un test pour commencer.";return}
 const p=last.lastPulse?new Date(last.lastPulse).toLocaleString("fr-FR"):"aucune";
 status.textContent="Dernière session : "+new Date(last.startedAt).toLocaleString("fr-FR")+" · Dernier signal : "+p+(last.ended?" · Page quittée normalement.":" · Fin non confirmée (crash, gel ou fermeture possibles).");
 const events=(last.events||[]).map(x=>{
   const data=Object.entries(x).filter(([k])=>!["at","type","ms"].includes(k)).map(([k,v])=>k+"="+v).join(" ");
   return x.at+"  "+x.type+"  "+data;
 });
 const snap=snapshot();
 const archive=snap.previous.map((p,i)=>"ESSAI PRECEDENT "+(i+1)+": "+(p.log?.startedAt||"?")+"\n"+stageLine(p.stage)+"\n"+(p.log?.events||[]).map(e=>e.at+" "+e.type).join("\n")).join("\n\n");
 out.textContent="APPAREIL : "+(last.agent||"inconnu")+"\nSESSION : "+last.id+"\nDERNIER SIGNAL : "+p+"\n"+stageLine(snap.scriptStage)+"\nPHASE LANCEUR : "+(snap.launcherStage?.phase||"inconnue")+"\nANCIENS ESSAIS SAUVEGARDES : "+snap.previous.length+"\n\n"+events.join("\n")+(archive?"\n\n"+archive:"");
}
function payload(){return JSON.stringify(snapshot(),null,2)}
$("refresh").addEventListener("click",show);
$("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(payload());$("status").textContent="Journal copié dans le presse-papiers."}catch(_){const a=document.createElement("textarea");a.value=payload();document.body.appendChild(a);a.select();try{document.execCommand("copy");$("status").textContent="Journal copié."}catch(__){$("status").textContent="Utilise le bouton Exporter."}a.remove()}});
$("download").addEventListener("click",()=>{
 const blob=new Blob([payload()],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="gensrpg-diagnostic-chrome-"+new Date().toISOString().slice(0,10)+".json";
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)
});
$("clear").addEventListener("click",()=>{
 if(!confirm("Effacer seulement le journal de diagnostic ? Les sauvegardes du jeu ne seront pas touchées."))return;
 try{localStorage.removeItem(KEY);localStorage.removeItem(HISTORY_KEY);localStorage.removeItem(STAGE_KEY);localStorage.removeItem(LAUNCH_KEY)}catch(_){}show()
});
$("start").addEventListener("click",()=>{try{sessionStorage.setItem("__gensDiagManualStart","1")}catch(_){}location.href="diagnostic.html?run=1"});
show();
if(new URLSearchParams(location.search).get("run")!=="1")return;

function scriptTagEnd(html,start){
 let quoted="";
 for(let i=start;i<html.length;i++){
   const c=html[i];
   if(quoted){if(c===quoted)quoted="";continue}
   if(c==="'"||c==='"'){quoted=c;continue}
   if(c===">")return i+1;
 }
 return -1;
}
function instrumentHeroStartup(html){
  // Test-page-only breadcrumbs. Does NOT read, change, skip or overwrite
  // personalized heroes, their saved data, or any game decision.
  const mark=kind=>'window.__gensMobileDiagV1&&window.__gensMobileDiagV1.logBounded("'+kind+'");';
  const targets=[
    ['z40kApplyCustomHeroes();','hero-call-before','hero-call-after'],
    ['const a=gensrpgHydrateAssets(JSON.parse(localStorage.getItem(Z40K_CUSTOM_HEROES_KEY)||"[]"));','hero-hydrate-before','hero-hydrate-after']
  ];
  let changed=0;
  for(const [literal,a,b] of targets){
    if(html.split(literal).length!==2)continue;
    html=html.replace(literal,mark(a)+literal+mark(b));changed++;
  }
  const signature='function applyCustomHeroesMulti(){';
  if(html.includes(signature)){
    html=html.replace(signature,signature+'\n'+mark('hero-apply-enter'));
    changed++;
  }
  launchStep('hero-breadcrumbs',changed+'/3 exact targets');
  return html;
}

function instrumentScripts(html){
 const found=/<script(?=[\s>])/gi;
 const close=/<\/script\s*>/gi;
 let index=0,cursor=0,out="";
 for(let open;(open=found.exec(html));){
   if(open.index<cursor)continue;
   const end=scriptTagEnd(html,open.index);
   if(end<0)break;
   close.lastIndex=end;
   const closing=close.exec(html);
   if(!closing)break;
   const tag=html.slice(open.index,end);
   const match=/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
   let source="inline";
   if(match){
     try{source=new URL(match[1]||match[2]||match[3],location.href).pathname.slice(-130)}catch(_){source="external"}
   }
   if(/\btype\s*=\s*["']?(?:application\/json|application\/ld\+json)/i.test(tag))source="data:"+source;
   index++;
   const cmd=phase=>'<script>window.__gensMobileDiagV1&&window.__gensMobileDiagV1.markScript("'+phase+'",'+index+','+JSON.stringify(source).replace(/</g,"\\u003c")+');<\/script>';
   out+=html.slice(cursor,open.index)+cmd("before")+html.slice(open.index,closing.index+closing[0].length)+cmd("after");
   cursor=closing.index+closing[0].length;
   found.lastIndex=cursor;
   if(index>=1000)break;
 }
 return {html:out+html.slice(cursor),count:index};
}
function launchStep(type,detail){
 try{localStorage.setItem(LAUNCH_KEY,JSON.stringify({session:"launcher",at:new Date().toISOString(),phase:type,source:String(detail||"").slice(0,100)}))}catch(_){}
}

$("loading").style.display="grid";
(async()=>{
 try{
   const u=new URL("index.html",location.href);
   const response=await fetch(u.href,{cache:"no-store"});
   if(!response.ok)throw Error("Chargement du jeu refusé : "+response.status);
   let html=await response.text();
   launchStep("html-received",html.length+" characters");
   if(!/<head(?:\s[^>]*)?>/i.test(html))throw Error("Structure de page de jeu introuvable");
   html=instrumentHeroStartup(html);
   const traced=instrumentScripts(html);
   html=traced.html;
   launchStep("instrumented",traced.count+" script tags");
   // Insert logger before all parser-blocking game scripts, retaining original index.
   const base=new URL("./",location.href).href;
   html=html.replace(/<head([^>]*)>/i,(all,attrs)=>'<head'+attrs+'><base href="'+base+'"><script src="diagnostic-boot.js"><\/script>');
   document.open();document.write(html);document.close();
 }catch(e){
   $("loading").style.display="none";
   $("status").textContent="Impossible de lancer le jeu : "+String(e.message||e);
   launchStep("launcher-error",String(e.message||e));
   show();
 }
})();
})();
