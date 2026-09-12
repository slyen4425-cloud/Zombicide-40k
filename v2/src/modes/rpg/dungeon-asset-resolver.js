const CREATURE_BASE='../assets/dungeon/creatures/';
const ITEM_BASE='../assets/dungeon/items/';

function norm(value=''){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

function explicitAssetPath(value,base){
  const raw=String(value||'').trim();
  if(!raw) return null;
  if(/^https?:\/\//i.test(raw)||raw.startsWith('../')||raw.startsWith('./')||raw.startsWith('/')) return raw;
  if(/\.(png|jpg|jpeg|webp)$/i.test(raw)) return `${base}${raw}`;
  return null;
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

const ITEM_FILES=Object.freeze({
  ancient_boots:'ditem_ancient_boots.png',
  bottes_anciennes:'ditem_ancient_boots.png',
  ancient_chest:'ditem_ancient_chest.png',
  plastron_ancien:'ditem_ancient_chest.png',
  ancient_gauntlets:'ditem_ancient_gauntlets.png',
  gantelets_anciens:'ditem_ancient_gauntlets.png',
  ancient_helm:'ditem_ancient_helm.png',
  casque_ancien:'ditem_ancient_helm.png',
  ancient_shoulders:'ditem_ancient_shoulders.png',
  epaulettes_anciennes:'ditem_ancient_shoulders.png',
  arcane_grimoire:'ditem_arcane_grimoire.png',
  grimoire_arcanique:'ditem_arcane_grimoire.png',
  ash_blade:'ditem_ash_blade.png',
  lame_de_cendre:'ditem_ash_blade.png',
  bastion_shield:'ditem_bastion_shield.png',
  bouclier_du_bastion:'ditem_bastion_shield.png',
  celerity_necklace:'ditem_celerity_necklace.png',
  collier_de_celerite:'ditem_celerity_necklace.png',
  colossus_pants:'ditem_colossus_pants.png',
  jambières_du_colosse:'ditem_colossus_pants.png',
  jambieres_du_colosse:'ditem_colossus_pants.png',
  duelist_dagger:'ditem_duelist_dagger.png',
  dague_du_duelliste:'ditem_duelist_dagger.png',
  ember_quiver:'ditem_ember_quiver.png',
  carquois_incendiaire:'ditem_ember_quiver.png',
  frost_quiver:'ditem_frost_quiver.png',
  carquois_de_givre:'ditem_frost_quiver.png',
  guardian_staff:'ditem_guardian_staff.png',
  baton_du_gardien:'ditem_guardian_staff.png',
  leather_boots:'ditem_leather_boots.png',
  bottes_de_cuir:'ditem_leather_boots.png',
  leather_gloves:'ditem_leather_gloves.png',
  gants_de_cuir:'ditem_leather_gloves.png',
  leather_pants:'ditem_leather_pants.png',
  jambieres_de_cuir:'ditem_leather_pants.png',
  leather_shoulders:'ditem_leather_shoulders.png',
  epaulettes_de_cuir:'ditem_leather_shoulders.png',
  leech_bow:'ditem_leech_bow.png',
  arc_du_sangsue:'ditem_leech_bow.png',
  runic_hammer:'ditem_runic_hammer.png',
  marteau_runique:'ditem_runic_hammer.png',
  skullbreaker_axe:'ditem_skullbreaker_axe.png',
  hache_du_brise_crane:'ditem_skullbreaker_axe.png',
  venom_quiver:'ditem_venom_quiver.png',
  carquois_de_venin:'ditem_venom_quiver.png',
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
function toItemAssetPath(file){return file?`${ITEM_BASE}${file}`:null;}

export function resolveDungeonCharacterAsset(definition={}){
  const direct=explicitAssetPath(definition?.artId,CREATURE_BASE);
  if(direct) return direct;
  const explicit=norm(definition?.artId);
  if(explicit&&CHARACTER_FILES[explicit]) return toAssetPath(CHARACTER_FILES[explicit]);
  const name=norm(definition?.name||definition?.id);
  if(CHARACTER_FILES[name]) return toAssetPath(CHARACTER_FILES[name]);
  for(const [key,file] of Object.entries(CHARACTER_FILES)) if(name.includes(key)) return toAssetPath(file);
  return null;
}

export function resolveDungeonItemAsset(definition={}){
  const direct=explicitAssetPath(definition?.artId,ITEM_BASE);
  if(direct) return direct;
  const explicit=norm(definition?.artId);
  if(explicit&&ITEM_FILES[explicit]) return toItemAssetPath(ITEM_FILES[explicit]);
  const identity=norm(definition?.name||definition?.id);
  if(ITEM_FILES[identity]) return toItemAssetPath(ITEM_FILES[identity]);
  for(const [key,file] of Object.entries(ITEM_FILES)) if(identity.includes(key)) return toItemAssetPath(file);
  return null;
}

export function resolveDungeonWorldAsset(kind){return toAssetPath(WORLD_FILES[norm(kind)]||null);}

export function dungeonAssetStyle(url,{position='center',size='cover'}={}){
  if(!url) return '';
  return `background-image:url('${url}');background-position:${position};background-size:${size};background-repeat:no-repeat;`;
}

export {CREATURE_BASE,ITEM_BASE};
