'use strict';
/* Historical byte reconstruction ONLY. Reverts the exact generated-wall material
   delta to old R05 before comparing immutable Phase9/12 fingerprints. */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
// Current Dungeon Core079 changes wall art only. Historical Capture and
// Phase12 source snapshots must reconstruct their OLD bytes, not pin their
// historical fingerprints to today's unrelated wall-material correction.
// This one audited test-only inverse is gated on the exact new index blob.
function restorePreWallMaterialIndex(index){
  // Test-only reverse of the Dungeon profile save change, before historical R16 checks.
  const start=Buffer.from('function saveGameProfiles(a){\n');
  const finish=Buffer.from('\n}\nfunction activeGameProfileId(){');
  const at=index.indexOf(start);
  if(at>=0){
    const end=index.indexOf(finish,at+start.length);
    assert.ok(end>at,'profile save boundary');
    const body=index.subarray(at+start.length,end).toString('utf8');
    if(body.includes('const profiles=Array.isArray(a)?a:[];')&&body.includes('duplicate_backup_20261024')){
      index=Buffer.concat([index.subarray(0,at+start.length),Buffer.from('  localStorage.setItem(GAME_PROFILES_KEY,JSON.stringify(a||[]));'),index.subarray(end)]);
    }
  }
  // Strict test-only inverse for the independent Chrome startup repair.
  // Restore known old bytes before passing to the existing historical chain.
  index=require('./gens_chrome_hero_recursion_source_view_20261024.cjs')(index);
  index=require('./gens_phase12_r06_capture_source_view_v1.cjs')(index);
  if(hash(index)!=='b33542b033c5afa8a1643d99c56c21dbd4be266c')return index;
  let source=index.toString('utf8');
  const now=`    // Murs générés : même matériau canonique que Dungeon Builder.
    // Les couverts restent des cases de terrain thématique distinctes.
    if(cell.classList.contains("wall")){
      cell.classList.remove("dc079TerrainCover");
      cell.classList.add("dc079WallBlock");
      delete cell.dataset.coverTheme;
      cell.style.backgroundImage='url("assets/dungeon/creatures/dng_wall_block.jpg")';
    }else if(cell.classList.contains("cover")){
      cell.classList.remove("dc079WallBlock");
      cell.classList.add("dc079TerrainCover");
      cell.style.backgroundImage='url("'+cover079(t,r,i)+'")';
      cell.dataset.coverTheme=t;
    }else{
      cell.classList.remove("dc079WallBlock");
      cell.classList.remove("dc079TerrainCover");
      delete cell.dataset.coverTheme;
    }`;
  const old=`    // Les obstacles/couverts ne montrent plus dungeon_wall.png.
    if(cell.classList.contains("wall") || cell.classList.contains("cover")){
      cell.classList.add("dc079TerrainCover");
      cell.style.backgroundImage='url("'+cover079(t,r,i)+'")';
      cell.dataset.coverTheme=t;
    }`;
  const styleNow=`.dc047Cell.dc079WallBlock{
  background-size:cover!important;
  background-position:center!important;
  filter:none!important;
  outline:1px solid rgba(205,181,126,.20)!important;
  outline-offset:-2px!important;
}
`;
  assert.equal(source.split(now).length-1,1,'exact Core079 generated-wall patch must exist once');
  assert.equal(source.split(styleNow).length-1,1,'exact Core079 wall CSS must exist once');
  source=source.replace(now,old).replace(styleNow,'');
  const restored=Buffer.from(source,'utf8');
  assert.equal(hash(restored),'485de2e6a08ffd89e4f1fb9410e40c938774d62f',
    'test-only reversal must restore byte-exact pre-wall Phase12 R05 index');
  return restored;
}

module.exports=restorePreWallMaterialIndex;
