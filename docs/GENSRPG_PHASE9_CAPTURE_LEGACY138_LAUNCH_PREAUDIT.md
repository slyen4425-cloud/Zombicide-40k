# GenSrpG — Phase 9 — Préadit chemin de lancement historique Capture138

Date : 9 octobre 2026. **Périmètre exclusivement documentaire + sentinelle du contrat public Capture. Aucun runtime modifié.**

## Gouvernance et base vérifiée

- Dépôt : `slyen4425-cloud/Zombicide-40k`.
- Source exacte et dernier HEAD documentaire contrôlé : `35ac5a66b4e367bb8463beb757078134e818922d` ; parent fonctionnel validé `1a80044e0fb29d0a635994cb94d69a55afbf1078`.
- CI source sur `35ac5a66b4e367bb8463beb757078134e818922d` : Architecture + Browser [37951626194](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37951626194), Firefox [37951625914](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37951625914), Tactical [37951626058](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37951626058), toutes SUCCESS.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-legacy138-launch-preaudit-2026-10-09`, pointant sur `35ac5a66b4e367bb8463beb757078134e818922d`.
- Branche autonome : `work/gensrpg-phase9-capture-legacy138-launch-preaudit-2026-10-09`.
- Production `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`; aucun merge ou déploiement.
- Chantier parallèle `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` : HEAD `e537678c68c43d7f58899f55d58341421caf90ad`, origine `8b33eddbc8e57453e7cf5159c07e04762aa64827`. Il est **divergent** et son périmètre fermeture/démontage est exclu du présent préaudit.

## Autorités existantes à préserver

1. `assets/gensrpg/capture/entry-v1.js` / `GensCaptureV1` : enregistrement public Shell `capture`, vérification du module actif, délégation unique au SessionStart existant.
2. `session-start-v1.js` : initialisation des participants, de la session et entrée dans le monde ; le démarrage n'appartient plus à Capture139.
3. `screen-return-v1.js` : provider de retour au Hub ; ce n'est **pas** la fermeture de session.
4. `hub-entry-v1.js` : transition DOM et rendu du Hub via `renderCaptureWorldHub` historique, ce dernier ayant des effets métier non triviaux.
5. Le test de caractérisation antérieur `gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs` établit sur son oracle historique que Capture138 intercepte `startConfiguredGame`, utilise `setTimeout` et appelle `renderCaptureWorldHub`. Le test Phase 5 `gens_phase5_startconfiguredgame_remaining_chain_preaudit_v1.test.cjs` confirme une chaîne d'autorités historiques. **Aucune conclusion de redondance n'est permise sur cette seule base.**

## Question isolée — propriétaire Capture138

Déterminer si le wrapper de lancement de `captureFix138` exécute encore une transition nécessaire lors d'un démarrage réel ou si le nouveau propriétaire Capture rend tout ou partie de ce chemin obsolète. En particulier, distinguer :
- invocation publique du lancement Capture par Shell ;
- éventuel chemin historique `startConfiguredGame` encore accessible ;
- délai borné / mise à jour de `renderCaptureWorldHub` ;
- effets sur changement d'univers et reprise, sans entrer dans la fermeture de session ;
- consommateurs Dungeon/Survie de la même chaîne globale.

**Ne pas retirer `captureFix138`, `gensStability151`, `renderCaptureWorldHub`, `isDungeonMode()` ni une protection historique sans parité du vrai chemin.** Aucun nouveau wrapper, timer, routeur ou source de vérité.

## Tests et limite de ce lot

Sentinelle ajoutée : `tests/gens_phase9_capture_legacy138_launch_boundary_preaudit_v1.test.cjs`, lancée dans Architecture. Elle exécute le **véritable fichier public** `entry-v1.js` dans une VM avec un Shell instrumenté : seule l'identité Capture démarre le SessionStart existant ; un lancement historique empoisonné ne doit jamais être appelé par ce provider ; aucun second propriétaire externe n'apparaît. Elle vérifie aussi le contrat et l'absence de copie du chemin historique dans les quatre modules externes.

Cela **ne prouve pas** l'inactivité du wrapper historique dans le vrai navigateur. Il faudra un RED de caractérisation du scénario réel avant un transfert runtime. Les anciens tests et les Browser/Firefox/Tactical restent les sentinelles de non-régression.

## Porte stricte Rule 26 / prochaine décision

L'arbre Git de `35ac5a66b4e367bb8463beb757078134e818922d` confirme `index.html` = **8 165 398 octets**, Git blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`.

Pour examiner le véritable corps `captureFix138`, obtenir impérativement le fichier de ce SHA exact :

https://github.com/slyen4425-cloud/Zombicide-40k/blob/35ac5a66b4e367bb8463beb757078134e818922d/index.html

Téléchargement utilisateur, ZIP si nécessaire ; vérifier taille et hash Git avant inspection. `worki.zip` est antérieur et **non réutilisable**. Après contrôle : cartographier appels réels et produire une sentinelle RED sur **une seule** responsabilité démontrée, avec oracle avant/après et rollback byte-exact. Si le chemin est nécessaire, le garder ; si transférable, déplacer le strict minimum et retirer l'ancienne autorité dans le même lot séparé.

Ce préaudit ne justifie à lui seul **aucun** checkpoint GREEN fonctionnel. La triple CI du commit documentaire/test doit réussir sur le **même SHA** pour clore ce préaudit technique.
