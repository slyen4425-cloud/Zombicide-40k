import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const yaml=readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');

test('Pages main deployment cannot cancel another and push + dispatch are serialized',()=>{
  const group=yaml.split('\n').find(line=>line.trimStart().startsWith('group: '));
  const cancel=yaml.split('\n').find(line=>line.trimStart().startsWith('cancel-in-progress: '));
  assert.ok(group,'the workflow must declare a release lock');
  assert.ok(group.includes("github.event_name == 'pull_request'"));
  assert.ok(group.includes("format('pages-pr-{0}', github.event.pull_request.number)"));
  assert.ok(group.includes("format('pages-publish-{0}', github.ref)"),
    'push and manual dispatch must serialize by the same ref');
  assert.equal(cancel?.trim(),"cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    'only old PR validation can be cancelled, never production');
  assert.ok(yaml.includes("if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'"));
  assert.equal(yaml.split('actions/deploy-pages@v4').length-1,1,'one publisher only');
  assert.ok(yaml.includes('node --test tests/gensrpg_pages_deploy_serialize_20261109.test.mjs'));
});
