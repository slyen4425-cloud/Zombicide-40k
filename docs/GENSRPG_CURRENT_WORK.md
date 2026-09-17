# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — dock flottant Tactical : raccord au renderer canonique

- Branche : `work/gensrpg-tactical-dock-render-reconnect-2026-09-17`
- Base exacte / checkpoint vert combat 4F : `96043b4b04a069fc571aca38634df221341bb411`
- Checkpoint vert 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`
- Checkpoint de départ UI : `checkpoint/gensrpg-start-tactical-dock-render-reconnect-2026-09-17`
- SHA runtime/tests validé : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## État final du lot dock — vert

Le dock flottant `Attaquer / Fin du tour / Capacité` est de nouveau raccordé au vrai cycle de rendu Tactical sans réintroduire d'autorité globale.

Validation du SHA `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` :

- contrat source du dock : vert ;
- vrai chemin navigateur dock Chromium : vert ;
- vrai chemin navigateur dock Firefox : vert ;
- batterie architecture complète : verte ;
- Chromium/preview historique : vert ;
- Firefox historique : vert ;
- aucun `MutationObserver` global `body/html` réintroduit ;
- aucun timer/retry de réparation ajouté ;
- gameplay combat, participants, IA, timeline, stats, XP, loot et mouvement inchangés ;
- workflow progression toujours lecture seule ;
- `main` intact.

Le test Firefox dédié utilise les options supportées par Playwright : même viewport/touch/DPR que Chromium, mais `isMobile:true` seulement sur Chromium.

## Lot combat 4F — état figé vert

Core 2.09 embuscade entre maintenant directement par `GensRpgTacticalCombatV2Bridge.requestCombat()` en conservant ses gardes, sa déduplication/persistance, `living(x)`, son délai 120 ms, sa libération à 250 ms, les mêmes `enemyIds` et `reason:"ambush"`.

Validation finale 4F sur `96043b4b04a069fc571aca38634df221341bb411` : architecture + Chromium/preview verts, Firefox vert, workflow progression lecture seule et `main` intact.

Dette combat après 4F :

- `dc200StartCombat` : 1 — alias historique uniquement ;
- `openDungeonCombatSetup` : 1 — définition rollback historique ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Cette dette reste hors du chantier UI courant.

## Anomalie utilisateur — dock flottant disparu

Symptôme initial : les commandes flottantes `Attaquer / Fin du tour / Capacité` n'étaient plus visibles pendant le combat Tactical.

### Propriétaires identifiés

- Renderer canonique : `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js`.
- Dock : `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` (V111), fonction `ensureDock()`.

### Cause confirmée

V111 créait toujours correctement les trois commandes et relayait vers les vrais boutons Tactical. L'ancien `MutationObserver` n'était plus installé par `install()`, conformément à la charte.

Après le retrait de cet observer, V111 avait tenté de conserver le dock en enveloppant `GensRpgTacticalCombatV2Ui.render` exporté. Mais le renderer canonique appelle son `render()` lexical/interne directement depuis `open()` et depuis ses actions. Le vrai chemin de rendu contournait donc le wrapper exporté ; `ensureDock()` n'était plus rappelé lors de l'ouverture réelle du combat.

L'ancien test V111 ne détectait pas cette régression car il vérifiait seulement l'existence du wrapper dans le source, pas le chemin `open() -> render()` réellement exécuté.

## Caractérisation créée avant correction

### Contrat source

`tests/gens_tactical_dock_canonical_render_hook_v11411.test.cjs`

Le contrat exige :

- un hook explicite de fin de rendu appartenant au renderer Tactical canonique ;
- notification depuis le `render()` lexical réellement utilisé ;
- export public de l'abonnement ;
- V111 s'abonne au hook sans remplacer `UI.render` ;
- aucune réactivation de l'ancien `observe()` dans `install()` ;
- conservation des labels et des relais vers les vrais boutons source.

### Reproduction navigateur vrai chemin

- Fixture : `tests/fixtures/tactical-dock-render-v11411.html`.
- Test : `tests/gens_tactical_dock_browser_v11411.test.cjs`.

Le test laisse volontairement expirer les retries historiques V111 jusqu'à 5 s avant d'ouvrir Tactical. Il ne peut donc pas réussir grâce à un retry tardif. Il ouvre ensuite le combat via le vrai `GensRpgTacticalCombatV2Ui.open()`, vérifie un dock unique et visible, les trois commandes, puis force un rerender interne et vérifie que le dock reste raccordé.

Le garde navigateur interdit explicitement tout `MutationObserver` global sur `body` ou `html`, conformément à la charte. Le garde source vérifie en parallèle que `install()` V111 ne rappelle jamais son ancien `observe()`. Un observer local/non-global éventuellement créé par le harness ou le navigateur n'est pas assimilé à l'ancienne réparation DOM globale.

## Correction appliquée

Petit lot à deux propriétaires uniquement :

1. le renderer Tactical canonique possède maintenant un mécanisme minimal `onAfterRender(fn)` détenu par lui-même et déclenché à la fin du vrai `render()` ;
2. V111 utilise cet abonnement au lieu de remplacer `UI.render`, et appelle son `maintain()` existant.

Le hook ne contient aucune règle métier et ne répare pas le DOM à distance : le propriétaire du renderer annonce explicitement qu'un rendu vient de finir.

## Interdictions maintenues

- ne pas réactiver `MutationObserver` global ;
- ne pas ajouter de timer/retry de réparation ;
- ne pas ajouter de listener global de reprise d'autorité ;
- ne pas modifier combat, participants, IA, timeline, stats, XP, loot ou mouvement ;
- ne pas toucher à l'alias `dc200StartCombat` restant ;
- ne pas toucher `main`.

Les retries de démarrage V111 déjà présents n'ont pas été étendus ni utilisés comme mécanisme de correction du dock.

## Agent parallèle autorisé

Une branche séparée a été créée depuis le checkpoint vert 4F pour un premier agent parallèle :

`work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`

Périmètre : diagnostic du flash/disparition de la zone Talent sur la fiche héros. Cette branche ne doit pas toucher au dock Tactical, au combat ni à `main`.

## Jalons verts précédents

- Lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- Lot 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` — `0315edb74a428594fa02d8d9fd74639779b8df07`.
- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

Lire la charte puis ce fichier, checkpoint avant changement, branche dédiée, caractériser avant correction, lot borné, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.
