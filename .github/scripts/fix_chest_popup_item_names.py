from pathlib import Path

p=Path('assets/dungeon/dungeon-zone-content-167824.js')
s=p.read_text(encoding='utf-8')
old='function markCellFloor(x,cell){if(x?.last?.map?.cells?.[cell]&&!["entry","exit","wall"].includes(String(x.last.map.cells[cell])))x.last.map.cells[cell]="floor"}\nfunction openChest(chestId){const ctx=currentContext();if(!ctx||!ctx.hero)return false;const chest=ctx.content.chests.find(c=>c.id===String(chestId));if(!chest||ctx.state.openedChests[chest.id])return false;const itemCount=chest.items.reduce((n,i)=>n+i.qty,0);if(!grantRewards(ctx.hero,chest.gold,chest.items)){try{ROOT.DungeonCore01?.modal?.("⚠️ Coffre non ouvert","La récompense n’a pas pu être enregistrée dans l’inventaire. Le coffre reste disponible.")}catch(e){}return false}ctx.state.openedChests[chest.id]=true;markCellFloor(ctx.x,chest.cell);removeExactChestScene(chest.id);persistSpatial(ctx.x);writeRuntime(ctx.x);try{ROOT.showToast?.("🎁 Coffre ouvert · "+chest.gold+" or · "+itemCount+" objet(s)")}catch(e){}try{ROOT.DungeonCore01?.modal?.("🎁 Coffre ouvert",(chest.gold?chest.gold+" or":"")+(chest.gold&&itemCount?" · ":"")+(itemCount?itemCount+" objet(s) ajouté(s) à l’inventaire":""));ROOT.DungeonCore01?.render?.()}catch(e){}return true}'
new='function rewardItemName(itemId){const id=String(itemId||"");try{const it=(ROOT.dungeonItems?.()||[]).find(x=>String(x?.id||"")===id);if(it?.name)return String(it.name)}catch(e){}return id}\nfunction rewardItemsSummary(items){return normalizeItems(items).map(it=>rewardItemName(it.itemId)+(it.qty>1?" ×"+it.qty:"")).join(" · ")}\nfunction markCellFloor(x,cell){if(x?.last?.map?.cells?.[cell]&&!["entry","exit","wall"].includes(String(x.last.map.cells[cell])))x.last.map.cells[cell]="floor"}\nfunction openChest(chestId){const ctx=currentContext();if(!ctx||!ctx.hero)return false;const chest=ctx.content.chests.find(c=>c.id===String(chestId));if(!chest||ctx.state.openedChests[chest.id])return false;const itemCount=chest.items.reduce((n,i)=>n+i.qty,0),itemSummary=rewardItemsSummary(chest.items);if(!grantRewards(ctx.hero,chest.gold,chest.items)){try{ROOT.DungeonCore01?.modal?.("⚠️ Coffre non ouvert","La récompense n’a pas pu être enregistrée dans l’inventaire. Le coffre reste disponible.")}catch(e){}return false}ctx.state.openedChests[chest.id]=true;markCellFloor(ctx.x,chest.cell);removeExactChestScene(chest.id);persistSpatial(ctx.x);writeRuntime(ctx.x);try{ROOT.showToast?.("🎁 Coffre ouvert"+(chest.gold?" · "+chest.gold+" or":"")+(itemSummary?" · "+itemSummary:""))}catch(e){}try{ROOT.DungeonCore01?.modal?.("🎁 Coffre ouvert",[chest.gold?chest.gold+" or":"",itemSummary].filter(Boolean).join(" · ")||"Coffre vide");ROOT.DungeonCore01?.render?.()}catch(e){}return true}'
if old not in s: raise SystemExit('openChest popup marker missing')
s=s.replace(old,new,1)
oldexp='ROOT.DungeonZoneContent167824={VERSION,APP_VERSION,CONTENT_KEY,normalizeContent,getZoneContent,saveZoneContent,applyCurrentZone,openChest,pickItem,triggerTrap,solvePuzzle,talkNpc,parseRewardItems,rewardItemsText,open,close,install,renderEditor,addEnemy,addChest,addTrap,addPuzzle,addItem,addNpc,remove};'
newexp='ROOT.DungeonZoneContent167824={VERSION,APP_VERSION,CONTENT_KEY,normalizeContent,getZoneContent,saveZoneContent,applyCurrentZone,openChest,pickItem,triggerTrap,solvePuzzle,talkNpc,parseRewardItems,rewardItemsText,rewardItemsSummary,open,close,install,renderEditor,addEnemy,addChest,addTrap,addPuzzle,addItem,addNpc,remove};'
if oldexp not in s: raise SystemExit('API export marker missing')
s=s.replace(oldexp,newexp,1)
p.write_text(s,encoding='utf-8')

p=Path('tests/dungeon_zone_content_v167824.test.cjs')
t=p.read_text(encoding='utf-8')
needle="assert.deepEqual(JSON.parse(JSON.stringify(api.parseRewardItems('potion_heal*2, sword_01 x 3'))),[{itemId:'potion_heal',qty:2},{itemId:'sword_01',qty:3}]);\n"
extra="assert.equal(api.rewardItemsSummary([{itemId:'ditem_ash_blade',qty:1},{itemId:'potion_heal',qty:2}]),'Lame de Cendre · Potion de soin ×2','chest popup must show visible item names and quantities');\n"+needle
if needle not in t: raise SystemExit('test marker missing')
t=t.replace(needle,extra,1)
p.write_text(t,encoding='utf-8')
