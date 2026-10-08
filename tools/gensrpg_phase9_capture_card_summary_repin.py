from pathlib import Path

OLD_BLOB="560966d096134cd58ff4dc6ab2be589cee936ba7"
NEW_BLOB="462abc969e7ac636f8ac4ee54c0d14fe51b83e7d"
OLD_SIZE="8165614"
NEW_SIZE="8165794"

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
