import { mountRpgEditor, loadRpgUniverse } from './rpg.js';
import { mountCombatLab } from './combat-lab.js';
import { mountWorldEditor } from './world-editor.js';
import { mountRoomEditor } from './room-editor.js';

export function mountRpgPage(host){
  host.innerHTML=`
    <nav class="rpg-tabs" aria-label="Outils RPG">
      <button type="button" class="rpg-tab active" data-rpg-tab="editor">⚙️ Configuration</button>
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
    else if(tab==='world') mountWorldEditor(body);
    else if(tab==='room') mountRoomEditor(body);
    else mountRpgEditor(body);
  }

  buttons.forEach(button=>button.addEventListener('click',()=>open(button.dataset.rpgTab)));
  open('editor');
}
