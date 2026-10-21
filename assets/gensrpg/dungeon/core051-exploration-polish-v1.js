
(function(){
"use strict";

const DEFAULT_CHALLENGES=[
{id:"p1",type:"choice",target:"door",title:"Séquence des gardiens",prompt:"Les plaques portent 3, 6, 11, 18, 27. Quelle valeur doit porter la suivante ?",solution:"38",options:"35,36,38,40",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p2",type:"riddle",target:"auto",title:"Le prisonnier du temps",prompt:"Je peux être perdu sans être possédé, gagné sans être acheté, et une fois passé je ne reviens jamais.",solution:"temps",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p3",type:"choice",target:"chest",title:"Sceau binaire",prompt:"Les runes suivent : ⚪⚫⚫, ⚫⚪⚫, ⚫⚫⚪. Quelle vient ensuite ?",solution:"⚪⚫⚫",options:"⚫⚪⚫,⚪⚫⚫,⚫⚫⚫",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p4",type:"riddle",target:"door",title:"Le témoin silencieux",prompt:"Je montre tout sans rien voir, je renverse gauche et droite sans jamais mentir.",solution:"miroir",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p5",type:"choice",target:"auto",title:"Suite brisée",prompt:"2, 5, 10, 17, 26…",solution:"37",options:"34,35,36,37",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p6",type:"riddle",target:"chest",title:"Le coffre du scribe",prompt:"On me remplit pour me vider, et plus je travaille plus je raccourcis.",solution:"crayon",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p7",type:"choice",target:"door",title:"Trois portes",prompt:"Une inscription dit : « La porte rouge ment. La bleue dit vrai. La verte dit que la bleue ment. » Une seule phrase est vraie. Quelle porte choisir ?",solution:"bleue",options:"rouge,bleue,verte",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p8",type:"riddle",target:"auto",title:"L'invité impossible",prompt:"Je suis dans la minute deux fois, dans l'heure aucune, et dans la seconde une fois.",solution:"e",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p9",type:"choice",target:"door",title:"Runes multiplicatives",prompt:"2 → 6, 3 → 12, 4 → 20. Alors 6 → ?",solution:"42",options:"30,36,40,42",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p10",type:"riddle",target:"auto",title:"Le voleur de voix",prompt:"Je répète tes mots sans les comprendre et je disparais dans une pièce trop pleine.",solution:"echo",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p11",type:"choice",target:"chest",title:"Balance des idoles",prompt:"Deux idoles pèsent 10. Une idole et deux gemmes pèsent 8. Combien pèse une gemme ?",solution:"1.5",options:"1,1.5,2,3",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p12",type:"stat",target:"auto",title:"Herse de pierre",prompt:"La herse descend lentement. Il faut maintenir le mécanisme ouvert pendant que le groupe passe.",solution:"",stat:"force",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p13",type:"stat",target:"door",title:"Alphabet runique mouvant",prompt:"Les glyphes changent selon un motif complexe. Il faut identifier la règle avant qu'ils ne s'effacent.",solution:"",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p14",type:"stat",target:"chest",title:"Serrure à contrepoids",prompt:"Chaque mouvement du crochet déplace un contrepoids invisible. Une erreur bloque le mécanisme.",solution:"",stat:"agilite",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p15",type:"choice",target:"auto",title:"L'intrus logique",prompt:"Quel nombre ne suit pas la même règle : 16, 25, 36, 45, 49 ?",solution:"45",options:"16,25,36,45,49",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p16",type:"riddle",target:"door",title:"Le mot amputé",prompt:"Quel mot devient plus long lorsqu'on lui retire sa première lettre ?",solution:"longe",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p17",type:"choice",target:"door",title:"Torches jumelles",prompt:"Quatre torches A B C D. A et C doivent être opposées, B identique à D, et exactement deux doivent être allumées. Quel motif convient ?",solution:"🔥❌❌🔥",options:"🔥🔥❌❌,🔥❌❌🔥,❌🔥🔥❌,🔥❌🔥❌",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p18",type:"riddle",target:"auto",title:"Le royaume sans routes",prompt:"J'ai des villes sans maisons, des forêts sans arbres et des rivières sans eau.",solution:"carte",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p19",type:"choice",target:"chest",title:"Suite du serpent",prompt:"1, 2, 6, 24, 120…",solution:"720",options:"240,360,600,720",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p20",type:"stat",target:"auto",title:"Sceau de volonté",prompt:"Une illusion promet exactement ce que chaque héros désire. Il faut reconnaître le mensonge et avancer.",solution:"",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p21",type:"riddle",target:"auto",title:"Le gardien sans corps",prompt:"Plus tu en prends, plus tu en laisses derrière toi.",solution:"pas",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p22",type:"choice",target:"door",title:"Suite alternée",prompt:"4, 7, 14, 17, 34, 37…",solution:"74",options:"40,68,71,74",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p23",type:"riddle",target:"chest",title:"Le bien partagé",prompt:"Si tu me gardes, je n'existe que pour toi. Si tu me partages, je cesse souvent d'exister.",solution:"secret",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p24",type:"choice",target:"auto",title:"Cycle des sceaux",prompt:"🔥 🌊 🌿 🔥 🌊 …",solution:"🌿",options:"🔥,🌊,🌿,⚡",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p25",type:"riddle",target:"door",title:"Le messager immobile",prompt:"Je voyage autour du monde collé dans un angle.",solution:"timbre",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p26",type:"choice",target:"chest",title:"Progression cachée",prompt:"5, 8, 14, 23, 35…",solution:"50",options:"46,48,50,52",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p27",type:"riddle",target:"auto",title:"Avant l'usage",prompt:"Je dois être brisé pour accomplir ce pour quoi j'existe.",solution:"oeuf",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p28",type:"stat",target:"door",title:"Porte cyclopéenne",prompt:"Une roue de pierre bloque le passage. Elle ne peut être déplacée qu'en maintenant une pression constante.",solution:"",stat:"force",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p29",type:"choice",target:"auto",title:"Carrés et cubes",prompt:"1, 8, 27, 64…",solution:"125",options:"81,100,121,125",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p30",type:"riddle",target:"chest",title:"Le gardien poreux",prompt:"Je possède mille ouvertures, pourtant je peux retenir ce que tes mains laisseraient couler.",solution:"eponge",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p31",type:"choice",target:"door",title:"Équation des armes",prompt:"Si 🗡️=3, 🛡️=5 et 🏹=7, combien vaut 🗡️ + 🛡️ × 🏹 ?",solution:"38",options:"56,38,35,43",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p32",type:"riddle",target:"auto",title:"La route qui chante",prompt:"Je cours sans jambes, tombe sans trébucher et peux rugir sans bouche.",solution:"riviere",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p33",type:"stat",target:"chest",title:"Cadran à aiguilles",prompt:"Le coffre possède six disques tournant à des vitesses différentes. Il faut les aligner au même instant.",solution:"",stat:"agilite",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p34",type:"choice",target:"auto",title:"Nombre manquant",prompt:"7, 10, 8, 11, 9, 12…",solution:"10",options:"9,10,11,13",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p35",type:"riddle",target:"door",title:"Né de la mer",prompt:"Je nais dans l'eau ; jeté dans l'eau, je disparais.",solution:"sel",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p36",type:"choice",target:"chest",title:"Calendrier des anciens",prompt:"Si le 1er jour est Lune, le 8e est…",solution:"Lune",options:"Soleil,Lune,Feu,Terre",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p37",type:"riddle",target:"auto",title:"Le gardien à deux mains",prompt:"J'ai un visage et deux mains mais aucun bras.",solution:"horloge",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p38",type:"choice",target:"door",title:"Somme des impairs",prompt:"1 + 3 + 5 + 7 + 9 = ?",solution:"25",options:"20,23,25,27",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p39",type:"stat",target:"auto",title:"Murmures du Néant",prompt:"Plusieurs voix donnent des ordres contradictoires. Il faut conserver son objectif malgré la confusion.",solution:"",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p40",type:"riddle",target:"chest",title:"Clés sans portes",prompt:"J'ai des dizaines de clés, une barre d'espace et une touche d'entrée, mais aucune porte.",solution:"clavier",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p41",type:"choice",target:"door",title:"Rotation des glyphes",prompt:"↑ → ↓ ← ↑ …",solution:"→",options:"↑,→,↓,←",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p42",type:"riddle",target:"auto",title:"La vie qui diminue",prompt:"Je grandis vers le bas à mesure que ma vie s'écoule.",solution:"bougie",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p43",type:"choice",target:"chest",title:"Priorité des runes",prompt:"12 ÷ 3 + 2 × 5 = ?",solution:"14",options:"10,14,20,30",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p44",type:"stat",target:"door",title:"Dalles à retardement",prompt:"Les dalles sûres ne restent stables qu'une fraction de seconde. Il faut franchir l'ensemble sans hésiter.",solution:"",stat:"agilite",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p45",type:"riddle",target:"auto",title:"L'invisible voyageur",prompt:"On ne me voit jamais directement, mais feuilles, flammes et poussière révèlent mon passage.",solution:"vent",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p46",type:"choice",target:"door",title:"Code miroir",prompt:"Un cadran montre 21:12. En inversant les chiffres, quel code obtient-on ?",solution:"12:21",options:"21:21,12:21,12:12,11:22",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p47",type:"riddle",target:"chest",title:"Lit sans sommeil",prompt:"J'ai un lit et une bouche, mais je ne dors ni ne parle.",solution:"riviere",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p48",type:"choice",target:"auto",title:"Suite des écarts",prompt:"30, 27, 23, 18, 12…",solution:"5",options:"4,5,6,7",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p49",type:"stat",target:"chest",title:"Coffre du pacte",prompt:"Le sceau tente de forcer un souvenir douloureux dans l'esprit du héros. Il faut garder le contrôle.",solution:"",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2},
{id:"p50",type:"riddle",target:"door",title:"Ce qui lie sans chaîne",prompt:"On peut me faire, me tenir, me rompre ou me trahir sans jamais me toucher.",solution:"promesse",stat:"esprit",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2}
];
let draft051=[];

function clone051(x){return JSON.parse(JSON.stringify(x))}
function esc051(v){try{return z40kEscHtml(String(v??""))}catch(e){return String(v??"")}}
function attr051(v){try{return z40kEscAttr(String(v??""))}catch(e){return String(v??"").replace(/"/g,"&quot;")}}
function cfg051(){try{return loadDungeonConfig?.()||{}}catch(e){return{}}}
function room051(){try{return Number(loadDungeonState?.()?.room)||0}catch(e){return 0}}
function scene051(){
  const r=room051();
  try{return (loadDungeonSceneElements?.()||[]).filter(x=>Number(x.room||0)===r || (!x.room&&r===0))}catch(e){return[]}
}
function saveScene051(a){try{saveDungeonSceneElements?.(a)}catch(e){}}
function hero051(){
  try{
    const x=JSON.parse(localStorage.getItem("gensrpg_dungeon_core02_v1")||"{}");
    return x.participants?.[Number(x.index)||0]||x.participants?.[0]||dungeonParticipants?.()?.[0]||null;
  }catch(e){return dungeonParticipants?.()?.[0]||null}
}
function heroName051(id){return CHARS?.[id]?.name||findCustomHero?.(id)?.name||id||"Héros"}
function damage051(id,n){
  n=Math.max(1,Number(n)||1);
  try{dungeonSetHeroWounds?.(id,n)}catch(e){}
  try{DungeonCore01?.render?.()}catch(e){}
}
function normalized051(v){return String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function challengePool051(){
  const c=cfg051();
  const list=Array.isArray(c.challenges)&&c.challenges.length?c.challenges:DEFAULT_CHALLENGES;
  return list.filter(x=>x&&x.title);
}
function pickChallenge051(target){
  let p=challengePool051().filter(x=>!x.target||x.target==="auto"||x.target===target);
  if(!p.length)p=challengePool051();
  if(!p.length)return clone051(DEFAULT_CHALLENGES[0]);

  // Core 0.67 : mémoire anti-répétition. Une énigme utilisée reste hors du tirage
  // jusqu'à ce qu'au moins 12 autres défis aient été rencontrés.
  const hk="gensrpg_dc067_challenge_history";
  let hist=[];try{hist=GensStorageV1.readJson(localStorage,hk,[]);if(!Array.isArray(hist))hist=[]}catch(e){hist=[]}
  const recent=new Set(hist.slice(-12).map(String));
  let fresh=p.filter(x=>!recent.has(String(x.id)));
  if(!fresh.length)fresh=p;
  const chosen=fresh[Math.floor(Math.random()*fresh.length)]||p[0];
  hist.push(String(chosen.id));
  try{GensStorageV1.writeJson(localStorage,hk,hist.slice(-24))}catch(e){}
  return clone051(chosen);
}

/* ---------- BIBLIOTHÈQUE D'ÉNIGMES CORE 0.69 ---------- */
const CHALLENGE_LIB_KEY_069="gensrpg_challenge_library_v1";
let challengeEditorCurrent069=null;

function loadChallengeLibrary069(){
  let lib=[];
  try{lib=GensStorageV1.readJson(localStorage,CHALLENGE_LIB_KEY_069,[])}catch(e){lib=[]}
  if(!Array.isArray(lib))lib=[];

  // Toujours garantir les 50 énigmes intégrées, sans écraser les modifications utilisateur.
  const byId=new Map(lib.filter(Boolean).map(x=>[String(x.id),x]));
  DEFAULT_CHALLENGES.forEach(x=>{
    const id=String(x.id);
    if(!byId.has(id))byId.set(id,clone051(x));
  });
  lib=[...byId.values()];
  try{GensStorageV1.writeJson(localStorage,CHALLENGE_LIB_KEY_069,lib)}catch(e){}
  return lib;
}
function saveChallengeLibrary069(lib){
  try{GensStorageV1.writeJson(localStorage,CHALLENGE_LIB_KEY_069,Array.isArray(lib)?lib:[])}catch(e){}
}
function challengeById069(id){
  return loadChallengeLibrary069().find(x=>String(x.id)===String(id))||null;
}
function challengeLabel069(x){
  const type=x?.type==="stat"?"Test":x?.type==="choice"?"Choix":"Énigme";
  const target=x?.target==="door"?"Porte":x?.target==="chest"?"Coffre":"Auto";
  return (x?.title||x?.id||"Sans nom")+" · "+type+" · "+target;
}

window.dc051LoadChallengeEditor=function(list){
  const lib=loadChallengeLibrary069();

  // Migration des anciennes aventures :
  // l'ancien bug pouvait sauvegarder seulement les 3 modèles historiques.
  // Dans ce cas on active les 50 intégrées au lieu de conserver le mauvais état.
  if(!Array.isArray(list)||list.length===0||list.length<=3){
    draft051=DEFAULT_CHALLENGES.map(x=>String(x.id));
  }else{
    draft051=[...new Set(list.map(x=>String(typeof x==="string"?x:x?.id||"")).filter(Boolean))];
  }
  // Si un ancien objet n'existe plus en bibliothèque, on le récupère.
  if(Array.isArray(list)){
    const cur=loadChallengeLibrary069(),ids=new Set(cur.map(x=>String(x.id))),add=[];
    list.forEach(x=>{
      if(x&&typeof x==="object"&&x.id&&!ids.has(String(x.id)))add.push(clone051(x));
    });
    if(add.length)saveChallengeLibrary069(cur.concat(add));
  }
  dc051RenderChallengeEditor();
};
window.dc051CollectChallenges=function(){
  const lib=loadChallengeLibrary069();
  const byId=new Map(lib.map(x=>[String(x.id),x]));
  return draft051.map(id=>byId.get(String(id))).filter(Boolean).map(clone051);
};
window.dc051AddSelectedChallenge069=function(){
  const sel=document.getElementById("daeChallengePicker069");
  const id=sel?.value||"";
  if(!id)return;
  if(!draft051.includes(id))draft051.push(id);
  dc051RenderChallengeEditor();
};
window.dc051RemoveSelectedChallenge069=function(){
  const sel=document.getElementById("daeChallengeSelected069");
  const id=sel?.value||"";
  if(!id)return;
  draft051=draft051.filter(x=>String(x)!==String(id));
  dc051RenderChallengeEditor();
};
window.dc051AddAllChallenges069=function(){
  draft051=loadChallengeLibrary069().map(x=>String(x.id));
  dc051RenderChallengeEditor();
};
window.dc051ClearChallenges069=function(){
  if(!confirm("Retirer toutes les énigmes de cette aventure ? La bibliothèque ne sera pas supprimée."))return;
  draft051=[];
  dc051RenderChallengeEditor();
};

// Compatibilité avec les vieux boutons éventuels.
window.dc051AddChallengeEditor=function(){dc051OpenChallengeLibrary069(true)};
window.dc051DeleteChallenge=function(i){
  if(i>=0&&i<draft051.length){draft051.splice(i,1);dc051RenderChallengeEditor()}
};
window.dc051UpdateChallenge=function(){};

window.dc051RenderChallengeEditor=function(){
  const host=document.getElementById("daeChallengeList");if(!host)return;
  const lib=loadChallengeLibrary069(),byId=new Map(lib.map(x=>[String(x.id),x]));
  const available=lib.filter(x=>!draft051.includes(String(x.id)));
  const selected=draft051.map(id=>byId.get(String(id))).filter(Boolean);

  host.innerHTML=`
    <div class="dc069ChallengeAssign">
      <div class="dc069ChallengeAssignRow">
        <select id="daeChallengePicker069" aria-label="Choisir une énigme">
          ${available.length?available.map(x=>`<option value="${attr051(x.id)}">${esc051(challengeLabel069(x))}</option>`).join(""):'<option value="">Toutes les énigmes de la bibliothèque sont déjà ajoutées</option>'}
        </select>
        <button type="button" class="v2Btn primary" onclick="dc051AddSelectedChallenge069()">➕ AJOUTER</button>
      </div>
      <div class="dc069ChallengeCount">🧩 <strong>${selected.length}</strong> énigme${selected.length>1?"s":""} active${selected.length>1?"s":""} dans cette aventure · <strong>${lib.length}</strong> dans la bibliothèque</div>
      <select id="daeChallengeSelected069" size="6" class="dc069ChallengeSelected">
        ${selected.map(x=>`<option value="${attr051(x.id)}">${esc051(x.title||x.id)}</option>`).join("")}
      </select>
      <div class="dc069ChallengeButtons">
        <button type="button" onclick="dc051RemoveSelectedChallenge069()">➖ RETIRER LA SÉLECTION</button>
        <button type="button" onclick="dc051AddAllChallenges069()">➕ AJOUTER TOUTES</button>
        <button type="button" onclick="dc051ClearChallenges069()">🧹 VIDER</button>
        <button type="button" class="v2Btn primary" onclick="dc051OpenChallengeLibrary069()">📚 RÉPERTOIRE D'ÉNIGMES</button>
      </div>
    </div>`;
};

function ensureChallengeLibraryModal069(){
  let modal=document.getElementById("dc069ChallengeLibraryModal");
  if(modal)return modal;
  modal=document.createElement("div");
  modal.id="dc069ChallengeLibraryModal";
  modal.className="modal";
  modal.style.display="none";
  modal.innerHTML=`
    <div class="modalContent dc069LibraryModalContent">
      <div class="topbar">
        <button class="back" type="button" onclick="dc051CloseChallengeLibrary069()">← Dungeon</button>
        <h2 style="flex:1;margin:0">🧩 Répertoire d'énigmes</h2>
      </div>
      <div class="dc069LibraryToolbar">
        <button type="button" class="v2Btn primary" onclick="dc051NewChallenge069()">➕ CRÉER</button>
        <button type="button" onclick="dc051ExportChallenges069()">📤 EXPORTER</button>
        <button type="button" onclick="dc051ImportChallenges069()">📥 IMPORTER</button>
      </div>
      <div class="dc069LibraryGrid">
        <div>
          <input id="dc069ChallengeSearch" type="search" placeholder="🔎 Rechercher..." oninput="dc051RenderChallengeLibrary069()">
          <select id="dc069ChallengeLibraryList" size="16" onchange="dc051SelectChallengeLibrary069(this.value)"></select>
        </div>
        <div id="dc069ChallengeForm"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}
window.dc051OpenChallengeLibrary069=function(createNew=false){
  const modal=ensureChallengeLibraryModal069();
  const lib=loadChallengeLibrary069();
  if(createNew||!challengeEditorCurrent069)challengeEditorCurrent069=createNew?null:String(lib[0]?.id||"");
  modal.style.display="block";
  document.body.style.overflow="hidden";
  if(createNew)dc051NewChallenge069();else dc051RenderChallengeLibrary069();
};
window.dc051CloseChallengeLibrary069=function(){
  const modal=document.getElementById("dc069ChallengeLibraryModal");
  if(modal)modal.style.display="none";
  document.body.style.overflow="";
  dc051RenderChallengeEditor();
};
window.dc051SelectChallengeLibrary069=function(id){
  challengeEditorCurrent069=String(id||"");
  dc051RenderChallengeLibrary069();
};
window.dc051RenderChallengeLibrary069=function(){
  const modal=ensureChallengeLibraryModal069(),lib=loadChallengeLibrary069();
  const search=normalized051(document.getElementById("dc069ChallengeSearch")?.value||"");
  const filtered=lib.filter(x=>!search||normalized051((x.title||"")+" "+(x.prompt||"")+" "+(x.id||"")).includes(search));
  const list=document.getElementById("dc069ChallengeLibraryList");
  if(list){
    list.innerHTML=filtered.map(x=>`<option value="${attr051(x.id)}"${String(x.id)===String(challengeEditorCurrent069)?" selected":""}>${esc051(challengeLabel069(x))}</option>`).join("");
  }
  let ch=lib.find(x=>String(x.id)===String(challengeEditorCurrent069));
  if(!ch&&filtered.length){ch=filtered[0];challengeEditorCurrent069=String(ch.id)}
  const form=document.getElementById("dc069ChallengeForm");if(!form)return;
  if(!ch){form.innerHTML='<div class="hint">Crée une énigme ou importe un pack.</div>';return}

  form.innerHTML=`
    <div class="dc051ChallengeGrid">
      <label class="wide">Nom <input id="dc069Title" value="${attr051(ch.title||"")}"></label>
      <label>Type<select id="dc069Type">
        <option value="riddle"${ch.type==="riddle"?" selected":""}>Énigme / réponse libre</option>
        <option value="choice"${ch.type==="choice"?" selected":""}>Choix</option>
        <option value="stat"${ch.type==="stat"?" selected":""}>Test de caractéristique</option>
      </select></label>
      <label>Utilisation<select id="dc069Target">
        <option value="auto"${ch.target==="auto"?" selected":""}>Porte ou coffre</option>
        <option value="door"${ch.target==="door"?" selected":""}>Porte uniquement</option>
        <option value="chest"${ch.target==="chest"?" selected":""}>Coffre uniquement</option>
      </select></label>
      <label class="wide">Texte / consigne<textarea id="dc069Prompt" rows="4">${esc051(ch.prompt||"")}</textarea></label>
      <label>Réponse correcte<input id="dc069Solution" value="${attr051(ch.solution||"")}"></label>
      <label>Choix séparés par virgules<input id="dc069Options" value="${attr051(ch.options||"")}"></label>
      <label>Caractéristique<select id="dc069Stat">${["force","agilite","intelligence","esprit","endurance","initiative","defense"].map(v=>`<option value="${v}"${String(ch.stat||"intelligence")===v?" selected":""}>${v}</option>`).join("")}</select></label>
      <label>Échec<select id="dc069FailType" onchange="dc051RenderChallengeLibrary069()">
        <option value="damage"${(ch.failType||"damage")==="damage"?" selected":""}>❤️ Dégâts</option>
        <option value="debuff"${ch.failType==="debuff"?" selected":""}>📉 Malus de stat</option>
        <option value="none"${ch.failType==="none"?" selected":""}>Aucun</option>
      </select></label>
      ${(ch.failType||"damage")==="damage"?`<label>Dégâts <input id="dc069FailDamage" type="number" min="0" value="${Math.max(0,Number(ch.failDamage)||0)}"></label>`:""}
      ${ch.failType==="debuff"?`
        <label>Stat pénalisée<select id="dc069FailStat">${["force","agilite","intelligence","esprit","endurance","initiative","defense"].map(v=>`<option value="${v}"${String(ch.failStat||"agilite")===v?" selected":""}>${v}</option>`).join("")}</select></label>
        <label>Malus <input id="dc069FailStatValue" type="number" max="0" value="${Math.min(-1,Number(ch.failStatValue)||-2)}"></label>
        <label>Durée <input id="dc069FailDuration" type="number" min="1" value="${Math.max(1,Number(ch.failDuration)||2)}"></label>
      `:""}
    </div>
    <div class="dc069ChallengeFormActions">
      <button class="v2Btn primary" type="button" onclick="dc051SaveChallenge069()">💾 ENREGISTRER</button>
      <button class="danger" type="button" onclick="dc051DeleteLibraryChallenge069()">🗑 SUPPRIMER</button>
    </div>`;
};
window.dc051NewChallenge069=function(){
  const lib=loadChallengeLibrary069();
  const ch={id:"challenge_"+Date.now().toString(36),type:"riddle",target:"auto",title:"Nouvelle énigme",prompt:"",solution:"",options:"",stat:"intelligence",failType:"damage",failDamage:1,failStat:"agilite",failStatValue:-2,failDuration:2};
  lib.push(ch);saveChallengeLibrary069(lib);challengeEditorCurrent069=ch.id;dc051RenderChallengeLibrary069();
};
window.dc051SaveChallenge069=function(){
  const lib=loadChallengeLibrary069(),i=lib.findIndex(x=>String(x.id)===String(challengeEditorCurrent069));if(i<0)return;
  const old=lib[i];
  // Lire le select d'échec AVANT le re-render.
  const ft=document.getElementById("dc069FailType")?.value||old.failType||"damage";
  lib[i]={...old,
    title:(document.getElementById("dc069Title")?.value||"").trim()||"Énigme sans nom",
    type:document.getElementById("dc069Type")?.value||"riddle",
    target:document.getElementById("dc069Target")?.value||"auto",
    prompt:document.getElementById("dc069Prompt")?.value||"",
    solution:document.getElementById("dc069Solution")?.value||"",
    options:document.getElementById("dc069Options")?.value||"",
    stat:document.getElementById("dc069Stat")?.value||"intelligence",
    failType:ft,
    failDamage:Math.max(0,Number(document.getElementById("dc069FailDamage")?.value??old.failDamage)||0),
    failStat:document.getElementById("dc069FailStat")?.value||old.failStat||"agilite",
    failStatValue:Math.min(-1,Number(document.getElementById("dc069FailStatValue")?.value??old.failStatValue)||-2),
    failDuration:Math.max(1,Number(document.getElementById("dc069FailDuration")?.value??old.failDuration)||2)
  };
  saveChallengeLibrary069(lib);
  dc051RenderChallengeLibrary069();
  try{showToast?.("Énigme enregistrée")}catch(e){}
};
window.dc051DeleteLibraryChallenge069=function(){
  if(!challengeEditorCurrent069||!confirm("Supprimer cette énigme de la bibliothèque ?"))return;
  let lib=loadChallengeLibrary069().filter(x=>String(x.id)!==String(challengeEditorCurrent069));
  draft051=draft051.filter(x=>String(x)!==String(challengeEditorCurrent069));
  saveChallengeLibrary069(lib);
  challengeEditorCurrent069=String(lib[0]?.id||"");
  dc051RenderChallengeLibrary069();
};
window.dc051ExportChallenges069=function(){
  const payload={format:"GenSrpG.challenge-pack",version:1,exportedAt:new Date().toISOString(),challenges:loadChallengeLibrary069()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="GenSrpG_enigmes.json";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.dc051ImportChallenges069=function(){
  const input=document.createElement("input");input.type="file";input.accept=".json,application/json";
  input.onchange=async()=>{
    const file=input.files?.[0];if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      const incoming=Array.isArray(data)?data:Array.isArray(data?.challenges)?data.challenges:[];
      if(!incoming.length)throw new Error("Aucune énigme");
      const lib=loadChallengeLibrary069(),byId=new Map(lib.map(x=>[String(x.id),x]));
      let added=0,updated=0;
      incoming.filter(x=>x&&x.id&&x.title).forEach(x=>{
        const id=String(x.id);
        if(byId.has(id)){updated++;byId.set(id,{...byId.get(id),...clone051(x)})}
        else{added++;byId.set(id,clone051(x))}
      });
      saveChallengeLibrary069([...byId.values()]);
      dc051RenderChallengeLibrary069();dc051RenderChallengeEditor();
      alert("Import terminé : "+added+" ajoutée(s), "+updated+" mise(s) à jour.");
    }catch(e){alert("Pack d'énigmes invalide.")}
  };
  input.click();
};

/* ---------- COFFRES : la carte et la scène deviennent une seule vérité ---------- */
function ensureMapChest051(){
  const r=room051();if(r<=0)return;
  const s=loadDungeonState?.()||{};
  const map=s.last?.map;
  if(!map || Number(map.chestIdx)<0 || map._dc051ChestConsumed)return;
  const all=loadDungeonSceneElements?.()||[];
  const already=all.some(x=>x.kind==="chest"&&Number(x.room||0)===r);
  if(already)return;
  const c=cfg051(),rarity=typeof dungeonPickChestRarity==="function"?dungeonPickChestRarity(c):"common";
  const trapped=Math.random()*100<Math.max(0,Math.min(100,Number(c.chestTrapChance)||0));
  addDungeonSceneElement?.({kind:"chest",name:"Coffre "+(dungeonRarityLabel?.(rarity)||rarity),rarity,trapped,room:r,fromMap:true});
}

/* ---------- DÉFIS PORTE / COFFRE ---------- */
function assignChallenges051(){
  const r=room051();if(r<=0)return;
  const c=cfg051();
  let changed=false;
  const s=loadDungeonState?.()||{};
  const map=s.last?.map;
  const persistKey="gensrpg_dc064_door_challenge_"+r;
  let persisted=null;
  try{persisted=JSON.parse(localStorage.getItem(persistKey)||"null")}catch(e){}

  // Restaurer une énigme déjà tirée pour cette salle si une ancienne routine
  // a reconstruit la mini-carte en revenant d'une fiche/popup.
  if(map && persisted?.challenge){
    const obj=map.objective||{};
    if(!obj.challenge || !map._dc051DoorRolled){
      obj.type="challenge";
      obj.title=persisted.title||"Défi de la porte";
      obj.challenge=clone051(persisted.challenge);
      obj.status=persisted.status||"locked";
      obj.text="Un mécanisme bloque la sortie.";
      map.objective=obj;
      map._dc051DoorRolled=true;
      changed=true;
    }
  }

  if(map && !map._dc051DoorRolled){
    map._dc051DoorRolled=true;
    const obj=map.objective||{};
    if(obj.type!=="guard_key" && Math.random()*100<Math.max(0,Number(c.challengeDoorChance)||0)){
      obj.type="challenge";
      obj.status="locked";
      obj.title="Défi de la porte";
      obj.challenge=pickChallenge051("door");
      obj.text="Un mécanisme bloque la sortie.";
      map.objective=obj;changed=true;
    }
  }
  if(changed){s.last.map=map;s.last.objective=map.objective;saveDungeonState?.(s)}
  try{
    if(map?.objective?.type==="challenge" && map.objective.challenge){
      localStorage.setItem(persistKey,JSON.stringify({
        title:map.objective.title||"Défi de la porte",
        challenge:map.objective.challenge,
        status:map.objective.status||"locked"
      }));
    }
  }catch(e){}

  const all=loadDungeonSceneElements?.()||[];
  let sceneChanged=false;
  all.forEach(el=>{
    if(el.kind!=="chest"||Number(el.room||0)!==r||el._dc051ChallengeRolled)return;
    el._dc051ChallengeRolled=true;
    if(Math.random()*100<Math.max(0,Number(c.challengeChestChance)||0)){
      el.challenge=pickChallenge051("chest");
      el.challengeDone=false;
    }
    sceneChanged=true;
  });
  if(sceneChanged)saveScene051(all);
}
// Contrat Dungeon explicite: Core200 émet une création de coffre, Core051
// reste seul propriétaire des chances et du tirage. Pas d'effet UI implicite.
window.GensDungeonChallengeLifecycle051={
  onChestCreated(id){
    const r=room051();
    if(r<=0||!id)return false;
    const found=(loadDungeonSceneElements?.()||[]).some(el=>
      el.kind==="chest" && String(el.id)===String(id) && Number(el.room||0)===r);
    if(!found)return false;
    assignChallenges051();
    return true;
  }
};

function challengeChance051(ch){
  const id=hero051(),stat=ch.stat||"intelligence";
  let v=10;try{const d=dungeonDerivedForHero?.(id)||{};v=Number(d[stat])||10}catch(e){}
  const difficulty=({easy:10,normal:0,hard:-10,nightmare:-20})[cfg051().difficulty||"normal"]||0;
  return Math.max(5,Math.min(95,50+(v-10)*3+difficulty));
}
function challengeTargetLabel051(ctx){return ctx.kind==="chest"?"🎁 Coffre":"🚪 Porte"}

function dc077ChallengeContext(kind,id){
  if(kind==="chest"){
    const all=loadDungeonSceneElements?.()||[],el=all.find(x=>String(x.id)===String(id));
    return {ch:el?.challenge||null,attempts:Math.max(0,Number(el?.challengeAttempts)||0)};
  }
  const s=loadDungeonState?.()||{},obj=s.last?.map?.objective;
  return {ch:obj?.challenge||null,attempts:Math.max(0,Number(obj?.challengeAttempts)||0)};
}
function dc077AssistHtml(ch,attempts){
  const cfg=cfg051(),mode=cfg.challengeAssistMode||"progressive",after=Math.max(1,Number(cfg.challengeAssistAfter)||2);
  if(mode==="off"||attempts<after||!ch)return "";
  const stage=Math.max(1,attempts-after+1);
  if(ch.type==="stat"){
    const bonus=mode==="soft"?10:Math.min(30,stage*10);
    return '<div class="dc077Hint">💡 <strong>Aide après '+attempts+' échec'+(attempts>1?'s':'')+' :</strong> le prochain test reçoit virtuellement <strong>+'+bonus+' %</strong> de chance.</div>';
  }
  if(ch.type==="choice"){
    return '<div class="dc077Hint">💡 <strong>Indice :</strong> '+(mode==="soft"?'observe les choix qui ne correspondent pas à la logique de l’énoncé.':'une mauvaise réponse sera retirée de la liste.')+'</div>';
  }
  const sol=String(ch.solution||"").trim();
  if(!sol)return '<div class="dc077Hint">💡 Relis l’énoncé en cherchant un double sens.</div>';
  const clean=sol.replace(/\s+/g," ");
  const lead=mode==="soft"?clean.slice(0,1):clean.slice(0,Math.min(stage+1,Math.max(1,clean.length-1)));
  return '<div class="dc077Hint">💡 <strong>Indice :</strong> la réponse comporte <strong>'+clean.length+' caractère'+(clean.length>1?'s':'')+'</strong> et commence par <strong>'+esc051(lead)+'…</strong></div>';
}
window.dc051OpenChallenge=function(kind,id){
  const ctx=dc077ChallengeContext(kind,id),ch=ctx.ch,attempts=ctx.attempts;
  if(!ch)return;
  // Core 0.76 : le titre sert uniquement à organiser la bibliothèque.
  // Il n'est jamais montré aux joueurs car il peut contenir un indice ou la réponse.
  const prompt='<div class="dc051ChallengePrompt">'+esc051(ch.prompt||"")+'</div>';
  let body=prompt+dc077AssistHtml(ch,attempts);

  if(ch.type==="choice"){
    let opts=String(ch.options||"☀️,🌙,🔥").split(",").map(x=>x.trim()).filter(Boolean);
    const cfg=cfg051(),after=Math.max(1,Number(cfg.challengeAssistAfter)||2);
    if((cfg.challengeAssistMode||"progressive")==="progressive" && attempts>=after){
      const wrong=opts.filter(o=>normalized051(o)!==normalized051(ch.solution));
      if(wrong.length>1){
        const removeCount=Math.min(wrong.length-1,Math.max(1,attempts-after+1));
        const gone=new Set(wrong.slice(0,removeCount).map(normalized051));
        opts=opts.filter(o=>!gone.has(normalized051(o)));
      }
    }
    body+='<div class="dc047Actions">'+opts.map(o=>'<button onclick="dc051ResolveChallenge(\''+kind+'\',\''+attr051(id||"")+'\',\''+attr051(o)+'\')">'+esc051(o)+'</button>').join("")+'</div>';
  }else if(ch.type==="stat"){
    let chance=challengeChance051(ch);
    const cfg=cfg051(),after=Math.max(1,Number(cfg.challengeAssistAfter)||2),mode=cfg.challengeAssistMode||"progressive";
    if(mode!=="off"&&attempts>=after)chance=Math.min(95,chance+(mode==="soft"?10:Math.min(30,(attempts-after+1)*10)));
    body+='<p>Test de <strong>'+esc051(ch.stat||"intelligence")+'</strong> · chance <strong>'+chance+'%</strong>.</p>'+
      '<button class="dc01Btn primary" style="width:100%" onclick="dc051RollStatChallenge(\''+kind+'\',\''+attr051(id||"")+'\','+chance+')">🎲 LANCER LE D100</button>';
  }else{
    body+='<input id="dc051RiddleAnswer" type="text" placeholder="Ta réponse…" style="width:100%;padding:11px;border-radius:9px;background:#0c0b09;color:#fff;border:1px solid #65503a">'+
      '<button class="dc01Btn primary" style="width:100%;margin-top:8px" onclick="dc051ResolveChallenge(\''+kind+'\',\''+attr051(id||"")+'\',document.getElementById(\'dc051RiddleAnswer\').value)">VALIDER LA RÉPONSE</button>';
  }
  DungeonCore01.modal(challengeTargetLabel051({kind})+" — Énigme",body);
};

window.dc051RollStatChallenge=function(kind,id,chance){
  chance=Math.max(5,Math.min(95,Number(chance)||50));
  const threshold=101-chance,roll=1+Math.floor(Math.random()*100),ok=roll>=threshold;
  DungeonCore01.modal("🎲 Test de caractéristique",
    '<div class="dc048Roll"><div>D100 : <strong>'+threshold+'+</strong></div><div class="dc048Die">'+roll+'</div>'+
    '<strong class="'+(ok?'dc048Good':'dc048Bad')+'">'+(ok?'✅ RÉUSSI':'❌ ÉCHEC')+'</strong></div>'+
    '<button class="dc01Btn primary" style="width:100%" onclick="dc051FinishChallenge(\''+kind+'\',\''+attr051(id||"")+'\','+(ok?'true':'false')+')">CONTINUER</button>');
};
window.dc051ResolveChallenge=function(kind,id,answer){
  let ch=null;
  if(kind==="chest")ch=(loadDungeonSceneElements?.()||[]).find(x=>String(x.id)===String(id))?.challenge;
  else ch=loadDungeonState?.()?.last?.map?.objective?.challenge;
  if(!ch)return;
  const ok=normalized051(answer)===normalized051(ch.solution);
  dc051FinishChallenge(kind,id,ok);
};
function applyChallengeDebuff051(heroId,ch){
  if(!heroId||!ch)return null;
  const st=loadState?.(heroId);if(!st)return null;
  st.dc067ChallengeDebuffs=Array.isArray(st.dc067ChallengeDebuffs)?st.dc067ChallengeDebuffs:[];
  const stat=String(ch.failStat||"agilite");
  const value=Math.min(-1,Number(ch.failStatValue)||-2);
  const remaining=Math.max(1,Number(ch.failDuration)||2);
  st.dc067ChallengeDebuffs.push({id:"chdeb_"+Date.now().toString(36),stat,value,remaining,label:ch.title||"Énigme ratée"});
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(String(current||"")===String(heroId))state=st;
  return {stat,value,remaining};
}
window.dc051FinishChallenge=function(kind,id,ok){
  let ch=null;
  if(kind==="chest"){
    const all=loadDungeonSceneElements?.()||[],el=all.find(x=>String(x.id)===String(id));
    if(!el)return;ch=el.challenge;
    if(ok){
      el.challengeDone=true;el.challengeAttempts=0;
      // Déverrouiller n'ouvre ni ne consomme le coffre.
      el.opened=false;
      saveScene051(all);
    }
  }else{
    const s=loadDungeonState?.()||{},map=s.last?.map,obj=map?.objective;
    if(!obj)return;ch=obj.challenge;
    if(ok){
      obj.status="done";obj.challengeAttempts=0;map.objective=obj;s.last.map=map;s.last.objective=obj;saveDungeonState?.(s);
      try{
        const r=Number(s.room)||0;
        if(r>0)localStorage.setItem("gensrpg_dc064_door_challenge_"+r,JSON.stringify({
          title:obj.title||"Défi de la porte",challenge:obj.challenge,status:"done"
        }));
      }catch(e){}
    }
  }

  if(!ok){
    // Compteur d'échecs persistant pour l'aide progressive.
    try{
      if(kind==="chest"){
        const all=loadDungeonSceneElements?.()||[],el=all.find(x=>String(x.id)===String(id));
        if(el){el.challengeAttempts=Math.max(0,Number(el.challengeAttempts)||0)+1;saveScene051(all)}
      }else{
        const ss=loadDungeonState?.()||{},oo=ss.last?.map?.objective;
        if(oo){oo.challengeAttempts=Math.max(0,Number(oo.challengeAttempts)||0)+1;ss.last.objective=oo;saveDungeonState?.(ss)}
      }
    }catch(e){}
    const h=hero051(),ft=ch?.failType||"damage";
    let consequence="";
    if(ft==="damage"){
      const dmg=Math.max(0,Number(ch?.failDamage)||0);
      if(dmg>0&&h)damage051(h,dmg);
      if(dmg>0)consequence="<br><strong>"+esc051(heroName051(h))+"</strong> subit <strong>"+dmg+" blessure"+(dmg>1?"s":"")+"</strong>.";
    }else if(ft==="debuff"&&h){
      const d=applyChallengeDebuff051(h,ch);
      if(d)consequence="<br><strong>"+esc051(heroName051(h))+"</strong> reçoit <strong>"+d.value+" "+esc051(d.stat)+"</strong> pendant <strong>"+d.remaining+" tour"+(d.remaining>1?"s":"")+"</strong>.";
    }
    const cfg=cfg051(),after=Math.max(1,Number(cfg.challengeAssistAfter)||2),ctx2=dc077ChallengeContext(kind,id);
    const helper=(cfg.challengeAssistMode||"progressive")!=="off"&&ctx2.attempts>=after
      ?"<br><br>💡 <strong>Une aide est maintenant disponible.</strong>"
      :"";
    DungeonCore01.modal("❌ Échec","Le défi n’est pas résolu."+consequence+helper+"<br><br>Tu peux retenter le défi.");
    return;
  }
  DungeonCore01.modal("✅ Défi réussi",kind==="chest"?"Le verrou du coffre cède. Il peut maintenant être fouillé.":"Le mécanisme se désactive. La porte est ouverte.");
  DungeonCore01.render?.();
};

/* Remplace l'ancien mini-jeu de porte s'il s'agit d'un défi 0.51. */
const oldPuzzle051=window.dc047Puzzle;
window.dc047Puzzle=function(){
  const obj=loadDungeonState?.()?.last?.map?.objective;
  if(obj?.type==="challenge"&&obj?.challenge)return dc051OpenChallenge("door","");
  return oldPuzzle051?.apply(this,arguments);
};

/* Coffre protégé : le bouton Fouiller ouvre d'abord son défi. */
if(window.DungeonCore01 && typeof DungeonCore01.searchChest==="function"){
  const prev=window.DungeonCore01.searchChest;
  window.DungeonCore01.searchChest=function(id){
    const el=(loadDungeonSceneElements?.()||[]).find(x=>String(x.id)===String(id));
    if(el?.challenge&&!el.challengeDone){dc051OpenChallenge("chest",id);return}
    return prev.apply(this,arguments);
  };
}

/* ---------- MARCHAND ---------- */
window.dc051OpenMerchant=function(){
  try{openMerchant?.()}catch(e){DungeonCore01.modal("🧙‍♂️ Marchand","Le marchand est présent, mais le module économie n’est pas disponible dans cet univers.")}
};
function decorateRoomAssets051(){
  const r=room051();if(r<=0)return;
  const list=scene051();
  const chests=list.filter(x=>x.kind==="chest");
  const merchants=list.filter(x=>x.kind==="merchant");
  dungeonRefreshCollectObjectives066?.();
  const objectives=scene051().filter(x=>x.kind==="objective");

  let host=document.getElementById("dc051RoomAssets");
  const anchor=document.getElementById("dc01Enemies");
  if(!host&&anchor){
    host=document.createElement("div");host.id="dc051RoomAssets";host.className="dc051RoomAssets";
    anchor.insertAdjacentElement("afterend",host);
  }
  if(!host)return;
  const cards=[];
  chests.forEach(c=>cards.push('<div class="dc051Asset"><span>🎁 <strong>'+(esc051(c.name||"Coffre"))+'</strong>'+(c.challenge&&!c.challengeDone?' · 🧩 verrouillé':'')+'</span><button onclick="DungeonCore01.searchChest(\''+attr051(c.id)+'\')">'+(c.challenge&&!c.challengeDone?'🧩 RÉSOUDRE':'🔍 FOUILLER')+'</button></div>'));
  merchants.forEach(m=>cards.push('<div class="dc051Asset"><span>🧙‍♂️ <strong>'+esc051(m.name||"Marchand")+'</strong></span><button onclick="dc051OpenMerchant()">💰 COMMERcer</button></div>'));
  objectives.forEach(o=>{
    const ready=(o.objectiveType||"manual")!=="manual"&&Math.max(0,Number(o.progress)||0)>=Math.max(1,Number(o.qty)||1);
    cards.push('<div class="dc051Asset"><span>🎯 <strong>'+esc051(o.name||"Objectif secondaire")+'</strong><small style="display:block;opacity:.78;margin-top:3px">'+esc051(dungeonObjectiveProgressText066(o))+' · ⭐ '+Math.max(0,Number(o.xp)||0)+' XP groupe</small></span><span class="badge">'+(ready?'TERMINÉ':'SECONDAIRE')+'</span></div>');
  });
  host.innerHTML=cards.join("");
}

/* ---------- ACTION PRINCIPALE : le vrai combat prend la place du bouton gris ---------- */
function mainAction051(){
  const b=document.getElementById("dc01Explore");if(!b)return;
  const enemies=(dungeonLivingEnemies?.()||[]).filter(e=>e&&!e.defeated&&Number(e.hp)>0);
  const combatOn=typeof dc045HeroCombatEnabled==="function"?dc045HeroCombatEnabled():true;
  if(enemies.length){
    if(combatOn){
      b.disabled=false;
      b.textContent="⚔️ ENGAGER LE COMBAT · "+enemies.length+" ENNEMI"+(enemies.length>1?"S":"");
      b.onclick=()=>dc030EngageCombat?.();
    }else{
      b.disabled=true;
      b.textContent="⚔️ ENNEMIS PRÉSENTS — GESTION MJ";
      b.onclick=null;
    }
  }else{
    b.onclick=()=>DungeonCore01.explore();
    const room=room051();
    b.textContent=room<=0?"🚪 ENTRER DANS LE DONJON":"🚪 EXPLORER";
  }
}

/* Après chaque génération : rendre coffre réel + attribuer défis. */
if(window.DungeonCore01 && typeof DungeonCore01.explore==="function"){
  const prev=window.DungeonCore01.explore;
  window.DungeonCore01.explore=function(){
    const before=room051(),r=prev.apply(this,arguments);
    setTimeout(()=>{
      if(room051()>before){
        ensureMapChest051();
        assignChallenges051();
        DungeonCore01.render?.();
      }
    },0);
    return r;
  };
}
if(window.DungeonCore01 && typeof DungeonCore01.render==="function"){
  const prev=window.DungeonCore01.render;
  window.DungeonCore01.render=function(){
    const r=prev.apply(this,arguments);
    ensureMapChest051();assignChallenges051();decorateRoomAssets051();mainAction051();
    return r;
  };
}
if(window.DungeonCore01 && typeof DungeonCore01.show==="function"){
  const prev=window.DungeonCore01.show;
  window.DungeonCore01.show=function(){
    const r=prev.apply(this,arguments);
    ensureMapChest051();assignChallenges051();decorateRoomAssets051();mainAction051();
    return r;
  };
}

setTimeout(()=>{try{ensureMapChest051();assignChallenges051();decorateRoomAssets051();mainAction051()}catch(e){}},0);

try{
  const badge=document.querySelector(".dc01Badge");
  if(badge)badge.textContent="NOUVEAU MOTEUR · CORE 1.05";
  const f=document.querySelector(".dc01Footer");
  if(f)f.textContent="Dungeon Core 1.05 · aide énigmes · objectifs secondaires · dalles visuelles.";
}catch(e){}
})();
