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
