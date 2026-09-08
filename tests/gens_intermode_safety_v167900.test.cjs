const fs=require('fs'),vm=require('vm');
const path=process.argv[2]||'assets/gensrpg/gens-intermode-safety-167900.js';
const src=fs.readFileSync(path,'utf8');
function ok(v,msg){if(!v)throw new Error(msg)}

const saved=[
 {id:'surv1',name:'Survivant',gameMode:'dungeon',contentFamily:'survival'},
 {id:'surv2',name:'Ancien',gameMode:'dungeon'},
 {id:'dng1',name:'RPG',gameMode:'dungeon',contentFamily:'rpg',universeId:'dungeon'},
 {id:'dng2',name:'Builtin',gameMode:'dungeon',dungeonBuiltin:true}
];
let stored=JSON.parse(JSON.stringify(saved)),applied=0,opened=[];
const bodyClasses=new Set(['gens-pure-capture']);
const body={classList:{contains:x=>bodyClasses.has(x)}};
const document={readyState:'complete',body};
const window={
 document,
 GAME_PROFILE_DUNGEON_ID:'dungeon',GAME_PROFILE_BASE_ID:'base',DUNGEON_HERO_IDS:['dng2'],
 activeGameProfileId:()=> 'capture',gensCurrentUniverseId:()=> 'capture_world',isDungeonMode:()=>false,
 loadCustomHeroesMulti:()=>JSON.parse(JSON.stringify(stored)),
 saveCustomHeroesMulti:x=>{stored=JSON.parse(JSON.stringify(x))},applyCustomHeroesMulti:()=>applied++,
 gensAbilityLibraryTab:'rpg',
 openAbilityLibrary:function(target){opened.push({target,tab:this.gensAbilityLibraryTab});return this.gensAbilityLibraryTab}
};
const ctx={window,document,globalThis:window,console};vm.createContext(ctx);vm.runInContext(src,ctx);
const api=window.GensIntermodeSafety167900;ok(api,'API absent');
ok(stored.find(x=>x.id==='surv1').gameMode==='zombicide','survival marker not recovered');
ok(stored.find(x=>x.id==='surv2').gameMode==='zombicide','legacy unmarked hero not recovered');
ok(stored.find(x=>x.id==='dng1').gameMode==='dungeon','explicit dungeon hero moved');
ok(stored.find(x=>x.id==='dng2').gameMode==='dungeon','builtin dungeon hero moved');
ok(applied===1,'custom heroes not reapplied once');
window.openAbilityLibrary(null);ok(window.gensAbilityLibraryTab==='creature','capture hub did not route to creature library');ok(opened.at(-1).tab==='creature','original library opened before creature routing');
bodyClasses.clear();window.activeGameProfileId=()=> 'base';window.gensCurrentUniverseId=()=> 'base';window.gensAbilityLibraryTab='rpg';window.openAbilityLibrary(null);ok(window.gensAbilityLibraryTab==='rpg','survival hub library was modified');
bodyClasses.add('gens-pure-capture');window.gensAbilityLibraryTab='rpg';window.openAbilityLibrary({kind:'talent',slotIndex:0});ok(window.gensAbilityLibraryTab==='rpg','explicit target routing was overridden');
console.log('OK gens inter-mode safety V16.79.00');
