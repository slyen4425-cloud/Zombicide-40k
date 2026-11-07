// Two-source CLI facade for the ONE canonical official main-history validator.
// Exact certified pins are data; the authoritative verifier rejects branch-only
// SHAs even when a laboratory advances on main.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveCaptureV2PreviewSourcesV1} from './resolve_capture_v2_preview_sources.mjs';
import {assertOfficialMainHistoryPin} from './verify_official_main_pin.mjs';

export function verifyCaptureOfficialLabPinsV1({pins,assertHistory=assertOfficialMainHistoryPin}={}){
 const selected=resolveCaptureV2PreviewSourcesV1(pins);
 for(const name of ['combat','exploration']){
  const entry=pins[name];
  const proof=assertHistory({repository:entry.repository,sha:selected[name]});
  if(proof?.repository!==entry.repository||proof?.pin!==selected[name]||
     proof?.ref!=='refs/heads/main')
   throw new Error('Official '+name+' main-history certification was not proven');
 }
 return selected;
}
const calledDirectly=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(calledDirectly){
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 const selected=verifyCaptureOfficialLabPinsV1({pins});
 for(const [name,sha] of Object.entries(selected))console.log(name+'='+sha);
}
