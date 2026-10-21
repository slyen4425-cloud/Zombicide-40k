# GenSrpG — Phase 12 / Dungeon salle 1 → salle 2 : entrée GREEN, restauration fine de carte NON GREEN

**21 octobre 2026 — périmètres de validation séparés ; aucune modification du runtime sur cette branche.**

## Charte §25 et source

- Base GREEN : `checkpoint/gensrpg-phase12-dungeon-tactical-combat-result-green-2026-10-21` = `17ce4972fb2e3cb859cbe25be3fc2f4196dbddac`.
- START avant la première mutation : `checkpoint/gensrpg-start-phase12-dungeon-room2-after-victory-2026-10-21` à ce même SHA ; travail `work/gensrpg-phase12-dungeon-room2-after-victory-2026-10-21`.
- `index.html` : Git blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` (1 729 855 octets), **inchangé**. [Permalien exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/17ce4972fb2e3cb859cbe25be3fc2f4196dbddac/index.html). GitHub `main` reste `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Aucun changement de fichier de production `assets/`, `service-worker.js`, Core, Tactical, stats ou données. Laboratoires Combat/Exploration et autres modes intouchés.

## Jalon GREEN prouvé : progression jusqu'à la salle 2

[**CI 39564370399**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39564370399) sur SHA exact `ca77d8e5651892b39c37f1c035823014e8cdf7e0`, deux jobs **SUCCESS** : sentinelles R10–R15/architecture et Playwright Chromium + Firefox. **Checkpoint intermédiaire** `checkpoint/gensrpg-phase12-dungeon-room2-entry-green-2026-10-21` créé après la CI sur le SHA certifié.

Parcours réel : accueil > Dungeon > nouvelle partie Aldren/Lyra/Brom > rencontre squelette 5 PV salle 1 > Tactical > attaques et IA D100 > victoire > bouton natif « Appliquer le résultat » > gain réel d'XP, ennemi retiré, blessures persistantes > rechargement > sélection Dungeon > bouton REPRENDRE LA PARTIE > interaction de sortie via `#dc01Explore` et éventuel coffre > **salle 2 générée**. Le test vérifie l'identifiant de salle actif, la salle propre au héros, les maps enregistrées dans `roomStates['1']` et `roomStates['2']`, l'absence de monstre actif issu de salle 1 et le titre natif « SALLE 2 ». Aucun moteur simulé ni écriture artificielle de PV/dégâts/génération.

- Chromium : génération effective d'une salle 2 type **rencontre**, avec un nouveau squelette de **5 PV enregistré pour room 2**.
- Firefox : génération effective d'une salle 2 type **sanctuaire**. Les types de salles demeurent aléatoires ; le test ne les impose pas.
- Dans les deux cas, la map de salle 1 reste préservée au moment du passage.

## Diagnostic supplémentaire NON GREEN : restauration fine de la carte de salle 2

Une version renforcée du test recharge une seconde fois après l'entrée en salle 2, revient par l'accueil et clique à nouveau **REPRENDRE LA PARTIE**, en comparant carte, scène, héros, ennemis, XP et blessures.

- [CI de régression 39564637900](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39564637900) : Chromium passe ; Firefox échoue à égalité exacte de map car une case `trap` apparaît après reprise (initialement `floor`), avec au même moment des scènes de coffre reconstituées. XP, blessures, position, pièce et ID des ennemis sont conservés.
- [CI de diagnostic 39564908783](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39564908783) : la simple attente après la narration ne suffit pas ; une modale d'**objectif secondaire** peut apparaître après l'entrée et les objets de scène ne sont pas nécessairement synchronisés.
- [CI de diagnostic 39565210342](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39565210342) : après fermeture via UI des modales de salle/objectif, Chromium passe, mais Firefox affiche encore après reprise **des cases `trap` et `chest` et deux objets de coffre** supplémentaires par rapport au relevé avant rechargement. Cette divergence **reste réelle et RED** ; elle ne doit pas être traitée comme un test vert par relâchement de l'égalité de map. Le parcours ne déclenche pas de nouveau combat, et les valeurs d'XP/blessures sont inchangées.
- Piste de propriétaire à confirmer : `assets/gensrpg/dungeon/core200-rebuild-v1.js`, méthode `syncChestAuthority208`, qui crée des scènes via `addDungeonSceneElement` mais ré-enregistre ensuite une liste `all` capturée **avant** ces créations avec `saveDungeonSceneElements(all)`. Ce code peut effacer l'élément ajouté ; à confronter aux propriétaires des événements de salle et des marqueurs `trap` avant toute correction. **Ne pas inventer une réparation du piège sur cette seule hypothèse.**
- La CI Playwright dépend du téléchargement des navigateurs ; une des runs affiche des erreurs temporaires de résolution DNS du CDN Playwright. Le browser job a néanmoins exécuté et produit le diagnostic RED : la divergence de carte n'est pas attribuable à cette panne réseau.

## Suite exigée par la charte

Ce chantier possède seulement un **jalon GREEN limité à l'entrée en salle 2**, non à la restauration complète de sa scène. La Phase 12 globale reste OUVERTE. Pour le prochain lot, créer un nouveau §25 START sur le jalon GREEN `ca77d8e5651892b39c37f1c035823014e8cdf7e0` et une branche séparée de **synchronisation des scènes Dungeon** ; y porter le test strict, tracer les écritures de `roomStates` et `saveDungeonSceneElements` ainsi que les événements, puis corriger le propriétaire identifié uniquement. Ne toucher ni Tactical, ni Core Stats, ni l'HTML lourd. Défaite, loot positif, smartphone/PWA demeurent hors scope.
