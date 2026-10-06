# GenSrpG — Phase 9 — Préaudit de la frontière de l’éditeur Survie

Date : 2026-10-06. Validation du lot précédent par Sylvain : « Oui c est fixé , reprend la restructuration en suivant la charte et le plan », à 17:51 Europe/Paris.

## Base et checkpoint

- Dépôt : slyen4425-cloud/Zombicide-40k.
- Base exacte : 7d317cc77683f1c3ce0f5e8696984f8c9b65a2a7.
- Dernier GREEN : checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06.
- Checkpoint de départ : checkpoint/gensrpg-start-phase9-survival-editor-family-boundary-preaudit-2026-10-06.
- Branche : work/gensrpg-phase9-survival-editor-family-boundary-preaudit-2026-10-06.
- main vérifiée et gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663.
- Index vérifié localement contre l’arbre GitHub : 8165926 octets / blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf / SHA-256 e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768.
- Triple CI de base : Architecture+Browser 37485298316, Firefox 37485298290, Tactical dock 37485298338, SUCCESS sur ce SHA.
- Statut : préaudit ouvert ; aucun runtime modifié.

Le fichier local est le résultat vérifié du lot précédent issu du ZIP utilisateur. Son blob égale celui du checkpoint actif. Aucun nouvel accès au HTML de 8 Mo par connecteur ni nouvelle demande de ce même contenu n’est nécessaire.

## Périmètre déclaré avant code

Responsabilité : frontière de sélection, lecture et écriture de l’éditeur natif Survie, propriétaire Shell/éditeur Survie dans le bloc principal. Autorité de famille à réutiliser : gensContentFamilyForProfile() -> GensCaptureV1.isProfile(), déjà validée.

Consommateurs à caractériser : activeSurvivalModId(), setActiveSurvivalMod(), currentSmodProfile(), selectSurvivalModProfile(), et les écritures dépendant de smodEditingId. Vérifier séparément les références de gensFamilyForProfile() ; sa suppression ou modification n’est pas présumée nécessaire.

Mutation de ce préaudit : documents uniquement. Les exécutions de caractérisation utilisent les fonctions exactes du fichier vérifié et la vraie identité Capture ; seuls les ports DOM/navigation peuvent être observés ou simulés, jamais la classification ni le résultat attendu.

Protégés : survivalProfiles() et son filtre GREEN, classifier, identité Capture, seeds, routage et lancement, stockage/migrations, réglages et calculs, mouvement, combat, stats, assets, PWA, quatre modules et laboratoires externes. Aucun schéma ni valeur de gameplay changé.

Risques : profil Capture reconnu comme Survie, édition étrangère, normalisation ou écriture dans un univers Capture, mauvaise sélection active, perte d’un profil Survie valide, incompatibilité historique.

## Questions à résoudre

1. Que renvoie l’éditeur lorsque Capture est actif, avec ou sans ancien style Dungeon ?
2. La liste correcte empêche-t-elle réellement les écritures sur un profil étranger ?
3. Quels écrivains utilisent directement smodEditingId au lieu d’une sélection classée ?
4. Quelle responsabilité native doit recevoir la garde, sans wrapper ni seconde identité ?
5. Quels usages de gensFamilyForProfile() existent dans la composition chargée ?
6. Quel lot TDD minimal préserve Survie et toutes les représentations Capture historiques ?

## Contrôles prévus et suite

Cartographie des fonctions et de leurs consommateurs, VM des sources exactes sur profils Survie/Capture/Dungeon/Manga, observation des lectures/écritures et des appels de sélection, vérification d’empreintes et de l’absence de mutation runtime. Documenter une décision unique sur preuve, puis triple CI du HEAD documentaire et checkpoint GREEN avant tout lot correctif.

L’autonomie Capture de premier niveau reste le but Phase 9. Ce préaudit ne change pas Adventure. Le déplacement et le visuel du PC personnel restent distincts. Phase 8 fermée. Aucun merge ni déploiement main.

## Conclusion exacte du préaudit

Le filtre survivalProfiles() est correct et inchangé. Mais activeSurvivalModId(), setActiveSurvivalMod() et currentSmodProfile() utilisent encore gameStyle différent de dungeon. selectSurvivalModProfile() fixe smodEditingId sans vérifier la famille.

Sept écrivains retrouvent directement cet identifiant sans garde : saveSurvivalModPools(), addSurvivalThreatLevel(), removeSurvivalThreatLevel(), saveSurvivalModIdentity(), saveSurvivalModProgression(), saveSurvivalModRules(), saveSurvivalModWaveRules(). Duplication et suppression utilisent currentSmodProfile(). Corriger uniquement l’identifiant actif ne ferme donc pas toute la frontière.

### Sources et preuve

12 profils / 63 couples profil-action / 31 fonctions exactes / vraie API Capture. Les fixtures contiennent des pools et niveaux retenus ; Capture porte un champ survival résiduel, format à protéger. Les profils neufs sans ce champ devront aussi entrer dans le prochain TDD.

Classifier, chargement, profil actif, normaliseur et saveGameProfiles() sont réels. Les ports DOM, alert/confirmation, rendus et applyGameProfile() sont observés/simulés. La mutation est prouvée par le vrai saveGameProfiles(), avant le port application. Il ne s’agit pas encore d’une preuve de bouton visible dans un navigateur ni d’une corruption personnelle.

| Profil | Famille canonique | ID éditeur actif | Profil lu après ouverture | Sélection native |
| --- | --- | --- | --- | --- |
| game_profile_zombicide_base | survival | game_profile_zombicide_base | game_profile_zombicide_base | admis |
| survival-custom | survival | survival-custom | survival-custom | admis |
| survival-neutral | survival | survival-neutral | survival-neutral | admis |
| game_profile_dungeon_demo | rpg | game_profile_zombicide_base | game_profile_zombicide_base | refusé |
| manga | manga | game_profile_zombicide_base | game_profile_zombicide_base | refusé |
| capture-new | creature | capture-new | capture-new | admis |
| capture-historical | creature | game_profile_zombicide_base | game_profile_zombicide_base | refusé |
| capture-modules | creature | capture-modules | capture-modules | admis |
| capture-survival-style | creature | capture-survival-style | capture-survival-style | admis |
| capture-disabled-modules | creature | capture-disabled-modules | capture-disabled-modules | admis |
| partial-capture | survival | partial-capture | partial-capture | admis |
| string-modules | survival | string-modules | string-modules | admis |

Constat concret : saveSurvivalModIdentity() remplace le nom de Capture neuf par WRONG_SURVIVAL_EDIT et persiste le tableau réel. Les sept écrivains directs peuvent atteindre des profils étrangers lorsque smodEditingId est stale. Les actions de duplication/suppression ont également été caractérisées : le fallback historique peut dupliquer 40K au lieu du profil demandé. Les ports simulés limitent les conclusions aux sélections et à la persistance native chargée, pas à tous les effets de applyGameProfile().

### Ancien helper de famille

gensFamilyForProfile() : une seule occurrence dans l’index, sa déclaration ; aucune référence dans les 39 scripts externes directement référencés par index + preview. Leurs blobs locaux ont été comparés à l’arbre GitHub de base. Aucun appel statique actif trouvé. Le helper retourne encore survival pour Capture sans style ; le vrai routage gensFamilyForProfileId() retourne bien adventure. Sa suppression n’est pas nécessaire au seam ; laisser cette dette inactive présumée hors correctif.

### Décision du prochain lot TDD

Propriétaire unique : éditeur natif Survie, réutilisant gensContentFamilyForProfile(profile)==="survival". Aucun classifier supplémentaire, wrapper, timer ou observer.

1. Garder la classification canonique dans activeSurvivalModId(), setActiveSurvivalMod() et currentSmodProfile(), y compris le fallback de référence.
2. Refuser un identifiant étranger avant modification de smodEditingId dans selectSurvivalModProfile().
3. Ajouter la garde au prédicat natif de recherche des sept écrivains.
4. Refuser la duplication lorsque le profil lu de fallback ne correspond pas à l’identifiant demandé ; tester également suppression et fallback.
5. Ajouter des sentinelles permanentes RED puis GREEN : profils neufs/historiques/modules/contradictoires, flags stricts, Survie valide, sélection étrangère, état stale, paramètres personnalisés enregistrés et relus, sauvegardes étrangères intactes.
6. Traverser le vrai preview mobile/PC : éditeur Survie, sauvegarde, Capture actif, appels natifs de frontière et contrôle des effets sans injection de résultat.
7. Composer strictement les preuves d’empreinte et inversions historiques ; aucun contrat ancien assoupli.

Aucun changement au filtre Survie GREEN, classifier, identité Capture, schema, migration, seed, routage Adventure, moteur ou applyGameProfile(). Le helper de famille reste hors lot.

### Clôture et point de reprise

Diff autorisé : rapport, preuve JSON et CURRENT_WORK uniquement. Runtime inchangé : 8165926 octets / d721d1665ba937b855d8de6c5b59c8d04d4a2bdf. Validation manuelle du classement précédent acquise.

Le HEAD documentaire doit obtenir Architecture+Browser, Firefox wall et Tactical dock SUCCESS avant checkpoint/gensrpg-phase9-survival-editor-family-boundary-preaudit-green-2026-10-06. Résoudre ce checkpoint : absent, terminer la validation ; présent, prendre son SHA exact pour un nouveau lot TDD avec son propre checkpoint de départ et sa branche.

## Reproduction indépendante

Depuis un checkout exact du SHA de base, exécuter ce script avec Node. Il produit artifacts/phase9-survival-editor-preaudit.json et ne modifie pas l’index ou les données réelles de l’application.

```javascript
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=process.cwd();
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const identity=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const profileKey='gensrpg_game_profiles_v1',activeKey='gensrpg_game_profile_active_v1';
const baseId='game_profile_zombicide_base',dungeonId='game_profile_dungeon_demo';
function exactFunction(name){
 const marker='function '+name+'(',start=source.indexOf(marker);
 assert.ok(start>=0,'real owner '+name);const open=source.indexOf('{',start);
 let depth=0,quote=null,escaped=false,line=false,comment=false;
 for(let i=open;i<source.length;i++){
  const c=source[i],n=source[i+1]||'';
  if(line){if(c==='\n')line=false;continue}
  if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote=null;continue}
  if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){comment=true;i++;continue}
  if(c==="'"||c==='"'||c==='\x60'){quote=c;continue}
  if(c==='{')depth++;if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }assert.fail('unterminated '+name);
}
const owners=['loadGameProfilesRaw','saveGameProfiles','loadGameProfiles','activeGameProfileId','setActiveGameProfileId','getActiveGameProfile',
 'gensReferenceSurvivalSettings','gensBlankSurvivalSettings','ensureSurvivalProfileData','gensContentFamilyForProfile','survivalProfiles',
 'gensFamilyForProfile','gensFamilyForProfileId','activeSurvivalModId','activeSurvivalMod','setActiveSurvivalMod','openSurvivalModEditor',
 'currentSmodProfile','currentSmod','selectSurvivalModProfile','checkedSmodPool','readSmodLevels','saveSurvivalModPools',
 'addSurvivalThreatLevel','removeSurvivalThreatLevel','saveSurvivalModIdentity','saveSurvivalModProgression','saveSurvivalModRules',
 'saveSurvivalModWaveRules','duplicateSurvivalModProfile','deleteSurvivalModProfile'];
const gameplay=(profile,modules={})=>({rpgUniverse:{gameplay:{profile,modules}}});
const cases=[
 {id:baseId,gameStyle:'zombicide',builtIn:true,expected:'survival'},
 {id:'survival-custom',gameStyle:'zombicide',expected:'survival'},
 {id:'survival-neutral',expected:'survival'},
 {id:dungeonId,gameStyle:'dungeon',...gameplay('classic'),expected:'rpg'},
 {id:'manga',gameStyle:'dungeon',...gameplay('manga'),expected:'manga'},
 {id:'capture-new',...gameplay('creature'),expected:'creature'},
 {id:'capture-historical',gameStyle:'dungeon',...gameplay('creature'),expected:'creature'},
 {id:'capture-modules',...gameplay('custom',{capture:true,controllableCreatures:true}),expected:'creature'},
 {id:'capture-survival-style',gameStyle:'survival',...gameplay('creature'),expected:'creature'},
 {id:'capture-disabled-modules',...gameplay('creature',{capture:false,controllableCreatures:false}),expected:'creature'},
 {id:'partial-capture',...gameplay('custom',{capture:true,controllableCreatures:false}),expected:'survival'},
 {id:'string-modules',...gameplay('custom',{capture:'true',controllableCreatures:'true'}),expected:'survival'}
];
const seed=cases.map(({expected,...p})=>({...p,name:p.id,desc:'retained',heroPool:['retained-hero'],objectPool:['retained-object'],enemyConfig:{retainedEnemy:2},enemyReserve:{retainedEnemy:4},
 survival:{icon:'S',themeColor:'#111111',xpCap:100,baseActions:3,levels:[{id:'one',name:'one',xp:0},{id:'two',name:'two',xp:10}],rules:{baseHp:3}}}));
function setup(id){
 const values=new Map([[profileKey,JSON.stringify(seed)],[activeKey,id],['gensrpg_dungeon_runtime_v2','retained-dungeon-save'],['gensrpg_capture_battle_current_v1','retained-capture-save']]);
 const writes=[],effects=[],elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{value:id==='smodName'?'WRONG_SURVIVAL_EDIT':id==='smodDesc'?'changed':'4',style:{},querySelector:()=>null});return elements.get(id)};
 const context={console,document:{body:{style:{}},getElementById:el,querySelectorAll:()=>[]},
  localStorage:{getItem:k=>values.get(String(k))??null,setItem:(k,v)=>{values.set(String(k),String(v));writes.push(String(k))},removeItem:k=>{values.delete(String(k));writes.push(String(k))}},
  applyGameProfile:p=>{effects.push({port:'applyGameProfile',id:typeof p==='string'?p:p.id});return true},
  renderSurvivalModEditor:()=>effects.push({port:'renderSurvivalModEditor'}),renderGensFamilyGamesIfVisible:()=>effects.push({port:'renderGensFamilyGamesIfVisible'}),
  showSurvivalModTab:tab=>effects.push({port:'showSurvivalModTab',tab}),
  enemiesForMode:()=>[],gameProfileId:()=> 'new-copy',alert:x=>effects.push({port:'alert',message:x}),confirm:()=>true};
 context.window=context;vm.createContext(context);vm.runInContext(identity,context,{filename:'real-capture-entry.js'});
 vm.runInContext('const GAME_PROFILES_KEY='+JSON.stringify(profileKey)+';const GAME_PROFILE_ACTIVE_KEY='+JSON.stringify(activeKey)+';'+
  'const GAME_PROFILE_BASE_ID='+JSON.stringify(baseId)+';const GAME_PROFILE_DUNGEON_ID='+JSON.stringify(dungeonId)+';const ZOMBICIDE_BASE_PRESET_ID="baseline-waves";let smodEditingId=null;'+
  owners.map(exactFunction).join('\n'),context,{filename:'exact-native-survival-editor-owners.js'});
 return {context,values,writes,effects,snapshot:()=>JSON.stringify([...values.entries()]),get profiles(){return JSON.parse(values.get(profileKey))}};
}
const evidence={baseSha:'7d317cc77683f1c3ce0f5e8696984f8c9b65a2a7',indexBytes:Buffer.byteLength(source),
 indexBlob:crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),owners,cases:[],writes:[]};
for(const item of cases){
 const s=setup(item.id),c=s.context,before=s.snapshot();
 assert.equal(c.gensContentFamilyForProfile(item),item.expected);
 const activeEditorId=c.activeSurvivalModId(),survivalList=Array.from(c.survivalProfiles(),p=>p.id);
 c.openSurvivalModEditor();const selected=c.currentSmodProfile();
 evidence.cases.push({id:item.id,style:item.gameStyle||'',family:item.expected,activeEditorId,currentEditorId:selected?.id,
  libraryContainsActive:survivalList.includes(item.id),legacyFamily:c.gensFamilyForProfile(item),shellFamily:c.gensFamilyForProfileId(item.id),
  writesOnOpen:s.writes.length,sourceFunctionsPreserved:true});
 assert.equal(s.snapshot(),before,'opening/read ports do not persist by themselves');
 const set=setup(baseId);set.context.setActiveSurvivalMod(item.id);
 evidence.cases[evidence.cases.length-1].setActiveAdmits=set.effects.some(e=>e.port==='applyGameProfile');
}
const writers=['saveSurvivalModPools','addSurvivalThreatLevel','removeSurvivalThreatLevel','saveSurvivalModIdentity',
 'saveSurvivalModProgression','saveSurvivalModRules','saveSurvivalModWaveRules','duplicateSurvivalModProfile','deleteSurvivalModProfile'];
for(const item of cases.filter(p=>p.expected==='creature'||p.id==='survival-custom'||p.id===dungeonId)){
 for(const name of writers){
  const s=setup(item.id),before=s.values.get(profileKey);vm.runInContext('smodEditingId='+JSON.stringify(item.id),s.context);
  let error=null;try{s.context[name](0)}catch(e){error=String(e.message)}
  const changed=s.values.get(profileKey)!==before,exists=s.profiles.some(p=>p.id===item.id);
  const after=s.profiles.find(p=>p.id===item.id),prior=seed.find(p=>p.id===item.id);
  evidence.writes.push({id:item.id,family:item.expected,owner:name,persistentWrites:s.writes.length,profilesChanged:changed,
   foreignProfileChanged:JSON.stringify(after)!==JSON.stringify(prior),profileStillExists:exists,
   duplicateFamily:s.profiles.find(p=>p.id==='new-copy')?s.context.gensContentFamilyForProfile(s.profiles.find(p=>p.id==='new-copy')):null,
   applied:s.effects.filter(e=>e.port==='applyGameProfile').map(e=>e.id),error});
 }
}
const newCapture=evidence.cases.find(p=>p.id==='capture-new');
assert.equal(newCapture.libraryContainsActive,false);
assert.equal(newCapture.activeEditorId,'capture-new');
assert.equal(newCapture.currentEditorId,'capture-new');
assert.equal(newCapture.setActiveAdmits,true);
const corruption=evidence.writes.find(p=>p.id==='capture-new'&&p.owner==='saveSurvivalModIdentity');
assert.equal(corruption.foreignProfileChanged,true,'real save owner mutates Capture profile');
assert.ok(corruption.persistentWrites>0);
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts','phase9-survival-editor-preaudit.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({cases:evidence.cases,writers: evidence.writes.length,captureWrites:evidence.writes.filter(p=>p.family==='creature'&&p.profilesChanged).length,
 confirmedCorruption:corruption,indexBytes:evidence.indexBytes,indexBlob:evidence.indexBlob},null,2));
```
