# GenSrpG — CURRENT_WORK officiel (19 octobre 2026)

## Phase 12 / Lot R11 — GREEN sur SHA certifié (code), EXIT Phase 12 toujours ouvert

- **Dernier code valide avant R11** : R10 `b1797246c76543447cbbd11248bd59b5c3d7ad6b`, quatre CI GREEN. Audit post-R10 `065ba9a4a66f99d0b1e42295e778a957da7bfd72`, 6 checks GREEN, checkpoint `checkpoint/gensrpg-phase12-post-r10-exit-assessment-green-2026-10-19`.
- **START §25** : `checkpoint/gensrpg-start-phase12-r11-disabled-script-retirement-2026-10-19` → `065ba9a4a66f99d0b1e42295e778a957da7bfd72`. Branche `work/gensrpg-phase12-r11-disabled-script-retirement-2026-10-19`.
- **Source §26 exacte** : `E1.zip`, `index.html(7).txt` ; 2 031 649 octets / blob Git `b8ef8dcb497cad94c91094ed008136a5d9800155` (R10).
- **R11 physiquement appliqué** : [commit `c3e84ddf59771425156e8764f495510088cc0b44`](https://github.com/slyen4425-cloud/Zombicide-40k/commit/c3e84ddf59771425156e8764f495510088cc0b44), via [action contrôlée SUCCESS](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39223648568). **17 scripts désactivés retirés collectivement**, 97 396 octets de moins ; HTML **1 934 253 octets**, Git blob **`f257bd9e193648dc62cd8a40d510831debfe045a`**. 148 scripts actifs/externes inchangés, cinq styles CSS protégés, cache PWA versionné.
- **Préflight global** : [run 39223188283](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39223188283) SUCCESS après caractérisation précise du seul `script[data-*]` dynamique (non lié aux désactivés). Tous les JS `assets/` examinés, y compris gros fichier d'assets.
- **Rollback historique** : `--restore-r10` et outils R10 → R09, avec garde de blob et nouvelles/anciennes sentinelles ; source byte-exacte préservée. Aucun gameplay modifié.
- **R11 GREEN certifié** : commit de code et sentinelles `9f56f7c7f4576179663f816949159097e981329d`, **7/7 checks SUCCESS sur le même SHA** : `retired-script-rollback`, `architecture-sentinels`, `browser-sentinel`, `dock-contract`, `dock-chromium`, `dock-firefox`, `firefox-wall-zoom`. Checkpoint : `checkpoint/gensrpg-phase12-r11-disabled-script-retirement-green-2026-10-19` → `9f56f7c7f4576179663f816949159097e981329d`. Ce commit documentaire ultérieur ne modifie aucun octet de code.
- **Protégés** : `main` reste `e8681f9823573ced8aec59c8ddc47a72b02bc663`, aucun merge ; deux labos, anciens assets Survie, fonctionnements des modes, stats, sauvegardes et PWA protégés. Tests manuels supplémentaires non revendiqués.
- **Prochaine étape** : audit strict des groupes **mono-propriétaires** encore imbriqués dans les deux grands scripts anonymes et choix d'un lot substantiel, réversible, avec nouveau START §25 et nouvelle source §26 certifiée. **Phase 12 toujours ouverte** : 1 140 482 octets de scripts inline actifs. Aucun lot artificiel, aucun merge.

Rapport complet : `docs/GENSRPG_PHASE12_R11_DISABLED_SCRIPT_RETIREMENT_2026-10-19.md`. Charte : `docs/GENSRPG_CHARTE.md` §§25–26.
