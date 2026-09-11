import { mountRpgEditor } from './modes/rpg/rpg.js';

const MODES = [
  { id: 'survival', icon: '☠️', name: 'Survie', description: 'Migration fidèle du mode actuel, nettoyée et isolée.', status: 'À migrer', enabled: true },
  { id: 'rpg', icon: '🧭', name: 'RPG', description: 'JDR aux dés, totalement configurable, avec Dungeon et assistant de table.', status: 'Éditeur générique actif', enabled: true },
  { id: 'capture', icon: '🔮', name: 'Capture de créatures', description: 'Mode isolé. Conservation de l’existant avant futur combat dynamique.', status: 'Mis de côté', enabled: false },
  { id: 'pvp', icon: '⚔️', name: 'Affrontement / PVP', description: 'Mode séparé réservé pour une phase ultérieure.', status: 'À venir', enabled: false },
];

const HELP = {
  home: { title: 'Comment fonctionne GenSrpG V2 ?', html: '<p>La V2 est reconstruite sans toucher à la version stable actuelle.</p><p><strong>Survie, RPG, Capture et PVP sont séparés.</strong> Le Core ne partage que des services techniques neutres.</p>' },
  status: { title: 'État de la reconstruction', html: '<p>Le socle RPG sait maintenant créer des statistiques, ressources, conditions, effets, compétences et transformations avec des liens par menus.</p><p>Les moteurs de conditions, effets, compétences et formes sont séparés de l’interface.</p>' },
  survival: { title: 'Mode Survie', html: '<p>Le but est de conserver les fonctions actuelles en les nettoyant, sans réinventer inutilement les règles déjà efficaces.</p>' },
  rpg: { title: 'Mode RPG', html: '<p>Le RPG reste basé sur les dés. Les statistiques, ressources, effets, distances, conditions et règles sont configurables.</p><p>Les liens utilisent des sélecteurs et menus : aucun identifiant technique ne doit être saisi à la main.</p>' },
  'rpg-editor': { title: 'Éditeur RPG générique', html: '<p>Cette zone définit les briques de l’univers RPG. Elles sont réutilisées par les héros, objets, jets, compétences, pièges, événements et transformations.</p>' },
  'rpg-stat': { title: 'Statistique', html: '<p>Une statistique décrit une valeur de jeu : Force, Furtivité, Chance, Champ de vision, Perception, Corruption, etc.</p><p>Exemple : « Furtivité » peut être sélectionnée dans un jet sans qu’un code spécial furtivité existe.</p>' },
  'rpg-resource': { title: 'Ressource', html: '<p>Une ressource est une jauge : PV, Mana, Ki, Rage, Énergie, Points d’action… Son nom n’a aucun sens imposé pour le moteur.</p>' },
  'rpg-condition': { title: 'Condition', html: '<p>Une condition vérifie une valeur avant d’autoriser une action, un effet ou une transformation.</p><p>Exemple : Ki ≥ 80, Niveau ≥ 10 ou PV sous un seuil. La statistique ou ressource se choisit dans le menu.</p>' },
  'rpg-effect': { title: 'Effet', html: '<p>Un effet modifie une statistique ou une ressource. Il pourra être réutilisé par une compétence, un objet, un piège, un événement ou une forme.</p><p>Exemple : Force +5 pendant 3 tours, ou PV −2.</p>' },
  'rpg-skill': { title: 'Compétence', html: '<p>Une compétence regroupe conditions, coût, charges, recharge, jet éventuel, cible et effets.</p><p>Chaque dépendance est choisie dans une liste : pas d’ID à recopier.</p>' },
  'rpg-form': { title: 'Évolution / transformation', html: '<p>Une forme peut être temporaire ou permanente. Elle peut demander des conditions, consommer une ressource, durer plusieurs tours, appliquer des effets et ajouter des compétences.</p><p>Exemple : Ki ≥ 80 → Forme éveillée pendant 3 tours.</p>' },
  capture: { title: 'Capture de créatures', html: '<p>Ce chantier est volontairement mis de côté. Son ancien fonctionnement sera récupéré avant toute réécriture.</p>' },
  pvp: { title: 'Affrontement / PVP', html: '<p>Architecture réservée, moteur à construire plus tard.</p>' },
};

function renderModes() {
  const host = document.querySelector('#modeGrid');
  host.innerHTML = MODES.map(mode => `<article class="mode-card ${mode.enabled ? '' : 'disabled'}" ${mode.enabled ? `data-mode="${mode.id}"` : ''}><div class="mode-card-head"><span class="mode-icon" aria-hidden="true">${mode.icon}</span><button class="help-button small" type="button" data-help="${mode.id}" aria-label="Aide ${mode.name}">?</button></div><h2>${mode.name}</h2><p>${mode.description}</p><span class="status-pill">${mode.status}</span></article>`).join('');
}

function renderStatus() {
  document.querySelector('#buildStatus').innerHTML = '<ul class="status-list"><li><strong>Branche :</strong> rebuild/v2</li><li><strong>Stable :</strong> main reste intact</li><li><strong>UI :</strong> mobile-first + aide contextuelle</li><li><strong>Core :</strong> stockage isolé + conditions + effets + compétences + formes</li><li><strong>RPG :</strong> éditeur générique relié par menus déroulants</li></ul>';
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
  if (help) { event.stopPropagation(); openHelp(help.dataset.help); return; }
  const mode = event.target.closest('[data-mode]');
  if (mode) openMode(mode.dataset.mode);
});

document.querySelector('#helpClose').addEventListener('click', closeHelp);
document.querySelector('#drawerBackdrop').addEventListener('click', closeHelp);
document.querySelector('#backHome').addEventListener('click', backHome);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeHelp(); });

renderModes();
renderStatus();
