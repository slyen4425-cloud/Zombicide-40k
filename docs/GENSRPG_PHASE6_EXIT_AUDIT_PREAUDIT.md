# GenSrpG — Phase 6 / audit de sortie Survie — pré-audit — 2026-09-26

## Base sûre

- checkpoint GREEN : `checkpoint/gensrpg-phase6-survival-custom-enemy-builtin-boundary-green-2026-09-26`
- SHA : `52ce1be73ff882840aaa6afbb6b45e6dd0c62023`
- checkpoint de départ : `checkpoint/gensrpg-start-phase6-exit-audit-2026-09-26`
- branche : `work/gensrpg-phase6-exit-audit-2026-09-26`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

CI de base :
- Architecture + Browser `36232137682` — SUCCESS ;
- Firefox `36232137749` — SUCCESS ;
- Tactical Dock `36232137683` — SUCCESS.

Validation utilisateur :
`Oui c est ok`.

## Critère de sortie officiel

Roadmap Phase 6 :
- déplacer progressivement le runtime Survie dans `assets/gensrpg/survival/` ;
- aucun appel aux fonctions privées Dungeon ;
- dés/stats/inventaire communs uniquement via Core ;
- assets Survie uniquement via contexte Survie.

Critère :
**Survie démarre/joue avec Dungeon/Tactical non chargés ou inactifs.**

Le mot `inactifs` autorise la présence de scripts historiques dans la composition tant qu'ils ne possèdent ni état, ni UI, ni décision du chemin Survie.

## État physique Survie

`assets/gensrpg/survival/` contient 2 fichiers :
- `entry-v1.js` ;
- `module-contract-v1.json`.

Le code de `entry-v1.js` est pur :
- aucune lecture DOM ;
- aucun stockage ;
- aucun timer/observer ;
- aucune référence Dungeon/Tactical/Capture/PvP ;
- dépendances injectées explicitement pour les règles de vagues.

Le contrat déclare explicitement comme interdits :
- Dungeon private runtime ;
- Tactical private runtime ;
- Capture private runtime ;
- PvP private runtime.

## Preuves navigateur déjà existantes

`gens_survival_shell_launch_browser_v11411.test.cjs` et
`gens_phase5_module_launch_s2_survival_provider_browser_v1.test.cjs`
prouvent déjà :
- famille Survie conservée ;
- profil non-Dungeon ;
- `isDungeonMode() === false` ;
- thème Dungeon absent ;
- état Dungeon runtime inchangé ;
- état Dungeon exploration inchangé ;
- overlay Dungeon absent/inactif ;
- hôte combat Dungeon absent/inactif.

`gens_survival_search_art_browser_v11411.test.cjs` prouve :
- vrai démarrage Survie ;
- Fouiller fonctionnel ;
- héros/items/ennemis Survie chargés ;
- assets `img_01` à `img_32` sans fallback inter-module.

## Point non encore prouvé explicitement

Tactical :
- aucune sentinelle de sortie Phase 6 ne vérifie encore explicitement qu'une session Survie ne crée pas de bataille Tactical ;
- il faut vérifier overlay, bataille V2 et dock Tactical absents/inactifs après démarrage réel Survie.

## Propriétaires Dungeon résiduels à auditer

Cartographie Phase 2 courante :
- `openZombieRule -> dungeonDirectImageBinding166` ;
- `enemyCardHtml -> dungeonDirectImageBinding166` ;
- `renderActiveEnemies -> dungeonDirectImageBinding166` ;
- `activeEnemyDefinition -> dungeonArtRenderFix165`.

Question critique :
ces propriétaires sont-ils seulement chargés pour Dungeon, ou sont-ils encore requis par l'UI ennemis Survie ?

## Méthode

Sans modifier le runtime :
1. audit statique des contrats/fichiers Survie ;
2. caractérisation navigateur réelle Survie ;
3. instrumentation non intrusive des fonctions résiduelles ;
4. ouverture du gestionnaire ennemis Survie et interactions représentatives ;
5. vérification qu'aucune autorité Dungeon/Tactical n'est nécessaire pour garder le chemin Survie correct ;
6. décision documentée GREEN ou BLOCKED.

## Interdictions

- aucune modification runtime dans l'audit ;
- aucun wrapper permanent ;
- aucun observer/timer/retry ajouté ;
- aucune suppression de couche Dungeon sur hypothèse ;
- aucune ouverture Phase 7 avant décision de sortie ;
- si le contenu exact d'`index.html` devient nécessaire pour corriger une dette, appliquer Rule 26 et demander le fichier exact à Sylvain.


---

# Résultat de l'audit de sortie

## Audit statique — GREEN

`tests/gens_phase6_exit_static_characterization_v1.test.cjs` prouve :
- seul `entry-v1.js` constitue l'entrée JS physique Survie dans `assets/gensrpg/survival/` ;
- aucune consommation de runtime privé Dungeon/Tactical ;
- API publique `GensSurvivalV1` ;
- contrat de module interdisant les runtimes privés des autres modes.

Les propriétaires Dungeon résiduels sont cartographiés explicitement, pas ignorés.

## Audit navigateur — GREEN

`tests/gens_phase6_exit_survival_runtime_browser_characterization_v1.test.cjs` démarre une vraie session Survie mobile et prouve :
- Dungeon mode faux ;
- overlay/hôte Dungeon inactifs ;
- overlay/dock Tactical inactifs ;
- aucune bataille Tactical UI ou Bridge ;
- réserve ennemis Survie rendue ;
- propriétaires Dungeon résiduels `openZombieRule`, `enemyCardHtml`, `renderActiveEnemies`, `activeEnemyDefinition` instrumentés à 0 appel ;
- aucun trigger `openZombieRule` exposé en Survie ;
- aucune erreur navigateur/runtime.

## Audit final — GREEN

`tests/gens_phase6_exit_audit_v1.test.cjs` verrouille :
- runtime exact 8 170 150 octets ;
- blob `ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9` ;
- services Core partagés présents ;
- caractérisation navigateur raccordée à la CI ;
- critère Phase 6 prêt pour sortie.

## CI technique

SHA :
`03871831acd44e88558cd4388285cde1b84525b4`.

Runs :
- Architecture + Browser `36233731004` — SUCCESS ;
- Firefox `36233731003` — SUCCESS ;
- Tactical Dock `36233731001` — SUCCESS.

## Décision

**GREEN — Phase 6 satisfait son critère de sortie.**

Survie démarre et joue sans dépendre d'une autorité privée Dungeon/Tactical active.

Les scripts historiques Dungeon/Tactical éventuellement présents dans la composition n'exercent aucune autorité sur le chemin Survie testé.

Aucun runtime n'a été modifié dans l'audit.

La prochaine étape après CI documentaire finale est la création du checkpoint :
`checkpoint/gensrpg-phase6-complete-green-2026-09-26`,
puis l'ouverture de la Phase 7 Dungeon exploration.
