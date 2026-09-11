import { mountRpgEditor, loadRpgUniverse } from './rpg.js';
import { mountCombatLab } from './combat-lab.js';
import { mountWorldEditor, loadWorldDraft } from './world-editor.js';
import { buildWorldIndex } from './world-engine.js';
import { mountRoomEditor, loadRoomLayout } from './room-editor.js';
import { mountHeroSheet } from './hero-sheet.js';
import { mountDungeonGameplayView } from './dungeon-gameplay-view.js';
import { createBrowserAudioOutput } from '../../core/browser-audio-output.js';
import { createRpgAudioSession } from './rpg-audio-session.js';

export function createRpgPageRuntime({audioOutput=null}={}){
  const output=audioOutput||createBrowserAudioOutput();
  const audioSession=createRpgAudioSession({output});
  let disposed=false;
  function dispose(){
    if(disposed) return {ok:true,alreadyDisposed:true};
    disposed=true;
    return audioSession.dispose();
  }
  return {audioSession,audioOutput:output,dispose,isDisposed:()=>disposed};
}

export function mountRpgPage(host,{runtime=null,dungeonRuntime=null,dungeonLootRecipients=[],dungeonInventory=null,dungeonConditionEvaluator=null,dungeonHeroRuntimes=[],dungeonSpatial=null,dungeonSpatialConfig={},dungeonCombat=null,onDungeonCombatStart=null,onDungeonRuntimeChange=null}={}){
  const pageRuntime=runtime||createRpgPageRuntime();
  let currentDungeonRuntime=dungeonRuntime||null;
  let currentDungeonLootRecipients=structuredClone(dungeonLootRecipients||[]);
  let currentDungeonInventory=dungeonInventory||null;
  let currentDungeonHeroRuntimes=structuredClone(dungeonHeroRuntimes||[]);
  let currentDungeonSpatial=dungeonSpatial?structuredClone(dungeonSpatial):null;
  let currentDungeonSpatialConfig=structuredClone(dungeonSpatialConfig||{});
  let currentDungeonCombat=dungeonCombat?structuredClone(dungeonCombat):null;
  let currentDungeonEventWorld={};
  let currentTab='editor';
  let dungeonView=null;
  host.innerHTML=`
    <nav class="rpg-tabs" aria-label="Outils RPG">
      <button type="button" class="rpg-tab active" data-rpg-tab="editor">⚙️ Configuration</button>
      <button type="button" class="rpg-tab" data-rpg-tab="dungeon">🎮 Donjon</button>
      <button type="button" class="rpg-tab" data-rpg-tab="heroes">🧙 Héros</button>
      <button type="button" class="rpg-tab" data-rpg-tab="world">🗺️ World Builder</button>
      <button type="button" class="rpg-tab" data-rpg-tab="room">🧱 Salle</button>
      <button type="button" class="rpg-tab" data-rpg-tab="combat">🎲 Combat test</button>
    </nav>
    <div id="rpgPageBody"></div>`;
  const body=host.querySelector('#rpgPageBody');
  const buttons=[...host.querySelectorAll('[data-rpg-tab]')];

  function dungeonLayoutProvider(roomId){
    return loadRoomLayout({id:String(roomId),name:String(roomId)});
  }

  function currentWorldIndex(){
    return buildWorldIndex(loadWorldDraft());
  }

  function open(tab){
    currentTab=tab;
    dungeonView=null;
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.rpgTab===tab));
    body.innerHTML='';
    if(tab==='combat') mountCombatLab(body,loadRpgUniverse());
    else if(tab==='dungeon') dungeonView=mountDungeonGameplayView(body,{
      universe:loadRpgUniverse(),
      roomRuntime:currentDungeonRuntime,
      lootRecipients:currentDungeonLootRecipients,
      layoutProvider:dungeonLayoutProvider,
      eventWorld:currentDungeonEventWorld,
      worldIndex:currentWorldIndex(),
      conditionEvaluator:dungeonConditionEvaluator,
      inventory:currentDungeonInventory,
      heroRuntimes:currentDungeonHeroRuntimes,
      spatial:currentDungeonSpatial,
      spatialConfig:currentDungeonSpatialConfig,
      activeCombat:currentDungeonCombat,
      onCombatStart:(combat,out)=>{
        currentDungeonCombat=combat;
        onDungeonCombatStart?.(structuredClone(combat),out);
      },
      onRoomRuntimeChange:(nextRuntime,out)=>{
        currentDungeonRuntime=nextRuntime;
        if(out?.recipients) currentDungeonLootRecipients=out.recipients;
        if(out?.world) currentDungeonEventWorld=out.world;
        onDungeonRuntimeChange?.(currentDungeonRuntime,out);
      },
    });
    else if(tab==='heroes') mountHeroSheet(body,loadRpgUniverse());
    else if(tab==='world') mountWorldEditor(body,loadRpgUniverse());
    else if(tab==='room') mountRoomEditor(body,loadRpgUniverse());
    else mountRpgEditor(body);
  }

  buttons.forEach(button=>button.addEventListener('click',()=>open(button.dataset.rpgTab)));
  open('editor');

  return {
    audioSession:pageRuntime.audioSession,
    setDungeonRuntime(nextRuntime){
      currentDungeonRuntime=nextRuntime||null;
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setRoomRuntime(currentDungeonRuntime);
      return currentDungeonRuntime;
    },
    setDungeonLootRecipients(nextRecipients){
      currentDungeonLootRecipients=structuredClone(nextRecipients||[]);
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setLootRecipients(currentDungeonLootRecipients);
      return structuredClone(currentDungeonLootRecipients);
    },
    setDungeonInventory(nextInventory){
      currentDungeonInventory=nextInventory||null;
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setInventory(currentDungeonInventory);
      return currentDungeonInventory;
    },
    setDungeonHeroRuntimes(nextHeroes){
      currentDungeonHeroRuntimes=structuredClone(nextHeroes||[]);
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setHeroRuntimes(currentDungeonHeroRuntimes);
      return structuredClone(currentDungeonHeroRuntimes);
    },
    setDungeonSpatial(nextSpatial,nextConfig=currentDungeonSpatialConfig){
      currentDungeonSpatial=nextSpatial?structuredClone(nextSpatial):null;
      currentDungeonSpatialConfig=structuredClone(nextConfig||{});
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setSpatial(currentDungeonSpatial,currentDungeonSpatialConfig);
      return currentDungeonSpatial?structuredClone(currentDungeonSpatial):null;
    },
    setDungeonCombat(nextCombat){
      currentDungeonCombat=nextCombat?structuredClone(nextCombat):null;
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setCombat(currentDungeonCombat);
      return currentDungeonCombat?structuredClone(currentDungeonCombat):null;
    },
    refreshDungeonWorld(){
      const index=currentWorldIndex();
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setWorldIndex(index);
      return index;
    },
    setDungeonEventWorld(nextWorld){
      currentDungeonEventWorld=structuredClone(nextWorld||{});
      if(currentTab==='dungeon'&&dungeonView) dungeonView.setEventWorld(currentDungeonEventWorld);
      return structuredClone(currentDungeonEventWorld);
    },
    getDungeonRuntime:()=>currentDungeonRuntime,
    getDungeonLootRecipients:()=>structuredClone(currentDungeonLootRecipients),
    getDungeonInventory:()=>currentDungeonInventory,
    getDungeonHeroRuntimes:()=>structuredClone(currentDungeonHeroRuntimes),
    getDungeonSpatial:()=>currentDungeonSpatial?structuredClone(currentDungeonSpatial):null,
    getDungeonCombat:()=>currentDungeonCombat?structuredClone(currentDungeonCombat):null,
    getDungeonEventWorld:()=>structuredClone(currentDungeonEventWorld),
    openTab:open,
    dispose:()=>pageRuntime.dispose(),
    isDisposed:()=>pageRuntime.isDisposed(),
  };
}