# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**PHASE 12 EN PAUSE / TEST UTILISATEUR BLOQUANT : Dungeon combat non validé sur prévisualisation externe.** D1–D9/R01–R05 restent GREEN **technique CI**, mais leur validation manuelle est insuffisante ; pas de R06 ni de publication sur `main`.

## Retour terrain aggravé / anti-faux-GREEN

- **Utilisateur** : le combat démarre normalement puis se dérègle après ~3 tours ; embuscade avec monstre éloigné, détection incohérente. **BLOCAGE MANUEL OUVERT** : ni nouveau lien de preview dite prête ni R06 ni merge `main`.
- **Échec long prouvé** : [39031194199](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39031194199) : deuxième tour → action « Choisis d’abord une cible », aucun dé, bien que héros actif, portée valide et panneau visible. `refreshSelection` effaçait la cible choisie au passage du tour ennemi.
- **Correctif UI strict** : `3084c86d6c5a1af0ec6165a5d5d927bffbf8057c` préserve la cible choisie, sans auto-attaque et sans modification des règles. [39031317603](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39031317603) : SUCCESS du **scénario réel local/externe sur quatre cycles**, dés héros/ennemi avec pauses, V108 commandes présentes. Ne pas déclarer checkpoint complet sans les sept checks au même SHA et revue des défauts restants.
- **Embuscade : raccord suspect identifié** : `assets/dungeon/dungeon-event-runtime-fix-167878.js` est bien pré-caché et répertorié, mais absent des scripts `index.html`, `preview.html`, de l'injection `main.yml` et du bootstrap Core. Test unitaire mocké ne prouve pas l'exécution réelle. Vérifier aucun autre chargeur, puis lot borné de raccord et test vrai spawn.
- **Détection** : V113 seul propriétaire autorisé. Ne pas réinstaller les hooks retirés V108/V111/V112 ; auditer la vraie trajectoire déplacement/événement/Bridge et les filtres room/branche avant modification.
- Rapport détaillé : `docs/GENSRPG_PHASE12_DUNGEON_COMBAT_PREVIEW_REGRESSION_DIAGNOSTIC_2026-10-17.md`.

## Correctif borné après preuve — Tactical V108, commandes d'attaque

- **Preuve [run 39014482141](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39014482141)** : les deux previews atteignent le combat réel, le déplacement légitime hors portée → à portée, puis le dé du héros et du monstre avec pauses « Continuer », MAIS seulement après appel **artificiel dans le test** à `GensRpgTacticalPolish1678108.install()`.
- **Défaut caractérisé** : la façade Tactical charge sa UI privée à la première entrée en combat, après la fenêtre des retries initiaux V108 ; `GensRpgTacticalPolish1678108.status().installed` peut être true avec `GensRpgTacticalCombatV2Ui.render` non raccordée et aucun panneau. À chaque rendu de ciblage/approche, le panneau manque, l'ancien bouton masqué par CSS reparaît.
- **Périmètre de correction autorisé** : **uniquement** le raccord lifecycle/after-render de `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js` ; utiliser le hook officiel Tactical `onAfterRender` et l'événement existant `gensrpg:tactical-combat-ready`. Ne pas créer de seconde autorité, de timers infinis, ni retoucher stats/dés/IA/détection/portée. Nettoyer le listener et le hook en `dispose()`.
- **Sentinelle de non-artifice** : retirer la réinstallation manuelle du banc de test et exiger explicitement le panneau V108, à chaque rendu y compris après approche, avant attaque. Tests ancien V108, scénario navigateur local/externe, 3 CI au même SHA. Aucun checkpoint GREEN avant validation.
- R06 suspendu ; aucune modification de `main`.

## Diagnostic isolé après retour utilisateur

- **Constat** : navigation entre les modes OK ; Dungeon exploration/rencontres : détection des monstres peu fiable ; en combat, après déplacements initiaux, appui sur attaque puis résultats de coups enchaînés héros/ennemis, absence d'animation des dés et de sélection d'objets/actions. **Régression signalée par l'utilisateur, cause inconnue.**
- **Base charte §25** : `5f6eaf3933c521f1fa43ffea9808f59eeb7a54a6`, HEAD de clôture documentaire R05, runtime du checkpoint R05 GREEN `a832da1cbbad39c446f46f1035dbb819aa60ec20`.
- **Checkpoint START** : `checkpoint/gensrpg-start-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17` sur `5f6eaf3933c521f1fa43ffea9808f59eeb7a54a6`.
- **Branche unique** : `work/gensrpg-phase12-dungeon-combat-preview-regression-diagnostic-2026-10-17`.
- **Source exacte §26 disponible** : `c8.zip` / `index.html(18).txt`, 2 781 436 octets, blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`, R05 GREEN.
- **Périmètre** : diagnostic reproduisant le vrai flux Dungeon (exploration → rencontre → combat tactique → sélection d'action/objet → animation dés), comparaison prévisualisation externe vs chargement local/GitHub Pages. Seules modifications possibles avant preuve : tests, rapport, preview isolée ; pas de changement moteur/AI/stats ni gameplay.
- **Hypothèse vérifiable** : `preview.html` charge les 29 modules d'appoint en externe **après** `DOMContentLoaded`, mais l'injection GitHub Pages les charge en phase parser avant DOMContentLoaded ; la composition peut diverger malgré sa CI de présence.
- **Fonctions protégées** : modules Dungeon Tactical V2, Dice, Core, Shell et historique R01–R05 ; pas de changement `main`, laboratoires combat/exploration ou des sauvegardes.
- **Gates** : test navigateur réel mobile pour le cycle rencontre/attaque/dés/actions, absence de boucle d'auto-frappes, comparaison preview vs production, sentinelles existantes Architecture/Chromium, Firefox, Tactical. Aucun checkpoint GREEN avant démonstration et CI sur le même SHA ; aucune fusion automatique.

## Référence R05 GREEN avant diagnostic

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
