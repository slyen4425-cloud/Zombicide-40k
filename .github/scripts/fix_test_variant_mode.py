from pathlib import Path
p=Path('tests/dungeon_room_template_content_v167828.test.cjs')
s=p.read_text(encoding='utf-8')
old="zoneApi.saveZoneContent('world-1',added.node.id,{...copied,enemies:[{id:'custom',enemyId:'dng_lich',qty:1,cell:6,role:'enemy'}]});"
new="zoneApi.saveZoneContent('world-1',added.node.id,{...copied,mode:'fixed',enemies:[{id:'custom',enemyId:'dng_lich',qty:1,cell:6,role:'enemy'}]});"
if old not in s:
    raise SystemExit('variant setup marker not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
