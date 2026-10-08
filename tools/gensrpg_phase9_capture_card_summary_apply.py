from pathlib import Path

OLD_INDEX_BLOB="560966d096134cd58ff4dc6ab2be589cee936ba7"
NEW_INDEX_BLOB="462abc969e7ac636f8ac4ee54c0d14fe51b83e7d"

index=Path("index.html")
text=index.read_text(encoding="utf-8")

old='''      const meta=(p.heroPool?.length||0)+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" monstres";'''
new='''      const trainerCount=p.heroPool?.length||0;
      const meta=gensContentFamilyForProfile(p)==="creature"
        ? trainerCount+" dresseur"+(trainerCount===1?"":"s")+" · Capture de créatures"
        : trainerCount+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" monstres";'''

assert text.count(old)==1, "unexpected Adventure card summary seam"
text=text.replace(old,new,1)
index.write_text(text,encoding="utf-8",newline="")
