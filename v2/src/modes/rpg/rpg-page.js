import { mountRpgEditor, loadRpgUniverse } from './rpg.js';
import { mountCombatLab } from './combat-lab.js';
import { mountWorldEditor, loadWorldDraft } from './world-editor.js';
import { buildWorldIndex } from './world-engine.js';
import { mountRoomEditor, loadRoomLayout } from './room-editor.js';
import { mountHeroSheet } from './hero-sheet.js';
import { mountDungeonGameplayView } from './dungeon-gameplay-view.js';
import { createDungeonTestSession } from './dungeon-test-session.js';
import { mountDungeonCombatItemControls } from './dungeon-combat-item-ui.js';
import { mountDungeonCombatFleeControl } from './dungeon-combat-flee-ui.js';
import { mountDungeonCombatGmControls } from './dungeon-combat-gm-ui.js';
import { isDungeonGameMasterDevice, setDungeonGameMasterDeviceRole } from './dungeon-device-role.js';
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

export function mountRpgPage(host,{runtime=null,dungeonRuntime=null,dungeonLootRecipients=[],dungeonInventory=null,dungeonConditionEvaluator=null,dungeonHeroRuntimes=[],dungeonSpatial=null,dungeonSpatialConfig={},dungeonCombat=null,dungeonIsGameMasterDevice=null,onDungeonCombatStart=null,onDungeonCombatChange=null,onDungeonCombatEnd=null,onDungeonRuntimeChange=null}={}){
  const pageRuntime=runtime||createRpgPageRuntime();
  let currentDungeonRuntime=dungeonRuntime||null;
  let currentDungeonLootRecipients=structuredClone(dungeonLootRecipients||[]);
  let currentDungeonInventory=dungeonInventory||null;
  let currentDungeonHeroRuntimes=structuredClone(dungeonHeroRuntimes||[]);
  let currentDungeonSpatial=dungeonSpatial?structuredClone(dungeonSpatial):null;
  let currentDungeonSpatialConfig=structuredClone(dungeonSpatialConfig||{});
  let currentDungeonCombat=dungeonCombat?structuredClone(dungeonCombat):null;
  let currentDungeonUniverse=loadRpgUniverse();
  let currentDungeonIsDemo=false;
  let currentDungeonIsGameMasterDevice=dungeonIsGameMasterDevice==null?isDungeonGameMasterDevice():Boolean(dungeonIsGameMasterDevice);
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

  function installDungeonTestLauncher(){
    if(currentTab!=='dungeon'||currentDungeonRuntime) return;
    const universe=loadRpgUniverse();
    const enabledHeroes=(Array.isArray(universe.heroes)?universe.heroes:Object.values(universe.heroes||{})).filter(hero=>hero&&hero.enabled!==false&&hero.id);
    const usingDemo=enabledHeroes.length===0;
    body.insertAdjacentHTML('afterbegin',`<section class="editor-section dungeon-test-launch" data-dungeon-test-launch><div class="section-title-row"><div><h3>▶️ Partie test</h3><p class="muted">${usingDemo?'Aucun héros configuré : une mini-démo temporaire sera utilisée, sans modifier tes données.':'Démarre immédiatement le World Builder actuel avec les héros configurés, sans créer de sauvegarde.'}</p></div><button type="button" class="primary-button" data-start-dungeon-test>Lancer une partie test</button></div><p class="muted" data-dungeon-test-status>${usingDemo?'Démo prête : 1 aventurier, 1 squelette et un combat simple.':`${enabledHeroes.length} héros prêt${enabledHeroes.length>1?'s':''} pour le test.`}</p></section>`);
    body.querySelector('[data-start-dungeon-test]')?.addEventListener('click',()=>{
      const status=body.querySelector('[data-dungeon-test-status]');
      const out=createDungeonTestSession({universe:loadRpgUniverse(),worldDraft:loadWorldDraft(),layoutProvider:dungeonLayoutProvider,allowDemoFallback:true});
      if(!out.ok){if(status) status.textContent=`Impossible de lancer : ${out.reason}.`;return;}
      currentDungeonUniverse=structuredClone(out.universe||loadRpgUniverse());
      currentDungeonIsDemo=out.demo===true;
      currentDungeonRuntime=out.roomRuntime;
      currentDungeonHeroRuntimes=structuredClone(out.heroRuntimes||[]);
      currentDungeonCombat=null;
      currentDungeonEventWorld={};
      onDungeonRuntimeChange?.(currentDungeonRuntime,{kind:'dungeon-test-start',demo:currentDungeonIsDemo,heroRuntimes:structuredClone(currentDungeonHeroRuntimes)});
      open('dungeon');
    });
  }

  function scheduleDungeonCombatUi(){
    if(currentTab!=='dungeon') return;
    const install=()=>{
      if(currentTab!=='dungeon'||!dungeonView) return;
      const universe=currentDungeonUniverse;
      mountDungeonCombatItemControls(body,{
        universe,
        getCombat:()=>dungeonView?.getCombat?.()||currentDungeonCombat,
        getHeroRuntimes:()=>dungeonView?.getHeroRuntimes?.()||structuredClone(currentDungeonHeroRuntimes),
        onUse(out){
          currentDungeonCombat=structuredClone(out.combat);
          currentDungeonHeroRuntimes=structuredClone(out.heroRuntimes||[]);
          dungeonView.setHeroRuntimes(currentDungeonHeroRuntimes);
          dungeonView.setCombat(currentDungeonCombat);
          onDungeonCombatChange?.(structuredClone(currentDungeonCombat),{...out,kind:'combat-item'});
          onDungeonRuntimeChange?.(currentDungeonRuntime,{...out,kind:'combat-item'});
          scheduleDungeonCombatUi();
        },
      });
      mountDungeonCombatFleeControl(body,{
        getCombat:()=>dungeonView?.getCombat?.()||currentDungeonCombat,
        getRoomRuntime:()=>dungeonView?.getRoomRuntime?.()||currentDungeonRuntime,
        getHeroRuntimes:()=>dungeonView?.getHeroRuntimes?.()||structuredClone(currentDungeonHeroRuntimes),
        onFlee(out){
          const fledCombat=structuredClone(out.combat);
          currentDungeonRuntime=out.roomRuntime;
          currentDungeonHeroRuntimes=structuredClone(out.heroRuntimes||[]);
          currentDungeonCombat=null;
          dungeonView.setCombat(null);
          dungeonView.setHeroRuntimes(currentDungeonHeroRuntimes);
          dungeonView.setRoomRuntime(currentDungeonRuntime);
          onDungeonCombatChange?.(fledCombat,{...out,kind:'combat-flee'});
          onDungeonRuntimeChange?.(currentDungeonRuntime,{...out,kind:'combat-flee'});
          scheduleDungeonCombatUi();
        },
      });
      mountDungeonCombatGmControls(body,{
        universe,
        isGameMasterDevice:currentDungeonIsGameMasterDevice,
        getCombat:()=>dungeonView?.getCombat?.()||currentDungeonCombat,
        onChange(out){
          currentDungeonCombat=structuredClone(out.combat);
          dungeonView.setCombat(currentDungeonCombat);
          onDungeonCombatChange?.(structuredClone(currentDungeonCombat),{...out,kind:'combat-gm'});
          scheduleDungeonCombatUi();
        },
      });
    };
    if(typeof queueMicrotask==='function') queueMicrotask(install); else setTimeout(install,0);
  }

  function open(tab){
    currentTab=tab;
    dungeonView=null;
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.rpgTab===tab));
    body.innerHTML='';
    if(tab==='combat') mountCombatLab(body,loadRpgUniverse());
    else if(tab==='dungeon'){
      if(!currentDungeonRuntime&&!currentDungeonIsDemo) currentDungeonUniverse=loadRpgUniverse();
      dungeonView=mountDungeonGameplayView(body,{
        universe:currentDungeonUniverse,
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
          scheduleDungeonCombatUi();
        },
        onCombatChange:(combat,out)=>{
          currentDungeonCombat=structuredClone(combat);
          onDungeonCombatChange?.(structuredClone(combat),out);
          scheduleDungeonCombatUi();
        },
        onCombatEnd:(combat,out)=>{
          currentDungeonCombat=structuredClone(combat);
          currentDungeonRuntime=out.roomRuntime;
          currentDungeonHeroRuntimes=structuredClone(out.heroRuntimes||[]);
          onDungeonCombatEnd?.(structuredClone(combat),out);
          scheduleDungeonCombatUi();
        },
        onRoomRuntimeChange:(nextRuntime,out)=>{
          currentDungeonRuntime=nextRuntime;
          if(out?.recipients) currentDungeonLootRecipients=out.recipients;
          if(out?.heroRuntimes) currentDungeonHeroRuntimes=structuredClone(out.heroRuntimes);
          if(out?.world) currentDungeonEventWorld=out.world;
          onDungeonRuntimeChange?.(currentDungeonRuntime,out);
          scheduleDungeonCombatUi();
        },
      });
      if(currentDungeonIsDemo&&currentDungeonRuntime) body.insertAdjacentHTML('afterbegin','<p class="status-pill" data-dungeon-demo-banner>Démo temporaire · aucune donnée enregistrée</p>');
      installDungeonTestLauncher();
      scheduleDungeonCombatUi();
    }
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
      if(!currentDungeonRuntime){currentDungeonIsDemo=false;currentDungeonUniverse=loadRpgUniverse();}
      if(currentTab==='dungeon'&&dungeonView){dungeonView.setRoomRuntime(currentDungeonRuntime);scheduleDungeonCombatUi();}
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
      if(currentTab==='dungeon'&&dungeonView){dungeonView.setHeroRuntimes(currentDungeonHeroRuntimes);scheduleDungeonCombatUi();}
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
      if(currentTab==='dungeon'&&dungeonView){
        dungeonView.setCombat(currentDungeonCombat);
        currentDungeonRuntime=dungeonView.getRoomRuntime();
        currentDungeonHeroRuntimes=dungeonView.getHeroRuntimes();
        scheduleDungeonCombatUi();
      }
      return currentDungeonCombat?structuredClone(currentDungeonCombat):null;
    },
    setDungeonGameMasterDevice(isGameMasterDevice){
      currentDungeonIsGameMasterDevice=setDungeonGameMasterDeviceRole(Boolean(isGameMasterDevice));
      if(currentTab==='dungeon') scheduleDungeonCombatUi();
      return currentDungeonIsGameMasterDevice;
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
    getDungeonGameMasterDevice:()=>currentDungeonIsGameMasterDevice,
    getDungeonEventWorld:()=>structuredClone(currentDungeonEventWorld),
    getDungeonUniverse:()=>structuredClone(currentDungeonUniverse),
    isDungeonDemo:()=>currentDungeonIsDemo,
    openTab:open,
    dispose:()=>pageRuntime.dispose(),
    isDisposed:()=>pageRuntime.isDisposed(),
  };
}
