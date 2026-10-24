# GenSrpG — Phase 12 / R03 Shell Hub Family UI — clôture du lot (16 octobre 2026)

## Statut
**GREEN technique/CI** au SHA `afab707dad385450fdf296f7b2b6b41da376929b`, checkpoint `checkpoint/gensrpg-phase12-r03-shell-hub-family-ui-extraction-green-2026-10-16` créé sur cet exact commit. Aucun merge sur `main`, aucun chantier suivant commencé.

## Base et vérification
Checkpoint de départ `checkpoint/gensrpg-start-phase12-r03-shell-hub-family-ui-extraction-2026-10-16` au SHA documentaire R02 `e8700f10aca7d4f3b9c85aa3cd4dc11aae6530ab`. ZIP §26 reçu `c6.zip` / `index.html(15).txt` = 2 869 485 octets et blob `062c4cd37634f504cc75ce3329d6e69e19b5f547`, exactement R02 code GREEN.

## Changement de code
Un seul bloc cohérent de six fonctions Shell de présentation Hub, **6 651 octets**, déplacé byte-identique vers `assets/gensrpg/shell/legacy-hub-family-ui-v1.js` (blob `e45f3b4e419a10b030c47bc921bded1ec0dc723b`). Index résultant = **2 862 906 octets**, blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b`. Parser-order synchrone, portée et restauration byte-identique vers R02 validés. Nouveau fichier ajouté au service worker/cache versionné. Aucun changement gameplay, sauvegarde ni moteur.

## Preuves
- Application contrôlée [38942880813](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38942880813) : SUCCESS, hashes de sortie, syntaxe, rollback, pré-cache et manifeste.
- Architecture + navigateur [38946742376](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742376) : SUCCESS ; tests historiques restaurés, sentinelle R03, frontières des quatre modules.
- Firefox [38946742392](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742392) : SUCCESS.
- Tactical [38946742410](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38946742410) : SUCCESS.
- Les trois workflows de validation sont **au même SHA `afab707dad385450fdf296f7b2b6b41da376929b`** ; six checks du SHA tous SUCCESS.
- La validation **manuelle Android, PWA installée sur téléphone et hors-ligne sur appareil réel** n'a pas été effectuée dans cette clôture, donc non revendiquée.

## Reprise
Le code métier multi-domaines du gros script n'a pas été intégralement découpé ; les enveloppes R03–R07 restent à traiter par responsabilité et tests réels. Ne pas démarrer un lot sans checkpoint §25 et source §26 précise. Nouvel index à demander au besoin : [permalink R03 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/afab707dad385450fdf296f7b2b6b41da376929b/index.html). `c6.zip` correspond à R02, pas au nouvel index. `main` gelée et deux laboratoires hors périmètre.
