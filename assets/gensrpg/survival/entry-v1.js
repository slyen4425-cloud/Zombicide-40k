"use strict";

(function installGensSurvivalV1(root){
  const VERSION="1.0.0";

  function defaultProfile(){
    return {
      enabled:false,
      mode:"xp",
      manualLevel:0,
      levels:[
        {name:"Bleu",color:"#2779b9",threshold:0,cards:[
          {kind:"enemy",enemy:"walker",qty:1},
          {kind:"enemy",enemy:"walker",qty:2},
          {kind:"enemy",enemy:"fatty",qty:1},
          {kind:"none",enemy:"walker",qty:0}
        ]},
        {name:"Jaune",color:"#c79a20",threshold:7,cards:[
          {kind:"enemy",enemy:"walker",qty:3},
          {kind:"enemy",enemy:"runner",qty:1},
          {kind:"enemy",enemy:"fatty",qty:1},
          {kind:"activation",enemy:"walker",qty:0}
        ]},
        {name:"Orange",color:"#cd6b20",threshold:19,cards:[
          {kind:"enemy",enemy:"walker",qty:5},
          {kind:"enemy",enemy:"runner",qty:2},
          {kind:"enemy",enemy:"fatty",qty:2},
          {kind:"double",enemy:"walker",qty:0}
        ]},
        {name:"Rouge",color:"#9f241f",threshold:43,cards:[
          {kind:"enemy",enemy:"walker",qty:7},
          {kind:"enemy",enemy:"runner",qty:3},
          {kind:"enemy",enemy:"abomination",qty:1},
          {kind:"double",enemy:"walker",qty:0}
        ]}
      ]
    };
  }

  function collectEnemyIds(profile){
    const ids=new Set();
    (profile?.levels||[]).forEach(level=>(level?.cards||[]).forEach(card=>{
      if((card?.kind==="enemy"||card?.kind==="activation")&&card?.enemy)ids.add(String(card.enemy));
    }));
    return [...ids];
  }

  function autoReserve(profile,defaultReserve){
    const defaults=(defaultReserve&&typeof defaultReserve==="object")?defaultReserve:{};
    const reserve={};
    Object.keys(defaults).forEach(id=>{reserve[id]=0});
    collectEnemyIds(profile).forEach(id=>{
      reserve[id]=Math.max(1,Number(defaults[id])||1);
    });
    return reserve;
  }

  function zombicideBaseProfile(spawnCards,enemyTypes){
    const base=defaultProfile();
    base.enabled=true;
    base.mode="xp";

    if(Array.isArray(spawnCards)){
      const types=Array.isArray(enemyTypes)?enemyTypes:[];
      const cols=[
        {name:"Bleu",color:"#2779b9",threshold:0,key:"b"},
        {name:"Jaune",color:"#c79a20",threshold:7,key:"y"},
        {name:"Orange",color:"#cd6b20",threshold:19,key:"o"},
        {name:"Rouge",color:"#9f241f",threshold:43,key:"r"}
      ];
      base.levels=cols.map(col=>({
        name:col.name,
        color:col.color,
        threshold:col.threshold,
        cards:spawnCards.map(card=>{
          const e=card?.[col.key]||["none"];
          if(e[0]==="none")return {kind:"none",enemy:"walker",qty:1};
          if(e[0]==="double")return {kind:"double",enemy:"walker",qty:1};
          if(e[0]==="activation")return {kind:"activation",enemy:e[1]||"walker",qty:1};
          const enemy=types.some(z=>z?.id===e[0])?e[0]:"walker";
          return {kind:"enemy",enemy,qty:Math.max(1,Number(e[1])||1)};
        })
      }));
    }
    return base;
  }

  root.GensSurvivalV1=Object.freeze({
    VERSION,
    waveRules:Object.freeze({
      defaultProfile,
      collectEnemyIds,
      autoReserve,
      zombicideBaseProfile
    })
  });
})(typeof window!=="undefined"?window:globalThis);
