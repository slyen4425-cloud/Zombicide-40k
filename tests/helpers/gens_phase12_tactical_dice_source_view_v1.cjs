"use strict";
const assert=require("node:assert/strict");
// Phase12 strict inverse of the TWO removed native-Dungeon wall seams.
// Reconstruct original V114.11 for legacy byte-identical Dice tests.
module.exports=function originalTacticalDiceSource(activeSource){
  let src=String(activeSource);
  const pairs=[
    [
      'function wallTargets(rt=R){const D=doc(rt);if(!D)return [];return [...(D.querySelectorAll?.(".gtv2Cell.blocked,#drc100Grid .drc100Cell.wall")||[])]}',
      'function wallTargets(rt=R){const D=doc(rt);if(!D)return [];return [...(D.querySelectorAll?.(".gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell")||[])]}'
    ],
    [
      'ensureStyle(rt);preloadWallBitmap(rt);patchHitResolver(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);decorateCombatUi(rt);',
      'ensureStyle(rt);preloadWallBitmap(rt);patchDungeonMapHtml(rt);patchHitResolver(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);decorateCombatUi(rt);'
    ]
  ];
  for(const [current,historical] of pairs){
    assert.equal(src.split(current).length-1,1,'exactly one retired wall seam expected');
    src=src.replace(current,historical);
  }
  return src;
};
