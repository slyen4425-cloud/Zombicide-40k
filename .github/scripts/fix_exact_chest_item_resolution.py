from pathlib import Path

p=Path('assets/dungeon/dungeon-zone-content-167824.js')
s=p.read_text(encoding='utf-8')
old='function normalizeItems(v){return Array.isArray(v)?v.map(x=>({itemId:String(x?.itemId||x?.id||""),qty:Math.max(1,Math.trunc(Number(x?.qty)||1))})).filter(x=>x.itemId):[]}'
new='function itemNameKey(v){return String(v||"").trim().toLocaleLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"")}\nfunction resolveRewardItemId(v){const raw=String(v||"").trim();if(!raw)return "";let list=[];try{list=typeof ROOT.dungeonItems==="function"?ROOT.dungeonItems():[]}catch(e){}if(!Array.isArray(list)||!list.length)return raw;const exact=list.find(it=>String(it?.id||"")===raw);if(exact)return String(exact.id);const key=itemNameKey(raw),named=list.find(it=>itemNameKey(it?.name)===key);return String(named?.id||raw)}\nfunction normalizeItems(v){return Array.isArray(v)?v.map(x=>({itemId:resolveRewardItemId(x?.itemId||x?.id||""),qty:Math.max(1,Math.trunc(Number(x?.qty)||1))})).filter(x=>x.itemId):[]}'
if old not in s:
    raise SystemExit('normalizeItems marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('tests/dungeon_zone_content_v167824.test.cjs')
t=p.read_text(encoding='utf-8')
old='const context={console,Math,Date,localStorage:store,setTimeout(){return 1},\n DungeonWorldBuilder167821:'
new='const context={console,Math,Date,localStorage:store,setTimeout(){return 1},\n dungeonItems(){return [{id:"potion_heal",name:"Potion de soin"},{id:"ditem_ash_blade",name:"Lame de Cendre"}]},\n DungeonWorldBuilder167821:'
if old not in t:
    raise SystemExit('context marker not found')
t=t.replace(old,new,1)
needle="assert.equal(api.APP_VERSION,'16.78.24');\n"
extra="assert.equal(api.APP_VERSION,'16.78.24');\nconst byName=api.normalizeContent({mode:'fixed',chests:[{cell:1,items:[{itemId:'Lame de Cendre',qty:1},{itemId:'potion_heal',qty:1}]}]});assert.deepEqual(JSON.parse(JSON.stringify(byName.chests[0].items)),[{itemId:'ditem_ash_blade',qty:1},{itemId:'potion_heal',qty:1}],'reward items must resolve a visible item name or preserve an exact catalog id');\n"
if needle not in t:
    raise SystemExit('app version marker not found')
t=t.replace(needle,extra,1)
# Strengthen opening test by saving a chest item using the visible catalog name and requiring actual id in inventory.
old="api.saveZoneContent('d1','n1',{mode:'fixed',enemies:[{id:'e1',enemyId:'dng_skeleton',qty:2,cell:4,hasKey:true}],chests:[{id:'ch1',cell:5,rarity:'rare',gold:20,items:[{itemId:'potion_heal',qty:2}]}],traps:"
new="api.saveZoneContent('d1','n1',{mode:'fixed',enemies:[{id:'e1',enemyId:'dng_skeleton',qty:2,cell:4,hasKey:true}],chests:[{id:'ch1',cell:5,rarity:'rare',gold:20,items:[{itemId:'Lame de Cendre',qty:1}]}],traps:"
if old not in t:
    raise SystemExit('chest test marker not found')
t=t.replace(old,new,1)
old="assert.equal(heroState.inventory.filter(i=>i.itemId==='potion_heal').length,2,'exact chest items must use existing inventory');"
new="assert.equal(heroState.inventory.filter(i=>i.itemId==='ditem_ash_blade').length,1,'exact chest item names must resolve to the real catalog id before inventory insertion');"
if old not in t:
    raise SystemExit('inventory assertion marker not found')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
