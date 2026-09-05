from pathlib import Path
p=Path('tests/dungeon_authored_runtime_v167839.test.cjs')
s=p.read_text(encoding='utf-8')
old="assert.equal(contentStore['world-authored'].A.mode,'fixed','le contenu exact du modèle doit être copié à la zone lors du premier passage');assert.ok(zoneApply>=1);"
new="assert.equal(contentStore['world-authored'].A.mode,'inherit','une zone liée doit rester en héritage dynamique au premier passage');assert.equal(contentStore['__room_template__']['room-a'].mode,'fixed','le runtime doit lire le modèle de pièce sans le recopier dans la zone');assert.ok(zoneApply>=1);"
if old not in s:
    raise SystemExit('authored runtime inheritance assertion not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
