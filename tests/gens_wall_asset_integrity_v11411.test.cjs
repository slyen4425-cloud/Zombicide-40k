const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const file=path.join(__dirname,'..','assets','dungeon','creatures','dng_wall_block.jpg');
const bytes=fs.readFileSync(file);

assert.ok(bytes.length>4,'canonical wall JPEG must not be empty');
assert.equal(bytes[0],0xff,'canonical wall JPEG must start with SOI FF');
assert.equal(bytes[1],0xd8,'canonical wall JPEG must start with SOI D8');
assert.equal(bytes[bytes.length-2],0xff,'canonical wall JPEG must end with EOI FF');
assert.equal(bytes[bytes.length-1],0xd9,'canonical wall JPEG must end with EOI D9');

let eoiCount=0;
for(let i=0;i<bytes.length-1;i++)if(bytes[i]===0xff&&bytes[i+1]===0xd9)eoiCount++;
assert.equal(eoiCount,1,'canonical wall JPEG must contain exactly one EOI marker');

console.log(JSON.stringify({scenario:'V114.11 canonical wall JPEG integrity',bytes:bytes.length,soi:true,eoi:true,eoiCount}));
