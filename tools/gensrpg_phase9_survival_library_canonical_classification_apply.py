"""One-shot transport of the verified single-predicate seam; removed before runtime commit."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
BRANCH = 'work/gensrpg-phase9-survival-library-canonical-classification-2026-10-06'
MAIN = 'e8681f9823573ced8aec59c8ddc47a72b02bc663'
OLD_BLOB = '1e3398755beb751786d825047bc60fe1a7179d79'
NEW_BLOB = 'd721d1665ba937b855d8de6c5b59c8d04d4a2bdf'
OLD_SIZE = 8165906
NEW_SIZE = 8165926
NEW_SHA256 = 'e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768'
OLD = b'function survivalProfiles(){\n  return loadGameProfiles().filter(p=>p.gameStyle!=="dungeon").map(ensureSurvivalProfileData);\n}'
NEW = b'function survivalProfiles(){\n  return loadGameProfiles().filter(p=>gensContentFamilyForProfile(p)==="survival").map(ensureSurvivalProfileData);\n}'
MAPS = [
    'docs/GENSRPG_PHASE2_INLINE_OWNERS.json',
    'docs/GENSRPG_PHASE2_STORAGE_OWNERS.json',
    'docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json',
    'docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv',
]
DOC = 'docs/GENSRPG_PHASE9_SURVIVAL_LIBRARY_CANONICAL_CLASSIFICATION.md'
CURRENT = 'docs/GENSRPG_CURRENT_WORK.md'
SCRIPT = 'tools/gensrpg_phase9_survival_library_canonical_classification_apply.py'
WORKFLOW = '.github/workflows/gensrpg-phase9-survival-library-canonical-classification-apply.yml'
REPORT = Path('/tmp/gensrpg-phase9-survival-library-repin.json')


def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()


def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def verify_environment():
    assert os.environ['GITHUB_REF_NAME'] == BRANCH, 'transport branch drift'
    assert git('rev-parse', 'HEAD') == os.environ['GITHUB_SHA'], 'checkout drift'
    assert git('rev-parse', 'origin/main') == MAIN, 'main freeze drift'


def apply():
    verify_environment()
    original = Path('index.html').read_bytes()
    assert len(original) == OLD_SIZE and blob(original) == OLD_BLOB, 'verified index baseline drift'
    assert original.count(OLD) == 1 and original.count(NEW) == 0, 'owner seam drift'
    updated = original.replace(OLD, NEW, 1)
    assert len(updated) == NEW_SIZE and blob(updated) == NEW_BLOB, 'candidate fingerprint drift'
    assert hashlib.sha256(updated).hexdigest() == NEW_SHA256
    assert updated.replace(NEW, OLD, 1) == original, 'inverse diff must recover every original byte'

    changes = {'index.html': updated}
    pins = []
    for path in sorted(Path('tests').rglob('*.test.cjs')):
        before = path.read_bytes()
        after = before.replace(OLD_BLOB.encode(), NEW_BLOB.encode()).replace(str(OLD_SIZE).encode(), str(NEW_SIZE).encode())
        if after != before:
            assert after.replace(NEW_BLOB.encode(), OLD_BLOB.encode()).replace(str(NEW_SIZE).encode(), str(OLD_SIZE).encode()) == before, 'non-mechanical test migration: ' + str(path)
            changes[str(path)] = after
            pins.append(str(path))
    assert len(pins) >= 80, 'unexpected baseline pin inventory'
    for name in MAPS:
        before = Path(name).read_bytes()
        assert before.count(OLD_BLOB.encode()) == 1, 'source metadata drift: ' + name
        after = before.replace(OLD_BLOB.encode(), NEW_BLOB.encode(), 1)
        assert after.replace(NEW_BLOB.encode(), OLD_BLOB.encode(), 1) == before
        changes[name] = after
    for name, data in changes.items():
        Path(name).write_bytes(data)
    REPORT.write_text(json.dumps({'pins': pins, 'paths': sorted(changes), 'inverseExact': True}, indent=2) + '\n')
    print(json.dumps({'oldBlob': OLD_BLOB, 'newBlob': NEW_BLOB, 'newBytes': NEW_SIZE,
                      'runtimePredicateChanges': 1, 'testPinsOnly': len(pins), 'metadataOnly': MAPS, 'inverseExact': True}, indent=2))


def finalize():
    verify_environment()
    candidate = Path('index.html').read_bytes()
    assert len(candidate) == NEW_SIZE and blob(candidate) == NEW_BLOB
    report = json.loads(REPORT.read_text())
    run = os.environ['GITHUB_RUN_ID']
    evidence = f'''
## Correctif intégré et preuve TDD réelle — 2026-10-06

- RED CI permanent : commit 15a637a92c37bfaed7a810e9b6a6fbc92d345b5e, Architecture 37481119855, job 112329182345. Échec exact sur l'appartenance de quatre variantes Capture à Survie ; autres identités/routages corrects.
- Transport ponctuel : run {run}, https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/{run}.
- Ce run exige le RED VM et le RED navigateur sur l'index intact, puis GREEN VM et vrai preview.html mobile/PC avant de produire le commit runtime.
- Nouveau runtime : {NEW_SIZE} octets, blob {NEW_BLOB}, SHA-256 {NEW_SHA256}.
- Diff runtime : une seule condition dans survivalProfiles(), +20 octets ; inversion exacte vers l'index utilisateur vérifiée.
- La logique de classification, les normaliseurs, renderers, profils, paramètres et quatre runtimes ne sont pas modifiés.
- {len(report['pins'])} fichiers de tests ont seulement leurs empreintes taille/blob repinnées. Quatre métadonnées de cartographie sont repinnées ; aucune assertion de comportement n'est assouplie.
- Le script de transport se retire dans le commit runtime. Le coordinateur retire le workflow ponctuel avec le connecteur avant la triple CI finale ; aucun installateur permanent ajouté.
- Preuves navigateur dans l'artefact gensrpg-survival-library-tdd : membership, stockage, rechargement, sélection Capture et captures des vraies listes.

Le raccord VM couvre 17 profils : 8 Survie, 5 Capture, 4 Dungeon/Manga. Le vrai preview couvre les deux listes sur mobile et PC, rafraîchissement, rechargement, invariance des profils/du profil actif/des sauvegardes avant sélection, puis sélection réelle de Capture via le propriétaire V155 existant. Le chemin actif reste Capture et ne crée pas de runtime Dungeon.

Point de reprise final : checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06. Ce checkpoint est créé uniquement sur le SHA exact dont Architecture+Browser, Firefox wall et Tactical dock terminent tous SUCCESS ; le run de transport seul ne constitue pas ce GREEN final.

Le lien manuel de clôture est fourni sur le SHA validé de preview.html. Le test utilisateur ciblé reste ouvert. Phase 9 non close : autonomie Capture de premier niveau et autres résidus restent distincts. main demeure {MAIN}, sans merge ni déploiement.
'''
    with Path(DOC).open('a', encoding='utf-8', newline='') as handle:
        handle.write(evidence)
    header = f'''# PHASE 9 — BIBLIOTHÈQUE SURVIE — CORRECTIF INTÉGRÉ / VALIDATION FINALE — 2026-10-06

Branche : `{BRANCH}`.
Checkpoint de départ : `checkpoint/gensrpg-start-phase9-survival-library-canonical-classification-2026-10-06`, base `b3186266b726b649f7010ca831fe3cfcbc1668df`.
Dernier GREEN avant ce lot : `checkpoint/gensrpg-phase9-capture-library-family-classification-preaudit-green-2026-10-06`, même SHA, triple CI SUCCESS.
Point de reprise final : `checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06` ; créé uniquement après triple CI SUCCESS sur le SHA exact candidat.
Production main gelée : `{MAIN}`.

## Résultat et preuve

`survivalProfiles()` utilise désormais la famille canonique survival. Capture neuf/historique/par modules/contradictoire est exclu de Survie ; son routage Adventure actuel est préservé. Aucune logique Capture, migration, renderer, normaliseur, wrapper, timer ou couche UI ajouté.

RED CI : `37481119855`, commit `15a637a92c37bfaed7a810e9b6a6fbc92d345b5e`. Run TDD réel : `{run}` ; RED VM/navigateur intact, puis GREEN VM et vrai preview mobile/PC exigés avant le commit runtime. 17 profils VM, lectures sans écriture, listes réelles/refresh/reload/stockage/sélection Capture protégés.

Index : {NEW_SIZE} octets / blob `{NEW_BLOB}` / SHA-256 `{NEW_SHA256}`. Une condition changée, +20 octets, inversion exacte vers le ZIP reçu. {len(report['pins'])} tests repinnés mécaniquement et quatre métadonnées de source mises à jour, sans contrat assoupli. Le script ponctuel est retiré ; le coordinateur retire le workflow avant validation finale.

## Validation finale et suite

Les trois workflows Architecture+Browser, Firefox wall et Tactical dock doivent être SUCCESS sur le même SHA avant création du checkpoint final. Vérifier ce checkpoint dans GitHub ; le transport n'est pas le GREEN final. Le rapport de clôture fournit le lien preview.html du SHA validé et le test manuel Survie -> Adventure -> Capture.

Phase 9 reste en cours. Résidus distincts : `activeSurvivalModId()`, `gensFamilyForProfile()`, autonomie Capture de premier niveau, diagnostic personnel/visuel Dungeon PC. Ne pas rouvrir Phase 8. Aucun merge ou déploiement main.

Rapport : [GENSRPG_PHASE9_SURVIVAL_LIBRARY_CANONICAL_CLASSIFICATION.md](GENSRPG_PHASE9_SURVIVAL_LIBRARY_CANONICAL_CLASSIFICATION.md).

---

'''
    previous = Path(CURRENT).read_text(encoding='utf-8')
    Path(CURRENT).write_text(header + previous, encoding='utf-8', newline='')
    Path(SCRIPT).unlink()
    expected = set(report['paths']) | {DOC, CURRENT, SCRIPT}
    actual = set(git('diff', '--name-only').splitlines())
    assert actual == expected, 'unexpected mutation scope: ' + repr(actual ^ expected)
    subprocess.check_call(['git', 'add', '--', *sorted(expected)])
    staged = set(git('diff', '--cached', '--name-only').splitlines())
    assert staged == expected, 'unexpected staging scope'
    print(json.dumps({'stagedPaths': len(staged), 'testFingerprintOnlyPaths': len(report['pins']),
                      'runtimeOwnersChanged': ['survivalProfiles'], 'scriptRemoved': True,
                      'workflowCleanupBeforeFinalCI': WORKFLOW}, indent=2))


if __name__ == '__main__':
    assert len(sys.argv) == 2 and sys.argv[1] in ('apply', 'finalize')
    {'apply': apply, 'finalize': finalize}[sys.argv[1]]()
