from pathlib import Path

p=Path('assets/dungeon/dungeon-zone-content-167824.js')
s=p.read_text(encoding='utf-8')
old='hp:Number.isFinite(Number(x?.hp))?Math.max(1,Number(x.hp)):null'
new='hp:(x?.hp===null||x?.hp===undefined||x?.hp==="")?null:(Number.isFinite(Number(x.hp))?Math.max(1,Number(x.hp)):null)'
if old not in s:
    raise SystemExit('enemy hp normalizer marker not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')

p=Path('tests/dungeon_zone_content_v167824.test.cjs')
s=p.read_text(encoding='utf-8')
marker="assert.ok(api,'zone content API must load');\n"
extra=marker+"const hpUnset=api.normalizeContent({mode:'fixed',enemies:[{enemyId:'dng_skeleton',hp:null},{enemyId:'dng_ghoul'},{enemyId:'dng_wraith',hp:''},{enemyId:'dng_orc',hp:9}]});assert.equal(hpUnset.enemies[0].hp,null,'null hp must stay unset and use the enemy base HP');assert.equal(hpUnset.enemies[1].hp,null,'missing hp must stay unset');assert.equal(hpUnset.enemies[2].hp,null,'blank hp must stay unset');assert.equal(hpUnset.enemies[3].hp,9,'an explicit authored hp must still be preserved');\n"
if marker not in s:
    raise SystemExit('zone test API marker not found')
p.write_text(s.replace(marker,extra,1),encoding='utf-8')
