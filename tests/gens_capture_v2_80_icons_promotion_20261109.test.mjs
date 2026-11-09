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

test('the certified UI medallions are added without removing the 80 approved Capture icons',()=>{
 const ids=[
  'core:ui-stat-health-01','core:ui-symbol-energy-01',
  'core:ui-stat-physical-01','core:ui-stat-defense-01',
  'core:ui-symbol-endurance-01','core:ui-stat-speed-01',
  'core:ui-element-fire-01','core:ui-element-water-01',
  'core:ui-element-electric-01','core:ui-element-glace-01',
  'core:ui-element-poison-01','core:ui-element-earth-01',
  'core:ui-element-air-01','core:ui-element-nature-01',
  'core:ui-element-acier-01','core:ui-element-light-01',
  'core:ui-element-shadow-01','core:ui-element-esprit-01'
 ];
 const medallions=cat.assets.filter(a=>a.assetType==='icon'&&a.category==='ui'&&ids.includes(a.id));
 assert.equal(medallions.length,18,'18 new authored icons must be present in the real catalog');
 assert.equal(new Set(medallions.map(a=>a.id)).size,18);
 assert.equal(new Set(medallions.map(a=>a.resource?.file)).size,18);
 for(const item of medallions){
  assert.equal(item.resource.mime,'image/webp');
  const rel=base+'assets/library/'+item.resource.file;
  const bytes=read(rel);
  assert.ok(bytes.length>0,'missing authored medallion: '+rel);
  assert.equal(manifest.get(rel),digest(bytes),'signed transport must match '+rel);
 }
 assert.equal(published.length,80,'new UI icons must not replace approved Capture skill icons');
});
