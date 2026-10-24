# GenSrpG — Phase 12 / R05 Core cloud sync & backup — clôture (17 octobre 2026)

**Statut : GREEN technique/CI**, Phase 12 globale encore ouverte. Aucun merge `main`, aucun lot R06 commencé.

## Autorités et point de départ (§§25–26)

- Source ZIP utilisateur : `c7 (1).zip` → `index.html(17).txt` = **2 835 125 octets**, blob `554bf6100aeb0f40bfc098dc90863af7d2d5e439`, strictement le checkpoint R04 GREEN.
- Checkpoint START : `checkpoint/gensrpg-start-phase12-r05-core-cloud-sync-backup-2026-10-17` au SHA `f01e0b65c67fcc4e14dbd64b8fec17625c1b5753`.
- Branche unique : `work/gensrpg-phase12-r05-core-cloud-sync-backup-2026-10-17`.
- **Commit code GREEN** : `a832da1cbbad39c446f46f1035dbb819aa60ec20`.
- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-r05-core-cloud-sync-backup-green-2026-10-17`, pointe exactement sur ce commit.

## Périmètre physique

Déplacement **octet-identique** du script anonyme autonome (sync en ligne / stockage local partagé / collecte et récupération des sauvegardes) dans `assets/gensrpg/core/legacy-cloud-sync-backup-v1.js`, **53 746 octets**, blob `8d7f8179676b096a53816cd1ca2530c120e3cf18`. Nouvelle balise classique `script src` synchrone au **même emplacement parser**, sans async/defer/module ; aucune seconde autorité. Les appels d'initialisation, listener DOMContentLoaded et règles de synchronisation restent dans le même corps JS. Aucune clé ou donnée utilisateur reproduite ici.

Nouvel `index.html` = **2 781 436 octets**, blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f` : **–53 689 octets**. Pré-cache PWA et manifeste des propriétaires mis à jour. Rollback R05→R04→R03→R02→R01 octet-exact et tests historiques adaptés sans modifier leurs empreintes originales.

## Tests et validation

- `tests/gens_phase12_r05_core_cloud_sync_extraction_v1.test.cjs` : empreintes du module et du nouvel index, un propriétaire, source conforme et rollback, ordre parser, listener et appel de récupération conservés, cache PWA.
- [Architecture / Chromium — run 38994986867](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986867) : SUCCESS, `architecture-sentinels` + `browser-sentinel`.
- [Firefox — run 38994986930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986930) : SUCCESS.
- [Tactical — run 38994986871](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986871) : SUCCESS, trois jobs.
- [Survie / Shell smoke — run 38994986857](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986857) : SUCCESS.
- **Sept checks SUCCESS** sur le seul SHA `a832da1cbbad39c446f46f1035dbb819aa60ec20` : `architecture-sentinels`, `browser-sentinel`, `firefox-wall-zoom`, `dock-contract`, `dock-chromium`, `dock-firefox`, `survival-shell-smoke`.

## Limites et suite

GREEN uniquement **technique / CI**. Pas de vérification attestée d'un véritable compte Supabase ni de manipulation de sauvegardes personnelles, d'installation Android réelle ou de PWA hors-ligne installée. `main` inchangée (`e8681f9823573ced8aec59c8ddc47a72b02bc663`) ; deux laboratoires et 32 visuels historiques Survie hors périmètre. Phase 12 non achevée.

Pour R06, ne pas réutiliser `c7 (1).zip` comme source courante : nouvel [index R05 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/a832da1cbbad39c446f46f1035dbb819aa60ec20/index.html), **2 781 436 octets** / blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`. Reborner d'abord une seule responsabilité et ouvrir checkpoint START et branche uniques. Pas de D10 mécanique.
