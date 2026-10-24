'use strict';
/* Static top-level execution inventory of verified production script #29.
 * CI uses actual fetched published html, no full HTML appears in logs.
 */
const fs=require('node:fs'),acorn=require('acorn'),crypto=require('node:crypto');
const html=fs.readFileSync('artifacts/published-index.html','utf8');
function tagEnd(start){
 let quoted='';
 for(let i=start;i<html.length;i++){
  const c=html[i];if(quoted){if(c===quoted)quoted='';continue}
  if(c==="'"||c==='"'){quoted=c;continue}
  if(c==='>')return i+1;
 }return -1;
}
let m,prev=0,idx=0,body='';
const open=/<script(?=[\s>])/gi,close=/<\/script\s*>/gi;
while((m=open.exec(html))){
 if(m.index<prev)continue;
 const end=tagEnd(m.index);close.lastIndex=end;
 const endMatch=close.exec(html);if(!endMatch)break;
 idx++;if(idx===29){body=html.slice(end,endMatch.index);break}
 prev=endMatch.index+endMatch[0].length;open.lastIndex=prev;
}
if(!body)throw Error('No 29 script');
const ast=acorn.parse(body,{ecmaVersion:'latest',sourceType:'script',locations:true,allowReturnOutsideFunction:true});
const name=node=>{
 if(!node)return '';
 switch(node.type){
  case 'Identifier':return node.name;
  case 'MemberExpression':return name(node.object)+'.'+name(node.property);
  case 'CallExpression':return name(node.callee)+'()';
  case 'ChainExpression':return name(node.expression);
  case 'SequenceExpression':return node.expressions.map(name).join(',');
  case 'AssignmentExpression':return name(node.left)+'='+name(node.right);
  case 'LogicalExpression':return name(node.left)+' '+node.operator+' '+name(node.right);
  case 'UnaryExpression':return node.operator+' '+name(node.argument);
  case 'FunctionExpression':return '(function)';
  case 'ArrowFunctionExpression':return '(arrow)';
  default:return node.type;
 }
};
const shorten=s=>s.replace(/\s+/g,' ').trim().slice(0,230);
const skipTypes=new Set(['FunctionDeclaration','ClassDeclaration']);
const statements=ast.body.map((n,i)=>({
 n:i+1,type:n.type,atLine:n.loc.start.line+15891,
 throughLine:n.loc.end.line+15891,
 bytes:n.end-n.start,
 role:n.type==='ExpressionStatement'?name(n.expression):
   n.type==='VariableDeclaration'?n.declarations.map(d=>name(d.id)+(d.init?' <- '+name(d.init):'')).join(', '):
   n.type==='IfStatement'?'IF '+name(n.test):
   n.type==='TryStatement'?'TRY':
   n.type,
 sample:shorten(body.slice(n.start,Math.min(n.end,n.start+400))),
 topLevel:!skipTypes.has(n.type)
}));
const executable=statements.filter(s=>s.topLevel);
const out={publishedCodeScript29Hash:crypto.createHash('sha256').update(body).digest('hex'),bodyBytes:Buffer.byteLength(body),programStatements:statements.length,executableCount:executable.length,executable:executable.map(x=>({n:x.n,type:x.type,atLine:x.atLine,throughLine:x.throughLine,bytes:x.bytes,role:x.role,sample:x.sample})),functionNames:statements.filter(s=>s.type==='FunctionDeclaration').map(s=>({atLine:s.atLine,role:s.role,sample:s.sample.slice(0,95)})).slice(0,20)};
const lookup=['z40kApplyCustomHeroes','loadCustomHeroesMulti','applyCustomHeroesMulti','saveCustomHeroesMulti'];
const details=lookup.map(fn=>{
 const declaration=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name===fn);
 const allReferences=[...body.matchAll(new RegExp('\\\\b'+fn+'\\\\s*\\\\(','g'))].length;
 if(!declaration)return {function:fn,definedInScript:false,references:allReferences};
 const snippet=body.slice(declaration.start,declaration.end);
 return {function:fn,definedInScript:true,atLine:declaration.loc.start.line+15891,
   throughLine:declaration.loc.end.line+15891,bytes:snippet.length,
   excerptStart:snippet.slice(0,3300),excerptEnd:snippet.slice(-350),
   references:allReferences};
});
out.heroChain=details;
console.log('GENSRPG_SCRIPT29_TOPLEVEL '+JSON.stringify(out));
fs.writeFileSync('artifacts/gensrpg-chrome-script29-toplevel.json',JSON.stringify(out,null,2));
