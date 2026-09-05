from pathlib import Path

p=Path('assets/dungeon/dungeon-zone-content-167824.js')
s=p.read_text(encoding='utf-8')
old='if(!el){try{el=ROOT.addDungeonSceneElement?.({kind:"chest",name:"Coffre "+String(c.rarity||"common"),rarity:String(c.rarity||"common"),trapped:false,room,cellIndex:cell,fromMap:true})||null}catch(e){}}if(el){el.cellIndex=cell;'
new='if(!el){try{el=ROOT.addDungeonSceneElement?.({kind:"chest",name:"Coffre "+String(c.rarity||"common"),rarity:String(c.rarity||"common"),trapped:false,room,cellIndex:cell,fromMap:true})||null;if(el&&!all.some(e=>String(e?.id)===String(el.id)))all.push(el)}catch(e){}}if(el){el.cellIndex=cell;'
if old not in s:
    raise SystemExit('syncExactChestScenes marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('tests/dungeon_zone_content_v167824.test.cjs')
t=p.read_text(encoding='utf-8')
# Make scene storage behave like production: every load/save crosses a JSON clone boundary.
old=' loadDungeonSceneElements(){return scenes},saveDungeonSceneElements(v){scenes=v},addDungeonSceneElement(v){const el={id:"scene-"+(++sceneSeq),...v};scenes.push(el);return el},removeDungeonSceneElement(id){scenes=scenes.filter(e=>String(e.id)!==String(id));return true},'
new=' loadDungeonSceneElements(){return JSON.parse(JSON.stringify(scenes))},saveDungeonSceneElements(v){scenes=JSON.parse(JSON.stringify(v))},addDungeonSceneElement(v){const el={id:"scene-"+(++sceneSeq),...v};const next=JSON.parse(JSON.stringify(scenes));next.push(JSON.parse(JSON.stringify(el)));scenes=next;return el},removeDungeonSceneElement(id){scenes=scenes.filter(e=>String(e.id)!==String(id));return true},'
if old not in t:
    raise SystemExit('scene storage mock marker not found')
t=t.replace(old,new,1)
# Strengthen the exact chest assertion.
needle="assert.equal(scenes[0].exactChestId167824,'ch1');"
if needle not in t:
    raise SystemExit('exact chest assertion marker not found')
t=t.replace(needle,needle+"assert.equal(scenes[0].rarity,'rare');",1)
p.write_text(t,encoding='utf-8')
