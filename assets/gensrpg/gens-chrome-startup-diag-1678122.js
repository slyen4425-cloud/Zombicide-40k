(()=>{
  if(window.__GENSRPG_DIAG122_INSTALLED__) return;
  window.__GENSRPG_DIAG122_INSTALLED__=true;
  const rows=[];
  let box=null;
  let expanded=false;
  const now=()=>new Date().toLocaleTimeString();
  const textOf=(x)=>{try{return String(x??'').replace(/\s+/g,' ').slice(0,180)}catch{return '[unprintable]'}};
  const targetOf=(t)=>{try{
    if(!t) return 'null';
    const tag=(t.tagName||t.nodeName||'node').toLowerCase();
    const id=t.id?`#${t.id}`:'';
    const cls=t.className&&typeof t.className==='string'?'.'+t.className.trim().replace(/\s+/g,'.'):'';
    const txt=textOf(t.innerText||t.textContent||'').slice(0,80);
    return `${tag}${id}${cls}${txt?` «${txt}»`:''}`;
  }catch{return '[target?]'}};
  function applyBoxMode(){
    if(!box) return;
    if(expanded){
      box.style.left='6px';
      box.style.right='6px';
      box.style.width='auto';
      box.style.maxHeight='55vh';
      box.style.padding='8px';
      box.style.overflow='auto';
      box.style.whiteSpace='pre-wrap';
    }else{
      box.style.left='auto';
      box.style.right='6px';
      box.style.width='128px';
      box.style.maxHeight='34px';
      box.style.padding='6px 8px';
      box.style.overflow='hidden';
      box.style.whiteSpace='nowrap';
    }
  }
  function ensureBox(){
    if(box&&box.isConnected) return box;
    if(!document.body) return null;
    box=document.createElement('div');
    box.id='gensrpgDiag122';
    box.style.cssText='position:fixed;z-index:2147483647;bottom:6px;background:rgba(0,0,0,.88);color:#fff;border:2px solid #00e0ff;border-radius:10px;font:12px/1.35 monospace;box-shadow:0 0 12px #000;pointer-events:auto;user-select:none';
    box.addEventListener('click',()=>{expanded=!expanded;applyBoxMode();render()});
    document.body.appendChild(box);
    applyBoxMode();
    render();
    return box;
  }
  function render(){
    if(!box||!box.isConnected) return;
    if(!expanded){
      const lastError=[...rows].reverse().find(r=>r.includes('❌'));
      box.textContent=lastError?'DIAG V123 ⚠️':'DIAG V123 ✓';
      return;
    }
    box.textContent='DIAG CHROME V123 — toucher pour replier\n'+rows.slice(-14).join('\n');
  }
  function log(msg,kind='i'){
    rows.push(`${now()} ${kind==='e'?'❌':kind==='w'?'⚠️':'•'} ${msg}`);
    if(rows.length>80) rows.splice(0,rows.length-80);
    ensureBox(); render();
    try{console[kind==='e'?'error':kind==='w'?'warn':'log']('[V123]',msg)}catch{}
  }
  window.__GENSRPG_DIAG122__={log,rows,expand:()=>{expanded=true;applyBoxMode();render()}};
  window.addEventListener('error',e=>log(`ERROR ${e.message||'inconnue'} @ ${e.filename||'?'}:${e.lineno||0}:${e.colno||0}`,'e'),true);
  window.addEventListener('unhandledrejection',e=>log(`PROMISE ${textOf(e.reason&&e.reason.stack||e.reason)}`,'e'),true);
  const nativeAdd=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,listener,opts){
    if(type!=='click'||!listener) return nativeAdd.call(this,type,listener,opts);
    const wrapped=typeof listener==='function'?function(ev){
      log(`handler click START ${listener.name||'[anon]'} sur ${targetOf(this)}`);
      try{
        const r=listener.call(this,ev);
        log(`handler click END ${listener.name||'[anon]'}`);
        return r;
      }catch(err){log(`handler click THROW ${listener.name||'[anon]'}: ${textOf(err&&err.stack||err)}`,'e');throw err;}
    }:listener;
    try{Object.defineProperty(wrapped,'__gensDiagOriginal',{value:listener})}catch{}
    return nativeAdd.call(this,type,wrapped,opts);
  };
  document.addEventListener('click',ev=>{
    const t=ev.target;
    const inline=t&&t.getAttribute?t.getAttribute('onclick'):null;
    log(`CLICK capture ${targetOf(t)}${inline?` onclick=${textOf(inline)}`:''}`);
    Promise.resolve().then(()=>log('microtask après CLICK'));
    setTimeout(()=>log('timer 0 après CLICK'),0);
    requestAnimationFrame(()=>log('RAF après CLICK'));
    setTimeout(()=>log('timer 250ms après CLICK'),250);
  },true);
  document.addEventListener('DOMContentLoaded',()=>{ensureBox();log(`DOMContentLoaded UA=${textOf(navigator.userAgent)}`);});
  window.addEventListener('load',()=>log('window.load terminé'));
  setTimeout(()=>{ensureBox();log('diag V123 chargé avant bootstrap principal');},0);
})();
