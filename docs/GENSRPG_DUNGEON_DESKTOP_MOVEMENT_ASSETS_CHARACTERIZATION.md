# Dungeon — déplacement PC/mobile et assets : caractérisation du 6 octobre 2026

## Résultat

Le signalement utilisateur est étudié sur la composition de production `preview.html`, dans un navigateur réel, avec un profil Dungeon neuf et des réglages persistés par l'éditeur existant.

Le profil de référence initialise `gameplay.modules.movement=false` et `movement.enabled=false`. Le mode mémorisé `tactical` ne suffit pas : `dc305PositionalGameplay()` exige également l'activation du module. Le héros peut être actif, assigné au joueur et afficher trois cases de mouvement tout en n'ayant aucune case accessible. Le clic ne change alors pas sa position, conformément à cette configuration.

Après activation par les vrais boutons « Style & Modules » et « Déplacements », les clics souris et taps tactiles déplacent le héros dans une aventure générée et dans un monde construit. Le coût réduit les cases restantes ; « Fin du tour » recharge le mouvement ; un second déplacement fonctionne.

Les réglages du navigateur PC peuvent différer de ceux du téléphone. Cette configuration explique le cas reproduit, mais les réglages de la session personnelle de l'utilisateur n'ont pas été observés. Aucun défaut du moteur de déplacement propre au PC n'a été reproduit. Aucun correctif runtime, défaut de gameplay ou asset n'est appliqué.

## Base, périmètre et propriétaires

- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Base et dernier GREEN : `5c915705a9ce6530646dd74f29edaf05c49dd5be`.
- Checkpoint créé avant toute mutation : `checkpoint/gensrpg-start-dungeon-desktop-movement-assets-characterization-2026-10-06`, sur cette base.
- Branche dédiée : `work/gensrpg-dungeon-desktop-movement-assets-characterization-2026-10-06`.
- Périmètre annoncé avant le test : commit `8cdd2fc592a2a6a632684b565d228d8933f728d7`.
- Version du test dont les preuves ont été examinées : `b37fbe2bdb66104b7dd61e4fb0cc4d0ae0adf661`.
- Checkpoint de clôture : `checkpoint/gensrpg-dungeon-desktop-movement-assets-characterization-green-2026-10-06`, à créer uniquement sur le HEAD final après sa CI requise verte.

Les valeurs sont lues par les propriétaires existants du profil et du Dungeon ; la position, les droits d'action et le budget restent pilotés par le moteur existant. Les fixtures passent par les APIs Adventure / Room Creator / World Builder. Il n'y a ni remplacement de fonction runtime, ni injection de position attendue, ni clic forcé, ni suppression artificielle d'overlay.

Le lot modifie uniquement le test dédié, son invocation et la conservation des preuves dans la CI existante, et les documents de suivi. Navigation, stats, sauvegardes, Capture, Survie, Tactical, PvP, PWA, règles et images demeurent hors mutation.

## Preuves navigateur examinées

Chromium en CI, contextes neufs et isolés : desktop `1366×768` sans tactile ; mobile émulé `412×915` avec tactile. Il ne s'agit pas d'un essai physique sur le PC Windows ou le téléphone de l'utilisateur.

| Parcours | Premier déplacement : position / cases restantes | Fin du tour | Second déplacement |
| --- | --- | --- | --- |
| PC, aventure générée | 37 / 3 → 10 / 0 | tour 2 ; 3 cases | 10 → 0 ; 1 case |
| Mobile, aventure générée | 37 / 3 → 10 / 0 | tour 2 ; 3 cases | 10 → 0 ; 1 case |
| PC, monde construit | 12 / 3 → 4 / 1 | tour 2 ; 3 cases | 4 → 2 ; 0 case |
| Mobile, monde construit | 12 / 3 → 4 / 1 | tour 2 ; 3 cases | 4 → 2 ; 0 case |

Avant activation, les deux contextes générés donnent `module=false`, `positional=false`, zéro case accessible, et une position inchangée après le clic/tap. Le rôle Joueur, l'assignation à Aldren et le droit d'agir sont valides. Après activation, le test contrôle les réglages sauvegardés `{module:true,mode:"tactical",enabled:true}`.

Le centre de la case cible est vérifié par `elementFromPoint` avant chaque action réelle. Les positions et budgets lus proviennent de l'état runtime. Les quatre parcours enregistrent zéro erreur JavaScript et aucune requête échouée observée.

Une modale d'événement visible peut intercepter légitimement les clics tant que son bouton OK n'a pas été utilisé. Le test attend le propriétaire de la notification et ferme les notices par leurs vrais boutons ; il ne neutralise pas cette garde. Après fermeture, les overlays de setup, d'éditeur et de notification sont masqués et les cases reçoivent effectivement les actions. Aucun overlay invisible bloquant n'est démontré.

Les écouteurs clavier actifs inspectés ne raccordent pas les flèches ou ZQSD au déplacement Dungeon. Le contrôle testé est le clic/tap sur une case accessible.

Preuves : [run 37437911494](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37437911494), job navigateur `112184677234`, étape « Caractériser les déplacements Dungeon PC/mobile et les images réelles » SUCCESS et upload SUCCESS. Artefact `dungeon-desktop-movement-assets`, id `11400775009`, `11487729` octets, SHA-256 `cafadfe91a15d37c0dbad9f9de5e5e73b9a72154f4db43b9262c8bb44d9e98cc`. ZIP téléchargé et digest vérifié ; les quatre résultats JSON et les captures PC/mobile générées et construites ont été examinés.

## Images et limites visuelles

Entre `a8c9aa9934276c38fc4ca2755e65cee7116ada4e` et `5c915705a9ce6530646dd74f29edaf05c49dd5be`, les 273 fichiers sous `assets/` ont les mêmes blobs Git. Les blocs inline Dungeon Core 2.00, 3.05 et Spatial 3.13 sont également identiques. Le présent diagnostic ne change aucun fichier runtime ou asset.

`index.html` reste `8165906` octets, blob `1e3398755beb751786d825047bc60fe1a7179d79`, SHA-256 `0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d`. La copie locale dérivée du ZIP utilisateur a été vérifiée contre les métadonnées GitHub ; aucune nouvelle lecture du gros HTML par connecteur n'est requise.

Les images présentes ont été réellement décodées : Aldren `1122×1402`, portes `190×165`, six sols pierre `512×512`, mur du monde construit `256×256`, et squelette dans le scénario où il était présent `1024×1536`. Aucune image cassée ou texture manquante n'apparaît dans les captures examinées. Le plateau prend davantage de place sur desktop : une même texture peut donc paraître plus grande.

Ce contrôle porte sur les scènes enregistrées, pas sur tout le catalogue ni sur chaque navigateur. L'absence de modification au dernier lot ne démontre pas une identité avec toutes les versions antérieures, notamment la production gelée. Le visuel précis jugé « bizarre » par l'utilisateur reste à identifier ; aucun remplacement d'image ou ajustement de rendu n'est justifié par le signalement seul.

## Historique des essais et CI de clôture

Les premières itérations ont corrigé le test, sans modification du produit : locator « Valider » ambigu avec « Retour », prise en compte d'une vraie notice d'événement, puis budget global de 300 secondes insuffisant pour les quatre parcours. Les contextes PC/mobile indépendants sont désormais exécutés en parallèle, avec un watchdog global de 600 secondes. Aucun contrôle n'a été supprimé pour obtenir le résultat.

La répétition sur `4841d13cd5101accf118d641b886874f7c2bdd17` ([run 37438946458](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37438946458), job `112188124475`) a exposé une autre fragilité du test : `scrollIntoViewIfNeeded` échoue si son élément est détaché pendant un rendu. Le premier déplacement PC avait fonctionné ; après fin du tour, le runtime indiquait tour 2, trois cases, onze cases accessibles et zéro erreur. Le test échouait avant le second clic ; les deux parcours mobiles étaient terminés avec succès. Les preuves de cette répétition ont été téléchargées et vérifiées (artefact `11400288055`, SHA-256 `356889b58bba84ba279887e2895860906e06e23cbea147952b9ad04dace9e385`).

L'attente utilise désormais `locator.click({trial:true})` : Playwright résout la case vivante, fait défiler et vérifie son actionnabilité sans émettre de clic. Le hit-test explicite, le vrai clic/tap et toutes les assertions de position, coût et fin de tour restent exécutés. Aucun retry d'une mutation métier, clic forcé ou changement du moteur n'est ajouté.

Le test dédié est `tests/gens_dungeon_desktop_movement_assets_browser_characterization_v1.test.cjs`. La CI Architecture+Browser existante reçoit son invocation et l'upload `always()` des captures/JSON ; tous les contrôles antérieurs restent présents. Le watchdog et les contextes appartiennent seulement au test.

Sur `b37fbe2bdb66104b7dd61e4fb0cc4d0ae0adf661`, le diagnostic dédié, l'architecture, Firefox Wall+Zoom ([run 37437911415](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37437911415)) et les trois jobs Tactical ([run 37437911436](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37437911436)) sont verts. La suite navigateur historique du run 37437911494 est également terminée SUCCESS : 335 étapes architecture et 50 étapes navigateur.

Le HEAD de clôture ajoute l'attente de locator décrite ci-dessus dans le test, ce rapport et la mise à jour de CURRENT_WORK. Ses trois workflows requis doivent être intégralement SUCCESS sur le même HEAD avant de publier le checkpoint final. L'existence du checkpoint nommé ci-dessus est la preuve de cette validation finale ; aucun état partiel ne doit être présenté comme GREEN.

## Test manuel précis

1. Sur [la version au contenu runtime vérifié](https://raw.githack.com/slyen4425-cloud/Zombicide-40k/5c915705a9ce6530646dd74f29edaf05c49dd5be/preview.html), ouvrir Aventure RPG, revenir à la liste des jeux, puis choisir « Modifier » sur Dungeon.
2. Dans « Style & Modules », cocher « Déplacements & distances » et cliquer « Enregistrer Style & Modules ».
3. Dans « Déplacements », choisir « Tactique — grille case par case » et « Au début de chaque tour du héros », puis cliquer « Enregistrer Déplacements » et fermer l'éditeur.
4. Lancer une nouvelle partie Dungeon, choisir le héros, entrer dans le donjon et valider toute notice visible avec OK. Vérifier le rôle Joueur et que « Mon héros » désigne le héros actif.
5. Cliquer sur une case entourée de vert près du héros. Attendu : le pion change de case et le budget baisse. Cliquer « Fin du tour » ; attendu : le mouvement se recharge et un nouveau clic fonctionne.

Ne pas attendre un déplacement avec les flèches/ZQSD. Si les clics échouent malgré ces réglages, relever le rôle, le héros actif, les cases restantes, le mode de déplacement et toute fenêtre visible. Pour la différence d'assets, une capture de la scène précise permettra de poursuivre un diagnostic ciblé.

## Prochaine étape

Attendre la validation utilisateur de son propre parcours PC. Le classement canonique Capture dans la liste Survie reste une anomalie distincte déjà reproduite ; il n'est pas corrigé ici. Tout chantier suivant commence par son propre checkpoint sur le dernier GREEN et sa déclaration de périmètre, conformément à la charte. Aucune fusion ou publication de `main` n'est réalisée.
