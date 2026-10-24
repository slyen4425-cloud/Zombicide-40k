
(function(){
function fixPregame131(){
  const pre=document.getElementById("pregameSetup");
  if(!pre)return;
  /* Supprime l'injection fautive V130. */
  document.getElementById("preMj130Btn")?.remove();

  /* Réaffiche tout ce que V130 avait éventuellement caché dans le vrai écran. */
  pre.querySelectorAll('[style*="display: none"],[style*="display:none"]').forEach(el=>{
    if(el.id!=="capturePregameMj130") el.style.removeProperty("display");
  });

  /* En mode Capture, on conserve le véritable écran participants + starters.
     Le MJ est une action secondaire, pas l'écran principal. */
  if(typeof gensCapturePregameMode==="function" && gensCapturePregameMode()){
    let tools=document.getElementById("capturePregameTools131");
    if(!tools){
      tools=document.createElement("div");
      tools.id="capturePregameTools131";
      tools.className="capturePregameTools131";
      tools.innerHTML='<button type="button" onclick="captureOpenPregameMj130()">🎛️ Réglages MJ</button>';
      const start=pre.querySelector('button.startGameBtn[onclick="startConfiguredGame()"]');
      if(start?.parentNode) start.parentNode.insertBefore(tools,start);
      else pre.appendChild(tools);
    }
    try{renderParticipantSelector()}catch(e){}
  } else {
    document.getElementById("capturePregameTools131")?.remove();
  }
}
window.captureFixPregame131=fixPregame131;

/* Empêche le vieux cleanup130 de refaire des dégâts s'il est appelé ailleurs. */
window.cleanupPregame130=function(){};

/* Quand la préparation devient visible, on répare une seule fois sans observer
   tout le DOM en boucle. */
document.addEventListener("DOMContentLoaded",()=>setTimeout(fixPregame131,50));
setTimeout(fixPregame131,150);
})();
