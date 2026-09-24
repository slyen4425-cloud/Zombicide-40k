from pathlib import Path
import hashlib

ROOT=Path(".")
INDEX=ROOT/"index.html"
OLD_SIZE="8172687"
NEW_SIZE="8172118"
OLD_BLOB="e56f7b63963d991717e1738c3e5188011276a2b7"
NEW_BLOB="198207e3f52730498831f196caa35c4a0283e934"
SCAN_EXEMPT="gens_phase5_capture135_retirement_stale_baseline_scan_v1.test.cjs"

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

data=INDEX.read_bytes()
assert len(data)==int(NEW_SIZE),(len(data),git_blob(data))
assert git_blob(data)==NEW_BLOB,git_blob(data)

changed=[]
for p in sorted((ROOT/"tests").glob("*.test.cjs")):
    if p.name==SCAN_EXEMPT:
        continue
    text=p.read_text(encoding="utf-8")
    new=text.replace(OLD_SIZE,NEW_SIZE).replace(OLD_BLOB,NEW_BLOB)
    if new!=text:
        p.write_text(new,encoding="utf-8")
        changed.append(str(p))

for rel in [
    "docs/GENSRPG_PHASE2_INLINE_OWNERS.json",
    "docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json",
    "docs/GENSRPG_PHASE2_STORAGE_OWNERS.json",
]:
    p=ROOT/rel
    text=p.read_text(encoding="utf-8")
    assert OLD_BLOB in text,(rel,"missing old blob")
    new=text.replace(OLD_BLOB,NEW_BLOB)
    p.write_text(new,encoding="utf-8")
    changed.append(rel)

tsv=ROOT/"docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv"
text=tsv.read_text(encoding="utf-8")
assert "# sourceIndexBlob="+OLD_BLOB in text
assert "assignments=759" in text
assert "startConfiguredGame\t4\tgensDungeonCore01Js" in text
text=text.replace("# sourceIndexBlob="+OLD_BLOB,"# sourceIndexBlob="+NEW_BLOB)
text=text.replace("assignments=759","assignments=758",1)
text=text.replace("startConfiguredGame\t4\tgensDungeonCore01Js","startConfiguredGame\t3\tgensDungeonCore01Js",1)
tsv.write_text(text,encoding="utf-8")
changed.append(str(tsv))

print("REALIGNED_COUNT="+str(len(changed)))
for name in changed:
    print(name)
