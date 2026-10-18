# GenSrpG — CURRENT_WORK officiel (18 octobre 2026)

## R06 — TERMINÉ : GREEN technique et validation utilisateur Capture

- **Checkpoint final immutable** : `checkpoint/gensrpg-phase12-r06-capture-legacy-patches-green-2026-10-18` au SHA exact `41a709f3478ded45b12b770435a96ad3f344faf3`. Branche chantier `work/gensrpg-phase12-r06-inline-owner-scope-2026-10-18`, départ `checkpoint/gensrpg-start-phase12-r06-inline-owner-scope-2026-10-18` sur `4dd865a45634b7367ce66a526feae58b923edef9`.
- **Quatre CI SUCCESS sur ce même SHA** : [source 39105851988](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39105851988), [Firefox 39105851959](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39105851959), [Tactical 39105851951](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39105851951), [Architecture + Chromium 39105851970](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39105851970) : 359 étapes statiques et 64 étapes du job Chromium réussies.
- **Périmètre** : 18 scripts historiques contigus Monster Capture, 140 211 octets, relogés byte-exact dans `assets/gensrpg/capture/legacy-patches/`, `index.html` réduit de 139 000 octets à 2 643 155 octets ; ordre parser, chargements synchrones, propriétaire Capture unique, PWA et rollback vérifiés. Aucun changement moteur ni donnée de sauvegarde.
- **Validation manuelle utilisateur : ACCORD EXPLICITE le 18 octobre 2026 (« Yes c est ok 👍 »)** sur [preview immuable R06](https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/41a709f3478ded45b12b770435a96ad3f344faf3/preview.html), surtout lancement Capture, retour Shell, jour suivant, reprise sauvegardée. GREEN technique + accord manuel utilisateur sont acquis ; ne pas présumer des tests non explicitement détaillés par l'utilisateur.
- **Prochaine décision** : retour Capture obtenu et R06 clos. Avant R07/D10, nouveau START §25 obligatoire. Ensuite audit du code inline résiduel pour quelques groupes homogènes de vraie portée ou clôture si gains marginaux ; pas de micro-lots par inertie. Pour toute nouvelle extraction `index.html`, ZIP utilisateur exact du SHA requis §26.
- **Intouchables** : `main` (`e8681f9823573ced8aec59c8ddc47a72b02bc663`), les 4 modes, laboratoires, 32 images Survie historiques, PWA, sauvegardes, Dungeon V113/Tactical et murs générés restent protégés. Le commit documentaire postérieur au GREEN n'est pas un nouveau SHA de certification.

Toutes les anciennes mentions « R06 non GREEN » ou « validation manuelle en attente » ci-dessous sont conservées comme historique et remplacées par le statut final validé.

---

## REPRISE EN COURS — Phase 12 / R06 Capture — extraction physique publiée, CI finale obligatoire

- **Source utilisateur §26 reçue et vérifiée** : `d1.zip`/`index.html(1).txt`, 2 782 155 octets, blob Git `b33542b033c5afa8a1643d99c56c21dbd4be266c` identique au checkpoint START `4dd865a45634b7367ce66a526feae58b923edef9`. Les mentions « source attendue » dans le pré-audit historique ci-dessous sont closes.
- **Extrait sur branche R06** : les 18 scripts historiques et contigus Capture (140 211 octets) sont externalisés **sans changement du code JS**, avec 18 chargements classiques, synchrones, ordonnés, même identifiant et position parser, sous `assets/gensrpg/capture/legacy-patches/`. Nouveau `index.html` : 2 643 155 octets, blob `12fc91df4ee4c7989a172baa96f9790da6dc57f7`, réduction de 139 000 octets. Application validée par [run 39076266755](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39076266755), code commit `a72f0cc8e81a433cef933888c2cf502e1cb05442`.
- **Autorités** : propriétaire Capture unique pour chaque ancienne logique ; entrée publique, session, écran retour, monde, roster et combat Core Capture inchangés. PWA précache les 18 fichiers, carte des propriétaires physiques étendue de 107 à 125 sans nouveau moteur. Les historiques D1–D9 / R01–R05 restent byte-exact via rollback test-only et leurs empreintes originales restent figées. Aucun travail sur `main`, Dungeon, Survie, PvP ni les laboratoires.
- **Sentinelles** : contrôle rapide [39078270215](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39078270215) SUCCESS, incluant 16 scénarios Phase 9 et les tests de départ/retour Capture ; Firefox et Tactical déjà verts sur des commits de travail intermédiaires. **Le run Architecture/Chromium complet doit encore réussir au MÊME SHA que tous les autres workflows.** Aucun checkpoint R06 GREEN ni publication tant que cela n'est pas acquis.
- **Rapport R06** : `docs/GENSRPG_PHASE12_R06_CAPTURE_LEGACY_PATCHES_2026-10-18.md`. Le point de départ `checkpoint/gensrpg-start-phase12-r06-inline-owner-scope-2026-10-18` reste immuable à `4dd865a4`; état code R06 en attente de certification. Retour utilisateur du Dungeon précédent : VALIDÉ. Nouveau test manuel ciblé Capture prévu après la CI. Ne pas ouvrir R07 ou D10 en parallèle.

## CHANTIER ACTIF — Phase 12 / R06 : bornage du prochain propriétaire inline

- **Validation utilisateur reçue le 18/10 (heure de France)** : les combats, embuscades et murs de Dungeon sont acceptés sur la [preview du checkpoint](https://html-preview.github.io/?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/4dd865a45634b7367ce66a526feae58b923edef9/preview.html). Cette validation **lève le blocage de reprise** de Phase 12 ; les mentions de « pause / pas de R06 » dans l'historique ci-dessous concernent les états précédents et ne sont plus la consigne courante.
- **Dernier GREEN technique ET manuel** : `checkpoint/gensrpg-dungeon-generated-wall-texture-green-2026-10-17`, SHA exact `4dd865a45634b7367ce66a526feae58b923edef9`. Quatre workflows SUCCESS sur ce même SHA : [murs/Dungeon 39072738371](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738371), [Firefox 39072738376](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738376), [Tactical 39072738379](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738379) et [Architecture/Chromium 39072738381](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738381). Ce checkpoint inclut les correctifs de combat et de murs. Aucun merge `main`.
- **R06 — START §25** : `checkpoint/gensrpg-start-phase12-r06-inline-owner-scope-2026-10-18` sur ce même SHA exact. **Branche dédiée** : `work/gensrpg-phase12-r06-inline-owner-scope-2026-10-18`, créée depuis ce point. Elle ne réutilise aucune branche historique D1/D9 ou de diagnostic et ne crée aucun propriétaire runtime parallèle.
- **Référence Phase 12** : D1–D9 déjà GREEN, R01–R05 déjà GREEN. La dernière extraction physique R05 a externalisé **53 746 octets** de synchronisation Core sans changement JS ; sa validation est conservée. R06 ne relance **pas** D10/Core203 par inertie. La Phase 12 demeure inachevée.
- **Source exacte R06 §26** : `index.html` du checkpoint de départ = **2 782 155 octets**, blob Git **`b33542b033c5afa8a1643d99c56c21dbd4be266c`**, contrôlés par métadonnées de l'arbre Git. Les ZIP historiques `c8.zip` / R05 concernent l'ancien blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f` (2 781 436 octets) et **ne sont pas** une source actuelle R06. Pour tout transfert/lecture exacte du contenu, obtenir le ZIP du [fichier au SHA de départ](https://github.com/slyen4425-cloud/Zombicide-40k/blob/4dd865a45634b7367ce66a526feae58b923edef9/index.html), contrôler taille et blob avant d'agir.
- **Périmètre de cette sous-étape** : audit du propriétaire candidat à partir des cartes d'autorité et de l'inventaire existants, contrôle des fichiers externes déjà GREEN, sélection d'une **responsabilité homogène**. Aucun mouvement du HTML/JS sans source exacte §26 ; aucune refonte de moteur, aucune migration d'assets. Documentation de pré-audit : `docs/GENSRPG_PHASE12_R06_OWNER_SCOPE_2026-10-18.md`.
- **Invariants protégés** : Shell/navigation, Survie et sauvegardes, Capture isolé, Dungeon exploration (authored/généré), seul détecteur V113/Bridge Tactical, dés et objets, texture murale `dng_wall_block.jpg` sur murs générés, Core storage/cloud, manifeste PWA et rollback R05→R01. Les deux laboratoires et les 32 images Survie historiques restent hors périmètre. `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- **Gates R06** : source ZIP exacte, candidat mono-propriétaire avec dépendances/ordre parser, extraction byte-identique et restauration du HTML exact, vérification manifest/cache PWA, tests unitaires + navigateurs réels Survie/Dungeon/Capture/PvP/Tactical, Architecture/Chromium + Firefox + Tactical SUCCESS sur **le même SHA**, checkpoint GREEN distinct et revue manuelle si comportement visible. **Aucun R06 GREEN à ce stade.**

## Historique conservé des chantiers précédents (lecture seule)
# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

## Chantier actif — murs des donjons générés (retour manuel validant les combats)

- **Retour utilisateur** : combats et embuscades semblent corrigés dans la preview du commit `83d379501e8fe2863471fbe0f10cdfb4f295576c`. **Défaut restant** : texture des murs en donjon **généré** ; texture des murs Builder, y compris en jeu, correcte et **à préserver**.
- **Branche exclusive** : `work/gensrpg-dungeon-generated-wall-texture-2026-10-17`. **Checkpoint START** : `checkpoint/gensrpg-start-dungeon-generated-wall-texture-2026-10-17`, base exacte `83d379501e8fe2863471fbe0f10cdfb4f295576c` (quatre suites CI vertes). Le précédent chantier Phase 12 reste suspendu, `main` intacte.
- **Diagnostic vérifié §26** : `c8.zip/index.html(18).txt`, 2 781 436 octets, Git blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`, égal au blob `index.html` de la base. Core 0.79 `polish079()` confond les classes `.wall` et `.cover` et applique `cover079()` (image `dng_floor_cave/water`) aux deux ; la texture murale Builder existante est `assets/dungeon/creatures/dng_wall_block.jpg`.
- **Périmètre strict** : différencier `.wall` et `.cover` **dans le peintre canonique Core 0.79 lui-même**, sans ajouter de seconde autorité peinture, sans modifier les autres modules, les stats, les dés, la génération de salles, les données Builder ni les règles du combat. Conserver `cover079()` pour les couverts et `floor079()` pour les sols.
- **Correction ciblée déposée** : commit `7651013ef10b6810967309dd4c1c11258a8dfa12`, dans le seul script inline canonique `dungeonCore079MapPolish` de `index.html` : mur généré → `dng_wall_block.jpg` (classe `dc079WallBlock`), couvert → `cover079()` inchangé, sol → `floor079()` inchangé. Aucune nouvelle autorité runtime ni nouveau fichier visuel ; correctif du monolithe réalisé depuis la copie ZIP vérifiée, avec modification contrôlée sur SHA et auto-retrait de l'outil de transformation. Blob `index.html` corrigé : `b33542b033c5afa8a1643d99c56c21dbd4be266c` (ancien `485de2e6a08ffd89e4f1fb9410e40c938774d62f`).
- **Validation en cours** : [GenSrpG generated Dungeon wall material regression](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39071456216) ; couvre le rendu de la carte, Tactical et retour, tests authored, combat quatre cycles et embuscades. Architecture, Firefox et Tactical sont relancés sur ce lot. **Pas de preview recommandée tant que les CI ne sont pas vertes sur un même SHA.**
- **Compatibilité des sentinelles de restructuration** : les vérificateurs historiques reconstruisent, **en mémoire uniquement et sur correspondance stricte du nouveau blob**, l'ancien fichier R05 byte-exact avant leurs comparaisons D9→R01 et Phase 9. Le manifeste du runtime courant, lui, conserve la **nouvelle** empreinte `b33542b033c5afa8a1643d99c56c21dbd4be266c`. Aucun historique n'est réécrit, aucune autorité supplémentaire dans le jeu. Le jalon Structure/Architecture [run 39072455193](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072455193) a réussi ses contrôles statiques au SHA `77a12c0c87c6442d7dec237595e5a655ba00649c` ; sentinelle navigateur en cours à cet instant.
- **Gates** : test source isolé Core 0.79 (mur/cover/sol, callback idempotent), navigateur Dungeon généré → Tactical → retour conserve la même image, tests authored Builder, Firefox, Tactical et Architecture. Aucun R06 ni merge ni checkpoint GREEN métier sans validations utilisateur.


## Reprise vérifiée — correctifs ciblés du 17 octobre (état le plus récent)

**Ne pas lancer R06, ne pas fusionner `main`, ne pas déclarer le donjon GREEN.** Les sections ci-dessous conservent les observations historiques ; le présent bloc supersède leurs hypothèses désormais vérifiées.

- Base §26 recontrôlée : `c8.zip/index.html(18).txt`, 2 781 436 octets, blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`. `index.html` reste inchangé.
- Le vrai scénario Chromium local + preview externe termine **quatre cycles** avec action visible, approche légitime, cible conservée et animation D100 interrompue par confirmation ; aucune autorité de dés supplémentaire.
- L'événement réel d'embuscade utilise à présent `dungeon-event-runtime-fix-167878.js` ; adversaire adjacent au héros (**distance 1**) dans les deux compositions.
- Diagnostic bloquant ajouté sur la carte native : au retour de Tactical, **case 5** `stone_01` (renderer Dungeon 0.80) au lieu du couvert `cave_01` (propriétaire 0.79). Trace [run 39061788861](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39061788861). Correctif dans `assets/dungeon/dungeon-source-render-stability-167877.js` : microtâche bornée déclenchée par le seam **déjà propriétaire** `dungeonMapHtml`, réappliquant le peintre 0.79 existant après le vrai rebuild 0.80, sans observer ni nouvel algorithme. Run [39062138586](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39062138586) : la parité des 25 cellules passe désormais.
- Une erreur additionnelle du vrai `dispose()` Tactical a alors été mise au jour : `STYLE_ID` non déclaré. Corrigée dans `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js` en nettoyant uniquement `gensTacticalV2Style`, `gtv21147DiceStyle` et `gtv271GeneralCombatRule`. Commit `3039e2870c797ec1bc3b23d097f522a3ab99e85b`, sentinelles de ce SHA en cours.
- Le workflow de diagnostic lance le **test de continuité de carte en premier**, puis le parcours long et l'embuscade, pour ne plus masquer l'échec derrière plusieurs minutes d'autres tests.
- Détection V113 : propriété unique conservée ; ni nouveau scan concurrent ni correction arbitraire de la vision. Reste à valider la détection après vrai mouvement, ainsi que les commandes d'inventaire/objet avec session non artificielle.
- Le checkpoint final §25 dépend des sentinelles Architecture + Chromium, Tactical dock, Firefox walls et diagnostic sur **un même SHA** ; revue utilisateur nécessaire avant preview déclarée prête.


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
