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
    if _blob(data)!=R01_SHA:
        return data
    assert len(data)==6969593, "R01 size drift"
    js=(Path(root)/"assets/gensrpg/shell/pwa-manifest-dynamic-v1.js").read_bytes()
    assert len(js)==734440 and _blob(js)==BODY_SHA, "R01 PWA IIFE drift"
    assert data.count(TAG)==1, "R01 PWA parser owner missing/duplicate"
    restored=data.replace(TAG,b"<script>"+js+b"</script>",1)
    assert len(restored)==7703979 and _blob(restored)==D9_SHA, "R01 -> D9 test-only restoration drift"
    return restored
