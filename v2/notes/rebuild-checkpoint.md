# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome et très avancé ; le chantier Capture reste volontairement en pause.
- Après le premier test réel sur téléphone, l'utilisateur a jugé l'interface V2 trop archaïque, les sous-menus mal structurés et le Donjon/combat très en retrait par rapport à la V1.
- Priorité actuelle : rendre le RPG réellement jouable et lisible sur téléphone avant de reprendre les autres modes.

## RPG — socle testable déjà présent

- Accueil → RPG → rôle appareil → page RPG raccordé.
- Partie Donjon test depuis le World Builder courant.
- Héros configurés utilisés avec leurs vraies données ; fallback démo en mémoire si aucun héros.
- Grille Donjon live avec positions runtime.
- Déplacement exploration tactile via Spatial Core + pathfinding authored, murs/portes/obstacles respectés.
- Déplacement tactique pendant le combat maintenant raccordé au moteur tactique existant.
- Interactions de proximité case/porte/coffre raccordées au vrai moteur.
- Combat réel, IA ennemie, victoire, réconciliation, loot et retrait du pion couverts par régression.
- Sauvegarde/reprise manuelle de session test via le provider V2.
- Preview téléphone indépendante de `main` disponible via raw.githack.

## Retour utilisateur — présentation

Le premier test utilisateur a révélé que le socle fonctionnel ne suffit pas :

- les sections RPG ressemblent encore à des outils de développement empilés ;
- les sous-menus manquent de hiérarchie ;
- la partie Donjon ne donne pas encore l'impression d'un écran de jeu ;
- le combat reste trop proche de formulaires/selects techniques ;
- l'écart de qualité perçue avec la V1 est encore très important.

La passe UX reste prioritaire, avec comme principe : conserver les moteurs V2 propres et améliorer uniquement la couche de présentation/interaction sauf nécessité gameplay explicitement validée.

## Référence V1 auditée

La V1 fournit des repères utiles à conserver dans l'esprit, pas dans le code :

- identité Dungeon sombre/fantasy avec tons pierre, brun et or ;
- plateau clairement séparé du reste de l'interface ;
- héros et ennemis immédiatement différenciés visuellement ;
- combat compact avec timeline, cartes combattants, PV/stats visibles et bouton d'action principal ;
- informations secondaires moins dominantes que l'action en cours ;
- hiérarchie de jeu plus lisible que l'empilement actuel de `editor-section` V2.

## Présentation Donjon — état actuel

### Passe 1 — identité visuelle

- stylesheet dédié `v2/src/ui/dungeon-gameplay-ui.css` ;
- identité sombre/fantasy inspirée des points forts de la V1 ;
- héros actif compact/sticky ;
- plateau rendu comme scène principale ;
- héros vert, ennemi rouge, héros focalisé halo or ;
- interactions de case intégrées visuellement au plateau ;
- combat rouge/brun avec timeline et action principale renforcées ;
- événements narratifs or/brun ;
- passages/PNJ/loot plus discrets ;
- état technique masqué sur mobile ;
- aucune règle gameplay modifiée.

CI : `34704516033` completed + success.

### Passe 2 — hiérarchie réelle de l'écran de jeu

Une couche de présentation dédiée restructure désormais le DOM après chaque rendu, sans modifier le renderer RPG ni ses règles.

- `v2/src/ui/dungeon-layout-polish.js` + `.css` ;
- surface principale : héros actif, plateau, choix bloquant, combat ;
- panneau repliable `☰ Journal & détails` : état, événements, passages, PNJ, butin, quêtes et panneaux secondaires ;
- listeners existants conservés ;
- plateau dominant sur mobile ;
- aucune mécanique modifiée.

CI : `34707068397` completed + success.

### Passe 3 — navigation RPG structurée

La barre plate `Configuration / Donjon / Héros / World Builder / Salle / Combat test` est remplacée visuellement par quatre catégories cohérentes :

1. `🎮 Jouer` → Donjon ;
2. `🧙 Héros` → Fiche héros ;
3. `🗺️ Monde` → World Builder + Salles ;
4. `⚙️ Configuration` → Règles & contenu + Laboratoire combat.

- `v2/src/ui/rpg-navigation-ui.js` déplace les boutons existants sans recréer leurs listeners ;
- `v2/src/ui/rpg-navigation-ui.css` ajoute la hiérarchie mobile/desktop ;
- entrée RPG orientée vers Donjon/Jouer ;
- aucun moteur RPG, stockage, World Builder ou combat modifié.

CI : `34707462937` completed + success.

## Déplacement tactique en combat

Le moteur existant `tactical-combat.js` est réutilisé, pas dupliqué.

- budget de mouvement par `turnSequence` ;
- déplacement fractionnable pendant le tour ;
- murs/portes/layout authored respectés ;
- cases occupées refusées ;
- le déplacement ne termine pas automatiquement le tour ;
- portée/LOS réévaluées depuis la nouvelle position ;
- feedback `👣 Déplacement tactique — X / Y cases restantes`.

Régression : `v2/tests/rpg-dungeon-combat-movement.test.mjs`.
CI : `34708055765` completed + success.

Commits principaux :
- UI grille combat : `755e0ba7216831da55684d3311f877e1a30414b8` ;
- raccordement page RPG : `ca1be4366f8440fbf077d165c8525bef0603e624` ;
- réutilisation du vrai `moveCombatActor()` : `56b46e43134439593f290a48b4e762359f0c8e74` ;
- régression : `4fccd57a743b3de4c9c02127ad7494cc3535df1a`.

## UX combat Donjon — commandes de jeu

- `<select>` compétence/cible conservés comme source de vérité mais masqués visuellement ;
- compétences et cibles rendues sous forme de cartes/boutons ;
- bouton principal `⚔️ Lancer l’action` ;
- héros/ennemis mieux différenciés ;
- jauges ressources ;
- timeline numérotée et tour actif renforcé ;
- aucun calcul de portée/LOS/dégâts/tours dans la couche UX.

CI : `34708334737` completed + success.

Commits :
- commandes : `430e4ad1feef68dbbfbc31d3bd56d9708820e0fa` ;
- styles : `139ad407a72f799f94ba8fc691fb84b476f5e512` ;
- chargement : `ba2b121e03ed4cf06d9781dd91d1115fa16054ff` ;
- régression : `444029c3522ee7cc204c722a1f47a99c271b107b`.

## Ciblage visuel tactique — synchronisation spatial/layout

- compétence sélectionnée utilisée comme profil tactique ;
- spatial courant + roomLayout matérialisé propagés aux contrôles de cible ;
- recalcul au montage et immédiatement après mouvement ;
- cible hors portée ou hors LOS non proposée ;
- cible réapparaît après repositionnement valide.

CI : `34709303945` completed + success.

Commits :
- contexte ciblage : `771c862b0b722218be13ffce3ef6b3258596ab3f` ;
- resynchronisation mouvement : `9d00aa47d2d01166ab52ebcaf5120ff5bed3779b` ;
- régression : `0847f08647fc97f101d06b8d1d22ac044eed7620`.

## UX fiche héros / inventaire / équipement

La fiche héros n'affiche plus seulement les objets de départ sous forme de liste. Elle exploite désormais le snapshot runtime déjà produit par `hero-engine.js`.

- `buildHeroSheetModel()` conserve les stats, ressources, compétences et progression existantes ;
- l'inventaire affiché provient de `heroSheetSnapshot().inventory` ;
- les entrées équipées sont identifiées à partir de `inventory.equipment` ;
- les vrais slots du héros sont affichés séparément, avec slot vide, slot principal ou slot lié ;
- l'inventaire affiche nom, icône, rareté, type, quantité et statut équipé ;
- les bonus de set existants sont affichés via `setProgress` ;
- navigation interne `État / Équipement / Inventaire / Compétences` ;
- ressources et statistiques restent visibles immédiatement ;
- responsive téléphone : grille 1 colonne pour les grandes sections, inventaire/compétences compactés ;
- aucun moteur d'inventaire, équipement, bonus ou set n'a été réécrit ;
- compatibilité `startingItems` conservée pour les consommateurs/tests existants.

Fichiers :
- `v2/src/modes/rpg/hero-sheet.js` ;
- `v2/src/ui/hero-sheet-ui.css` ;
- chargement dans `v2/index.html` ;
- régression `v2/tests/rpg-hero-sheet-presentation.test.mjs`.

Le premier run `34709890806` a échoué uniquement parce que l'ancien test attendait encore `model.startingItems`. Compatibilité rétablie sans retirer le nouveau modèle runtime.

Batterie complète finale : `34709948494` completed + success.

Commits :
- fiche runtime inventaire/équipement : `7d282905720300c2a5da366f7c29a9a20363351e` ;
- styles : `f4e26b526686069e83c2f8a1e59c4adb2b71b57d` ;
- chargement CSS : `c695da592a27e4f6342852128d54b029de10710c` ;
- régression : `c0c5904e3b0b5b2ff474d4cb5d335e9b60e37f23` ;
- compatibilité historique : `c3d5ec13efdc6ea66a94332d76016dbf051eb8bc`.

## UX Monde / World Builder / Créateur de salle

La présentation du constructeur de monde a été restructurée sans modifier les moteurs d'édition ni le stockage.

World Builder :
- navigation locale `🌍 Vue du monde / 🚪 Zones & salles / 🔗 Passages` ;
- résumé visible du nombre de zones, salles et passages ;
- les cartes de salles sont organisées en grille responsive ;
- les boutons et champs existants (`+ Zone`, `+ Salle`, `+ Liaison`, champs zone/salle/lien) sont conservés avec leurs listeners d'origine.

Créateur de salle :
- la grille devient l'élément principal de l'écran ;
- la barre d'outils est placée juste au-dessus de la grille et devient scrollable/sticky sur téléphone ;
- les réglages généraux et obstacles sont déplacés dans `⚙️ Réglages de la salle`, repliable ;
- les interactions restent séparées sous la zone de construction ;
- résumé visible du nombre de cases et d'interactions ;
- aucun outil de peinture, clic de case, resize, porte, obstacle ou interaction n'est réimplémenté dans la couche UX.

Fichiers :
- `v2/src/ui/rpg-world-builder-ui.js` ;
- `v2/src/ui/rpg-world-builder-ui.css` ;
- chargement dans `v2/index.html` ;
- régression `v2/tests/rpg-world-builder-presentation.test.mjs`.

Batterie complète : `34710181887` completed + success.

Commits :
- structure présentation : `3e1a269439a4ab815600f7f217386afd9d8fc7a0` ;
- styles : `19bcfb33fef44caa8107b0fa607b143465c1d1cd` ;
- chargement V2 : `94ad00e23b88c400aaaed4e68f1ad1eb1fd6bfd9` ;
- régression : `ae0c868bd36cb8351a39227004294b2a804c707e`.

## Jalons CI récents validés

- RPG : preview téléphone : `34703496395` success
- RPG UX : première refonte présentation Donjon : `34704516033` success
- RPG UX : hiérarchie surface de jeu / Journal & détails : `34707068397` success
- RPG UX : navigation Jouer / Héros / Monde / Configuration : `34707462937` success
- RPG : déplacement tactique en combat : `34708055765` success
- RPG UX : commandes combat cartes/cibles : `34708334737` success
- RPG UX : cibles synchronisées portée/LOS/layout : `34709303945` success
- RPG UX : fiche héros/inventaire/équipement : `34709948494` success
- RPG UX : Monde / World Builder / Salles : `34710181887` success

## Preview téléphone

La preview initiale reste la référence du prototype archaïque :
`https://raw.githack.com/slyen4425-cloud/Zombicide-40k/32e3703889f9d3d0f881b13dafc59a342ecd9e72/v2/index.html`

Pour tester les prochaines passes UX, communiquer une nouvelle URL raw.githack figée sur le commit validé concerné ; ne jamais écraser la V1 publique pour une preview.

## Priorités ouvertes

1. Revoir maintenant `Configuration` pour séparer proprement les catégories au lieu d'une longue interface d'éditeur.
2. Après cette structure, faire la passe assets réels : héros, ennemis, boss, tuiles, murs, portes, obstacles, icônes et cadrages.
3. Puis audio/PWA/cache/parité finale. Monster Capture reste en pause pendant ce cycle RPG UX.
