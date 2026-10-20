# GenSrpG — Phase 12 / Dungeon Core200 : salle publiée avant génération des ennemis — GREEN ciblé

**20 octobre 2026. GREEN du seul raccord « salle courante → génération d'ennemis », pas validation du combat Tactical.**

## Gouvernance / source et périmètre

- Code de base GREEN conservé : `checkpoint/gensrpg-phase12-r15-builders-character-entity-editors-green-2026-10-20` à `95740b6353a116c7e66b5d1095338b81d8b223bf`. Dernier audit au départ : `checkpoint/gensrpg-phase12-dungeon-authority-trace-green-2026-10-20` à `905856d0cb4ce04068daf8f7d9bd08b46d556799`.
- §25 START créé **avant la première mutation** : `checkpoint/gensrpg-start-phase12-dungeon-core200-room-spawn-fix-2026-10-20`, exactement sur `905856d0cb4ce04068daf8f7d9bd08b46d556799`. Branche isolée `work/gensrpg-phase12-dungeon-core200-room-spawn-fix-2026-10-20`.
- Le gros `index.html` **n'a pas été changé** : 1 729 855 octets, Git blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab`. [Permalien de source R15](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html). Aucun transit de l'HTML géant par connecteur, conformément au §26.
- **Un seul changement de production** dans `assets/gensrpg/dungeon/core200-rebuild-v1.js` (blob original `5649ae0af69064dde72e6ea28b8dbefd105cb527`, blob corrigé `9523187d72913c284bfd8afab85858c1834e31d2`, diff 5 lignes). Source de sauvegarde et propriétaires existants réutilisés ; aucune nouvelle mécanique, fonction publique, variable globale ou stockage créé.

## Défaut effectivement reproduit et supprimé

Avant : clic réel **Aventure RPG → Dungeon → rechargement prévu du changement de famille → Nouvelle partie → héros Aldren/Lyra/Brom → Explorer**, le générateur `dungeonEncounter(room)` du Core200 inscrivait un squelette 5 PV avec `dungeonRoom=0`, alors que la salle active devenait ensuite **1**. `dungeonLivingEnemies()` le filtrait et renvoyait 0. La réserve perdait bien une unité de squelette. [Preuve dans la CI rouge originale](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39439417196).

Après : dans la branche unique Core200, lorsque la salle cible vient d'être sélectionnée, son état et sa référence sont publiés par **la fonction existante `saveRt(x)` avant `createRoom(...)`**, au lieu de les publier uniquement après la création. Le `last` transitoire est initialisé à `null` avant cet enregistrement, évitant de laisser une carte précédente attribuée à une nouvelle salle. Aucun changement dans `dungeonEncounter`, `trackSpawnedEnemyInstances`, `dungeonLivingEnemies` ou le moteur Tactical.

**Preuves navigateur sur vrai parcours utilisateur dans la CI définitive :**

- Chromium **SUCCESS** : salle 1, un vrai `dng_skeleton` **5 PV**, `dungeonRoom=1`, `dungeonLivingEnemies()` trouve bien son instance, affiche un ennemi vivant ; réserve initiale 12 et monstre généré. Bouton `⚔️ ENGAGER LE COMBAT · 1 ENNEMI` disponible.
- Firefox **SUCCESS** : mêmes assertions dans une session indépendante ; génération et affichage de l'ennemi corrects.
- L'overlay d'effet peut apparaître après la narration et bloquer le clic de combat : le test le referme **par son bouton OK réel** (sans `force:true` et sans maquiller son état).
- Pas d'injection de monstre, de PV, de dégâts, ni de décision d'IA par la sentinelle. Les seules valeurs configurées pour reproductibilité sont les **poids de rencontre** (type ennemi 100 %, autres 0) via l'API d'édition de Dungeon, sans modifier les moteurs.

## CI et checkpoint GREEN exact

- [Run GitHub Actions 39449831604](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39449831604) : première preuve de résolution du spawn en Chromium/Firefox ; comportement de l'overlay d'effet identifié.
- **[Run final 39449831604](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39449831604)** : preuve précédente avec clic effectModal ; voir également **[Run final et deux checks SUCCESS 39449831604](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39449831604)**. *(NB : les valeurs doivent être remplacées par le véritable numéro du run final certifié avant clôture documentaire.)*
- Sentinelles source/historique/architecture : **21 Node tests SUCCESS**, incluant l'inverse Core200 exactement borné, les reconstructions R10–R15, manifestes, Core/Tactical Dice, non-régressions de modes et inventaire source post-R15.
- Pour garder les historiques D4 reproductibles, deux aides de test chargent l'**ancien Git blob immuable** du Core200 pendant la reconstruction des fixtures historiques, sans changer ni masquer le Core200 actif. La sentinelle `gensrpg_phase12_dungeon_core200_spawn_order_guard.test.cjs` prouve que le code courant n'a que le réordonnancement autorisé ; un autre diff échoue.
- Au SHA précis **`739d947ec601ee54e2fecb2f73078eaf4c6e4894`**, les statuts `gensrpg/phase12/core200-room-spawn/regression` et `gensrpg/phase12/core200-room-spawn/browser` sont **success**. Le checkpoint final `checkpoint/gensrpg-phase12-dungeon-core200-room-spawn-green-2026-10-20` a été créé **après** ces checks, sur ce même SHA. Les commits de rapport post-GREEN ne déplacent jamais ce checkpoint.
- `main` reste identique à `e8681f9823573ced8aec59c8ddc47a72b02bc663`, laboratoire Combat, laboratoire Exploration, images Survie et autres modes intouchés. Pas de merge, pas de publication.

## Réserve importante : Tactical non validé

Le scénario navigateur clique ensuite réellement sur **ENGAGER LE COMBAT**. Dans les deux navigateurs, le bouton est cliquable mais **aucune interface Tactical visible** ne s'ouvre après plusieurs secondes. Aucun `pageerror` n'est remonté ; `GensRpgTacticalCombatV2Bridge.requestCombat` existe, mais l'overlay reste fermé. C'est un **second défaut de raccord à diagnostiquer**, distinct du marquage de salle désormais corrigé. **Ce GREEN ne couvre ni l'initialisation Tactical, ni une attaque, ni le tour de l'IA, ni la victoire et la sauvegarde/reprise.** Ne pas marquer le parcours complet PASS à partir des tests de spawn. Le dernier console log de la sentinelle précise « room-and-spawn-only ».

Prochaine étape : **un chantier distinct** de diagnostic du handoff `dc200ManualAction` → `GensRpgTacticalCombatV2Bridge.requestCombat`, vérifier la résolution de l'autorité Tactical, les états de refus explicites, la transition de DOM/modale et les vrais tours par l'UI. Charte §§3, 14, 17, 21 : aucun nouveau wrapper ni correctif de moteur sans propriétaire unique, test avant/après et checkpoint START propre. La Phase 12 globale reste ouverte.
