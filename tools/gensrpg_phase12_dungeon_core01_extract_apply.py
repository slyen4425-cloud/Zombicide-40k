#!/usr/bin/env python3
"""Phase 12: byte-exact, reversible single-owner Dungeon inline extraction.

Rule 26: the user-supplied index.html was independently checked against the
GitHub source blob and byte length BEFORE authoring this transform.
Only the already-pinned checkout source may be transformed on its work branch.
"""
from pathlib import Path
from gensrpg_phase12_r01_d9_source_view import read_d9_index_view
import argparse
import hashlib

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUTPUT = ROOT / "assets/gensrpg/dungeon/core01-session-ui-v1.js"
SOURCE_LENGTH = 7934204
SOURCE_BLOB = "bf996ec4e748a4927ac6dd57cceaeaf2afcd9441"
TARGET_LENGTH = 7911489
TARGET_BLOB = "2921ebadacf6f660e815d9ff7712e44cd765fbdd"
RUNTIME_LENGTH = 22768
RUNTIME_BLOB = "df36eba9b8a62f806bc50f86f09f53c90608ce07"
START_TAG = b'<script id="gensDungeonCore01Js">'
END_TAG = b'</script>'
EXTERNAL_TAG = b'<script id="gensDungeonCore01Js" src="assets/gensrpg/dungeon/core01-session-ui-v1.js"></script>'

def blob(value):
    return hashlib.sha1(b"blob " + str(len(value)).encode("ascii") + b"\0" + value).hexdigest()

def pinned(data, length, sha, label):
    assert len(data) == length and blob(data) == sha, (
        f"{label} mismatch: {len(data)} bytes / {blob(data)}; expected {length}/{sha}"
    )

def derive(data):
    pinned(data, SOURCE_LENGTH, SOURCE_BLOB, "user-verified source index")
    assert data.count(START_TAG) == 1, "Dungeon owner tag must occur once"
    assert data.count(EXTERNAL_TAG) == 0, "Dungeon owner cannot be double loaded"
    start = data.index(START_TAG)
    ending = data.find(END_TAG, start + len(START_TAG))
    assert ending > start, "Dungeon owner closing tag missing"
    inner = data[start + len(START_TAG):ending]
    pinned(inner, RUNTIME_LENGTH, RUNTIME_BLOB, "extracted Dungeon owner")
    transformed = data[:start] + EXTERNAL_TAG + data[ending + len(END_TAG):]
    pinned(transformed, TARGET_LENGTH, TARGET_BLOB, "transformed index")
    return transformed, inner

def modify_once(text, before, after, label):
    assert text.count(before) == 1, f"{label}: unexpected preimage count {text.count(before)}"
    assert after not in text, f"{label}: target already applied"
    return text.replace(before, after, 1)

BASE = "bf996ec4e748a4927ac6dd57cceaeaf2afcd9441"
NEXT = TARGET_BLOB
PATH_GRAPH = "tests/gens_phase2_runtime_load_graph_v11411.test.cjs"
PATH_COMPOSITION = "tests/gens_runtime_composition_guard_v11411.test.cjs"
PATH_OWNERS = "tests/gens_phase2_inline_owner_manifest_v11411.test.cjs"
PATH_GLOBALS = "tests/gens_phase2_inline_global_last_owner_v11411.test.cjs"

def test_replacements(path):
    if path in (PATH_OWNERS, PATH_GLOBALS):
        return [(BASE,NEXT)]
    if path in (PATH_GRAPH, PATH_COMPOSITION):
        anchor="  'assets/gensrpg/capture/builtin-seed-v1.js?v=1',\n" if path == PATH_COMPOSITION else "  'assets/gensrpg/capture/builtin-seed-v1.js',\n"
        newpath="  'assets/gensrpg/dungeon/core01-session-ui-v1.js',\n"
        replace=[(anchor,anchor+newpath)]
        if path == PATH_GRAPH:
            replace.extend([
                ("size,49,'production composition", "size,50,'production composition"),
                ("allJs.length,107,", "allJs.length,108,"),
                ("phase2Js.length,71,", "phase2Js.length,72,"),
                ("reachable.size,93,", "reachable.size,94,")
            ])
        return replace
    raise ValueError(path)

def touched_tests():
    return [PATH_OWNERS,PATH_GLOBALS,PATH_GRAPH,PATH_COMPOSITION]

def apply():
    source=INDEX.read_bytes()
    target, runtime=derive(source)
    assert not OUTPUT.exists(), "Target Dungeon owner already exists"
    patches={}
    for path in touched_tests():
        original=(ROOT/path).read_text(encoding="utf8")
        updated=original
        for old,new in test_replacements(path):
            updated=modify_once(updated,old,new,path)
        patches[path]=updated
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_bytes(runtime)
    INDEX.write_bytes(target)
    for path, updated in patches.items():
        (ROOT/path).write_text(updated,encoding="utf8")
    verify()

def verify():
    # D2 is an independent downstream physical extraction. Undo only its
    # verified external tag in memory to inspect the immutable D1 state.
    target=read_d9_index_view(INDEX,ROOT)
    d9tag=b'<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'
    if d9tag in target:
        assert target.count(d9tag)==1, "D9 owner once"
        assert len(target)==7703979 and blob(target)=="fce949665fea47a2aa2a535ede7289b06936f986", "D9 index drift"
        d9=(ROOT/"assets/gensrpg/dungeon/core202-content-density-v1.js").read_bytes()
        assert len(d9)==11821 and blob(d9)=="364673f3dd35bfa8be7f378152f775656c9243e2", "D9 body drift"
        target=target.replace(d9tag,b'<script id="dungeonCore202ContentDensity">'+d9+b'</script>',1)
        assert len(target)==7715741 and blob(target)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "restored D8 exact"
    d8tag=b'<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>'
    if d8tag in target:
        assert target.count(d8tag)==1, "D8 owner once"
        assert len(target)==7715741 and blob(target)=="f56dc5bbb368b176509ab16477bd4b24dd000497", "D8 index drift"
        d8=(ROOT/"assets/gensrpg/dungeon/core201-stability-v1.js").read_bytes()
        assert len(d8)==13990 and blob(d8)=="7edf731fd1aa209ec96490fb8e2cb7af04afd627", "D8 body drift"
        target=target.replace(d8tag,b'<script id="dungeonCore201Stability">'+d8+b'</script>',1)
        assert len(target)==7729678 and blob(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 restored drift"
    d7tag=b'<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>'
    if d7tag in target:
        assert target.count(d7tag)==1, "D7 owner once"
        assert len(target)==7729678 and blob(target)=="6e1cb9b82126409b633306b0e77a7e45badb0f79", "D7 index drift"
        d7=(ROOT/"assets/gensrpg/dungeon/core214-single-authority-v1.js").read_bytes()
        assert len(d7)==15795 and blob(d7)=="72481ac3ee62bc67f6c0646eb724baf4a87a2f88", "D7 body drift"
        target=target.replace(d7tag,b'<script id="dungeonCore214SingleAuthority">'+d7+b'</script>',1)
        assert len(target)==7745413 and blob(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "restored D6 drift"
    d6tag=b'<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>'
    if d6tag in target:
        assert target.count(d6tag)==1, "D6 owner only once"
        d6=(ROOT/"assets/gensrpg/dungeon/core213-stability-v1.js").read_bytes()
        assert len(target)==7745413 and blob(target)=="b5271e44dc4c14834a7725a869fb3c12386f2437", "D6 index drifted"
        assert len(d6)==17519 and blob(d6)=="af4bf724315180becd80833af251504130751ad3", "D6 code drifted"
        target=target.replace(d6tag,b'<script id="dungeonCore213Stability">'+d6+b'</script>',1)
    d5tag=b'<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>'
    if d5tag in target:
        assert target.count(d5tag)==1, "D5 owner once"
        d5=(ROOT/"assets/gensrpg/dungeon/core211-consolidation-v1.js").read_bytes()
        assert len(target)==7762879 and blob(target)=="2ad1961efb9733037b7753ffd4a308baa1b00b64", "D5 index drifted"
        assert len(d5)==17511 and blob(d5)=="bba60d921df20a114b489e17f9222e0c4f310871", "D5 external JS drifted"
        target=target.replace(d5tag,b'<script id="dungeonCore211Consolidation">'+d5+b'</script>',1)
    d4tag=b'<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>'
    if d4tag in target:
        assert target.count(d4tag)==1, "D4 owner loaded once"
        d4=(ROOT/"assets/gensrpg/dungeon/core200-rebuild-v1.js").read_bytes()
        assert len(target)==7780333 and blob(target)=="ca15dd7b483963d7bd0767b7b5baca915d17ec43", "D4 index drifted"
        assert len(d4)==55842 and blob(d4)=="5649ae0af69064dde72e6ea28b8dbefd105cb527", "D4 code drifted"
        target=target.replace(d4tag,b'<script id="dungeonCore200Rebuild">'+d4+b'</script>',1)
    d3_external=b'<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>'
    if d3_external in target:
        assert target.count(d3_external)==1, "D3 owner must load once"
        d3=(ROOT/"assets/gensrpg/dungeon/mj72-scene-v1.js").read_bytes()
        assert len(target)==7836124 and blob(target)=="972f0e0be12fac14427853fbcd7abe5233eb5a8c", "D3 index drifted"
        assert len(d3)==27511 and blob(d3)=="8304087b15bbbf5f71c22b7f8c916e0a78b1b905", "D3 code drifted"
        target=target.replace(d3_external,b'<script id="dungeonMj72_2Script">'+d3+b'</script>',1)
    d2_external=b'<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>'
    if d2_external in target:
        assert target.count(d2_external)==1, "D2 owner must load once"
        d2=(ROOT/"assets/gensrpg/dungeon/core051-exploration-polish-v1.js").read_bytes()
        assert len(d2)==47962 and blob(d2)=="d7ec321ffa05b8749de5d7bf9e8264e55b24f919", "D2 external owner drifted"
        assert len(target)==7863589 and blob(target)=="e5f8895495f969597a6c209fcc29afd66b7a0636", "D2 physical index drifted"
        target=target.replace(d2_external,b'<script id="dungeonCore051ExplorationPolish">'+d2+b'</script>',1)
    runtime=OUTPUT.read_bytes()
    pinned(target,TARGET_LENGTH,TARGET_BLOB,"current index")
    pinned(runtime,RUNTIME_LENGTH,RUNTIME_BLOB,"external owner")
    assert target.count(EXTERNAL_TAG)==1
    assert target.count(START_TAG)==0
    restored=target.replace(EXTERNAL_TAG,START_TAG+runtime+END_TAG,1)
    pinned(restored,SOURCE_LENGTH,SOURCE_BLOB,"reconstituted original index")
    assert derive(restored)==(target,runtime)
    for path in touched_tests():
        updated=(ROOT/path).read_text(encoding="utf8")
        for before,after in test_replacements(path):
            if before not in after:
                assert before not in updated, f"{path}: obsolete graph/sha value remains"
            expected_after=after
            if d2_external in read_d9_index_view(INDEX,ROOT):
                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after=("fce949665fea47a2aa2a535ede7289b06936f986" if d9tag in read_d9_index_view(INDEX,ROOT)
                                    else "f56dc5bbb368b176509ab16477bd4b24dd000497" if d8tag in read_d9_index_view(INDEX,ROOT)
                                    else "6e1cb9b82126409b633306b0e77a7e45badb0f79" if d7tag in read_d9_index_view(INDEX,ROOT)
                                    else "b5271e44dc4c14834a7725a869fb3c12386f2437" if d6tag in read_d9_index_view(INDEX,ROOT)
                                    else "2ad1961efb9733037b7753ffd4a308baa1b00b64" if d5tag in read_d9_index_view(INDEX,ROOT)
                                    else "ca15dd7b483963d7bd0767b7b5baca915d17ec43" if d4tag in read_d9_index_view(INDEX,ROOT)
                                    else "972f0e0be12fac14427853fbcd7abe5233eb5a8c"
                                    if d3_external in read_d9_index_view(INDEX,ROOT)
                                    else "e5f8895495f969597a6c209fcc29afd66b7a0636")
                elif path==PATH_GRAPH:
                    for before_count,after_count in [
                        ("size,50,","size,51,"),
                        ("allJs.length,108,","allJs.length,109,"),
                        ("phase2Js.length,72,","phase2Js.length,73,"),
                        ("reachable.size,94,","reachable.size,95,")
                    ]:
                        expected_after=expected_after.replace(before_count,after_count)
                    if d3_external in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,51,","size,52,"),
                            ("allJs.length,109,","allJs.length,110,"),
                            ("phase2Js.length,73,","phase2Js.length,74,"),
                            ("reachable.size,95,","reachable.size,96,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d4tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,52,","size,53,"),
                            ("allJs.length,110,","allJs.length,111,"),
                            ("phase2Js.length,74,","phase2Js.length,75,"),
                            ("reachable.size,96,","reachable.size,97,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d5tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,53,","size,54,"),
                            ("allJs.length,111,","allJs.length,112,"),
                            ("phase2Js.length,75,","phase2Js.length,76,"),
                            ("reachable.size,97,","reachable.size,98,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d6tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,54,","size,55,"),
                            ("allJs.length,112,","allJs.length,113,"),
                            ("phase2Js.length,76,","phase2Js.length,77,"),
                            ("reachable.size,98,","reachable.size,99,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d7tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,55,","size,56,"),
                            ("allJs.length,113,","allJs.length,114,"),
                            ("phase2Js.length,77,","phase2Js.length,78,"),
                            ("reachable.size,99,","reachable.size,100,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d8tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,56,","size,57,"),
                            ("allJs.length,114,","allJs.length,115,"),
                            ("phase2Js.length,78,","phase2Js.length,79,"),
                            ("reachable.size,100,","reachable.size,101,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
                    if d9tag in read_d9_index_view(INDEX,ROOT):
                        for before_count,after_count in [
                            ("size,57,","size,58,"),
                            ("allJs.length,115,","allJs.length,116,"),
                            ("phase2Js.length,79,","phase2Js.length,80,"),
                            ("reachable.size,101,","reachable.size,102,")
                        ]: expected_after=expected_after.replace(before_count,after_count)
            # R01 moved only the independent PWA IIFE. Historical Core01 proof
            # continues to check the exact D9 source via read_d9_index_view.
            # The live manifest tests intentionally pin the NEW physical source
            # and the one additional reachable Shell/PWA owner.
            if blob(INDEX.read_bytes())=="caf31c121d926b7b76b9bb05688fab8f2839814e":
                if path in (PATH_OWNERS,PATH_GLOBALS):
                    expected_after="caf31c121d926b7b76b9bb05688fab8f2839814e"
                elif path==PATH_GRAPH:
                    for former,current in [
                        ("size,58,","size,59,"),
                        ("allJs.length,116,","allJs.length,117,"),
                        ("phase2Js.length,80,","phase2Js.length,81,"),
                        ("reachable.size,102,","reachable.size,103,")
                    ]:
                        expected_after=expected_after.replace(former,current)
            assert updated.count(expected_after)==1, f"{path}: R01 owner graph expected {expected_after!r}; found {updated.count(expected_after)} copies"
    print("Phase 12 verified: exact index rollback, 22768-byte Dungeon owner and four explicit regression-guard updates")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--apply",action="store_true")
    group.add_argument("--verify",action="store_true")
    a=p.parse_args()
    if a.apply: apply()
    else: verify()
