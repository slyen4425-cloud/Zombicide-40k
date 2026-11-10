import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decidePagesRecovery, PAGES_RETRY_COOLDOWN_MS} from '../tools/gensrpg_pages_recovery_watchdog.mjs';

const sha='5d78b992798978f17c115ef3eb91ceb51da98044';
const oldSha='7710c8ca84db058cd9ac2a269ab4f161240d09ee';
const now=Date.parse('2026-11-11T05:00:00Z');
const failed=(id=42835304461, stamp='2026-11-10T14:33:36Z')=>({
 id,status:'completed',conclusion:'failure',head_branch:'main',head_sha:sha,
 event:'push',created_at:stamp
});
const choose=(runs,more={})=>decidePagesRecovery({
 repositorySha:sha, workflowSha:sha, runs, nowMs:now, ...more
});

test('only a completed failed canonical main publication after twelve hours can trigger recovery',()=>{
 const d=choose([failed()]);
 assert.equal(d.retry,true);
 assert.equal(d.sha,sha);
 assert.equal(d.lastFailedRun,42835304461);
 assert.equal(PAGES_RETRY_COOLDOWN_MS,43200000);
});

test('never dispatch during cooldown or while ANY canonical main publisher is running',()=>{
 assert.equal(choose([failed()],{nowMs:Date.parse('2026-11-10T15:01:00Z')}).retry,false);
 assert.equal(choose([failed(),{...failed(8),status:'in_progress',conclusion:null}]).retry,false);
 assert.equal(choose([failed(),{...failed(8),status:'queued',conclusion:null}]).retry,false);
 assert.equal(choose([failed(),{...failed(8),status:'waiting',conclusion:null}]).retry,false);
});

test('no retry for a published SHA, cancelled run, no matching failure or moving branch',()=>{
 assert.equal(choose([failed(),{...failed(9),conclusion:'success'}]).retry,false);
 assert.equal(choose([{...failed(),conclusion:'cancelled'}]).retry,false);
 assert.equal(choose([{...failed(),head_sha:oldSha}]).retry,false);
 assert.equal(choose([failed()],{workflowSha:oldSha}).retry,false);
 assert.equal(choose([]).retry,false);
});

test('non-main / PR events are never treated as production results',()=>{
 assert.equal(choose([{...failed(),event:'pull_request'}]).retry,false);
 assert.equal(choose([{...failed(),head_branch:'work/test'}]).retry,false);
});

test('watchdog workflow is separate, single-owner, guarded, and dispatches only main.yml',()=>{
 const y=readFileSync(new URL('../.github/workflows/gensrpg-pages-recovery-watchdog.yml',import.meta.url),'utf8');
 const publisher=readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
 assert.match(y,/schedule:/);
 assert.match(y,/cron: ['"]?17 1,7,13,19 \* \* \*['"]?/);
 assert.match(y,/actions: write/);
 assert.match(y,/contents: read/);
 assert.match(y,/github\.ref == 'refs\/heads\/main'/);
 assert.match(y,/node tools\/gensrpg_pages_recovery_watchdog\.mjs/);
 assert.doesNotMatch(y,/deploy-pages@|upload-pages-artifact@|gh-pages/);
 assert.equal(publisher.split('actions/deploy-pages@v4').length-1,1);
 const source=readFileSync(new URL('../tools/gensrpg_pages_recovery_watchdog.mjs',import.meta.url),'utf8');
 assert.match(source,/actions\/workflows\/main\.yml\/dispatches/);
 assert.match(source,/body: JSON\.stringify\(\{ ref: 'main' \}\)/);
 assert.doesNotMatch(source,/update-ref|force-push|delete-branch|delete-deployment/);
});
