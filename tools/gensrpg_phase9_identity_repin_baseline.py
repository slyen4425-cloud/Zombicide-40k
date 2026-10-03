from pathlib import Path
import re

OLD_BLOB="f523410e175ee4946059da8e8ee8519295fb63c5"
NEW_BLOB="1d4bd0f6eddb6a58fa0939b666bbebdbb07dc3b1"
OLD_SIZE="8169430"
NEW_SIZE="8168382"

test_changed=[]
for path in sorted(Path("tests").rglob("*.test.cjs")):
    text=path.read_text(encoding="utf-8")
    updated=text.replace(OLD_BLOB,NEW_BLOB).replace(OLD_SIZE,NEW_SIZE)
    if updated!=text:
        path.write_text(updated,encoding="utf-8",newline="")
        test_changed.append(str(path))

doc_changed=[]
for path in sorted(Path("docs").rglob("*")):
    if not path.is_file():
        continue
    try:
        text=path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    lines=text.splitlines(keepends=True)
    updated_lines=[]
    changed=False
    for line in lines:
        if "sourceIndexBlob" in line and OLD_BLOB in line:
            line=line.replace(OLD_BLOB,NEW_BLOB)
            changed=True
        updated_lines.append(line)
    if changed:
        path.write_text("".join(updated_lines),encoding="utf-8",newline="")
        doc_changed.append(str(path))

assert len(test_changed)>=80, f"unexpectedly small test baseline migration: {len(test_changed)}"
assert len(doc_changed)>=3, f"unexpectedly small sourceIndexBlob migration: {len(doc_changed)}"

print(f"repinned {len(test_changed)} test files")
print(f"repinned {len(doc_changed)} sourceIndexBlob docs")
for path in doc_changed:
    print("DOC "+path)
