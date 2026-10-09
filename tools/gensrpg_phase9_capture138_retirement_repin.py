#!/usr/bin/env python3
"""Mechanical Phase 2 inventory + active test baseline update after Capture138 exact seam."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parents[1]
oldblob='18627cc0c5fc7945732c8a910504c59ef823b6ae'
newblob='644fc5d0ce5fd195c5496d42cc0204bd1f9a9831'
oldsize='8165398';newsize='8164674'
legacy=base64.b64decode('LyogLS0tLS0tLS0tLSBkw6ltYXJyYWdlIENhcHR1cmUgOiBhcnJpdmUgZGlyZWN0ZW1lbnQgc3VyIEV4cGxvcmVyIC8gSHViIC0tLS0tLS0tLS0gKi8KY29uc3Qgc3RhcnQxMzg9d2luZG93LnN0YXJ0Q29uZmlndXJlZEdhbWU7CndpbmRvdy5zdGFydENvbmZpZ3VyZWRHYW1lPWFzeW5jIGZ1bmN0aW9uKCl7CiAgY29uc3QgY2FwPWlzQ2FwdHVyZUNvbnRleHQxMzgoKTsKICBjb25zdCByZXM9YXdhaXQgc3RhcnQxMzguYXBwbHkodGhpcyxhcmd1bWVudHMpOwogIGlmKGNhcCl7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHRyeXsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2hlZXQiKSYmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzaGVldCIpLnN0eWxlLmRpc3BsYXk9Im5vbmUiKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgibWVudSIpJiYoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIm1lbnUiKS5zdHlsZS5kaXNwbGF5PSJibG9jayIpOwogICAgICAgIHJlbmRlckNhcHR1cmVXb3JsZEh1YigpOwogICAgICAgIGNvbnN0IGh1Yj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY2FwdHVyZUdhbWVIdWIiKTsKICAgICAgICBpZihodWIpe2h1Yi5zdHlsZS5kaXNwbGF5PSJibG9jayI7aHViLnNjcm9sbEludG9WaWV3KHtibG9jazoic3RhcnQifSl9CiAgICAgIH1jYXRjaChlKXt9CiAgICB9LDMwKTsKICB9CiAgcmV0dXJuIHJlczsKfTsKCg==').decode('utf-8')
anchor='/* ---------- traduction propre des éléments ---------- */'
def swap(s,old,new,name):
 n=s.count(old)
 if n!=1:raise AssertionError('%s expected exactly once, found %d in %s'%(name,n,old[:90]))
 return s.replace(old,new,1)
def modify(rel,edits):
 p=root/rel
 original=p.read_text()
 s=original
 for old,new,detail in edits:s=swap(s,old,new,rel+': '+detail)
 if s==original:raise AssertionError('no change '+rel)
 p.write_text(s)
 print('PIN',rel,len(original),'->',len(s))
def repin(rel):
 p=root/rel
 s=p.read_text()
 s=s.replace(oldblob,newblob).replace(oldsize,newsize)
 p.write_text(s)
doc=['docs/GENSRPG_PHASE2_INLINE_OWNERS.json','docs/GENSRPG_PHASE2_STORAGE_OWNERS.json',
     'docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json','docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv']
for p in doc:repin(p)
modify(doc[0],[('Capture context detection, shared turn/start routing and Capture UI cleanup',
                'Capture context detection, turn/target routing and Capture UI cleanup','retire start authority')])
modify(doc[2],[('"inlineSetTimeoutSyntax": 138','"inlineSetTimeoutSyntax": 137','remove 30 ms timer syntax')])
modify(doc[3],[('# distinctGlobals=428 assignments=739 multiOwnerGlobals=114',
                '# distinctGlobals=428 assignments=738 multiOwnerGlobals=113','exact globals'),
               ('startConfiguredGame\t2\tgensDungeonCore01Js','startConfiguredGame\t1\tgensDungeonCore01Js','global chain')])
testroot=root/'tests'
exclude={'gens_phase9_capture138_legacy_start_retirement_v1.test.cjs'}
changed=[]
for p in testroot.glob('*.test.cjs'):
 if p.name in exclude:continue
 s=p.read_text()
 a=s.replace(oldblob,newblob).replace(oldsize,newsize)
 if a!=s:p.write_text(a);changed.append(p.name)
print('Baseline test pins',len(changed))
modify('tests/gens_phase5_module_launch_final_shell_authority_v1.test.cjs',[
  ("['captureFix138','gensDungeonCore01Js']","['gensDungeonCore01Js']",'remove retired global writer')])
modify('tests/gens_phase2_inline_global_last_owner_v11411.test.cjs',[
 ('assert.equal(assignments,739,','assert.equal(assignments,738,','count assignments'),
 ('assert.equal(multiOwnerGlobals,114,','assert.equal(multiOwnerGlobals,113,','count multiple owners'),
 ("['startConfiguredGame',2,'gensDungeonCore01Js']","['startConfiguredGame',1,'gensDungeonCore01Js']",'single historical owner')])
modify('tests/gens_phase5_startconfiguredgame_remaining_chain_preaudit_v1.test.cjs',[
 ("const ids=[\n  'captureFix138',\n  'gensDungeonCore01Js'\n];","const ids=[\n  'gensDungeonCore01Js'\n];",'retired owner'),
 (r'/^startConfiguredGame\t2\tgensDungeonCore01Js$/m',r'/^startConfiguredGame\t1\tgensDungeonCore01Js$/m','last owner row'),
 ("['capture','dungeon']","['dungeon']",'domain'),
 ("// Capture 138: Capture-context post-launch UI work + historical delayed render.\nassert.match(functions.captureFix138,/isCaptureContext138/);\nassert.match(functions.captureFix138,/setTimeout/);\nassert.match(functions.captureFix138,/renderCaptureWorldHub/);",
  "// Capture138 remains loaded for turn, target and creature UI responsibilities, not start.\nconst c138=blockBody('captureFix138');\nassert.match(c138,/isCaptureContext138/);\nassert.match(c138,/captureBattleApplyAbility/);\nassert.doesNotMatch(c138,/window\\.startConfiguredGame\\s*=|const start138=/);",'Capture138 preserved'),
 ("  assignments:2,","  assignments:1,",'report assignment count')])
# Preserve previous Hub-entry oracle: explicitly reverse Capture138 seam BEFORE comparing
# to the immutable old Hub-entry checkpoint; never re-pin the historical checkpoint itself.
p='tests/gens_phase9_capture_hub_entry_owner_transfer_v1.test.cjs'
modify(p,[(" .replace(init,oldBody).replace(load,oldLoad);",
         " .replace(init,oldBody).replace(load,oldLoad)\n .replace('"+anchor+"',Buffer.from('"+'LyogLS0tLS0tLS0tLSBkw6ltYXJyYWdlIENhcHR1cmUgOiBhcnJpdmUgZGlyZWN0ZW1lbnQgc3VyIEV4cGxvcmVyIC8gSHViIC0tLS0tLS0tLS0gKi8KY29uc3Qgc3RhcnQxMzg9d2luZG93LnN0YXJ0Q29uZmlndXJlZEdhbWU7CndpbmRvdy5zdGFydENvbmZpZ3VyZWRHYW1lPWFzeW5jIGZ1bmN0aW9uKCl7CiAgY29uc3QgY2FwPWlzQ2FwdHVyZUNvbnRleHQxMzgoKTsKICBjb25zdCByZXM9YXdhaXQgc3RhcnQxMzguYXBwbHkodGhpcyxhcmd1bWVudHMpOwogIGlmKGNhcCl7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHRyeXsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2hlZXQiKSYmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzaGVldCIpLnN0eWxlLmRpc3BsYXk9Im5vbmUiKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgibWVudSIpJiYoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIm1lbnUiKS5zdHlsZS5kaXNwbGF5PSJibG9jayIpOwogICAgICAgIHJlbmRlckNhcHR1cmVXb3JsZEh1YigpOwogICAgICAgIGNvbnN0IGh1Yj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY2FwdHVyZUdhbWVIdWIiKTsKICAgICAgICBpZihodWIpe2h1Yi5zdHlsZS5kaXNwbGF5PSJibG9jayI7aHViLnNjcm9sbEludG9WaWV3KHtibG9jazoic3RhcnQifSl9CiAgICAgIH1jYXRjaChlKXt9CiAgICB9LDMwKTsKICB9CiAgcmV0dXJuIHJlczsKfTsKCg=='+"','base64').toString('utf8')+'"+anchor+"');",
         'compose byte-exact prior seam inverse')])
p='tests/gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs'
modify(p,[(".replace(newInstall,oldMethod).replace(newLoad,oldLoad);",
         ".replace(newInstall,oldMethod).replace(newLoad,oldLoad)\n  .replace('"+anchor+"',Buffer.from('"+'LyogLS0tLS0tLS0tLSBkw6ltYXJyYWdlIENhcHR1cmUgOiBhcnJpdmUgZGlyZWN0ZW1lbnQgc3VyIEV4cGxvcmVyIC8gSHViIC0tLS0tLS0tLS0gKi8KY29uc3Qgc3RhcnQxMzg9d2luZG93LnN0YXJ0Q29uZmlndXJlZEdhbWU7CndpbmRvdy5zdGFydENvbmZpZ3VyZWRHYW1lPWFzeW5jIGZ1bmN0aW9uKCl7CiAgY29uc3QgY2FwPWlzQ2FwdHVyZUNvbnRleHQxMzgoKTsKICBjb25zdCByZXM9YXdhaXQgc3RhcnQxMzguYXBwbHkodGhpcyxhcmd1bWVudHMpOwogIGlmKGNhcCl7CiAgICBzZXRUaW1lb3V0KCgpPT57CiAgICAgIHRyeXsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2hlZXQiKSYmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzaGVldCIpLnN0eWxlLmRpc3BsYXk9Im5vbmUiKTsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgibWVudSIpJiYoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIm1lbnUiKS5zdHlsZS5kaXNwbGF5PSJibG9jayIpOwogICAgICAgIHJlbmRlckNhcHR1cmVXb3JsZEh1YigpOwogICAgICAgIGNvbnN0IGh1Yj1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY2FwdHVyZUdhbWVIdWIiKTsKICAgICAgICBpZihodWIpe2h1Yi5zdHlsZS5kaXNwbGF5PSJibG9jayI7aHViLnNjcm9sbEludG9WaWV3KHtibG9jazoic3RhcnQifSl9CiAgICAgIH1jYXRjaChlKXt9CiAgICB9LDMwKTsKICB9CiAgcmV0dXJuIHJlczsKfTsKCg=='+"','base64').toString('utf8')+'"+anchor+"');",
         'compose byte-exact historical oracle')])
# The preaudit itself describes an earlier historical state in the classification; keep
# its previous decision text, but its active chain assertions now prove no Capture138 writer.
print('REPIN COMPLETE; only index.html, Phase2 inventories and tests edited.')
