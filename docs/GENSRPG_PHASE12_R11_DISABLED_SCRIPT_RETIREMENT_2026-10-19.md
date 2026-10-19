# GenSrpG — Phase 12 / R11 : retrait collectif des scripts déjà désactivés

Date : 19 octobre 2026. **Code R11 physiquement appliqué sur la branche R11 ; certification CI en cours, pas de checkpoint final avant quatre suites vertes.**

## 1. Conformité aux §§25–26

- Dernier audit antérieur GREEN : `checkpoint/gensrpg-phase12-post-r10-exit-assessment-green-2026-10-19` → `065ba9a4a66f99d0b1e42295e778a957da7bfd72`, six checks GitHub SUCCESS.
- START créé **avant tout changement** : `checkpoint/gensrpg-start-phase12-r11-disabled-script-retirement-2026-10-19` au SHA `065ba9a4a66f99d0b1e42295e778a957da7bfd72`.
- Branche dédiée : `work/gensrpg-phase12-r11-disabled-script-retirement-2026-10-19`. `main` toujours à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de merge.
- Source §26 reçue et authentifiée : `E1.zip` / `index.html(7).txt`, **2 031 649 octets / Git blob `b8ef8dcb497cad94c91094ed008136a5d9800155`**, identique au code R10 immuable `b1797246c76543447cbbd11248bd59b5c3d7ad6b`.

## 2. Périmètre réalisé

- Retrait **collectif et uniquement physique** de 17 balises `<script type="application/x-gensrpg-disabled">` et de leurs corps déjà inertes. **Aucune exécution réactivée**, aucun script de jeu actif déplacé, aucun nouveau propriétaire créé.
- Corps inertes : 95 878 octets. Balises complètes : **97 396 octets** en moins.
- `index.html` : **2 031 649 → 1 934 253 octets**, Git blob final vérifié via GitHub **`f257bd9e193648dc62cd8a40d510831debfe045a`**.
- Les **148 balises de scripts restant actifs ou externes** restent toutes **strictement identiques à l'octet et dans le même ordre**.
- **Cinq styles CSS actifs conservés** : `rpgTurnTargetFlow157Css`, `rpgPlayerTargeting158Css`, `rpgHeroTargeting159Css`, `dungeonCore091PostCombatUnlockCss`, `dungeonCore104CoherenceCss` ; aucune règle CSS retirée.
- Cache PWA versionné : `service-worker.js` modifié **uniquement dans le nom de cache** avec le suffixe `-r11-retired-disabled`.
- Le code R10 historique, les modules Survie/Dungeon/Capture/Tactical/Sync/Stats, les 32 images Survie et les deux laboratoires restent inchangés.

## 3. Preflight : blocage utile et résolution justifiée

- Le préflight static global lit **tous les scripts actifs inline** et **tous les JS sous `assets/`**, y compris le très gros `legacy-visual-data-v1.js`, auparavant non inspectable avec le connecteur.
- La première exécution a **correctement échoué** sur `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js`, qui effectue `querySelector('script[data-'+flag+']')`. Inspection du vrai fichier : la recherche cible **les scripts dynamiquement injectés marqués `data-*`**, pas les 17 tags anciens (qui possèdent uniquement `type` et `id`).
- Le garde a été affiné **seulement** pour ce cas `script[data-*]` démontré ; tout autre scan générique des tags `script` et toute référence littérale aux 17 ID désactivés restent bloqués.
- **Préflight devenu SUCCESS** au commit `309eccdbdd7d3c68f5950c150b1c48af8919d0e8` : [run 39223188283](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39223188283). La preuve statique reste associée aux sentinelles de non-régression ; elle n'est pas une garantie absolue contre toute réflexion dynamique.

## 4. Transformation et compatibilité historique

- Outil : `tools/gensrpg_phase12_r11_retired_scripts.cjs` avec gardes de blob/tailles, vérification de 17 ID uniques, exclusion de tous les scripts actifs de la transformation, 5 styles conservés, sortie cible exacte, scan des JS, `--apply`, `--verify` et `--restore-r10`.
- Outil historique R10 `tools/gensrpg_phase12_r10_capture_extract_apply.cjs` adapté pour reconstruire l'index R10 depuis R11 **avant** restauration byte-exacte R10→R09. Sentinelle R10 historique conservée et relancée sur sa source restaurée, **sans retirer de couverture**.
- Nouvelle sentinelle : `tests/gensrpg_phase12_r11_retired_scripts_sentinel.test.cjs` prouve : 148 scripts actifs inchangés et ordonnés, absence des types désactivés, conservation CSS, PWA et retour **R11→R10→R09 exact**. Sentinelles R09 et R10 relancées.
- [Application contrôlée R11](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39223648568) : **SUCCESS**. Commit automatique d'application sur la branche R11 : **`c3e84ddf59771425156e8764f495510088cc0b44`**. Seuls **`index.html` et `service-worker.js`** modifiés dans ce commit.
- Les `git push` du bot GitHub Actions ne redéclenchent pas toujours les autres workflows. Un commit documentaire distinct avec le même code permet de déclencher les quatre suites, puis de certifier un SHA unique.

## 5. Conditions strictes de fermeture

- CI R11 source/rollback, Architecture statique + navigateur Chromium réel, Firefox et Tactical (Chromium + Firefox) doivent être **toutes SUCCESS sur le même SHA final** ; correction soustractive et sentinelles historiques maintenues si un test échoue. Aucun contournement du garde.
- Garder les tests des modes Survie, Dungeon, Monster Capture, PvP placeholder et la PWA. **Aucun résultat de test manuel non effectué ne doit être inventé.**
- Si quatre suites vertes : créer `checkpoint/gensrpg-phase12-r11-disabled-script-retirement-green-2026-10-19` sur le SHA certifié, actualiser `GENSRPG_CURRENT_WORK.md` et fournir une preview immuable.
- **Phase 12 restera ouverte** après R11 : les scripts inline actifs représentent encore des responsabilités multi-domaines. La fin de Phase 12 ne doit pas être annoncée artificiellement.
