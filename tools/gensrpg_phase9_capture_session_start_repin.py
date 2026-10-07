from pathlib import Path

OLD_BLOB="20381d1df0b10b664d5163f308f909cd7a6e45df"
NEW_BLOB="560966d096134cd58ff4dc6ab2be589cee936ba7"
OLD_SIZE="8166499"
NEW_SIZE="8165614"

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
