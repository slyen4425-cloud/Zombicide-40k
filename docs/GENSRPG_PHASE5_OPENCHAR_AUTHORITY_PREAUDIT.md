# GenSrpG — Phase 5 / pré-audit autorité fiche héros openChar

Date : 2026-09-23

## Base

- Branche :
  `work/gensrpg-phase5-openchar-authority-preaudit-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-openchar-authority-preaudit-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-screen-return-dungeon-s2-green-2026-09-23`
- SHA exact de base :
  `eba5ba001744dfb00f9bec1fa391e6fa54d2f527`
- Runtime :
  taille `8172500`, blob `7b586e9fb14b7a93a0edb069e115fd6d48cbda97`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié dans ce pré-audit.

## QA manuelle conservée hors périmètre

La validation téléphone de Dungeon S2 a signalé trois anomalies :

1. valeurs/affichage Stats au retour ne correspondant pas toujours immédiatement
   à l'état attendu ;
2. détection ennemie hors combat toujours intermittente, avec un nouveau cas où
   un ennemi a été téléporté à l'autre bout de la map ;
3. en Survie, certains libellés semblent reprendre du vocabulaire Dungeon
   (« explorer salle »), alors que l'action déclenche correctement la vague zombie.

Le diff S1 -> S2 ne modifie que 7 lignes du raccord `goMenu`
(5 ajouts / 2 suppressions), sans toucher Stats, déplacement, détection,
Survie, Builder ou assets.

Ces trois points doivent donc être traités dans des chantiers QA séparés et
ne doivent pas recevoir de rustine dans le chantier `openChar`.

## Propriétaire natif

Le Shell historique possède :

`function openChar(id)`

Responsabilités observées :
- fermeture d'un éventuel popup de tour ;
- reconstruction des héros custom avant validation ;
- vérification de participation à la session ;
- chargement `current/state` ;
- nettoyage d'identité Dungeon hors Dungeon ;
- bascule immédiate `menu -> sheet` ;
- initialisation du turn state si nécessaire ;
- rendu canonique via `render()`.

Le rendu canonique applique déjà synchroniquement :

`applyDungeonSheetIdentity()`
`renderDungeonHeroStats()`
`renderDungeonSkillTree()`
`updateDungeonSearchUi()`

avant le rendu partagé de la fiche.

## Chaîne réelle openChar

Une détection stricte d'affectation
`window.openChar\s*=(?!=)`
trouve exactement deux wrappers :

1. `captureFix139`
2. `dungeonCore028HeroExploreGuard`

### Capture 139

Rôle réel :
- pendant `window._captureStarting139 === true` ;
- et uniquement en contexte Capture ;
- neutraliser l'ouverture automatique d'une fiche pendant la fenêtre critique
  de lancement Capture ;
- déléguer tous les autres appels à l'ancien propriétaire.

Ce wrapper porte donc encore une responsabilité réelle de lancement Capture.
Il n'est pas candidat à un retrait opportuniste dans ce pré-audit.

### Dungeon Core 0.28

Rôle réel :
- scanner les boutons de `#sheet` ;
- retirer tout bouton contenant « Explorer » ou pointant vers
  `exploreDungeonRoom` / `DungeonCore01.explore` ;
- installer un `MutationObserver` ciblé sur `#sheet` ;
- wrapper `window.openChar` ;
- refaire le nettoyage immédiatement puis avec
  `setTimeout(...,0)` et `setTimeout(...,100)`.

Ce bloc est un candidat soustractif prioritaire :
- il reprend une fonction protégée globale ;
- il conserve une stratégie observer/retry historique ;
- la fiche actuelle a déjà une identité Dungeon synchrone consolidée.

## Anomalie de cartographie Phase 2

L'ancien regex de cartographie :

`window.<name>\s*=`

compte à tort le premier `=` de comparaisons telles que :

`typeof window.openChar==="function"`

La cartographie historique peut donc afficher trois « affectations » openChar
alors que le runtime exact n'en possède que deux.

La sentinelle dédiée :

`tests/gens_phase5_openchar_authority_preaudit_v1.test.cjs`

utilise un motif strict et verrouille la chaîne réelle.

Ce constat doit être conservé lors d'une future correction générale de la
cartographie Phase 2, mais ce pré-audit ne régénère pas tout l'inventaire.

## Preuve navigateur demandée

Sentinelle :

`tests/gens_phase5_openchar_core028_browser_characterization_v1.test.cjs`

Principe :
- utiliser la vraie preview ;
- retirer uniquement le bloc
  `dungeonCore028HeroExploreGuard` dans la fixture de test ;
- démarrer un vrai Dungeon depuis le Shell ;
- ouvrir une vraie fiche héros ;
- attendre les frames/rendus tardifs ;
- vérifier qu'aucun bouton Explorer n'est recréé ;
- vérifier que les onglets Dungeon restent affichés ;
- vérifier l'absence d'erreur navigateur.

Si cette preuve est GREEN, le premier micro-lot runtime recommandé sera le
retrait soustractif de Core 0.28 uniquement.

## Interdictions

- aucune modification Stats ;
- aucune modification de détection/mouvement ;
- aucune correction de terminologie Survie ;
- aucun changement de lancement Capture ;
- aucun changement Tactical ;
- aucune nouvelle autorité Shell ;
- aucun nouveau wrapper, observer, retry ou polling ;
- aucun merge sur `main`.


## Résultat navigateur ciblé

Workflow ciblé temporaire :

- run `35920553852` ;
- résultat : **SUCCESS** ;
- workflow temporaire retiré de l'arbre final après la preuve.

Fixture :
- runtime S2 exact ;
- composition des modules reconstruite depuis
  `.github/workflows/main.yml`, comme GitHub Pages ;
- retrait uniquement de
  `dungeonCore028HeroExploreGuard`.

Résultat réel :
- la fiche Dungeon s'ouvre ;
- les onglets Dungeon restent présents ;
- aucun bouton Explorer visible/clicable n'est recréé ;
- aucun besoin fonctionnel visible du wrapper Core 0.28 n'est observé.

Deux nœuds hérités restent dans le DOM de la fiche mais sont
`display:none` :

- `🧟 EXPLORER UNE SALLE` -> `generateZombieWaveQuick()` ;
- `⚡ EXPLORER UNE SALLE` -> `generateZombieWaveQuick()`.

Ce sont des contrôles Survie cachés, pas des actions Dungeon.

Cette preuve explique également le retour utilisateur sur la terminologie
Survie : le texte « explorer salle » appartient bien à des contrôles qui
déclenchent une vague zombie. La logique fonctionne ; le libellé est une dette
UI/terminologie séparée.

## Décision du pré-audit

Premier micro-lot runtime recommandé :

**retirer uniquement `dungeonCore028HeroExploreGuard`.**

Le lot devra être strictement soustractif :
- supprimer le bloc Core 0.28 ;
- ne pas déplacer son observer/retry ailleurs ;
- ne pas modifier le renderer de fiche ;
- ne pas modifier Capture 139 ;
- conserver les sentinelles fiche Dungeon / flash Survie ;
- ajouter une sentinelle permanente garantissant qu'aucune action Explorer
  visible n'apparaît dans la fiche Dungeon.

Après ce retrait, la chaîne globale réelle `openChar` devra devenir :

`captureFix139`

au-dessus du propriétaire natif Shell `function openChar(id)`.

Le retrait de Capture 139 n'est pas autorisé par ce pré-audit.
