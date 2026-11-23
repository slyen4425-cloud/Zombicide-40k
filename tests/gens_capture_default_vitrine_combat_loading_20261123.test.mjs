import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAPTURE_OFFICIAL_BACKGROUND_ART_V1,captureOfficialLoadingArtUrlsV1}
 from '../assets/gensrpg/capture-v2/shell-official-art-v1.mjs';

const read=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');

test('showcase starts with three certified wallpapers and never overwrites a personal background',()=>{
 const creator=read('shell-creator-presentation-v1.mjs');
 assert.equal(CAPTURE_OFFICIAL_BACKGROUND_ART_V1.length,3);
 assert.match(creator,/automaticWallpaper=true/);
 assert.match(creator,/!results\[0\]\?\.blob/);
 assert.match(creator,/AUTO_WALLPAPER_CHOICE_V1/);
 assert.match(creator,/putVisualChoice\(universe,AUTO_WALLPAPER_CHOICE_V1\)/);
 assert.match(creator,/rotateDefaultWallpaper\(\)/);
 assert.match(creator,/if\(!automaticWallpaper\|\|disposed\)return false/);
 assert.match(creator,/await media\.clearVisualChoice\(universe\)/);
 assert.doesNotMatch(creator,/await media\.remove\(universe,'background'\);\s*await media\.putVisualChoice/);
});

test('menu/window navigation rotates only the default, never the chosen personal artwork',()=>{
 const shell=read('shell-entry-v1.js');
 assert.match(shell,/creatorOwner\?\.rotateDefaultWallpaper\?\.\(\)/);
 assert.match(shell,/if\(previousMenu==='creator'\|\|previousMenu==='editors'\)/);
});

test('Combat receives up to twelve actual blob URLs instead of unsupported official HTTPS URLs',()=>{
 const game=read('adventure-app-v1.mjs');
 assert.equal(captureOfficialLoadingArtUrlsV1().length,4);
 assert.match(game,/captureOfficialLoadingArtUrlsV1\(\)\.map\(async source=>/);
 assert.match(game,/await fetch\(source,\{cache:'force-cache'\}\)/);
 assert.match(game,/URL\.createObjectURL\(file\)/);
 assert.match(game,/loadingArtObjectUrls\.add\(localUrl\)/);
 assert.match(game,/\[\.\.\.officialBlobs\.filter\(Boolean\),\.\.\.sequence\]\.slice\(0,12\)/);
 assert.match(game,/url\.searchParams\.set\('loadingArtCombat',JSON\.stringify\(activeLoadingImages\.combat\)\)/);
 assert.match(game,/for\(const value of urls\)URL\.revokeObjectURL\(value\)/);
});

test('existing historical image remains first in every official loading list',()=>{
 const urls=captureOfficialLoadingArtUrlsV1();
 assert.ok(urls[0].includes('file_0000000089ec81f4a7bdfd03220f487c.png'));
 assert.ok(urls[1].includes('file_00000000ee088210a7c5cb3bea4d5068.png'));
 assert.ok(urls[2].includes('file_0000000090d481f48cc94001c7925590.png'));
 assert.ok(urls[3].includes('raiiven_sous_la_lune_violette.png'));
});
