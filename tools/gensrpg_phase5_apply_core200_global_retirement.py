from pathlib import Path
import hashlib

p=Path("index.html")
before=p.read_bytes()

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

assert len(before)==8172742, (len(before), git_blob(before))
assert git_blob(before)=="95f8c96e7e221eb743f7c8013ffa8af499eca1c8"

old=(
    'const startOutside200=window.startConfiguredGame;\n'
    'window.startConfiguredGame=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};\n'
    'const gensDungeonStartConfiguredGame200V1=window.startConfiguredGame;'
)
new=(
    'const startOutside200=window.startConfiguredGame;\n'
    'const gensDungeonStartConfiguredGame200V1=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};'
)

text=before.decode("utf-8")
assert text.count(old)==1, text.count(old)
after=text.replace(old,new,1).encode("utf-8")

assert len(after)==8172687, (len(after), git_blob(after))
assert git_blob(after)=="e56f7b63963d991717e1738c3e5188011276a2b7"
p.write_bytes(after)
