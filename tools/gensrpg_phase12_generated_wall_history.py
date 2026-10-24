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
from functools import lru_cache

def _historical_node_env(root):
    # Only the exact Chrome-fix blob is projected to its old bytes. This affects
    # historical rollback subprocesses, never the shipped app or disk index.
    import os
    env=os.environ.copy()
    preload=root/"tests/helpers/gens_chrome_historical_subprocess_view_20261024.cjs"
    env["NODE_OPTIONS"]=" ".join(x for x in [
        env.get("NODE_OPTIONS",""), "--require="+str(preload)
    ] if x)
    return env

@lru_cache(maxsize=1)
def _exact_r09_to_r08():
    from pathlib import Path
    import subprocess
    root=Path(__file__).resolve().parents[1]
    data=subprocess.check_output(["node",str(root/"tools/gensrpg_phase12_r09_wave_extract_apply.cjs"),"--restore-r08"],cwd=root,env=_historical_node_env(root))
    assert blob(data)=="6eeed45a0a12085c1b107ee6c24b49040277ca54", "R09 -> R08 exact rollback required"
    return data

@lru_cache(maxsize=1)
def _exact_r10_to_r09():
    from pathlib import Path
    import subprocess
    root=Path(__file__).resolve().parents[1]
    data=subprocess.check_output(["node",str(root/"tools/gensrpg_phase12_r10_capture_extract_apply.cjs"),"--restore-r09"],cwd=root,env=_historical_node_env(root))
    assert len(data)==2093066 and blob(data)=="4dbe3314d5048f2def404ed674498c0670c04fc1", "R10 -> R09 exact rollback required"
    return data

def historical_r05_view(data):
    # New R11 source is strictly reconstructed via R11→R10→R09 before old snapshot checks.
    # Validate only known, exact subsequent physical index snapshots. In
    # particular R14/R15 must replay to R09 before D9's strict historical
    # gates run; the Node rollback owner enforces every intermediate SHA.
    exact_current={
        "b8ef8dcb497cad94c91094ed008136a5d9800155":2031649,
        "f257bd9e193648dc62cd8a40d510831debfe045a":1934253,
        "b0d0c73292e4374fc4f23e86edffad5c1b39a7b6":1863745,
        "b5a39705baf83e9782695c14bede8b9dde6ddf52":1820094,
        "dab5be5dedfa56c49d76d40a4cb824a0098903f0":1772759,
        "9f35eb833a6ede4b91399854f19bb9bef59f45ab":1729855,
    }
    current_sha=blob(data)
    if current_sha=="cc355585acab68958bd349ffcf8fa0de4eab9b0d":
        # Test-only byte-exact pre-Chrome-fix source view. The physical index
        # and the application storage are never modified.
        from pathlib import Path
        import subprocess
        root=Path(__file__).resolve().parents[1]
        data=subprocess.check_output([
            "python3",str(root/"tests/gens_chrome_hero_recursion_patch_20261024.py"),
            "--reverse-stdout"
        ], input=data, cwd=root)
        current_sha=blob(data)
        assert len(data)==1720766 and current_sha=="260f00aa179c939f9875971ce8a7b", "R16 Chrome rollback not byte-exact"
    if current_sha=="260f00aa179c939f9875971ce8a7b":
        from pathlib import Path
        root=Path(__file__).resolve().parents[1]
        owner=(root/"assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js").read_bytes()
        assert len(data)==1720766 and len(owner)==9158 and blob(owner)=="fe7c0cff03f7e19f49d3c743257c5fe717f40593", "R16 source/owner drift"
        hook=b'<script id="dungeonCore303TimelineRootFix" src="assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js"></script>'
        assert data.count(hook)==1, "R16 historical parser slot drift"
        data=data.replace(hook,b'<script id="dungeonCore303TimelineRootFix">'+owner+b'</script>',1)
        current_sha=blob(data)
        assert len(data)==1729855 and current_sha=="9f35eb833a6ede4b91399854f19bb9bef59f45ab", "R16 historical inverse mismatch"
    if current_sha in exact_current:
        assert len(data)==exact_current[current_sha], "unknown historical index size"
        data=_exact_r10_to_r09()
    if blob(data)=="4dbe3314d5048f2def404ed674498c0670c04fc1":
        data=_exact_r09_to_r08()
    if blob(data)=="6eeed45a0a12085c1b107ee6c24b49040277ca54":
        from gensrpg_phase12_r08_shared_catalog_extract_apply import ROOT as R08_ROOT, REL as R08_REL, restore as r08_restore
        data=r08_restore(data,(R08_ROOT/R08_REL).read_bytes())
    # Exact R07 -> R06 is test-only, before legacy R06/R05/D9 restorations.
    # The active runtime page and published sound asset are never rewritten.
    if blob(data)=="aca31c540d61c81e1504d3b915b034b372103b5b":
        from gensrpg_phase12_r07_magic_audio_extract_apply import ROOT as R07_ROOT, REL, reverse as r07_reverse
        data=r07_reverse(data,(R07_ROOT/REL).read_bytes())
    # History-only inverse of R06 first: the active page remains external.
    # No archived byte signature or original module body is changed.
    if blob(data)=="12fc91df4ee4c7989a172baa96f9790da6dc57f7":
        from gensrpg_phase12_r06_capture_inline_extract_apply import (
            ROOT, NAMES, location, restore, SOURCE_BLOB,
        )
        bodies={location(n):(ROOT/location(n)).read_bytes() for n in NAMES}
        data=restore(data,bodies)
        assert blob(data)==SOURCE_BLOB and len(data)==2782155, "exact R06 -> approved Dungeon checkpoint"
    if blob(data)!=NEW_BLOB:
        return data
    assert data.count(NEW)==1 and data.count(STYLE)==1,"Core079 wall delta must be exact"
    result=data.replace(NEW,OLD,1).replace(STYLE,b"",1)
    assert blob(result)==OLD_BLOB and len(result)==2781436,"only Core079 wall art can differ"
    return result
