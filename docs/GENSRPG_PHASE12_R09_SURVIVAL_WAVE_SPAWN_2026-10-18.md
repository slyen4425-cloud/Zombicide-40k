# GenSrpG — Phase 12 R09 : extraction Survie, configuration vagues et apparitions

**18 octobre 2026 — validation technique en cours, NON GREEN tant que les quatre CI ne passent pas sur le même SHA.** Phase 12 reste ouverte.

## Source et checkpoint (§§25–26)

- R08 GREEN certifié et accepté : `f458f0dce79a6bf0034c69bca36313f671d51fc4` ; checkpoint `checkpoint/gensrpg-phase12-r08-shared-ability-skill-catalog-green-2026-10-18`.
- Source transmise par l'utilisateur : `d7.zip` ; HTML exact R08 **2 131 805 octets**, Git blob `6eeed45a0a12085c1b107ee6c24b49040277ca54`. Contrôle positif avant modification.
- START : `checkpoint/gensrpg-start-phase12-r09-survival-wave-spawn-2026-10-18` créé à partir du SHA exact ci-dessus **avant les modifications** ; branche `work/gensrpg-phase12-r09-survival-wave-spawn-2026-10-18`.
- Production `main` gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`; aucun laboratoire concerné.

## Périmètre effectivement déplacé

72 **déclarations originales inchangées** sont physiquement sorties du grand script historique multi-domaines (vagues et réserves zombies, configuration et profils de vagues, ensembles, génération/pioche de cartes d'apparition, présentation des résultats). Elles sont maintenant dans `assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js` sous le propriétaire Survie. Il s'agit d'une extraction, **pas d'une modification des règles de gameplay** ni d'un second moteur. Les constantes communes, appels éventuels aux éditeurs et opérations hors ce groupe restent à leur place initiale.

Chargement JS classique **synchrone immédiatement avant** le grand script qui déclare les constantes partagées et utilisait ces fonctions : les fonctions sont des déclarations hoistées, aucun appel d'initialisation n'est déplacé. Un import dans le service worker et une entrée `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` complètent le raccord.

| Fichier | Octets | Blob Git |
|---|---:|---|
| `index.html` R08 source | 2 131 805 | `6eeed45a0a12085c1b107ee6c24b49040277ca54` |
| `index.html` R09 projeté et publié | **2 093 066** | `4dbe3314d5048f2def404ed674498c0670c04fc1` |
| `assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js` | **39 292** | `515642eda275802c50af867d5712517d47020414` |

Réduction physique du HTML **38 739 octets** ; toutes les déclarations sont conservées dans le propriétaire externe. Aucun asset visuel ni stockage persistant déplacé. Il reste un grand script HTML historique multi-domaines : **la Phase 12 n'est pas terminée**.

## Contrôles et retour arrière

- L'extraction a été produite par `tools/gensrpg_phase12_r09_wave_extract_apply.cjs`, avec **vérification stricte de l'empreinte R08 à l'entrée, de chaque fonction extraite, des octets finaux, des positions et du rollback exact R09 → R08**. Son premier garde a échoué avant tout changement à cause d'une confusion de longueur UTF-16 ; le garde a été rectifié, sans affaiblir les SHA, puis l'[application contrôlée a réussi](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39134393939).
- Le moteur vérifie `--verify` par comparaison avec le commit R08 et l'empreinte des fichiers R09. `--restore-r08` reconstruit les octets exacts du fichier validé R08 pour les tests anciens (sans lire un gros HTML via GitHub). La chaîne de retour `R09 → R08 → R07 → R06` permet de **préserver** les sentinelles historiques existantes sans modifier leurs attentes.
- `tests/gensrpg_phase12_r09_wave_sentinel.test.cjs` protège les 72 déclarations globales, réserve et limites, sauvegarde de profil, pioche de cartes, ordre du chargement, SHA et compilation. CI dédiée `.github/workflows/gensrpg-phase12-r09-wave-sentinels.yml`.
- **Tests requis avant GREEN :** R09 source/rollback, Firefox, Tactical, Architecture + Chromium, tous SUCCESS sur **un même SHA**. Survie navigation/bibliothèque/profils, Dungeon/combat/dés/sauvegarde, Capture et PvP non jouable restent protégés. Aucun checkpoint GREEN, merge ou déclaration de test utilisateur avant ces preuves.

Le nouveau code fonctionnel a été publié sur la branche R09 au commit `40e192a4b39e2e8fed17818cd69707ec297603cc`; les commits suivants ne modifient que la documentation, les contrôles et les fixtures de reconstruction pour la CI.

## Prochaine décision

Finaliser la CI sur le dernier SHA, créer ensuite seulement le checkpoint technique GREEN, fournir un lien preview immuable et demander les retours manuels ciblés (réserve, vagues, apparition, retour aux modes). Ne pas ouvrir un R10 automatique ni déménager le monolithe sous une fausse autorité ; vérifier les dernières frontières à fort effet et l'objectif de sortie réel de Phase 12.
