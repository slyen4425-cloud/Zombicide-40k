# GenSrpG — Phase 12 / Dungeon : cycle de vie des coffres et restauration de scène — GREEN ciblé

**Date : 21 octobre 2026.** Le scénario réel de coffre en partie Dungeon est validé sur Chromium et Firefox, jusqu'au retour en salle 2 après seconde reprise. Ce GREEN ne constitue pas une certification exhaustive de toutes les variantes d'événements pièges, ni de la Phase 12 globale.

## Source, charte et checkpoint

- Dernier jalon GREEN de départ : `checkpoint/gensrpg-phase12-dungeon-room2-entry-green-2026-10-21`, SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0` (CI 39564370399).
- §25 START de ce lot, **avant toute modification** : `checkpoint/gensrpg-start-phase12-dungeon-scene-lifecycle-2026-10-21` au SHA `ca77d8e5651892b39c37f1c035823014e8cdf7e0` ; branche de travail `work/gensrpg-phase12-dungeon-scene-lifecycle-2026-10-21`.
- `index.html` **inchangé** (blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab`, 1 729 855 octets), [permalien exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/4d1b096fe4834cd803e2c4c48ed1db363de95397/index.html). §26 respecté, aucune lecture du HTML énorme via GitHub.
- Dernier commit certifié **`4d1b096fe4834cd803e2c4c48ed1db363de95397`** ; [CI GitHub Actions 39579919307](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39579919307) : deux jobs SUCCESS, contextes exact-SHA `gensrpg/phase12/scene-lifecycle/regression` et `gensrpg/phase12/scene-lifecycle/browser`, tous deux `success`.
- Checkpoint GREEN créé **après** les deux succès : `checkpoint/gensrpg-phase12-dungeon-chest-lifecycle-green-2026-10-21`, pointant exactement sur ce commit, immuable ; documents ultérieurs distincts du checkpoint.

## Diagnostic et résolution : deux problèmes à ne pas confondre

1. **Vraie anomalie de stockage du propriétaire Dungeon Core200** : `syncChestAuthority208` chargeait une liste `all`, créait des coffres manquants via `addDungeonSceneElement`, puis enregistrait la liste `all` antérieure aux ajouts. La sauvegarde finale pouvait annuler les créations faites par l'API officielle. Correction minimaliste et sans nouvelle autorité dans `assets/gensrpg/dungeon/core200-rebuild-v1.js` : enregistrer les déplacements des scènes existantes **avant** de créer les scènes manquantes, laisser `addDungeonSceneElement` persister les nouveaux objets, et ne pas écraser cet état ensuite. La sentinelle source exige exactement ce seul changement dans les fichiers runtime.
2. **Erreur de navigation du test de diagnostic antérieur**, pas un défaut du jeu : la fonction effectivement propriétaire de l'interaction de coffre est `openChest213` dans `assets/gensrpg/dungeon/core213-stability-v1.js`, et non `searchChest` de Core200. Core213 ouvre un dialogue comportant un bouton **« 🎁 OUVRIR / FOUILLER »** distinct du bouton « CONTINUER ». Une trace de pile l'a formellement confirmé. Cliquer sur « CONTINUER » ferme seulement le dialogue, conformément à Core213 : l'ancien test créait une fausse boucle de non-consommation. Le nouveau test clique sur la vraie commande visible. **Core213 n'a pas été modifié.**
3. Les traces temporaires du propriétaire ont été **retirées intégralement** avant la CI finale, et ne figurent pas dans le checkpoint.

## Vrai scénario navigateur certifié

- Accueil → Aventure RPG → Dungeon → nouvelle partie Aldren/Lyra/Brom → salle 1 : vrai squelette 5 PV et combat Tactical réel jusqu'à victoire → résultat et 1 XP → rechargement de la page → navigation normale et bouton **REPRENDRE LA PARTIE**.
- Depuis la salle 1 reprise, choix du rôle **MJ par le sélecteur visible**, ouverture des outils MJ puis création d'un coffre avec le bouton de menu **Coffre commun**, et ouverture par les commandes réelles `FOUILLER` puis `OUVRIR / FOUILLER`. Le test ne modifie jamais directement les coffres, les PV, les scènes, les jets, l'XP, l'IA ou le résultat ; aucun clic forcé ni appel direct aux fonctions de consommation.
- Contrôle de la carte **après fouille**, pour tenir compte du retrait normal de la case coffre, puis transition réelle vers la salle 2 ; comparaison stricte des cartes `roomStates[1]` au départ de la salle et à l'arrivée.
- Fermeture des dialogues natifs, deuxième reload, navigation d'accueil et deuxième clic **REPRENDRE LA PARTIE**. Comparaison exacte de la carte de salle 2, des scènes coffre enregistrées, de la salle et de la position du héros, des ennemis éventuels, et de l'XP/blessures.

### Échantillon exact de la CI finale

- Chromium : **2** interactions de coffre, salle 2 générée comme rencontre, **1** ennemi 5 PV dans la salle 2, carte identique après deuxième reprise, Aldren **1 XP** et **2 blessures** après retour.
- Firefox : **1** interaction de coffre, salle 2 générée comme rencontre, **1** ennemi 5 PV dans la salle 2, carte identique après deuxième reprise, Aldren **1 XP** et **0 blessure** après retour.
- Les résultats de combat sont aléatoires. Le test n'invente jamais de valeur. Les deux navigateurs ont aussi réussi le jeu antérieur (victoire et reprise) et les sentinelles historiques R10–R15/architecture/stats/dés/Tactical. Diff du runtime avec base GREEN : **seulement Core200** ; `main` et autres modules inchangés.

## Limites explicitement non couvertes

- Le cas généré aléatoirement qui change un marqueur `trap` après une reprise n'a pas été reproduit dans la CI finale. Une vérification dédiée des producteurs d'événements `trap` et de leur état de reprise est nécessaire pour affirmer la parité générale des pièges.
- Pas de certification de victoire/défaite de groupe, de butin positif effectivement tombé, de multi-héros répartis sur plusieurs salles, d'actions tactiques de déplacement, de mobile/PWA ou de publication de production.
- `main` reste à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucune fusion/déploiement Pages. Laboratoires Combat/Exploration, Survie, Capture et PvP intouchés.
- Le projet Phase 12 global reste **OUVERT**.

## Livrables

- Source minimale : `assets/gensrpg/dungeon/core200-rebuild-v1.js`.
- Scénario Playwright réel : `tests/gensrpg_phase12_dungeon_scene_lifecycle_browser.cjs`.
- Garde de source : `tests/gensrpg_phase12_dungeon_scene_lifecycle_source_guard.test.cjs`.
- Workflow : `.github/workflows/gensrpg-phase12-dungeon-scene-lifecycle.yml`.
- Point de reprise : `docs/GENSRPG_CURRENT_WORK.md`, à mettre à jour sur la branche après le checkpoint immuable.

Charte : `docs/GENSRPG_CHARTE.md` §§1–5, 12–26 ; `docs/GENSRPG_CHECKPOINT_POLICY.md`.
