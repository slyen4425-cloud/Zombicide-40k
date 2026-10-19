# GenSrpG — CURRENT_WORK officiel (19 octobre 2026)

## Phase 12 / R11 — retrait groupé des scripts historiquement désactivés

- **Phase active** : préflight R11 **non destructif** ; aucune suppression n'est encore appliquée. Périmètre : uniquement les 17 scripts déjà désactivés dans le HTML.
- **START §25 avant toute modification** : `checkpoint/gensrpg-start-phase12-r11-disabled-script-retirement-2026-10-19` → `065ba9a4a66f99d0b1e42295e778a957da7bfd72`. Branche dédiée `work/gensrpg-phase12-r11-disabled-script-retirement-2026-10-19` issue du même SHA.
- **GREEN précédent** : `checkpoint/gensrpg-phase12-post-r10-exit-assessment-green-2026-10-19` → `065ba9a4a66f99d0b1e42295e778a957da7bfd72`, les 6 checks CI sur ce SHA sont SUCCESS.
- **Code R10 certifié** `b1797246c76543447cbbd11248bd59b5c3d7ad6b` ; source §26 validée `E1.zip` avec 2 031 649 octets, blob `b8ef8dcb497cad94c91094ed008136a5d9800155`.
- **Extraction candidate (groupe C unique)** : 17 balises `script type="application/x-gensrpg-disabled"` ; 95 878 octets de corps, 97 396 octets HTML. Résultat byte-déterministe potentiel 1 934 253 octets / blob `f257bd9e193648dc62cd8a40d510831debfe045a`. Les 148 autres balises de scripts restent octet-identiques et dans leur ordre, les 5 styles CSS associés sont protégés.
- **Gate à lever** : vérifier les références des noms des inertes et accès DOM aux tags script dans tous les JS `assets/`, y compris le très gros `legacy-visual-data-v1.js`, via checkout CI. Contrôle statique seul non exhaustif : une régression test navigateur/jeu doit encore être exclue.
- **Outil de travail** `tools/gensrpg_phase12_r11_retired_scripts.cjs` : `--audit` (lecture seule), `--restore-r10` depuis le SHA exact, `--apply` réservé au lot contrôlé après gate, `--verify` sortie byte-exacte. Aucune autorité active déplacée.
- **Avant publication du retrait** : raccord PWA/cache, adaptation des tests historiques via reconstruction R11→R10→R09 sans retirer de couverture, preuve d'absence de régression sur vrai navigateur et quatre suites CI vertes sur un SHA identique. Si préflight rouge, aucune suppression.
- **Protégés** : `main` gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Laboratoires Combat/Exploration, 32 images Survie, gameplay, sauvegardes, runtimes Shell/Core/Dungeon/Capture/Survie/Tactical/PvP inchangés. Retour R10 Capture favorable mais non exhaustif.
- **Prochaine action** : vérifier le préflight GitHub CI puis décider si retrait global C est sûr ; ne pas ouvrir 17 micro-lots.

Rapports de référence : `docs/GENSRPG_PHASE12_POST_R10_EXIT_ASSESSMENT_2026-10-19.md`, `docs/GENSRPG_PHASE12_POST_R10_VERIFIED_CENSUS_2026-10-19.json`, charte §§25–26.
