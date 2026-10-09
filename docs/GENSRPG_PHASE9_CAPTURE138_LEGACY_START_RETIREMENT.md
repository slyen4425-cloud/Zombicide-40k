# Phase 9 — Retrait borné du lancement historique Capture138 — TDD RED

Date : 9 octobre 2026. **Lot préparé, aucun runtime modifié sur GitHub à cette étape.**

## Checkpoint et isolation
- Départ `checkpoint/gensrpg-start-phase9-capture138-legacy-start-retirement-2026-10-09` au SHA `049d616c6a16decdb3eefd1ece922c3720a7eff3`.
- Branche `work/gensrpg-phase9-capture138-legacy-start-retirement-2026-10-09`. Source GREEN du préaudit : `checkpoint/gensrpg-phase9-capture-legacy138-launch-preaudit-green-2026-10-09`, mêmes octets du runtime.
- Triple CI du préaudit : Architecture/Browser [37960827487](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37960827487), Firefox [37960827480](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37960827480), Tactical [37960827332](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37960827332) toutes SUCCESS.
- Production `main` inchangée `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Le préaudit parallèle shutdown `e537678...` sur base plus ancienne reste isolé.

## Source Rule 26 contrôlée
Pièce jointe utilisateur `indexj.txt`, 8 165 398 octets ; blob Git `18627cc0c5fc7945732c8a910504c59ef823b6ae` ; SHA256 `1e539021cc24bb4beec50542f2c6929922b634117b29d60a5aed0e04a4630a00`. Correspond exactement au fichier du SHA de base.

## Diagnostic et scope du seam
Le vrai bloc `captureFix138` (ligne ~26905) capture l'ancien `window.startConfiguredGame`, redéfinit ce global et impose un rendu Capture différé de 30 ms. Le dernier script de production `assets/gensrpg/shell/module-launch-final-authority-v1.js` réaffecte ensuite ce global, sans déléguer à la chaîne préexistante, vers `GensShellModuleLaunchV1.startModuleSession(activeModule())`. Le fournisseur Capture public délègue à `GensCaptureSessionStartV1` déjà validé. L'ancien wrapper Capture138 est donc inaccessible par le bouton de démarrage public final, bien que toujours présent dans le fichier.

Seam unique envisagé : supprimer exactement la section `/* ---------- démarrage Capture ... */` jusqu'à la section traduction, **724 octets**, et rien d'autre. Blob cible calculé : `644fc5d0ce5fd195c5496d42cc0204bd1f9a9831`, 8 164 674 octets. Le patch inverse restaure byte-exact le blob source.

**Ne jamais retirer les autres responsabilités de Capture138 :** détection de contexte, tour, étiquettes, overlay créature, normalisation d'affinités, cible de combat, application des capacités, IA et rendu combat. Ne pas déplacer `renderCaptureWorldHub` ni son garde V151, SessionStart, ScreenReturn ou HubEntry. Aucun changement de Dungeon, Survie, PvP, Tactical, sauvegarde, PWA, laboratoires ni `main`.

## RED et GREEN local
Test : `tests/gens_phase9_capture138_legacy_start_retirement_v1.test.cjs`. Test local du fichier exact : **RED attendu** car l'interception existe encore. Une **copie locale temporaire** avec le seul seam supprimé donne **GREEN**, démontrant parité VM du vrai Capture138 + du propriétaire Shell final, absence de timer 30 ms sur le démarrage public, neuf autres responsabilités conservées et rollback blob byte-exact. Ceci n'est **pas** un GREEN GitHub runtime.

La migration doit également mettre à jour les empreintes dans les sentinelles actives, l'inventaire Phase 2 (nombre d'assignations globales, timers et owners) et préserver explicitement les oracles de rollback des lots précédents. Un repin aveugle des anciens témoins est interdit.

## Suite obligatoire
1. Conserver ce premier commit RED distinct.
2. Construire/appliquer sur cette branche **seulement** un patch exact vérifié, après avoir cartographié toutes les sentinelles qui attendent encore la chaîne historique. Le gros index transite sur le runner depuis le dépôt, pas via les connecteurs.
3. Lancer GREEN ciblé, les tests historiques composés et rollback byte-exact ; puis Architecture + Browser, Firefox, Tactical au même SHA. Toute CI rouge interdit checkpoint et preview validée.
4. Proposer preview smartphone et attendre validation utilisateur avant checkpoint fonctionnel final.


## Application réelle sur GitHub — c6cc7ef26327dacc7a7ef72507b002ef4c127a1f

- Source Rule 26 utilisateur rigoureusement vérifiée. RED publié sur `d9f1e2e535a89b17f9f8ec36eeb27eb5c713f629`.
- Dry-run `37966286703` **SUCCESS** : RED réel, patch candidat GREEN, empreinte et rollback exact, analyse d'impact de 107 anciennes références de blob et 105 anciennes références de taille dans les tests.
- One-shot `37966631255` **SUCCESS**, commit runtime `c6cc7ef26327dacc7a7ef72507b002ef4c127a1f` sur branche dédiée ; strictement 19 lignes de `index.html` supprimées (724 octets), Git blob cible `644fc5d0ce5fd195c5496d42cc0204bd1f9a9831`.
- Les quatre inventaires Phase 2 ont des empreintes cohérentes ; les sentinelles actives ont leur empreinte courante et les deux oracles historiques Hub sont byte-exact après réapplication inverse du seam. La parité VM du lancement public Shell et les tests ciblés de propriétaire sont GREEN sur le runner.
- Aucune modification `main`, Dungeon, Survie, PvP, Tactical, laboratoires ou sauvegardes.
- **Barrière de clôture** : triple CI Architecture+Browser / Firefox / Tactical sur le prochain commit de nettoyage documentaire, puis preview smartphone et validation utilisateur. Jusqu'à ces conditions : **candidat technique, pas checkpoint GREEN fonctionnel**.
