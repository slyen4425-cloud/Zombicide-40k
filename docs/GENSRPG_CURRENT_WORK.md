# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**Correctif Dungeon V108 GREEN technique/CI — validation manuelle Android encore attendue.** Phase 12 extraction R06 **suspendue** tant que le retour terrain n'est pas disponible. `main` reste gelée. Le problème distinct de détection des monstres en exploration reste à diagnostiquer.

## Correction bornée validée : panneau d'actions Tactical V108

- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-green-2026-10-17`, commit code exact **`32b5120f26fe8d01dcd6c602b82630fa27bbf23e`** (https://github.com/slyen4425-cloud/Zombicide-40k/tree/checkpoint/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-green-2026-10-17).
- **Branche de travail** : `work/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17` ; commit documentaire postérieur possible sans changer le code GREEN.
- **Checkpoint START** : `checkpoint/gensrpg-start-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17`, SHA `7ac97a36df9f31f2cc3f7640e857ffc59963574c`.
- **Modifications runtime limitées** : `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js` et `assets/gensrpg/tactical/entry-v1.js` ; raccord V108 à la disponibilité de l'UI Tactical lazy, abonnement unique au contrat `onAfterRender`, désabonnement au dispose. Aucun moteur de combat ni `index.html` modifié ; ni timing dés, portée, rapprochement, IA, dégâts ou sauvegardes.
- **Suite testée sans installation manuelle artificielle** : Dungeon lancé, ennemi ciblé, rapprochement légitime, panneau Attaque / Arme / Objet persistant, clic Attaquer, dés visibles du héros (Continuer exigé), dés de l'ennemi (Continuer exigé), absence d'enchaînement automatique pendant chaque attente ; validation en prévisualisation locale et externe simulée sur Chromium mobile.
- **Sept checks SUCCESS au SHA code unique** : [Architecture+Chromium 39027235756](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235756), [Firefox 39027235760](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235760), [Tactical 39027235759](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235759), [Dungeon preview combat E2E 39027235758](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39027235758).
- **Prudence** : prévisualisation externe non équivalente à GitHub Pages/PWA native : Supabase et QR CDN simulés comme indisponibles dans le test, pas de sauvegardes privées, ni preuve d'installation sur Android. Retour utilisateur requis. La détection terrain de monstres et les autres situations de jeu ne sont pas garanties par un seul scénario de combat.
- **Preview isolée** : https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/32b5120f26fe8d01dcd6c602b82630fa27bbf23e/preview.html ; source épinglée, sans publication `main`.
- **Rapport** : `docs/GENSRPG_PHASE12_DUNGEON_TACTICAL_V108_PANEL_REBIND_FIX_2026-10-17.md`. R06 non ouvert.

---

## Correctif borné — Tactical V108 panneau d'actions (charte §25)

- **Base exacte** : `7ac97a36df9f31f2cc3f7640e857ffc59963574c`, diagnostic navigateur ayant reproduit Dungeon carte → approche valide → attaque → dés et tour adverse **uniquement après réinstallation MANUELLE du panneau V108 dans le banc de test**.
- **Checkpoint de départ** : `checkpoint/gensrpg-start-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17` sur ce SHA.
- **Branche unique** : `work/gensrpg-phase12-dungeon-tactical-v108-panel-rebind-fix-2026-10-17`.
- **Source index §26** : `c8.zip`, 2 781 436 octets / blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f` ; **index.html ne sera pas modifié**.
- **Propriétaire** : interface Tactical V108, module `assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js` ; raccord explicite à l'activation via `assets/gensrpg/tactical/entry-v1.js`. Un seul panneau et une seule autorité de commandes ; aucun observateur body/html.
- **Cause identifiée** : V108 `installWithRetries` peut s'exécuter AVANT l'UI Tactical chargée à la demande ; `installed=true` malgré `hookUiRender()` non établi. La page peut cacher l'attaque historique sans remonter le panneau V108. Re-rendu lors des sélections et des mouvements efface le panneau absent.
- **Périmètre** : brancher V108 lorsque l'UI est réellement chargée, utiliser le callback contractuel `GensRpgTacticalCombatV2Ui.onAfterRender` pour remonter le panneau après chaque rendu, cleanup explicite ; aucun changement au moteur, déplacements/portées, IA, dégâts, timing de dés, sauvegardes.
- **Protections** : test Chrome mobile du parcours réel, sans réinstallation artificielle ; distance et approche légitimes, Attaque/Arme/Objet visibles après ciblage et déplacement, dés héros et ennemi bloquants jusqu'au bouton Continuer, aucune frappe en boucle. Triple CI Architecture/Chromium, Firefox, Tactical même SHA ; checkpoint GREEN si et seulement si preuves intégrales. Production `main` et les laboratoires intacts ; pas de R06.
- **Prochain** : retirer la rustine du **test uniquement**, adapter raccord d'activation, puis exécuter ces contrôles et vérifier le résultat avant de proposer une nouvelle preview.

---

# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**PHASE 12 EN PAUSE / TEST UTILISATEUR BLOQUANT : Dungeon combat non validé sur prévisualisation externe.** D1–D9/R01–R05 restent GREEN **technique CI**, mais leur validation manuelle est insuffisante ; pas de R06 ni de publication sur `main`.

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
