from pathlib import Path

ui=Path('assets/dungeon/dungeon-room-content-ui-167831.js')
s=ui.read_text(encoding='utf-8')
old='function removeItem(surface,index){const i=Math.trunc(Number(index));if(i<0||i>=drafts[surface].length)return false;drafts[surface].splice(i,1);renderItems(surface);return true}'
new=old+'\nfunction selectedItems(surface){return (drafts[surface]||[]).map(it=>({itemId:String(it?.itemId||\"\"),qty:Math.max(1,Math.trunc(Number(it?.qty)||1))})).filter(it=>it.itemId)}'
if old not in s: raise SystemExit('UI removeItem marker missing')
s=s.replace(old,new,1)
oldexp='ROOT.DungeonRoomContentUI167831={VERSION,APP_VERSION,RANDOM_ENEMY_ID,RANDOM_ITEM_ID,trapTypes,enemyItems,lootItems,simplify,addItem,removeItem,renderItems,syncTrap,patch,install};'
newexp='ROOT.DungeonRoomContentUI167831={VERSION,APP_VERSION,RANDOM_ENEMY_ID,RANDOM_ITEM_ID,trapTypes,enemyItems,lootItems,simplify,addItem,removeItem,selectedItems,renderItems,syncTrap,patch,install};'
if oldexp not in s: raise SystemExit('UI export marker missing')
s=s.replace(oldexp,newexp,1)
ui.write_text(s,encoding='utf-8')

vis=Path('assets/dungeon/dungeon-room-visual-config-167826.js')
s=vis.read_text(encoding='utf-8')
old='else if(activeObject==="chest")data={rarity:DOC.getElementById("drv167826Rarity")?.value,gold:DOC.getElementById("drv167826Gold")?.value,itemsText:DOC.getElementById("drv167826Items")?.value};'
new='else if(activeObject==="chest"){const modern=ROOT.DungeonRoomContentUI167831?.selectedItems?.("zone");data={rarity:DOC.getElementById("drv167826Rarity")?.value,gold:DOC.getElementById("drv167826Gold")?.value,items:Array.isArray(modern)?modern:parseItems(DOC.getElementById("drv167826Items")?.value||"")};}'
if old not in s: raise SystemExit('zone chest save marker missing')
s=s.replace(old,new,1)
vis.write_text(s,encoding='utf-8')

tpl=Path('assets/dungeon/dungeon-room-template-content-167828.js')
s=tpl.read_text(encoding='utf-8')
old='else if(activeObject==="chest")data={rarity:DOC.getElementById("drtRarity")?.value,gold:DOC.getElementById("drtGold")?.value,itemsText:DOC.getElementById("drtItems")?.value};'
new='else if(activeObject==="chest"){const modern=ROOT.DungeonRoomContentUI167831?.selectedItems?.("template");data={rarity:DOC.getElementById("drtRarity")?.value,gold:DOC.getElementById("drtGold")?.value,items:Array.isArray(modern)?modern:(visualApi()?.parseItems?.(DOC.getElementById("drtItems")?.value||"")||[])};}'
if old not in s: raise SystemExit('template chest save marker missing')
s=s.replace(old,new,1)
tpl.write_text(s,encoding='utf-8')
