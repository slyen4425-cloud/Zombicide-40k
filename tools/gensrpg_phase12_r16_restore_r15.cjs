'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
// Strict byte-identical inverse of the Core303 physical relocation for R06-R15 historical sentinels.
const PRE='9f35eb833a6ede4b91399854f19bb9bef59f45ab',CURRENT='260f00aa179c939f35188ca854f9875971ce8a7b';
const OWNER='fe7c0cff03f7e19f49d3c743257c5fe717f40593';
const PATH='assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js';
const HOOK='<script id="dungeonCore303TimelineRootFix" src="'+PATH+'"></script>';
const sha=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
function canonicalR15(){
 // Reconstruct the exact pre-Chrome-fix bytes only for historical sentinel
 // comparisons. Never alter the active index, saved data or runtime owner.
 const active=fs.readFileSync('index.html');
 const index=require('../tests/helpers/gens_chrome_hero_recursion_source_view_20261024.cjs')(active).toString('utf8');
 const hash=sha(index);
 if(hash===PRE)return index;
 if(hash!==CURRENT)throw Error('R16 unauthorized source: cannot reconstruct R15');
 const owner=fs.readFileSync(PATH,'utf8');
 if(sha(owner)!==OWNER)throw Error('R16 original Core303 owner changed');
 if(index.split(HOOK).length!==2)throw Error('R16 not exactly one canonical parser slot');
 const rebuilt=index.replace(HOOK,'<script id="dungeonCore303TimelineRootFix">'+owner+'</script>');
 if(Buffer.byteLength(rebuilt)!==1729855||sha(rebuilt)!==PRE)throw Error('R16 rollback not R15 byte-exact');
 return rebuilt;
}
module.exports={canonicalR15};
if(require.main===module){if(process.argv[2]!=='--restore-r15')throw Error('R16 --restore-r15 only');process.stdout.write(canonicalR15())}
