import { mountRpgEditor, loadRpgUniverse } from './rpg.js';
import { mountCombatLab } from './combat-lab.js';
import { mountWorldEditor } from './world-editor.js';
import { mountRoomEditor } from './room-editor.js';
import { mountHeroSheet } from './hero-sheet.js';
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

export function mountRpgPage(host,{runtime=null}={}){
  const pageRuntime=runtime||createRpgPageRuntime();
  host.innerHTML=`
    <nav class="rpg-tabs" aria-label="Outils RPG">
      <button type="button" class="rpg-tab active" data-rpg-tab="editor">⚙️ Configuration</button>
      <button type="button" class="rpg-tab" data-rpg-tab="heroes">🧙 Héros</button>
      <button type="button" class="rpg-tab" data-rpg-tab="world">🗺️ World Builder</button>
      <button type="button" class="rpg-tab" data-rpg-tab="room">🧱 Salle</button>
      <button type="button" class="rpg-tab" data-rpg-tab="combat">🎲 Combat test</button>
    </nav>
    <div id="rpgPageBody"></div>`;
  const body=host.querySelector('#rpgPageBody');
  const buttons=[...host.querySelectorAll('[data-rpg-tab]')];

  function open(tab){
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.rpgTab===tab));
    body.innerHTML='';
    if(tab==='combat') mountCombatLab(body,loadRpgUniverse());
    else if(tab==='heroes') mountHeroSheet(body,loadRpgUniverse());
    else if(tab==='world') mountWorldEditor(body);
    else if(tab==='room') mountRoomEditor(body);
    else mountRpgEditor(body);
  }

  buttons.forEach(button=>button.addEventListener('click',()=>open(button.dataset.rpgTab)));
  open('editor');

  return {
    audioSession:pageRuntime.audioSession,
    dispose:()=>pageRuntime.dispose(),
    isDisposed:()=>pageRuntime.isDisposed(),
  };
}
