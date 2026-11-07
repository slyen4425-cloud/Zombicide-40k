// Apply the two EXISTING Shell update indicators at Pages build time only.
// No browser runtime or second release authority. Imported helper is shared
// with the canonical service-worker SHA versioner.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {stampShellForCommit} from './version_pwa_release_worker.mjs';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    if(process.argv.length!==4)
      throw Error('Usage: version_pwa_release_shell.mjs <_site/index.html> <40-hex release SHA>');
    const [file,sha]=process.argv.slice(2);
    const before=fs.readFileSync(file,'utf8');
    const after=stampShellForCommit(before,sha);
    fs.writeFileSync(file,after,'utf8');
    console.log('PWA Shell release version:',sha,'two existing version markers only');
  }catch(error){
    console.error('::error::'+error.message);
    process.exitCode=1;
  }
}
