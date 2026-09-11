import { mountRpgEditor } from './modes/rpg/rpg.js';

const MODES = [
  {
    id: 'survival',
    icon: '☠️',
    name: 'Survie',
    description: 'Migration fidèle du mode actuel, nettoyée et isolée.',
    status: 'À migrer',
    enabled: true,
  },
  {
    id: 'rpg',
    icon: '🧭',
    name: 'RPG',
    description: 'JDR aux dés, totalement configurable, avec Dungeon et assistant de table.',
    status: 'Éditeur de base actif',
    enabled: true,
  },
  {
    id: 'capture',
    icon: '🔮',
    name: 'Capture de créatures',
    description: 'Mode isolé. Conservation de l’existant avant futur combat dynamique.',
    status: 'Mis de côté',
    enabled: false,
  },
  {
    id: 'pvp',
    icon: '⚔️',
    name: 'Affrontement / PVP',
    description: 'Mode séparé réservé pour une phase ultérieure.',
    status: 'À venir',
    enabled: false,
  },
];

const HELP = {
  home: {
    title: 'Comment fonctionne GenSrpG V2 ?',
    html: `
      <p>La V2 est reconstruite sans toucher à la version stable actuelle.</p>
      <p><strong>Survie, RPG, Capture et PVP sont séparés.</strong> Une modification du RPG ne doit pas casser Capture ou Survie.</p>
      <p>Le Core partage uniquement des services neutres : sauvegarde, profils, assets, audio, paramètres et import/export.</p>
    `,
  },
  status: {
    title: 'État de la reconstruction',
    html: `
      <p>Le premier éditeur RPG est maintenant actif : statistiques et ressources sont créées comme des données libres.</p>
      <p>Les prochaines briques seront les conditions, effets, compétences et transformations.</p>
    `,
  },
  survival: {
    title: 'Mode Survie',
    html: '<p>Le but est de conserver les fonctions actuelles en les nettoyant, sans réinventer inutilement les règles déjà efficaces.</p>',
  },
  rpg: {
    title: 'Mode RPG',
    html: `
      <p>Le RPG reste basé sur les dés. Les statistiques, ressources, effets, distances, conditions et règles doivent être configurables.</p>
      <p>Les liens entre objets utilisent des sélecteurs et menus, jamais des identifiants techniques à saisir manuellement.</p>
    `,
  },
  'rpg-editor': {
    title: 'Éditeur RPG générique',
    html: `
      <p>Cette zone définit les briques de base de l'univers RPG. Rien n'est imposé par le moteur.</p>
      <p>Une statistique ou une ressource créée ici pourra ensuite être utilisée par les héros, objets, jets, compétences, pièges, événements et transformations.</p>
    `,
  },
  'rpg-stat': {
    title: 'Statistique',
    html: `
      <p>Une statistique décrit une valeur de jeu : Force, Furtivité, Chance, Champ de vision, Perception, Corruption, etc.</p>
      <p><strong>Valeur de base</strong> : valeur par défaut. <strong>Minimum/Maximum</strong> : bornes autorisées. <strong>Coût d'amélioration</strong> : ressource dépensée pour gagner un point.</p>
      <p>Exemple : une statistique « Furtivité » peut ensuite être sélectionnée dans un jet de détection sans qu'aucun code spécial « furtivité » existe dans le moteur.</p>
    `,
  },
  'rpg-resource': {
    title: 'Ressource',
    html: `
      <p>Une ressource est une jauge dépensable ou variable : PV, Mana, Ki, Rage, Énergie, Points d'action, etc.</p>
      <p>Le maximum peut être fixe ou lié à une statistique choisie dans la liste. Aucun identifiant technique n'est à saisir.</p>
      <p>Exemple : « Ki » peut servir plus tard de coût d'une transformation temporaire.</p>
    `,
  },
  capture: {
    title: 'Capture de créatures',
    html: '<p>Ce chantier est volontairement mis de côté. Son ancien fonctionnement sera récupéré avant toute réécriture.</p>',
  },
  pvp: {
    title: 'Affrontement / PVP',
    html: '<p>Architecture réservée, moteur à construire plus tard.</p>',
  },
};

function renderModes() {
  const host = document.querySelector('#modeGrid');
  host.innerHTML = MODES.map(mode => `
    <article class="mode-card ${mode.enabled ? '' : 'disabled'}" ${mode.enabled ? `data-mode="${mode.id}"` : ''}>
      <div class="mode-card-head">
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <button class="help-button small" type="button" data-help="${mode.id}" aria-label="Aide ${mode.name}">?</button>
      </div>
      <h2>${mode.name}</h2>
      <p>${mode.description}</p>
      <span class="status-pill">${mode.status}</span>
    </article>
  `).join('');
}

function renderStatus() {
  document.querySelector('#buildStatus').innerHTML = `
    <ul class="status-list">
      <li><strong>Branche :</strong> rebuild/v2</li>
      <li><strong>Stable :</strong> main reste intact</li>
      <li><strong>UI :</strong> mobile-first + aide contextuelle</li>
      <li><strong>Core :</strong> stockage V2 isolé et préfixé</li>
      <li><strong>RPG :</strong> éditeur générique stats + ressources opérationnel</li>
    </ul>
  `;
}

function openHelp(key) {
  const help = HELP[key] || HELP.home;
  const drawer = document.querySelector('#helpDrawer');
  document.querySelector('#helpTitle').textContent = help.title;
  document.querySelector('#helpBody').innerHTML = help.html;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.querySelector('#drawerBackdrop').hidden = false;
}

function closeHelp() {
  const drawer = document.querySelector('#helpDrawer');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.querySelector('#drawerBackdrop').hidden = true;
}

function openMode(modeId) {
  const home = document.querySelector('#homeView');
  const workspace = document.querySelector('#workspaceView');
  const host = document.querySelector('#workspaceHost');
  home.hidden = true;
  workspace.hidden = false;
  host.innerHTML = '';
  if (modeId === 'rpg') mountRpgEditor(host);
  else host.innerHTML = '<section class="panel"><h2>Migration en préparation</h2><p>Ce mode sera branché ici sans dépendre du moteur RPG.</p></section>';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function backHome() {
  document.querySelector('#workspaceView').hidden = true;
  document.querySelector('#homeView').hidden = false;
  document.querySelector('#workspaceHost').innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', event => {
  const help = event.target.closest('[data-help]');
  if (help) {
    event.stopPropagation();
    openHelp(help.dataset.help);
    return;
  }
  const mode = event.target.closest('[data-mode]');
  if (mode) openMode(mode.dataset.mode);
});

document.querySelector('#helpClose').addEventListener('click', closeHelp);
document.querySelector('#drawerBackdrop').addEventListener('click', closeHelp);
document.querySelector('#backHome').addEventListener('click', backHome);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeHelp();
});

renderModes();
renderStatus();
