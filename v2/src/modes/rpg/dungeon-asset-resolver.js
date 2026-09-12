const CREATURE_BASE='../assets/dungeon/creatures/';

function norm(value=''){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

const CHARACTER_FILES=Object.freeze({
  aldren:'dng_aldren.png',
  lyra:'dng_lyra.png',
  brom:'dng_brom.png',
  squelette:'dng_skeleton.png',
  skeleton:'dng_skeleton.png',
  squelette_archer:'dng_skeleton_archer.png',
  skeleton_archer:'dng_skeleton_archer.png',
  garde_squelette:'dng_skeleton_guard.png',
  skeleton_guard:'dng_skeleton_guard.png',
  gobelin:'dng_goblin.png',
  goblin:'dng_goblin.png',
  gobelin_archer:'dng_goblin_archer.png',
  goblin_archer:'dng_goblin_archer.png',
  gobelin_chaman:'dng_goblin_shaman.png',
  goblin_shaman:'dng_goblin_shaman.png',
  orc:'dng_orc.png',
  ork:'dng_orc.png',
  orc_berserker:'dng_orc_berserker.png',
  ork_berserker:'dng_orc_berserker.png',
  orc_shaman:'dng_orc_shaman.png',
  ork_shaman:'dng_orc_shaman.png',
  necromancien:'dng_necromancer.png',
  necromancer:'dng_necromancer.png',
  liche:'dng_lich.png',
  lich:'dng_lich.png',
  wyvern:'dng_wyvern.png',
  wyverne:'dng_wyvern.png',
  troll:'dng_troll.png',
  minotaure:'dng_minotaur.png',
  minotaur:'dng_minotaur.png',
  golem:'dng_golem.png',
  harpie:'dng_harpy.png',
  harpy:'dng_harpy.png',
  araignee:'dng_spider.png',
  spider:'dng_spider.png',
  spectre:'dng_wraith.png',
  wraith:'dng_wraith.png',
  goule:'dng_ghoul.png',
  ghoul:'dng_ghoul.png',
  loup_sinistre:'dng_direwolf.png',
  direwolf:'dng_direwolf.png',
});

const WORLD_FILES=Object.freeze({
  floor:'dungeon_floor_stone.png',
  stone:'dungeon_floor_stone.png',
  water:'dungeon_floor_water.png',
  lava:'dungeon_floor_lava.png',
  rock:'dungeon_floor_cracked.png',
  wall:'dungeon_wall.png',
  door_closed:'dungeon_door_closed.png',
  door_open:'dungeon_door_open.png',
  chest:'dungeon_chest_common.png',
  trap:'dungeon_trap_spike.png',
  portal:'dungeon_portal.png',
  switch:'dungeon_switch.png',
  boss:'dungeon_marker_boss.png',
  entry:'dungeon_marker_start.png',
  exit:'dungeon_marker_exit.png',
});

function toAssetPath(file){return file?`${CREATURE_BASE}${file}`:null;}

export function resolveDungeonCharacterAsset(definition={}){
  const explicit=norm(definition?.artId);
  if(explicit){
    if(explicit.endsWith('_png')) return toAssetPath(explicit.replace(/_png$/,'.png'));
    if(CHARACTER_FILES[explicit]) return toAssetPath(CHARACTER_FILES[explicit]);
  }
  const name=norm(definition?.name||definition?.id);
  if(CHARACTER_FILES[name]) return toAssetPath(CHARACTER_FILES[name]);
  for(const [key,file] of Object.entries(CHARACTER_FILES)) if(name.includes(key)) return toAssetPath(file);
  return null;
}

export function resolveDungeonWorldAsset(kind){return toAssetPath(WORLD_FILES[norm(kind)]||null);}

export function dungeonAssetStyle(url,{position='center',size='cover'}={}){
  if(!url) return '';
  return `background-image:url('${url}');background-position:${position};background-size:${size};background-repeat:no-repeat;`;
}

export {CREATURE_BASE};
