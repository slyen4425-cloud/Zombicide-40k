from pathlib import Path
import re, subprocess, sys

workflow=Path(".github/workflows/gensrpg-architecture-sentinels.yml").read_text(encoding="utf-8")
static=workflow.split("\n  browser-sentinel:",1)[0]
tests=[]
for m in re.finditer(r"node\s+(tests/[A-Za-z0-9_.-]+\.test\.cjs)",static):
    p=m.group(1)
    if p not in tests:
        tests.append(p)

failed=[]
print(f"STATIC_SWEEP_COUNT={len(tests)}")
for i,p in enumerate(tests,1):
    r=subprocess.run(["node",p],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
    if r.returncode:
        tail=" | ".join(r.stderr.strip().splitlines()[-5:])
        print(f"FAIL {i}/{len(tests)} {p} :: {tail}")
        failed.append(p)
print(f"STATIC_SWEEP_FAILED={len(failed)}")
for p in failed:
    print("FAILED_FILE "+p)
sys.exit(1 if failed else 0)
