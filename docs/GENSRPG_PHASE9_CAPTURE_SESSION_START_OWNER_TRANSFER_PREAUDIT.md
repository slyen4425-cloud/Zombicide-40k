# GenSrpG — Phase 9 — Préaudit transfert du propriétaire de démarrage Capture

Date : 2026-10-06.

## Base

- Branche : `work/gensrpg-phase9-capture-session-start-owner-transfer-preaudit-2026-10-06`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-session-start-owner-transfer-preaudit-2026-10-06`
- Base exacte : `194112b90aa50727fb3e33be1b3bc8b7b52c6b10`
- GREEN précédent : `checkpoint/gensrpg-phase9-capture-top-level-entry-preaudit-green-2026-10-06`
- Triple CI de base : Architecture+Browser `37506319577`, Firefox wall `37506319678`, Tactical dock `37506319532` — SUCCESS
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

Le préaudit précédent a verrouillé que :
- `GensCaptureV1` possède déjà l'identité Capture canonique et le provider public du Shell ;
- `GensCaptureV1.startModuleSession()` délègue encore à `legacyStartConfiguredGame` ;
- cette référence est liée explicitement depuis le propriétaire historique inline Capture139 ;
- le contrat Capture nomme encore Capture139 comme initialiseur de session temporaire ;
- le retour écran `moduleScreenReturn` reste une dette séparée et ne doit pas être mélangé à ce lot.

## Mission unique

Identifier, dans le propriétaire exact Capture139, le plus petit transfert d'ownership permettant au module Capture de posséder réellement son démarrage de session sans créer un second initialiseur actif.

Aucune mutation runtime n'est autorisée pendant ce préaudit.

## Rule 26 — gate obligatoire

Le corps exact de Capture139 vit dans le gros `index.html`. La charte interdit de le faire transiter par le connecteur GitHub.

Le fichier requis est celui du SHA de départ exact :
`194112b90aa50727fb3e33be1b3bc8b7b52c6b10`.

Le runtime n'a pas changé entre le GREEN précédent et ce checkpoint :
- taille connue : `8166499` octets ;
- blob Git connu : `20381d1df0b10b664d5163f308f909cd7a6e45df`.

Avant toute inspection locale :
1. télécharger l'`index.html` du permalink exact du SHA de départ ;
2. joindre le fichier, de préférence compressé en ZIP ;
3. vérifier taille et blob Git ;
4. seulement ensuite inspecter Capture139 et sélectionner un seam unique.

## Périmètre protégé

Ne pas modifier dans ce préaudit :
- `GensCaptureV1.isProfile()` ;
- classifier famille Capture/Survie ;
- Shell module-launch final ;
- provider public Capture ;
- profils, seeds et migrations ;
- participants ;
- pré-game ;
- retour écran / goMenu ;
- Dungeon, Survie, Tactical, PvP ;
- combat Capture, exploration Capture et laboratoires ;
- assets, PWA, gameplay et sauvegardes.

Interdits :
- copier tout Capture139 vers un nouveau fichier par défaut ;
- garder deux initialisateurs de session actifs ;
- wrapper global ;
- observer ;
- timer/retry/polling ;
- fallback implicite ;
- déplacement multi-responsabilités.

## Questions à résoudre sur le fichier vérifié

1. Quelles lignes/fonctions exactes de Capture139 constituent réellement l'initialisation de session Capture ?
2. Quelles dépendances de ces lignes sont Capture-owned, Core partagé ou encore historiques ?
3. Quelle référence publique owner-local minimale peut remplacer le binding `legacyStartConfiguredGame` ?
4. Peut-on transférer une responsabilité à la fois sans déplacer gameplay/UI/retour écran ?
5. Quel RED exact prouvera qu'avant transfert le module public ne possède pas la session, puis quel inverse byte-exact garantira le rollback ?

## Sortie attendue du préaudit

Un rapport d'ownership, un seam minimal unique, un plan TDD RED/GREEN et la liste stricte des fragments autorisés. Le runtime reste inchangé tant que ce préaudit n'est pas clos.

Aucun merge/deploy main.


## Rule 26 exécutée — résultat exact

Le fichier inspecté a été reconstruit localement depuis l'archive utilisateur déjà fournie et les deltas GitHub du GREEN, puis vérifié contre le SHA cible avant lecture :
- taille : `8166499` octets ;
- blob Git : `20381d1df0b10b664d5163f308f909cd7a6e45df` ;
- SHA-256 : `9bace694ada4e3dd3701ebf6803a53df298ed3079150dd366633974f38f3fc1b`.

Le corps exact de `captureFix139` possède actuellement l'initialisation de session Capture. Il :
1. normalise et valide les participants ;
2. exige les créatures de départ ;
3. fixe `current` et recharge `state` ;
4. persiste les participants, héros personnalisés et or de pré-game ;
5. active la session ;
6. initialise jour/tour/round/localisation du monde Capture ;
7. garantit les kits de départ ;
8. applique le réglage du gestionnaire de tours ;
9. entre dans le monde Capture ;
10. effectue une seconde entrée bornée après 1200 ms.

Le Shell final est déjà l'autorité globale de lancement : `assets/gensrpg/shell/module-launch-final-authority-v1.js` remplace `startConfiguredGame()` par un routage générique vers `GensShellModuleLaunchV1.startModuleSession(moduleId)`. Aucun changement Shell n'est donc nécessaire ni autorisé pour ce transfert.

## Classement des dépendances

Capture-owned existant :
- `gensCaptureParticipantsReady` ;
- `captureWorldState` / `saveCaptureWorldState` ;
- `captureEnsureStarterKitsForParticipants` ;
- `captureEnterWorld139` (consommé temporairement ; sa propriété écran reste un futur lot distinct).

Services partagés existants :
- `normalizeGameParticipants`, `saveGameParticipants`, `loadState` ;
- `applyCustomHeroesMulti`, `applyPregameGoldToParticipants`, `markSessionActive` ;
- `loadGameCustomization`, `saveGameCustomization` ;
- `startTurnManagerForGame`, `saveTurnState`, `closeTurnPopup`, `renderTurnUi`.

Une seule dépendance ne peut pas être résolue proprement par le namespace global : `current/state` sont des bindings lexicaux. Le futur owner recevra donc un adaptateur explicite `activateParticipant(id)` fourni par le bootstrap historique. Aucun autre gameplay ne doit rester dans ce câblage.

## Seam unique retenu

Nouveau propriétaire :
`assets/gensrpg/capture/session-start-v1.js` exposant `GensCaptureSessionStartV1`.

Contrat visé :
- `install(bindings)` : injecte une fois les dépendances explicites et valide leur présence ;
- `start()` : unique initialiseur de session Capture ;
- `dispose()` : annule le délai borné restant et remet l'état transitoire à zéro ;
- `status()` : permet aux sentinelles de vérifier l'installation sans état gameplay dupliqué.

`GensCaptureV1.startModuleSession()` appellera cet owner au lieu de `legacyStartConfiguredGame`.
`GensCaptureV1.install()` conservera uniquement l'enregistrement du provider Shell et ne recevra plus la fonction Capture139.

Dans `captureFix139`, le corps actuel de `window.startConfiguredGame` et la référence `gensCaptureStartConfiguredGame139V1` seront retirés. Le bloc ne gardera que :
- `captureEnterWorld139` / retour écran, dette séparée déjà déclarée ;
- le câblage explicite nécessaire au nouvel owner ;
- `GensCaptureV1.install()`.

Aucune seconde implémentation active ne sera conservée.

## TDD suivant

Après GREEN documentaire :
1. créer un checkpoint final de préaudit ;
2. créer le checkpoint de départ et la branche TDD dédiés ;
3. écrire un RED permanent exigeant le nouvel owner, l'absence du binding `legacyStartConfiguredGame` et l'absence du corps session dans Capture139 ;
4. prouver que le chemin Shell réel déclenche le nouvel owner, avec dresseur/créature valides, monde jour 1 et configuration de tours conservés ;
5. appliquer le transfert exact ;
6. repinner mécaniquement les sentinelles de blob/taille sans assouplir leurs autres assertions ;
7. triple CI, preview réel mobile/PC, puis checkpoint GREEN.

Le retour écran n'est pas traité dans ce lot.
