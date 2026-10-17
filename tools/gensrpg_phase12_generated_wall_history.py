"""Test-only exact reversal of the procedural wall-art change for historical Phase12 snapshots.

Do not write the returned bytes back to disk. Runtime retains the NEW material.
This only allows old byte-pinned snapshots to remain immutable/accurate.
"""
import hashlib

NEW_BLOB="b33542b033c5afa8a1643d99c56c21dbd4be266c"
OLD_BLOB="485de2e6a08ffd89e4f1fb9410e40c938774d62f"
def blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

OLD='''    // Les obstacles/couverts ne montrent plus dungeon_wall.png.
    if(cell.classList.contains("wall") || cell.classList.contains("cover")){
      cell.classList.add("dc079TerrainCover");
      cell.style.backgroundImage='url("'+cover079(t,r,i)+'")';
      cell.dataset.coverTheme=t;
    }'''.encode("utf8")
NEW='''    // Murs générés : même matériau canonique que Dungeon Builder.
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
    }'''.encode("utf8")
STYLE='''.dc047Cell.dc079WallBlock{
  background-size:cover!important;
  background-position:center!important;
  filter:none!important;
  outline:1px solid rgba(205,181,126,.20)!important;
  outline-offset:-2px!important;
}
'''.encode("utf8")
def historical_r05_view(data):
    if blob(data)!=NEW_BLOB:
        return data
    assert data.count(NEW)==1 and data.count(STYLE)==1,"Core079 wall delta must be exact"
    result=data.replace(NEW,OLD,1).replace(STYLE,b"",1)
    assert blob(result)==OLD_BLOB and len(result)==2781436,"only Core079 wall art can differ"
    return result
