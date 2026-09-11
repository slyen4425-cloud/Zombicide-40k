const PREFIX = 'gensrpg_v2__';

export function storageKey(scope, id = 'default') {
  return `${PREFIX}${scope}__${id}`;
}

export function readJson(scope, id = 'default', fallback = null) {
  try {
    const raw = localStorage.getItem(storageKey(scope, id));
    return raw == null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn('GenSrpG V2 readJson', scope, id, error);
    return fallback;
  }
}

export function writeJson(scope, id = 'default', value) {
  localStorage.setItem(storageKey(scope, id), JSON.stringify(value));
  return value;
}

export function removeJson(scope, id = 'default') {
  localStorage.removeItem(storageKey(scope, id));
}

export function cloneData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
