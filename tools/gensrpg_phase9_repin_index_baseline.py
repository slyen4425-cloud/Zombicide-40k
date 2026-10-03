from pathlib import Path

OLD_BLOB="02a052bc231728eb383e17c83e61a958be0ac58c"
NEW_BLOB="f523410e175ee4946059da8e8ee8519295fb63c5"
OLD_SIZE="8169555"
NEW_SIZE="8169430"

changed=[]
for path in sorted(Path("tests").rglob("*.test.cjs")):
    text=path.read_text(encoding="utf-8")
    updated=text.replace(OLD_BLOB,NEW_BLOB).replace(OLD_SIZE,NEW_SIZE)
    if updated!=text:
        path.write_text(updated,encoding="utf-8",newline="")
        changed.append(str(path))

assert len(changed)>=80, f"unexpectedly small baseline migration: {len(changed)} files"
print(f"repinned {len(changed)} test files")
for path in changed:
    print(path)
