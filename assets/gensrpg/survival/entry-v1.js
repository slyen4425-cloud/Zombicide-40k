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

  root.GensSurvivalV1=Object.freeze({
    VERSION,
    waveRules:Object.freeze({
      defaultProfile,
      collectEnemyIds
    })
  });
})(typeof window!=="undefined"?window:globalThis);
