import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const source='preview-exploration-lab/assets/exploration/objects/animated';
const published='_site/preview/capture-v2-pr225/vendor/exploration-lab/assets/exploration/objects/animated';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const views=['front','three_quarters_left','three_quarters_right'];

test('Pages retains every real windmill/turbine sprite and frame but omits only unused author ZIPs',()=>{
 let originalZipBytes=0;
 for(const kind of ['windmill','wind_turbine'])
  for(const view of views){
   const rel=kind+'/'+view;
   const sourceArchive=join(source,rel,'source.zip');
   const stagedArchive=join(published,rel,'source.zip');
   assert.ok(existsSync(sourceArchive),'source archive must remain in the official Exploration checkout: '+rel);
   assert.equal(existsSync(stagedArchive),false,'author work ZIP must not be sent to browser Pages: '+rel);
   originalZipBytes+=statSync(sourceArchive).size;
   for(const sprite of ['sheet.webp',...Array.from({length:12},(_,i)=>
      'frames/frame_'+String(i).padStart(2,'0')+'.png')]){
    const original=join(source,rel,sprite),stage=join(published,rel,sprite);
    assert.ok(existsSync(original),'original official game sprite: '+original);
    assert.ok(existsSync(stage),'published animation remains available: '+stage);
    assert.equal(sha(stage),sha(original),'never transform or remove authored game imagery: '+stage);
   }
  }
 assert.ok(originalZipBytes>15*1024*1024,
   'recovery must physically omit meaningful non-runtime archive bytes, not feign optimization');
 console.log('PAGES_AUTHOR_ZIP_OMITTED_BYTES',originalZipBytes);
});
