# GenSrpG — Phase 12 / Dungeon : coffres, sauvegarde et reprise — GREEN ciblé, événements différés encore RED

**21 octobre 2026.** Deux checkpoints distincts ont été créés au fil des preuves. Le lot corrige la persistance des coffres créés par la synchronisation Dungeon ; il ne certifie pas que les pièges, énigmes et sous-salles générés par événements restent entièrement identiques après un reload.

## Autorité, branche et charte

- **Base GREEN** : `checkpoint/gensrpg-phase12-dungeon-room2-entry-green-2026-10-21`, SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0`. Ce checkpoint validait une véritable victoire en salle 1 et une première entrée en salle 2, mais non la restauration complète des scènes.
- **START §25 avant mutation** : `checkpoint/gensrpg-start-phase12-dungeon-scene-lifecycle-2026-10-21`, SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0`; branche dédiée `work/gensrpg-phase12-dungeon-scene-lifecycle-2026-10-21`. Tentative précédente `work/gensrpg-phase12-dungeon-scene-restore-2026-10-21` RED, préservée comme diagnostic, pas réutilisée comme base.
- **§26** : `index.html` jamais lu via API GitHub ni modifié, blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab`, taille 1 729 855 octets ; [source au dernier code GREEN de départ](https://github.com/slyen4425-cloud/Zombicide-40k/blob/ca77d8e5651892b39c37f1c035823014e8cdf7e0/index.html).
- **Seul diff de production** : `assets/gensrpg/dungeon/core200-rebuild-v1.js`, fonction `syncChestAuthority208`. La liste des scènes déjà chargées est sauvegardée **avant** l'ajout éventuel de coffres manquants, et `addDungeonSceneElement` conserve sa responsabilité normale de persister ces nouveaux coffres. Suppression du `saveDungeonSceneElements(all)` postérieur qui écrasait une liste plus récente. Pas d'autre fichier runtime modifié ; aucun nouveau moteur, listener, wrapper global ni mutation de Tactical/Stats/D100/IA/XP.
- **Traces temporaires supprimées** : les `DUNGEON_CHEST_TRACE_*` qui ont servi à identifier la vraie interface d'ouverture ne figurent pas dans le code certifié. Le test source vérifie le diff exact et le gel de tous les autres fichiers de production.

## Résolution de la confusion « CONTINUER » / « OUVRIR »

Le code effectivement actif pour rechercher un coffre est `openChest213` dans **`assets/gensrpg/dungeon/core213-stability-v1.js`**. Ce propriétaire affiche une fenêtre d'information et un bouton spécial **« 🎁 OUVRIR / FOUILLER »**. Le bouton générique « CONTINUER » ferme la fenêtre, sans consommer l'objet. Une trace de pile Chromium a prouvé que ce second bouton, et non le callback interne prévu dans Core200, constitue le chemin utilisateur effectif.

Le diagnostic antérieur cliquait à tort sur « CONTINUER » et attribuait cette non-consommation au moteur. Le test final utilise **uniquement la commande réelle**, et a validé « Coffre fouillé » puis le retrait du coffre de la scène et de la carte. **Core213 n'a pas été modifié.**

## Validation automatisée sur le vrai chemin

Playwright Chromium et Firefox parcourent réellement : accueil > Dungeon > nouvelle partie Aldren/Lyra/Brom > génération d'un squelette en salle 1 > combat Tactical jusqu'à victoire par vraies attaques et D100 > application native du résultat > 1 XP > reload > menu > **REPRENDRE**.

- Le test sélectionne le rôle MJ avec le sélecteur UI visible puis crée un coffre commun par le vrai menu **OUTILS MJ**. Il le fouille avec les boutons de Core213, constate sa disparition, puis franchit réellement la sortie de la salle 1. La carte de salle 1 est comparée à son état **après** fouille, et non à celui d'avant, car le retrait d'un coffre modifie intentionnellement la carte.
- En salle 2, le test utilise de nouveau les outils MJ pour y déposer **un coffre qu'il laisse fermé**. Après fermeture normale des dialogues de jeu, il recharge la page, navigue de l'accueil vers Dungeon puis clique **REPRENDRE**. Les ID de coffre et leur indice de cellule, ainsi que toutes les cases `chest/cache`, doivent être **strictement identiques** après cette deuxième reprise. Le même héro, la même salle 2 et les ennemis vivants éventuels doivent être conservés, sans variation d'XP ou de blessures due au rechargement.
- Les événements automatiques postérieurs (nouveau piège ou changement d'énigme) sont **observés et consignés comme écarts non couverts**, jamais réattribués au propriétaire des coffres ni présentés comme corrigés.
- Aucun ajout direct de monstre, de scène, de jet, de récompense ou de PV dans le stockage du test ; le contenu déterministe provient exclusivement des outils MJ publics, les combats sont réels.

## Checkpoints et preuves

**Premier jalon GREEN limité au cycle de coffre et à une reprise échantillonnée** : `checkpoint/gensrpg-phase12-dungeon-chest-lifecycle-green-2026-10-21`, commit `4d1b096fe4834cd803e2c4c48ed1db363de95397`, [CI 39579919307](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39579919307), les deux jobs verts.

**Renforcement de la sentinelle** : commit `7c9fe8f17ab0e36e23f8f15bafa5b799a575b4a5`, [CI 39582252735](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39582252735) : régression et navigateur Chromium/Firefox **success** avec coffre non consommé en salle 2, comparaison stricte des identifiants et marqueurs, écarts événementiels explicitement visibles :
- Chromium : deux coffres en salle 2 ; mêmes IDs et indices **9 et 15** après reload, mais un coffre reçoit un `challenge` (de false à true) après reprise.
- Firefox : coffre à l'indice **13** avec même ID après reload ; une nouvelle scène `trap` est créée à l'indice **20** et le marqueur de carte change alors de `floor` à `trap`. **La carte complète n'est donc pas identique**. Le coffre, lui, est conservé.
- Ces traces sont des exemples de runs aléatoires et ne sont pas des valeurs imposées par le test.

Le checkpoint renforcé doit être créé **seulement** après une CI success sur le SHA documentaire final, sans déplacer le précédent. Le point de reprise officiel sera actualisé après certification.

## Limites et prochaine étape

- **Encore NON GREEN** : cycle des événements de salle (`trap`, `special_branch`) et attribution différée des défis de coffre ; risque de mutation de carte/scène après reprise. Un nouveau §25 START/lot propre doit suivre l'identité des producteurs et les transitions de sauvegarde. Ne pas masquer l'écart par des comparaisons moins exigeantes dans ce prochain lot.
- Non testés : défaite complète, récompense positive d'un monstre avec loot, multi-héros sur salles distinctes, expérience manuelle Pixel/smartphone, PWA/cache. Certains warnings 404 de ressources historiques sont aussi hors périmètre.
- Production `main` toujours gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun merge ou publication Pages/PWA. Laboratoires Combat/Exploration et modes Survie/Capture/PvP intouchés. **Phase 12 globale OUVERTE**.

Références : `docs/GENSRPG_CHARTE.md` §§1–5, 12–26 ; `docs/GENSRPG_CHECKPOINT_POLICY.md`; `tests/gensrpg_phase12_dungeon_scene_lifecycle_browser.cjs`, `tests/gensrpg_phase12_dungeon_scene_lifecycle_source_guard.test.cjs`.
