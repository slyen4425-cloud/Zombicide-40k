(()=>{
  if(window.__GENSRPG_DIAG122_INSTALLED__) return;
  window.__GENSRPG_DIAG122_INSTALLED__=true;
  const rows=[];
  let box=null;
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
  function ensureBox(){
    if(box&&box.isConnected) return box;
    if(!document.body) return null;
    box=document.createElement('div');
    box.id='gensrpgDiag122';
    box.style.cssText='position:fixed;z-index:2147483647;left:6px;right:6px;bottom:6px;max-height:38vh;overflow:auto;background:rgba(0,0,0,.92);color:#fff;border:2px solid #00e0ff;border-radius:10px;padding:8px;font:12px/1.35 monospace;white-space:pre-wrap;box-shadow:0 0 20px #000;pointer-events:auto';
    box.addEventListener('click',()=>{box.style.maxHeight=box.style.maxHeight==='75vh'?'38vh':'75vh'});
    document.body.appendChild(box);
    render();
    return box;
  }
  function render(){
    if(!box||!box.isConnected) return;
    box.textContent='DIAG CHROME V122\n'+rows.slice(-12).join('\n');
  }
  function log(msg,kind='i'){
    rows.push(`${now()} ${kind==='e'?'❌':kind==='w'?'⚠️':'•'} ${msg}`);
    if(rows.length>80) rows.splice(0,rows.length-80);
    ensureBox(); render();
    try{console[kind==='e'?'error':kind==='w'?'warn':'log']('[V122]',msg)}catch{}
  }
  window.__GENSRPG_DIAG122__={log,rows};
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
  setTimeout(()=>{ensureBox();log('diag chargé avant bootstrap principal');},0);
})();
