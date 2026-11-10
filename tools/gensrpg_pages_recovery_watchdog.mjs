// GitHub Pages availability watchdog. Never builds or deploys a second site.
// It may only dispatch the already canonical main.yml publisher after a
// completed failure and a full cooldown. No external assets or settings mutate.
export const PAGES_RETRY_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const isReleaseRun = run =>
  run?.head_branch === 'main' &&
  (run.event === 'push' || run.event === 'workflow_dispatch');
const isActive = run =>
  ['queued', 'pending', 'waiting', 'requested', 'in_progress'].includes(run?.status);
const validSha = sha => /^[a-f0-9]{40}$/.test(sha ?? '');

export function decidePagesRecovery({
  repositorySha, workflowSha, runs, nowMs,
  cooldownMs = PAGES_RETRY_COOLDOWN_MS
}) {
  if (!validSha(repositorySha) || !validSha(workflowSha) ||
      repositorySha !== workflowSha)
    return { retry: false, reason: 'main changed during watchdog; no stale dispatch' };
  if (!Array.isArray(runs) || !Number.isFinite(nowMs) ||
      !Number.isFinite(cooldownMs) || cooldownMs < 12 * 60 * 60 * 1000)
    throw new Error('Invalid Pages watchdog input or insufficient cooldown');
  const publicationRuns = runs.filter(isReleaseRun).sort((a, b) =>
    Date.parse(b.created_at) - Date.parse(a.created_at));
  if (publicationRuns.some(isActive))
    return { retry: false, reason: 'a canonical Pages publication is already active' };
  const forSha = publicationRuns.filter(x => x.head_sha === repositorySha);
  if (forSha.some(x => x.status === 'completed' && x.conclusion === 'success'))
    return { retry: false, reason: 'exact main SHA has already passed HTTPS Pages proof' };
  if (!forSha.length)
    return { retry: false, reason: 'no matching publisher result for current main' };
  const latest = forSha[0];
  if (latest.status !== 'completed' ||
      !['failure', 'timed_out'].includes(latest.conclusion))
    return { retry: false, reason: 'latest publisher result is not a confirmed failure' };
  const when = Date.parse(latest.created_at);
  if (!Number.isFinite(when) || when > nowMs)
    throw new Error('Invalid future/undated Pages deployment result');
  if (nowMs - when < cooldownMs)
    return { retry: false, reason: 'Pages failure cooldown not elapsed' };
  return { retry: true, reason: 'Pages failed on current main; safe timed recovery',
    lastFailedRun: latest.id, sha: repositorySha };
}

async function api(endpoint, token, base) {
  const response = await fetch(base + endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!response.ok)
    throw new Error('GitHub API ' + response.status + ' for ' + endpoint);
  return response;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY || '';
  const token = process.env.GH_TOKEN || '';
  const workflowSha = process.env.GITHUB_SHA || '';
  const base = process.env.GITHUB_API_URL || 'https://api.github.com';
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo) ||
      !token || !validSha(workflowSha))
    throw new Error('Watchdog requires authenticated canonical repository main context');
  const ref = await (await api('/repos/' + repo + '/git/ref/heads/main', token, base)).json();
  const repositorySha = ref?.object?.sha;
  const history = await (await api(
    '/repos/' + repo + '/actions/workflows/main.yml/runs?branch=main&per_page=100',
    token, base
  )).json();
  const assessment = decidePagesRecovery({
    repositorySha, workflowSha, runs: history.workflow_runs,
    nowMs: Date.now()
  });
  console.log('GENSRPG_PAGES_RECOVERY', JSON.stringify(assessment));
  if (!assessment.retry) return;
  // Double-check the moving main ref before dispatch, to avoid a stale run.
  const verified = await (await api('/repos/' + repo + '/git/ref/heads/main', token, base)).json();
  if (verified?.object?.sha !== repositorySha) {
    console.log('GENSRPG_PAGES_RECOVERY: main moved; no dispatch');
    return;
  }
  const response = await fetch(base + '/repos/' + repo +
    '/actions/workflows/main.yml/dispatches', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ref: 'main' })
  });
  if (response.status !== 204)
    throw new Error('Canonical Pages dispatch refused with status ' + response.status);
  console.log('GENSRPG_PAGES_RECOVERY dispatched EXACT canonical publisher main.yml once');
}

// Imported by the pure unit tests without causing any network calls.
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href)
  main().catch(error => { console.error(error); process.exitCode = 1; });
