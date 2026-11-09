import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve('_site','preview','capture-v2-pr225');
const read=rel=>readFileSync(join(root,rel));
const digest=b=>createHash('sha256').update(b).digest('hex');
const pin=JSON.parse(readFileSync('tools/capture_v2_pages_preview_pin.json','utf8'));
const base='vendor/exploration-lab/capture-assets/';
const catPath=base+'data/assets/catalog/global-visual-assets.v1.json';
const bridge=JSON.parse(read('bridge-transport-manifest.v1.json'));
const cat=JSON.parse(read(catPath));
const published=cat.assets.filter(a=>a.assetType==='icon'&&a.category==='skill'&&
  a.tags?.includes('future')&&a.tags?.includes('capture')&&
  a.id?.startsWith('pack:capture:icon-skill-'));
const manifest=new Map(bridge.files.map(entry=>[entry.path,entry.sha256]));
test('only the certified 80 approved Capture icons are transported by the canonical visual pin',()=>{
 assert.equal(pin.officialVisuals.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(pin.officialVisuals.ref,'global-assets');
 assert.equal(bridge.assets.repository,pin.officialVisuals.repository);
 assert.equal(bridge.assets.sha,pin.officialVisuals.sha);
 assert.match(pin.officialVisuals.sha,/^[a-f0-9]{40}$/);
 assert.ok(Number.isInteger(pin.officialVisuals.certifiedCiRun)&&pin.officialVisuals.certifiedCiRun>0);
 assert.equal(cat.storage.branch,'global-assets');
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.icons,cat.assets.filter(a=>a.assetType==='icon').length);
 assert.equal(published.length,80,'the complete two user-approved series must exist in the actual Pages catalog');
 assert.equal(new Set(published.map(a=>a.id)).size,80);
 assert.equal(new Set(published.map(a=>a.resource?.file)).size,80);
 assert.equal(published.filter(a=>a.tags.includes('series-1')).length,40);
 assert.equal(published.filter(a=>a.tags.includes('series-2')).length,40);
 assert.equal(bridge.assets.catalogEntries,cat.assets.length);
 assert.equal(manifest.get(catPath),digest(read(catPath)));
 for(const item of published){
  assert.equal(item.resource.mime,'image/webp');
  assert.ok(/^capture\/icons\/skills\/icon_skill_[a-z0-9_]+_01\.webp$/.test(item.resource.file));
  const rel=base+'assets/library/'+item.resource.file;
  const bytes=read(rel);
  assert.equal(statSync(join(root,rel)).size,bytes.length);
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',rel);
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',rel);
  assert.equal(bytes.subarray(12,16).toString('ascii'),'VP8 ',rel);
  assert.equal(bytes.readUInt16LE(26)&0x3fff,128,rel);
  assert.equal(bytes.readUInt16LE(28)&0x3fff,128,rel);
  assert.equal(manifest.get(rel),digest(bytes),'native Pages manifest must verify '+rel);
 }
});
