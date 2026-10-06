"""Temporary verified twelve-owner guard transport; no persistent installer."""
from pathlib import Path
import hashlib,json,os,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
BRANCH="work/gensrpg-phase9-survival-editor-canonical-boundary-2026-10-06"
MAIN='e8681f9823573ced8aec59c8ddc47a72b02bc663'
OLD_BLOB='d721d1665ba937b855d8de6c5b59c8d04d4a2bdf'
NEW_BLOB='20381d1df0b10b664d5163f308f909cd7a6e45df'
OLD_SIZE=8165926
NEW_SIZE=8166499
NEW_SHA256='9bace694ada4e3dd3701ebf6803a53df298ed3079150dd366633974f38f3fc1b'
SEAMS=json.loads(r'''[{"count":1,"before":"function activeSurvivalModId(){\n  const p=getActiveGameProfile();\n  if(p&&p.gameStyle!==\"dungeon\")return p.id;\n  return GAME_PROFILE_BASE_ID;\n}","after":"function activeSurvivalModId(){\n  const p=getActiveGameProfile();\n  if(p&&gensContentFamilyForProfile(p)===\"survival\")return p.id;\n  return GAME_PROFILE_BASE_ID;\n}"},{"count":1,"before":"function setActiveSurvivalMod(id){\n  const p=loadGameProfiles().find(x=>String(x.id)===String(id)&&x.gameStyle!==\"dungeon\");\n  if(p)applyGameProfile(p,false);\n}","after":"function setActiveSurvivalMod(id){\n  const p=loadGameProfiles().find(x=>String(x.id)===String(id)&&gensContentFamilyForProfile(x)===\"survival\");\n  if(p)applyGameProfile(p,false);\n}"},{"count":1,"before":"function currentSmodProfile(){\n  const arr=loadGameProfiles();return arr.find(x=>String(x.id)===String(smodEditingId)&&x.gameStyle!==\"dungeon\")||arr.find(x=>x.id===GAME_PROFILE_BASE_ID)\n}","after":"function currentSmodProfile(){\n  const arr=loadGameProfiles();return arr.find(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\")||arr.find(x=>x.id===GAME_PROFILE_BASE_ID&&gensContentFamilyForProfile(x)===\"survival\")\n}"},{"count":1,"before":"function selectSurvivalModProfile(id){smodEditingId=id;setActiveSurvivalMod(id);renderSurvivalModEditor()}","after":"function selectSurvivalModProfile(id){if(!loadGameProfiles().some(x=>String(x.id)===String(id)&&gensContentFamilyForProfile(x)===\"survival\"))return;smodEditingId=id;setActiveSurvivalMod(id);renderSurvivalModEditor()}"},{"count":6,"before":"  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(smodEditingId));if(i<0)return;","after":"  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\");if(i<0)return;"},{"count":1,"before":"  const profiles=loadGameProfiles(),pi=profiles.findIndex(x=>String(x.id)===String(smodEditingId));if(pi<0)return;","after":"  const profiles=loadGameProfiles(),pi=profiles.findIndex(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\");if(pi<0)return;"},{"count":1,"before":"  const profiles=loadGameProfiles(),source=currentSmodProfile();if(!source)return;","after":"  const profiles=loadGameProfiles(),source=currentSmodProfile();if(!source||String(source.id)!==String(smodEditingId))return;"}]''')
MAPS=['docs/GENSRPG_PHASE2_INLINE_OWNERS.json','docs/GENSRPG_PHASE2_STORAGE_OWNERS.json',
 'docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json','docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv']
LINEAGE='tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs'
DOC='docs/GENSRPG_PHASE9_SURVIVAL_EDITOR_CANONICAL_BOUNDARY.md'
CURRENT='docs/GENSRPG_CURRENT_WORK.md'
SCRIPT='tools/gensrpg_phase9_survival_editor_canonical_boundary_apply.py'
WORKFLOW='.github/workflows/gensrpg-phase9-survival-editor-canonical-boundary-apply.yml'
REPORT=Path('/tmp/gensrpg-survival-editor-repin.json')
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def environment():
 assert os.environ['GITHUB_REF_NAME']==BRANCH
 assert git('rev-parse','HEAD')==os.environ['GITHUB_SHA']
 assert git('rev-parse','origin/main')==MAIN
def apply():
 environment()
 original=Path('index.html').read_bytes()
 assert len(original)==OLD_SIZE and blob(original)==OLD_BLOB
 updated=original
 for item in SEAMS:
  a=item['before'].encode();b=item['after'].encode()
  assert updated.count(a)==item['count'] and updated.count(b)==0,'seam drift'
  updated=updated.replace(a,b)
 assert len(updated)==NEW_SIZE and blob(updated)==NEW_BLOB
 assert hashlib.sha256(updated).hexdigest()==NEW_SHA256
 inverse=updated
 for item in reversed(SEAMS):
  a=item['before'].encode();b=item['after'].encode()
  assert inverse.count(b)==item['count']
  inverse=inverse.replace(b,a)
 assert inverse==original,'every original byte must be preserved outside the declared guards'
 changes={'index.html':updated};pins=[]
 for path in sorted(Path('tests').rglob('*.test.cjs')):
  before=path.read_bytes()
  after=before.replace(OLD_BLOB.encode(),NEW_BLOB.encode()).replace(str(OLD_SIZE).encode(),str(NEW_SIZE).encode())
  if after!=before:
   assert after.replace(NEW_BLOB.encode(),OLD_BLOB.encode()).replace(str(NEW_SIZE).encode(),str(OLD_SIZE).encode())==before
   changes[str(path)]=after;pins.append(str(path))
 assert len(pins)>=80,'pin inventory drift'
 for name in MAPS:
  before=Path(name).read_bytes()
  assert before.count(OLD_BLOB.encode())==1
  after=before.replace(OLD_BLOB.encode(),NEW_BLOB.encode(),1)
  assert after.replace(NEW_BLOB.encode(),OLD_BLOB.encode(),1)==before
  changes[name]=after

 # Extend the exact historical rollback composition. Preserve its fixture and old target hashes.
 previous=changes.get(LINEAGE,Path(LINEAGE).read_bytes()).decode()
 marker='// Compose the separately authorized Survival-library seam before the historical'
 assert previous.count(marker)==1
 proof='// Invert the separately declared canonical Survival-editor guard seam first.\n'
 proof+='const editorBoundarySeams='+json.dumps(SEAMS,ensure_ascii=False)+';\n'
 proof+='let beforeEditorBoundary=index;\n'
 proof+='for(const seam of [...editorBoundarySeams].reverse()){\n'
 proof+='  assert.equal(beforeEditorBoundary.split(seam.after).length-1,seam.count,"declared canonical editor guard count");\n'
 proof+='  beforeEditorBoundary=beforeEditorBoundary.split(seam.after).join(seam.before);\n}\n'
 proof+='const editorBoundaryBytes=Buffer.from(beforeEditorBoundary,"utf8");\n'
 proof+='const editorBoundaryBlob=crypto.createHash("sha1").update(Buffer.concat([\n'
 proof+='  Buffer.from("blob "+editorBoundaryBytes.length+"\\0"),editorBoundaryBytes\n])).digest("hex");\n'
 proof+='assert.equal(editorBoundaryBlob,"'+OLD_BLOB+'","inverse editor guards must recover the exact preceding GREEN");\n\n'
 after=previous.replace(marker,proof+marker,1)
 assert after.count('assert.equal(index.split(canonicalLibrary)')==1
 after=after.replace('assert.equal(index.split(canonicalLibrary)','assert.equal(beforeEditorBoundary.split(canonicalLibrary)',1)
 assert after.count('const ownershipRuntime=index.replace(')==1
 after=after.replace('const ownershipRuntime=index.replace(','const ownershipRuntime=beforeEditorBoundary.replace(',1)
 assert '1e3398755beb751786d825047bc60fe1a7179d79' in after
 assert '3d925e4f3760819642b1f48d2ab2d0aba66dbd5c45d6595d0d4d4b1e3d22e7b2' in after
 restored=after.replace(proof,'',1).replace('assert.equal(beforeEditorBoundary.split(canonicalLibrary)','assert.equal(index.split(canonicalLibrary)',1).replace('const ownershipRuntime=beforeEditorBoundary.replace(','const ownershipRuntime=index.replace(',1)
 assert restored==previous,'historical extension must be strictly additive and reversible'
 changes[LINEAGE]=after.encode()
 for name,data in changes.items():Path(name).write_bytes(data)
 REPORT.write_text(json.dumps({'pins':pins,'paths':sorted(changes),'inverseExact':True,'lineageStrict':True},indent=2)+'\n')
 print(json.dumps({'functions':12,'oldBlob':OLD_BLOB,'newBlob':NEW_BLOB,'newBytes':NEW_SIZE,
  'pureFingerprintRepins':len(pins),'historicalProofExtension':LINEAGE,'inverseExact':True},indent=2))
def finalize():
 environment()
 candidate=Path('index.html').read_bytes()
 assert len(candidate)==NEW_SIZE and blob(candidate)==NEW_BLOB
 report=json.loads(REPORT.read_text());run=os.environ['GITHUB_RUN_ID']
 evidence=f'''
## Correctif natif et TDD réel — 2026-10-06

- RED CI permanent : 37496576542 / job 112382541562 / commit 4bd3d77e3b953da183cfec06ba1788da62567bb5 ; échec exact « Capture must not be selected by the Survival editor ».
- Transport contrôlé : https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/{run}.
- Le transport exige RED VM et navigateur sur l’index intact, puis GREEN VM et vrai preview mobile/PC avant le commit runtime.
- Runtime : {NEW_SIZE} octets / {NEW_BLOB} / SHA-256 {NEW_SHA256}. Douze fonctions natives, conditions uniquement, +573 octets. Inverse exact vers le checkpoint de départ.
- Paramètres Survie personnalisés sauvegardés, relus et affichés après reload ; profils Capture neufs/historiques/modules/contradictoires refusés ; état devenu étranger pendant l’édition refusé par les neuf actions natives testées.
- {len(report['pins'])} repins mécaniques taille/blob ; quatre métadonnées repinnées ; preuve historique étendue de façon réversible, fixture et anciens blobs immuables conservés.
- Aucun classifier, identité, filtre de liste, route, seed, schéma, gameplay, renderer, applyGameProfile(), asset, PWA ou autre runtime modifié.
- Script retiré dans ce commit ; workflow retiré ensuite par le coordinateur avant le HEAD final.
- Artefacts gensrpg-survival-editor-tdd : RED et GREEN, données de preuve et captures réelles.

Le transport seul ne constitue pas le GREEN final : Architecture+Browser, Firefox wall et Tactical dock doivent réussir sur le HEAD exact de clôture avant checkpoint/gensrpg-phase9-survival-editor-canonical-boundary-green-2026-10-06. Test manuel ciblé à faire sur ce SHA. Phase 9 reste en cours ; aucun merge/deploy main.
'''
 with Path(DOC).open('a',encoding='utf8',newline='') as f:f.write(evidence)
 header=f'''# PHASE 9 — FRONTIÈRE CANONIQUE ÉDITEUR SURVIE — CORRECTIF INTÉGRÉ — 2026-10-06

Branche : {BRANCH}.
Départ : checkpoint/gensrpg-start-phase9-survival-editor-canonical-boundary-2026-10-06, base 797316634b1354522adee616c637013aad69a1eb.
Dernier GREEN : checkpoint/gensrpg-phase9-survival-editor-family-boundary-preaudit-green-2026-10-06, même base triple SUCCESS.
Point final : checkpoint/gensrpg-phase9-survival-editor-canonical-boundary-green-2026-10-06, uniquement après triple CI SUCCESS du HEAD exact.
main gelée : {MAIN}.

Douze gardes natives classent sélection, lecture, fallback, sept écrivains et duplication stale par l’autorité existante. Corps de règle/rendu inchangés. RED permanent 37496576542 ; transport TDD {run} exige RED VM/navigateur puis GREEN VM/preview mobile-PC avant runtime.

Index : {NEW_SIZE} / {NEW_BLOB} / SHA-256 {NEW_SHA256}, +573 octets et inverse exact. {len(report['pins'])} repins mécaniques, quatre métadonnées et composition stricte de la preuve historique sans fixture/blob/cas assoupli. Paramètres Survie personnalisés sauvegardés/relus, profils étrangers intacts.

Prochaine étape : retirer le workflow temporaire, triple CI du HEAD de clôture, checkpoint final et lien manuel. Si le checkpoint final est absent, finir cette validation ; s’il existe, prendre son SHA pour le prochain préaudit de l’entrée Capture autonome. Phase 9 en cours ; Phase 8 close ; Dungeon PC/visuel et labos distincts. Aucun merge/deploy.

Rapport : [GENSRPG_PHASE9_SURVIVAL_EDITOR_CANONICAL_BOUNDARY.md](GENSRPG_PHASE9_SURVIVAL_EDITOR_CANONICAL_BOUNDARY.md).

---

'''
 Path(CURRENT).write_text(header+Path(CURRENT).read_text(encoding='utf8'),encoding='utf8',newline='')
 Path(SCRIPT).unlink()
 expected=set(report['paths'])|{DOC,CURRENT,SCRIPT}
 actual=set(git('diff','--name-only').splitlines())
 assert actual==expected,'scope drift: '+repr(actual^expected)
 subprocess.check_call(['git','add','--',*sorted(expected)])
 assert set(git('diff','--cached','--name-only').splitlines())==expected
 print(json.dumps({'stagedPaths':len(expected),'guards':12,'scriptRemoved':True,'temporaryWorkflowCleanup':WORKFLOW}))
if __name__=='__main__':
 assert len(sys.argv)==2 and sys.argv[1] in ('apply','finalize')
 {'apply':apply,'finalize':finalize}[sys.argv[1]]()
