/* Opt-in diagnostic launch and report UI; does not edit user/game saves. */
(function(){
"use strict";
const KEY="gensrpg_mobile_diag_v1";
const $=id=>document.getElementById(id);
let last=null;
function getLog(){
 try{let s=localStorage.getItem(KEY);return s?JSON.parse(s):null}catch(_){return null}
}
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
 out.textContent="APPAREIL : "+(last.agent||"inconnu")+"\nSESSION : "+last.id+"\nDERNIER SIGNAL : "+p+"\n\n"+events.join("\n");
}
function payload(){return JSON.stringify(getLog()||{error:"no-logs"},null,2)}
$("refresh").addEventListener("click",show);
$("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(payload());$("status").textContent="Journal copié dans le presse-papiers."}catch(_){const a=document.createElement("textarea");a.value=payload();document.body.appendChild(a);a.select();try{document.execCommand("copy");$("status").textContent="Journal copié."}catch(__){$("status").textContent="Utilise le bouton Exporter."}a.remove()}});
$("download").addEventListener("click",()=>{
 const blob=new Blob([payload()],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="gensrpg-diagnostic-chrome-"+new Date().toISOString().slice(0,10)+".json";
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)
});
$("clear").addEventListener("click",()=>{
 if(!confirm("Effacer seulement le journal de diagnostic ? Les sauvegardes du jeu ne seront pas touchées."))return;
 try{localStorage.removeItem(KEY)}catch(_){}show()
});
$("start").addEventListener("click",()=>{try{sessionStorage.setItem("__gensDiagManualStart","1")}catch(_){}location.href="diagnostic.html?run=1"});
show();
if(new URLSearchParams(location.search).get("run")!=="1")return;
$("loading").style.display="grid";
(async()=>{
 try{
   const u=new URL("index.html",location.href);
   const response=await fetch(u.href,{cache:"no-store"});
   if(!response.ok)throw Error("Chargement du jeu refusé : "+response.status);
   let html=await response.text();
   if(!/<head(?:\s[^>]*)?>/i.test(html))throw Error("Structure de page de jeu introuvable");
   // Insert logger before all parser-blocking game scripts, retaining original index.
   const base=new URL("./",location.href).href;
   html=html.replace(/<head([^>]*)>/i,(all,attrs)=>'<head'+attrs+'><base href="'+base+'"><script src="diagnostic-boot.js"><\/script>');
   document.open();document.write(html);document.close();
 }catch(e){
   $("loading").style.display="none";
   $("status").textContent="Impossible de lancer le jeu : "+String(e.message||e);
   try{localStorage.setItem(KEY,JSON.stringify({version:1,startedAt:new Date().toISOString(),ended:true,events:[{at:new Date().toISOString(),type:"launcher-error",message:String(e.message||e).slice(0,180)}]}))}catch(_){}
   show();
 }
})();
})();
