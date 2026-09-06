/* GenSrpG Dungeon — secondary authored branch content fix 16.78.60.
   Built World Builder secondary branches only.
   - exposes the virtual branch node to DungeonZoneContent while exact content is applied,
     so authored cells are clamped against the real branch-room dimensions instead of case 0
   - in fixed authored content, removes legacy/random chests from the branch room
   - preserves only configured exact chests and enforces their configured rarity/name
   - does not affect normal authored nodes, Random Dungeon, Capture or Survival. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.60";
let installed=false,retries=0;
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function writeRt(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function builder(){return ROOT.DungeonWorldBuilder167821||null}
function zone(){return ROOT.DungeonZoneContent167824||null}
function mainGraph(){try{return ROOT.DungeonAuthoredRuntime167839?.graph?.()||null}catch(e){return null}}
function branchContext(){const x=readRt(),g=mainGraph();if(!x?.last?.authoredRuntime167839||!g)return null;const nodeId=String(x.last.worldNodeId||""),roomId=String(x.last.customRoomId||"");if(!nodeId||!roomId||String(x.last.worldDungeonId||"")!==String(g.id))return null;if((g.nodes||[]).some(n=>String(n?.id)===nodeId))return null;let room=null;try{room=ROOT.DungeonRoomCreator100?.findRoom?.(roomId)||null}catch(e){}if(!room)return null;let content=x.last?.worldZoneContent167824||null;try{content=zone()?.normalizeContent?.(content)||content}catch(e){}return {x,g,nodeId,roomId,room,content}}
function augmentedGraph(ctx){const g=clone(ctx.g);g.nodes=Array.isArray(g.nodes)?g.nodes:[];if(!g.nodes.some(n=>String(n?.id)===ctx.nodeId))g.nodes.push({id:ctx.nodeId,roomId:ctx.roomId,label:String(ctx.room?.name||ctx.roomId),secondaryBranch167860:true});return g}
function withVirtualNode(ctx,fn){const B=builder();if(!B||typeof B.findDungeon!=="function")return fn();const old=B.findDungeon;B.findDungeon=function(id){if(String(id||"")===String(ctx.g.id))return augmentedGraph(ctx);return old.apply(this,arguments)};try{return fn()}finally{B.findDungeon=old}}
function sceneElements(){try{return ROOT.loadDungeonSceneElements?.()||[]}catch(e){return[]}}
function saveSceneElements(all){try{ROOT.saveDungeonSceneElements?.(all);return true}catch(e){return false}}
function fixedContent(ctx){return String(ctx?.content?.mode||"")==="fixed"}
function allowedChests(ctx){const list=Array.isArray(ctx?.content?.chests)?ctx.content.chests:[];return new Map(list.map(c=>[String(c?.id||""),c]).filter(x=>x[0]))}
function scrubLegacyChests(ctx){if(!fixedContent(ctx))return 0;const room=Number(ctx.x?.room)||0,allowed=allowedChests(ctx),all=sceneElements();let removed=0;const next=all.filter(el=>{if(el?.kind!=="chest"||Number(el?.room||0)!==room)return true;const id=String(el?.exactChestId167824||""),sameExact=el?.exactChest167824===true&&String(el?.exactDungeonId167824||"")===String(ctx.g.id)&&String(el?.exactNodeId167824||"")===ctx.nodeId&&allowed.has(id);if(sameExact)return true;removed++;return false});if(removed)saveSceneElements(next);return removed}
function enforceExactChestMetadata(ctx){const room=Number(ctx.x?.room)||0,allowed=allowedChests(ctx),all=sceneElements();let changed=0;for(const el of all){if(el?.kind!=="chest"||Number(el?.room||0)!==room||el?.exactChest167824!==true)continue;if(String(el?.exactDungeonId167824||"")!==String(ctx.g.id)||String(el?.exactNodeId167824||"")!==ctx.nodeId)continue;const c=allowed.get(String(el.exactChestId167824||""));if(!c)continue;const rarity=String(c.rarity||"common"),name=String(c.label||("Coffre "+rarity));if(String(el.rarity||"")!==rarity){el.rarity=rarity;changed++}if(String(el.name||"")!==name){el.name=name;changed++}el.trapped=false;el.challenge=null;el.challengeDone=true}if(changed)saveSceneElements(all);return changed}
function wrapZone(){const Z=zone();if(!Z||typeof Z.applyCurrentZone!=="function")return false;if(Z.applyCurrentZone.__secondaryBranch167860)return true;const old=Z.applyCurrentZone;const wrapped=function(options){const ctx=branchContext();if(!ctx)return old.apply(this,arguments);if(fixedContent(ctx))scrubLegacyChests(ctx);const out=withVirtualNode(ctx,()=>old.call(this,options));const fresh=branchContext()||ctx;if(fixedContent(fresh)){scrubLegacyChests(fresh);enforceExactChestMetadata(fresh)}const rt=readRt();if(rt?.last&&String(rt.last.worldNodeId||"")===ctx.nodeId){rt.last.secondaryBranchContentFixed167860=true;writeRt(rt)}return out};wrapped.__secondaryBranch167860=true;wrapped.__original=old;Z.applyCurrentZone=wrapped;return true}
function repairCurrent(){const ctx=branchContext(),Z=zone();if(!ctx||!Z?.applyCurrentZone)return false;if(ctx.x?.last?.secondaryBranchContentFixed167860){if(fixedContent(ctx)){scrubLegacyChests(ctx);enforceExactChestMetadata(ctx)}return true}try{Z.applyCurrentZone({force:true});return true}catch(e){console.warn("Secondary branch content repair",e);return false}}
function install(){const ok=wrapZone();if(ok){installed=true;setTimeout(repairCurrent,0);return true}if(retries++<30&&typeof setTimeout==="function")setTimeout(install,80);return false}
ROOT.DungeonSecondaryBranchContentFix167860={VERSION,APP_VERSION,readRt,branchContext,augmentedGraph,scrubLegacyChests,enforceExactChestMetadata,wrapZone,repairCurrent,install};
install();
})();
