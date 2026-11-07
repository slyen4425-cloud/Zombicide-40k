// Single Pages build-time cache versioner. Never run in the game browser.
// The immutable published commit SHA is the ONLY release marker; the actual
// service-worker file, gameplay modules and user IndexedDB stay untouched.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export function stampWorkerForCommit(source,sha){
  if(typeof sha!=='string'||!/^[a-f0-9]{40}$/.test(sha))
    throw Error('Invalid immutable release commit SHA');
  if(typeof source!=='string')
    throw Error('Invalid service worker source');
  const versions=[...source.matchAll(/^const CACHE_NAME = "gensrpg-cache-[^"]+";$/gm)];
  if(versions.length!==1)
    throw Error('Exactly one root cache version owner is required');
  if(!source.includes('name.startsWith("gensrpg-cache-")&&name!==CACHE_NAME'))
    throw Error('Unsafe PWA cache cleanup: release would delete preview caches');
  const name='gensrpg-cache-release-'+sha.slice(0,12);
  return source.replace(versions[0][0],'const CACHE_NAME = "'+name+'";');
}

/**
 * Immutable public Shell release identity. The old installed PWA checks the
 * HTTP <meta> against Z40K_APP_VERSION. They used to stay equal for every
 * deployment, hiding the update banner despite a changed service worker.
 *
 * Change exactly those two EXISTING markers in the built _site HTML only.
 * Never touch index.html source, a game module, its data or user storage.
 */
export function stampShellForCommit(source,sha){
  if(typeof sha!=='string'||!/^[a-f0-9]{40}$/.test(sha))
    throw Error('Invalid immutable shell release commit SHA');
  if(typeof source!=='string')throw Error('Invalid PWA Shell version source');
  const meta=[...source.matchAll(/<meta name="z40k-app-version" content="([^"]+)">/g)];
  const runtime=[...source.matchAll(/const Z40K_APP_VERSION = "([^"]+)";/g)];
  if(meta.length!==1||runtime.length!==1||meta[0][1]!==runtime[0][1])
    throw Error('Exactly one matching pair of PWA Shell version markers is required');
  const release='gensrpg-release-'+sha.slice(0,12);
  return source
    .replace(meta[0][0],'<meta name="z40k-app-version" content="'+release+'">')
    .replace(runtime[0][0],'const Z40K_APP_VERSION = "'+release+'";');
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    if(process.argv.length!==4)
      throw Error('Usage: version_pwa_release_worker.mjs <_site/service-worker.js> <40-hex release SHA>');
    const [file,sha]=process.argv.slice(2);
    const original=fs.readFileSync(file,'utf8');
    const updated=stampWorkerForCommit(original,sha);
    fs.writeFileSync(file,updated,'utf8');
    console.log('PWA release worker:',sha,'single isolated cache namespace');
  }catch(error){
    console.error('::error::'+error.message);
    process.exitCode=1;
  }
}
