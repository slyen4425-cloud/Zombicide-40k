const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-grid-capture-167830.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
function cls(on=false){return {contains(v){return v==='on'&&on},set(v){on=!!v}}}
const listeners={capture:null,bubble:null};
const grid={addEventListener(type,fn,capture){if(type==='pointerdown')listeners[capture?'capture':'bubble']=fn},removeEventListener(){}};
const templateToggle={classList:cls(true)},zoneToggle={classList:cls(false)};
const cell={dataset:{drcIndex:'5'},closest(sel){return sel==='[data-drc-index]'?this:null}};
const elements=new Map([['drc100Grid',grid],['drt167828Toggle',templateToggle],['drv167826Toggle',zoneToggle]]);
let opened=0,zoneOpened=0,painted=0;
const document={readyState:'complete',getElementById(id){return elements.get(id)||null},addEventListener(){}};
const room={cells:Array.from({length:9},()=>({object:null}))};room.cells[5].object='chest';
const context={console,document,setTimeout(fn){fn();return 1},DungeonRoomCreator100:{open(){},findRoom(){return room}},DungeonRoomTemplateContent167828:{inferRoomId(){return 'room1'},openEditor(i,obj){assert.equal(i,5);assert.equal(obj,'chest');opened++}},DungeonRoomVisualConfig167826:{activateCell(i){assert.equal(i,5);zoneOpened++}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-room-grid-capture-167830.js'});
const api=context.DungeonRoomGridCapture167830;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.30');assert.equal(typeof listeners.capture,'function','capture listener must be attached before historical paint listener');
listeners.bubble=()=>{painted++};
function fire(){let stopped=false;const ev={target:cell,preventDefault(){},stopPropagation(){stopped=true},stopImmediatePropagation(){stopped=true}};listeners.capture(ev);if(!stopped)listeners.bubble(ev)}
fire();assert.equal(opened,1,'template configuration touch must open editor');assert.equal(painted,0,'historical paint listener must never run while template configuration is active');
templateToggle.classList.set(false);zoneToggle.classList.set(true);fire();assert.equal(zoneOpened,1,'per-zone configuration touch must activate exact cell');assert.equal(painted,0,'historical paint listener must never run while per-zone configuration is active');
zoneToggle.classList.set(false);fire();assert.equal(painted,1,'normal Room Creator painting must remain untouched outside configuration mode');
assert.match(loader,/dungeon-room-grid-capture-167830\.js\?v=167833/,'loader must cache-bust the capture guard with V16.78.33');
assert.match(loader,/dungeon-room-content-ui-167831\.js\?v=167833/,'intuitive UI must load after capture guard');
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-grid-capture-167830.js')),'capture guard must exist in final built site');assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-content-ui-167831.js')),'intuitive UI must exist in final built site')}
console.log('Dungeon Room grid capture V16.78.33 loading regression: OK');
