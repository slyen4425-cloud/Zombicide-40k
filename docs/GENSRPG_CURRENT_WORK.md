# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**Phase 12 : D1–D9 et R01–R05 GREEN technique/CI ; Phase 12 globale encore OUVERTE.** Aucun R06 ouvert. Production `main` inchangée.

## Dernier jalon GREEN — R05 Core cloud sync & backup

- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-r05-core-cloud-sync-backup-green-2026-10-17`, SHA exact **`a832da1cbbad39c446f46f1035dbb819aa60ec20`** (https://github.com/slyen4425-cloud/Zombicide-40k/tree/checkpoint/gensrpg-phase12-r05-core-cloud-sync-backup-green-2026-10-17).
- **Branche de travail unique** : `work/gensrpg-phase12-r05-core-cloud-sync-backup-2026-10-17` ; le commit de clôture documentaire peut se trouver après le code GREEN, sans modification du runtime.
- **Checkpoint de départ** : `checkpoint/gensrpg-start-phase12-r05-core-cloud-sync-backup-2026-10-17` sur `f01e0b65c67fcc4e14dbd64b8fec17625c1b5753` (R04 documentaire, runtime égal R04 GREEN `645f5fa9b849c1732e2c11f625548665067294ec`).
- **Source exacte §26 R05** : ZIP utilisateur `c7 (1).zip`, `index.html(17).txt`, **2 835 125 octets**, blob Git `554bf6100aeb0f40bfc098dc90863af7d2d5e439` = ancien index R04. **Ne pas réutiliser ce ZIP comme nouvel index R05.**
- **Changement borné** : script cloud Supabase / synchronisation / récupération et compactage des sauvegardes extrait **sans modification de corps** dans `assets/gensrpg/core/legacy-cloud-sync-backup-v1.js`, **53 746 octets**, blob Git `8d7f8179676b096a53816cd1ca2530c120e3cf18`. Un script classique synchrone le remplace à son emplacement exact entre le grand monolithe et le bloc version/accueil ; conservation des clés, appels d'initialisation, DOMContentLoaded et callbacks. Ne rien publier de sensible dans les rapports.
- **Index R05** : **2 781 436 octets**, blob Git `485de2e6a08ffd89e4f1fb9410e40c938774d62f`, gain de **53 689 octets HTML**. PWA pré-cache le nouveau fichier et le manifeste d'autorité Core est mis à jour.
- **Historique test-only** : rollback octet-exact R05→R04→R03→R02→R01 ; aucune implémentation parallèle en runtime. Règles de sauvegarde ou synchronisation non réécrites.

## Validation code GREEN au même SHA `a832da1cbbad39c446f46f1035dbb819aa60ec20`

- **Architecture et Chromium** [38994986867](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986867) : SUCCESS, y compris `architecture-sentinels` et `browser-sentinel`.
- **Firefox** [38994986930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986930) : SUCCESS.
- **Tactical Chromium et Firefox** [38994986871](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986871) : SUCCESS.
- **Shell / Survie browser smoke** [38994986857](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38994986857) : SUCCESS.
- **Sept checks SUCCESS sur un même SHA** : `architecture-sentinels`, `browser-sentinel`, `firefox-wall-zoom`, `dock-contract`, `dock-chromium`, `dock-firefox`, `survival-shell-smoke`.
- **Limite** : GREEN = certification code/CI. Aucun test manuel Android, restauration réelle d'un compte Supabase avec données privées, ni test de PWA installée hors ligne sur téléphone n'est attesté. Pas de publication `main`.

## Suite strictement bornée

- **R06 non ouvert** : auditer le gros HTML résiduel par propriétaire ; ne pas rouvrir D10 par inertie, ni mêler Shell, Core, Survie, Dungeon, Capture et PvP dans un même lot.
- Nouvelle source §26 R05 nécessaire pour toute prochaine modification du gros HTML : [index au SHA GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/a832da1cbbad39c446f46f1035dbb819aa60ec20/index.html). Vérifier **2 781 436 octets** / blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`, demander une archive de ce nouvel index s'il faut consulter ou modifier son contenu.
- `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; laboratoires combat/exploration et 32 visuels Survie historiques intacts.
- Rapport : `docs/GENSRPG_PHASE12_R05_CORE_CLOUD_SYNC_BACKUP_2026-10-17.md`. Roadmap : `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
