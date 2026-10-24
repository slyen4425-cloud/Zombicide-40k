# Phase 10 / S2 — Composition réelle du provider PvP avec le Shell

Date : 12 octobre 2026.

## Source de vérité et propriétaire

- Base GREEN S1 : `checkpoint/gensrpg-phase10-pvp-shell-provider-s1-green-2026-10-12`, SHA `cb36c5f1db0a5734083b39bd9f50b40d80e1c010` ; triple CI SUCCESS Architecture [38230907940](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38230907940), Firefox [38230907878](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38230907878), Tactical [38230907872](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38230907872).
- Checkpoint de départ S2 : `checkpoint/gensrpg-start-phase10-pvp-shell-composition-s2-2026-10-12` sur le même SHA S1.
- Branche unique : `work/gensrpg-phase10-pvp-shell-composition-s2-2026-10-12`.
- Core reste propriétaire des systèmes génériques ; Shell de la navigation ; PvP seul de sa session et de son futur combat. Pas d'accès aux états privés Survie/Dungeon/Capture/Tactical.

## Périmètre et invariants

- Raccorder le provider S1 au **vrai** contrat `GensShellModuleLaunchV1` de façon explicite, sans deuxième autorité ni wrapper de navigation.
- `assets/gensrpg/pvp/shell-composition-v1.js` reste inerte au simple chargement ; `connect()` est appelé explicitement par le point de composition, une seule fois par page.
- Ne pas préparer une session, modifier une règle, lancer un combat ou dévoiler une UI PvP jouable. Le placeholder `PVP — À VENIR` demeure exact.
- Si une session PvP n'est pas préparée avec la configuration du créateur, le démarrage demeure `false`. Les autres modules ne perdent aucun handler ou état.
- Le Shell courant n'offre pas `unregister` : après `dispose()`, callback inerte, jamais de double registration.

## Entrée index.html — charte §26

L'utilisateur a fourni `a2.zip` : fichier interne `index.html(2).txt`, 7 933 755 octets ; blob Git **`613b4a21d83e9adcdd091be82240a3a6f9cf5bf7`**, byte-exact à la base `45d46b4cfa45da2b91579f7d25ded79269391a2b`. La branche S2 dérive du checkpoint S1 ; aucune modification d'index entre les deux, vérifiable par compare Git.

Insertion locale strictement ciblée avant `assets/gensrpg/shell/module-launch-final-authority-v1.js` : charger session S0, provider S1, composition S2, puis appeler `GensPvpShellCompositionV1.connect()` explicitement. Index résultant : 7 934 204 octets, blob Git **`bf996ec4e748a4927ac6dd57cceaeaf2afcd9441`**, différence +449 octets. **Application GitHub réalisée par l'assistant via le workflow controlled apply** [38253428337](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38253428337) SUCCESS : commit `6267eb076acb81045e9936e4bdf696897e0417ba` sur la branche S2, blob `index.html` vérifié dans l'arbre GitHub `bf996ec4e748a4927ac6dd57cceaeaf2afcd9441` (7 934 204 octets). L'utilisateur n'a rien à publier ni à pousser. Les sentinelles S0/S1/S2, le graphe réel et l'ordre de composition ont réussi avant ce commit. **La triple CI finale reste requise sur un même HEAD**, puis checkpoint seulement si tous les critères sont satisfaits.

## Gates de clôture

1. Publier l'index ciblé sur S2 ; contrôler le blob distant et le HEAD.
2. Adapter uniquement les tests de graphe/chargement devenus périmés par le changement explicite de production.
3. Tests Node de composition réelle, sentinelles navigateur des quatre modules et triple CI SUCCESS sur **un unique SHA**.
4. Fournir la preview SHA précise ; demander le test manuel ciblé de navigation et de non-régression si l'UI visible évolue.
5. Seulement après ces gates, checkpoint GREEN S2 ; ne pas confondre absence de combat et régression.

`main` demeure gelé au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucun changement des laboratoires ni ouverture Phase 11.
