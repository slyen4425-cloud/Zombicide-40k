from pathlib import Path
import hashlib
import sys

p=Path("index.html")
before=p.read_bytes()

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

SOURCE_SIZE=8172687
SOURCE_BLOB="e56f7b63963d991717e1738c3e5188011276a2b7"

assert len(before)==SOURCE_SIZE, (len(before),git_blob(before))
assert git_blob(before)==SOURCE_BLOB, git_blob(before)

old=(
    '/* 6) Nouveau jeu = reset du jour / tour monde Capture */\n'
    'const start135=window.startConfiguredGame;\n'
    'if(typeof start135==="function"){\n'
    '  window.startConfiguredGame=async function(){\n'
    '    try{\n'
    '      if(typeof gensCapturePregameMode==="function"&&gensCapturePregameMode()){\n'
    '        const ws=captureWorldState();\n'
    '        ws.day=1;ws.turnIndex=0;ws.round=1;ws.last=null;\n'
    '        if(Array.isArray(ws.history))ws.history=[];\n'
    '        saveCaptureWorldState(ws);\n'
    '      }\n'
    '    }catch(e){console.warn("Reset jour Capture",e)}\n'
    '    return await start135.apply(this,arguments);\n'
    '  };\n'
    '}\n'
)

text=before.decode("utf-8")
assert text.count(old)==1, text.count(old)
after=text.replace(old,"",1).encode("utf-8")

assert len(after)==8172118, (len(after),git_blob(after))
assert git_blob(after)=="198207e3f52730498831f196caa35c4a0283e934", git_blob(after)
assert b'<script id="captureFix135">' in after
assert b'window.captureSelectAllyTarget135=function' in after
assert b'const target135=window.captureBattleSelectDefaultTarget;' in after

print("SOURCE_BYTES="+str(len(before)))
print("SOURCE_BLOB="+git_blob(before))
print("TARGET_BYTES="+str(len(after)))
print("TARGET_BLOB="+git_blob(after))

if "--apply" in sys.argv:
    p.write_bytes(after)
