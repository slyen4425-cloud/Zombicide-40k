# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven ; moteurs stats, ressources, D100, combat, inventaire, sets, progression, bestiaire, quêtes, alliés, salles, événements et spatial protégés par régressions.
- Monster Capture reste volontairement en pause pendant la passe UX RPG.
- Priorité actuelle : rendre le RPG réellement jouable, lisible et visuellement proche de la qualité attendue avant de reprendre les autres modes.
- `main` n'est pas utilisé pour la V2.

## RPG — socle jouable déjà raccordé

- Accueil → RPG → rôle appareil → page RPG.
- Donjon test depuis le World Builder courant.
- Héros configurés + fallback démo en mémoire.
- Grille live avec positions runtime.
- Déplacement exploration tactile via Spatial Core.
- Déplacement tactique en combat via le moteur `tactical-combat.js` existant.
- Murs, portes, obstacles, portée, LOS, couverture, cases occupées.
- Interactions exact-cell / portes / coffres.
- Combat réel, IA ennemie, victoire, réconciliation, loot et retrait des pions.
- Sauvegarde/reprise manuelle du test Donjon.

## UX RPG — jalons validés

### Donjon / navigation

- identité sombre/fantasy ; plateau prioritaire ; héros/ennemis différenciés ;
- surface principale séparée du panneau `☰ Journal & détails` ;
- navigation RPG regroupée en `🎮 Jouer / 🧙 Héros / 🗺️ Monde / ⚙️ Configuration` ;
- entrée RPG orientée vers Donjon/Jouer.

CI :
- identité Donjon `34704516033` success ;
- hiérarchie Donjon `34707068397` success ;
- navigation RPG `34707462937` success.

### Déplacement tactique combat

- budget par `turnSequence`, fractionnable ;
- déplacement ne termine pas automatiquement le tour ;
- murs/portes/layout authored et cases occupées respectés ;
- portée/LOS recalculées après déplacement ;
- feedback `👣 Déplacement tactique — X / Y cases restantes`.

CI : `34708055765` success.

### Commandes combat

- selects compétence/cible conservés comme source de vérité mais masqués ;
- compétences/cibles présentées en cartes/boutons ;
- bouton principal `⚔️ Lancer l’action` ;
- timeline, ressources et tour actif mieux lisibles ;
- cibles recalculées depuis le spatial + roomLayout courant ; une cible hors portée/LOS n'est plus proposée et réapparaît après repositionnement valide.

CI :
- commandes combat `34708334737` success ;
- ciblage spatial `34709303945` success.

### Fiche héros / inventaire / équipement

- affiche le vrai `heroSheetSnapshot()` ;
- slots réellement équipés, inventaire, rareté, quantités, sets, compétences, progression ;
- navigation interne `État / Équipement / Inventaire / Compétences` ;
- responsive mobile ;
- compatibilité historique `startingItems` conservée.

CI : `34709948494` success.

### Monde / World Builder / Salle

- navigation locale `Vue du monde / Zones & salles / Passages` ;
- grille de salle promue comme surface principale ;
- barre d'outils sticky/scrollable mobile ;
- réglages techniques rangés dans un panneau repliable ;
- interactions séparées ;
- vrais contrôles/listeners d'origine conservés.

CI : `34710181887` success.

### Configuration RPG

- longue page d'éditeur regroupée en :
  - `🧱 Fondations` ;
  - `⚔️ Règles & combat` ;
  - `✨ Capacités` ;
  - `🎒 Contenu & monde` ;
- une catégorie visible à la fois ;
- vraies `editor-section` déplacées, aucun moteur ou stockage recréé.

CI : `34710700809` success.

## Passe assets réels — jalon actuel

Objectif : réutiliser les vrais assets Dungeon déjà présents dans le dépôt sans réintroduire la logique V1.

### Resolver centralisé

Nouveau fichier `v2/src/modes/rpg/dungeon-asset-resolver.js` :

- `resolveDungeonCharacterAsset()` ;
- `resolveDungeonWorldAsset()` ;
- `dungeonAssetStyle()` ;
- `artId` explicite prioritaire lorsqu'il existe ;
- fallback par noms canoniques pour Aldren, Lyra, Brom, squelettes, gobelins, orcs, Nécromancien, Liche, Wyvern, Troll, Minotaure, Golem, Harpie, Araignée, Spectre, Goule, Loup sinistre, etc. ;
- mapping décor : sol pierre/eau/lave/rocher, murs, portes ouvertes/fermées, coffres, pièges, portail, switch, boss, entrée et sortie.

Commit resolver : `dc50d5cc2ffc69faafe95924c931e845e52e84c4`.

### Plateau Donjon

`v2/src/modes/rpg/dungeon-room-grid-view.js` :

- vrais portraits utilisés pour les pions lorsque disponibles ;
- texture de sol sur les cases ;
- portes, murs et certains éléments interactifs utilisent les assets existants ;
- emoji conservé en fallback et pour la compatibilité/accessibilité ;
- aucune règle de déplacement, collision ou interaction modifiée.

Commits :
- rendu assets : `87d6de0ad84f0b807cbc19ceca8febe43c1d5ad2` ;
- compatibilité anciens symboles portes/murs : `f0dbc14ed8cdf375633373e316fc7283c5891e1a`.

### Fiche héros / objets

`v2/src/modes/rpg/hero-sheet.js` :

- portrait réel du héros si `artId` ou asset canonique disponible ;
- images des objets si leur `artId` pointe vers un asset ;
- fallback icône conservé ;
- inventaire et équipement restent dérivés du runtime existant.

Commit : `53712f2f3b11da0c8acc71e8925f50c141a6d2f8`.

### Cadrage visuel

Nouveau `v2/src/ui/dungeon-assets-ui.css` :

- cadrage portraits sur les pions ;
- portrait héros dans la fiche ;
- images d'objets en `contain` ;
- textures de plateau ;
- tailles adaptées mobile.

Commit styles : `b9bbe3ae92a31025e67512c488007e8fc39624fc`.
Chargement V2 : `5ebdf995e271564f4f08195a2599dc1e8a7a8521`.
Régression : `v2/tests/rpg-dungeon-assets-presentation.test.mjs`, commit `456b331cf8722e05b514159af0fa99eb2179b0c9`.

### Validation CI

Premier run : `34711555501` — failure de compatibilité uniquement : l'ancien test attendait encore le symbole littéral `🚪⬅️` pour une porte d'entrée, alors que l'image de porte l'avait remplacé visuellement.

Correction : les symboles historiques restent présents avec les vrais assets affichés en même temps.

Batterie complète finale : `34711595969` — completed + success.

Aucun moteur de gameplay n'a été modifié pendant cette passe.

## Jalons CI récents

- preview téléphone initiale : `34703496395` success
- identité Donjon : `34704516033` success
- hiérarchie Donjon : `34707068397` success
- navigation RPG : `34707462937` success
- déplacement tactique combat : `34708055765` success
- commandes combat : `34708334737` success
- cibles spatial/LOS : `34709303945` success
- fiche héros/inventaire : `34709948494` success
- World Builder/Salles : `34710181887` success
- Configuration : `34710700809` success
- assets réels Donjon : `34711595969` success

## Preview téléphone

Ancienne référence archaïque :
`https://raw.githack.com/slyen4425-cloud/Zombicide-40k/32e3703889f9d3d0f881b13dafc59a342ecd9e72/v2/index.html`

Ne pas utiliser GitHub Pages pour `rebuild/v2` afin de ne pas écraser la V1 publique.

## Priorités ouvertes

1. Étendre les vrais portraits/assets aux cartes de combattants et à la timeline de combat.
2. Vérifier ensuite les assets des objets/sets et les cadrages restants dans les interfaces secondaires.
3. Générer une nouvelle preview téléphone figée sur un commit UX récent pour validation utilisateur.
4. Puis audio/PWA/cache/parité finale.
5. Monster Capture reste en pause pendant ce cycle RPG UX.
