import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',
 import.meta.url),'utf8');
const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',
 import.meta.url),'utf8');
const read=(selector,next)=>{
 const p=css.lastIndexOf(selector);
 assert.ok(p>=0,'selector missing: '+selector);
 return css.slice(p,p+next);
};
test('RPG profile dialogue is smaller yet accessible, mobile landscape touch targets remain >=40px',()=>{
 assert.match(read('/* Real RPG profile presentation',410),
  /#adventure-play-sheet\{[\s\S]*?width:min\(800px/);
 assert.match(css,/#adventure-close-sheet\{[^}]*min-height:44px/);
 assert.match(css,/\.sheet-tabs button\{[^}]*min-height:44px/);
 assert.match(css,/\.sheet-stat-actions button\{[^}]*min-height:40px/);
 assert.match(css,/#adventure-sheet-content\{[^}]*overflow-y:auto/);
});
test('official portraits, readable named statistics and 4 RPG tabs remain',()=>{
 for(const tab of ['hero','team','stats','inventory'])
  assert.match(html,new RegExp('data-adventure-sheet-tab="'+tab+'"'));
 for(const sel of ['.sheet-profile-top','.sheet-portrait-frame',
  '.sheet-stat-grid','.sheet-stat-card','.sheet-vital'])
  assert.ok(css.includes(sel),'important RPG UI missing '+sel);
 assert.match(css,/\.sheet-profile-top\{[^}]*grid-template-columns:minmax\(92px,150px\)/);
 assert.match(css,/\.sheet-stat-grid\{[^}]*minmax\(105px,1fr\)/);
 assert.match(css,/\.sheet-stat-card\{[^}]*padding:8px/);
});
