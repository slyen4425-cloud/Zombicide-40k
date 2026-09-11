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
    status: 'Socle en construction',
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
      <p>Cette page est le premier socle de la V2. Elle valide l’isolation des modes et le système d’aide contextuelle.</p>
      <p>La prochaine étape est de créer les contrats de données du Core puis le moteur générique RPG : statistiques, ressources, effets et conditions.</p>
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
    <article class="mode-card ${mode.enabled ? '' : 'disabled'}">
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
      <li><strong>RPG :</strong> aucune dépendance obligatoire à des noms de stats/ressources</li>
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

document.addEventListener('click', event => {
  const help = event.target.closest('[data-help]');
  if (help) openHelp(help.dataset.help);
});

document.querySelector('#helpClose').addEventListener('click', closeHelp);
document.querySelector('#drawerBackdrop').addEventListener('click', closeHelp);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeHelp();
});

renderModes();
renderStatus();
