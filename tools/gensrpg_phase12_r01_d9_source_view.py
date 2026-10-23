"""Test-only historical source projection R01 -> D9, strictly hash-verified and never persisted."""
from pathlib import Path
import hashlib

D9_SHA="fce949665fea47a2aa2a535ede7289b06936f986"
R01_SHA="caf31c121d926b7b76b9bb05688fab8f2839814e"
BODY_SHA="778e3acf2f77b3c7680bf70a0c6a846b84826235"
TAG=b'<script src="assets/gensrpg/shell/pwa-manifest-dynamic-v1.js"></script>'
def _blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def read_d9_index_view(index_file, root):
    """Current physical D9/R01 index -> byte-exact D9 view solely for legacy --verify."""
    data=Path(index_file).read_bytes()
    # A later owner extraction must first reverse to exact R15 for historical D9 tests.
    if _blob(data)=="260f00aa179c939f35188ca854f9875971ce8a7b":
        import subprocess
        data=subprocess.check_output(["node",str(Path(root)/"tools/gensrpg_phase12_r16_restore_r15.cjs"),"--restore-r15"],cwd=root)
        assert len(data)==1729855 and _blob(data)=="9f35eb833a6ede4b91399854f19bb9bef59f45ab", "R16 → R15 D9 historical normalization is not exact"
    # Exact test-only reversal of a newer procedural wall material change.
    # No writeback: runtime index remains the corrected version.
    from gensrpg_phase12_generated_wall_history import historical_r05_view
    data=historical_r05_view(data)
    if _blob(data)=="485de2e6a08ffd89e4f1fb9410e40c938774d62f":
        from gensrpg_phase12_r05_core_cloud_sync_extract_apply import reverse as r05_reverse
        module=(Path(root)/"assets/gensrpg/core/legacy-cloud-sync-backup-v1.js").read_bytes()
        data=r05_reverse(data,module) # strict R05 -> R04 historical-only
    if _blob(data)=="554bf6100aeb0f40bfc098dc90863af7d2d5e439":
        from gensrpg_phase12_r04_builders_equipment_extract_apply import restore as r04_reverse
        module=(Path(root)/"assets/gensrpg/builders/equipment-library-editor-v1.js").read_bytes()
        data=r04_reverse(data,module) # test-only R04 -> R03 exact restoration
    if _blob(data)=="8faf7af7fced0a1e0724985e85718a0e4a9e673b":
        from gensrpg_phase12_r03_shell_hub_extract_apply import reverse as r03_reverse
        shell=(Path(root)/"assets/gensrpg/shell/legacy-hub-family-ui-v1.js").read_bytes()
        data=r03_reverse(data,shell)  # exact R03 -> R02 historical source, tests only
    if _blob(data)=="062c4cd37634f504cc75ce3329d6e69e19b5f547":
        from gensrpg_phase12_r02_legacy_visual_data_extract_apply import reverse
        js=(Path(root)/"assets/gensrpg/core/legacy-visual-data-v1.js").read_bytes()
        data=reverse(data,js)  # strict R02 -> R01 historical source, test-only
    if _blob(data)!=R01_SHA:
        return data
    assert len(data)==6969593, "R01 size drift"
    js=(Path(root)/"assets/gensrpg/shell/pwa-manifest-dynamic-v1.js").read_bytes()
    assert len(js)==734440 and _blob(js)==BODY_SHA, "R01 PWA IIFE drift"
    assert data.count(TAG)==1, "R01 PWA parser owner missing/duplicate"
    restored=data.replace(TAG,b"<script>"+js+b"</script>",1)
    assert len(restored)==7703979 and _blob(restored)==D9_SHA, "R01 -> D9 test-only restoration drift"
    return restored
