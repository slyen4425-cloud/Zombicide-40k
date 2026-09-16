# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — XP manuel + portrait fiche héros

- Branche de travail : `work/gensrpg-xp-portrait-cleanfix-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-xp-portrait-cleanfix-2026-09-16`
- Base exacte : `84344017659cc909ded580bc39d0c8d103deb5df`
- Checkpoint vert de départ : `checkpoint/gensrpg-stats-editor-regression-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Périmètre strict

Deux régressions seulement sont traitées dans ce chantier :

1. les boutons XP manuel `+/-` de la fiche héros doivent passer par le cycle canonique de progression déjà existant, y compris level-up et persistance ;
2. le portrait de la fiche doit être rendu par son propriétaire natif et ne plus être repris ensuite par une ancienne couche visuelle concurrente.

Aucun changement de règles de progression, seuils XP, calculs de stats, combat, déplacement, navigation globale, cache/PWA ou World Builder n'est autorisé dans ce chantier.

## Propriétaires retenus

### XP manuel

- propriétaire : `changeXP()` dans le runtime natif de la fiche ;
- systèmes existants à réutiliser : `dungeonSyncProgressionForState`, `dungeonHandleLevelUp071`, `save()` et le rendu natif ;
- interdiction : ne pas installer un second `changeXP`, wrapper permanent, observer, retry ou boucle de maintenance pour rattraper le résultat.

### Portrait de fiche

- propriétaire : rendu natif de la fiche qui écrit `charImage` ;
- resolver d'art existant à réutiliser ;
- interdiction : aucune couche chargée après le rendu ne doit réécrire `#charImage`, wrapper l'ouverture/rendu de la fiche ou utiliser des retries pour reprendre cette autorité.

Les correctifs visuels du plateau/pions qui n'écrivent pas la fiche restent hors périmètre et doivent être préservés.

## État caractérisé avant correction

### XP

Le `changeXP()` natif modifie bien `state.xp`, appelle `dungeonSyncProgressionForState(current, state)`, joue le son puis rend la fiche. En revanche il ne raccorde pas actuellement le résultat `leveled` à `dungeonHandleLevelUp071` et ne persiste pas directement via `save()`.

Les récompenses de combat possèdent déjà le chemin canonique attendu : sync progression -> traitement level-up -> persistance. Ce chemin existant doit être réutilisé, pas réinventé.

Le fichier `assets/gensrpg/dungeon/progression-runtime-v1.js` installe encore un wrapper de `changeXP`. Il peut servir de trace historique mais ne doit pas devenir l'autorité finale du correctif.

### Portrait

`assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js` écrit directement `#charImage`, wrappe plusieurs fonctions de fiche et tente de réinstaller ses hooks avec des timers. `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js` référence encore ce module via `SHEET_ART_SRC`.

Cette chaîne constitue une autorité concurrente de la fiche et doit être supprimée du chemin de fiche de manière soustractive, tout en conservant les responsabilités visuelles réellement utiles au plateau.

## Fonctions / zones protégées touchées

- `changeXP()` natif ;
- traitement canonique de level-up uniquement par appel, sans modifier sa règle ;
- persistance uniquement par l'API existante ;
- rendu natif du portrait de fiche / `charImage` ;
- bootstrap visuel uniquement pour retirer l'ancienne autorité de fiche si nécessaire.

## Tests exigés avant validation

### XP

- exécuter le vrai `changeXP()` extrait du runtime, pas une fonction simulée injectant le résultat ;
- vérifier qu'un gain sans niveau persiste et rend correctement ;
- vérifier qu'un gain avec niveau appelle une seule fois le traitement canonique avec le bon `beforeLevel`, attribue les points via le moteur existant, persiste puis rend ;
- vérifier qu'une baisse XP ne fabrique aucun level-up ;
- vérifier qu'aucun wrapper parallèle de `changeXP()` n'est nécessaire à l'autorité finale.

### Portrait

- vérifier que le rendu natif choisit immédiatement le portrait du héros courant lors d'un changement de héros ;
- vérifier qu'aucun module aval ne réécrit `#charImage` ou ne wrappe les fonctions de fiche ;
- attendre au-delà des anciennes fenêtres de retry et confirmer que le portrait reste celui du héros courant ;
- vérifier séparément que les visuels/pions Dungeon encore nécessaires restent fonctionnels.

### Inter-modules / architecture

- sentinelles architecture globales vertes ;
- tests Stats du checkpoint précédent toujours verts ;
- aucune nouvelle MutationObserver globale, timer permanent, renderer concurrent, seconde source de vérité ou auto-réparation ajoutée.

## Risque inter-module principal

Le bridge Hero Art mélange encore historique de fiche et corrections visuelles du plateau. La suppression doit viser uniquement l'autorité concurrente de la fiche ; elle ne doit pas retirer les resolvers/images utilisés légitimement par les pions Dungeon.

## Séquence de travail

1. caractériser précisément `dungeonHandleLevelUp071` et le rendu natif de `charImage` ;
2. corriger `changeXP()` dans son propriétaire natif, avec test de raccord réel ;
3. valider ce jalon XP avant de toucher au portrait ;
4. supprimer de façon soustractive l'autorité concurrente de fiche et valider le portrait ;
5. relancer sentinelles architecture + Stats + navigateur ;
6. créer un checkpoint vert seulement sur le SHA final entièrement validé.

## Chantier précédent — éditeur de statistiques (vert)

Le correctif Stats est terminé au checkpoint `84344017659cc909ded580bc39d0c8d103deb5df` : le renderer Stats canonique reste l'unique renderer riche, la policy ne fait que décorer les cartes, et le bridge Hero Art ne wrappe plus le cycle Stats. Ce chantier ne doit pas être rouvert ici.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
