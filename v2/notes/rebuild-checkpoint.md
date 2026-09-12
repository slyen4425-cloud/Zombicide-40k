# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome et très avancé ; le chantier Capture reste volontairement en pause.
- Après le premier test réel sur téléphone, l'utilisateur a jugé l'interface V2 trop archaïque, les sous-menus mal structurés et le Donjon/combat très en retrait par rapport à la V1.
- Nouvelle priorité immédiate : GEL des ajouts gameplay pendant une passe UX/présentation RPG. La V1 sert de référence de qualité visuelle/fonctionnelle, sans réutiliser son architecture legacy.

## RPG — socle testable déjà présent

- Accueil → RPG → rôle appareil → page RPG raccordé.
- Partie Donjon test depuis le World Builder courant.
- Héros configurés utilisés avec leurs vraies données ; fallback démo en mémoire si aucun héros.
- Grille Donjon live avec positions runtime, déplacement tactile via Spatial Core + pathfinding authored, murs/portes/obstacles respectés.
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

Décision : ne plus ajouter de mécanique avant d'avoir reconstruit une UX RPG/Donjon cohérente et mobile-first.

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

Commits :
- structure DOM : `f7fe18d4d481e6c2af8b0f39f1ecf7bd8ec5d87d`
- styles : `321e0ece8fce6ae331d660664bfc106966c389d1`
- chargement : `a5b779e6ab4bc3521eab963562b872bc884cce11`
- régression : `e898650b8a2188ba6dff37c865328e1b273c85c0`

### Passe 3 — navigation RPG structurée

La barre plate `Configuration / Donjon / Héros / World Builder / Salle / Combat test` est remplacée visuellement par quatre catégories cohérentes :

1. `🎮 Jouer` → Donjon ;
2. `🧙 Héros` → Fiche héros ;
3. `🗺️ Monde` → World Builder + Salles ;
4. `⚙️ Configuration` → Règles & contenu + Laboratoire combat.

Implémentation volontairement présentation-only :

- `v2/src/ui/rpg-navigation-ui.js` déplace les boutons existants dans les groupes sans recréer leurs listeners ;
- `v2/src/ui/rpg-navigation-ui.css` ajoute une hiérarchie 4 colonnes desktop / 2 colonnes téléphone ;
- `v2/index.html` charge la nouvelle couche ;
- à l'entrée RPG, si l'ancien onglet Configuration est encore actif par défaut, la couche UX ouvre automatiquement `Donjon` afin que l'utilisateur arrive d'abord sur `Jouer` ;
- aucun moteur RPG, stockage, World Builder ou combat n'est modifié.

Régression : `v2/tests/rpg-navigation-presentation.test.mjs`.
Batterie complète : `34707462937` completed + success.

Commits :
- navigation structurée : `e72c36ea4c3cabf587e0529b0a9cc2b10034b484`
- styles navigation : `c163e1c336bc73ffc428240c5d2396c843d3165e`
- chargement V2 : `3cc48f1d64c6f551e39df3eb65a0ef6bffc159df`
- régression : `8bafc0363234ca40e6d80d12f9cd96fb4f8c7d72`

## Jalons CI récents validés

- RPG : création/lancement session test : `34700285175` success
- RPG : fallback démo jusqu'au vrai combat : `34700599970` success
- RPG : grille live mobile : `34701638751` success
- RPG : combat démo complet victoire/loot : `34701834544` success
- RPG : déplacement exploration grille : `34702387637` success
- RPG : interactions proximité : `34702763858` success
- RPG : sauvegarde/reprise minimale : `34703227141` success
- RPG : preview téléphone : `34703496395` success
- RPG UX : première refonte présentation Donjon : `34704516033` success
- RPG UX : hiérarchie surface de jeu / Journal & détails : `34707068397` success
- RPG UX : navigation Jouer / Héros / Monde / Configuration : `34707462937` success

## Preview téléphone

La preview précédente reste utile comme référence du prototype archaïque :
`https://raw.githack.com/slyen4425-cloud/Zombicide-40k/32e3703889f9d3d0f881b13dafc59a342ecd9e72/v2/index.html`

Pour tester les prochaines passes UX, générer/communiquer une nouvelle URL raw.githack figée sur le commit validé concerné ; ne jamais écraser la V1 publique pour une preview.

## Priorités ouvertes

1. Refaire maintenant l'UX de combat Donjon : portraits/cartes, PV et ressources visibles, timeline lisible, compétences sous forme de commandes/cartes et ciblage visuel ; réduire au maximum les `select` bruts.
2. Revoir ensuite la fiche héros/inventaire/équipement pour qu'elle soit une interface de jeu et non une suite de formulaires.
3. Revoir les écrans Monde/Salles et Configuration pour appliquer la même hiérarchie de sous-menus à l'intérieur de chaque catégorie.
4. Après cette structure, faire la passe assets réels : héros, ennemis, boss, tuiles, murs, portes, obstacles, icônes et cadrages.
5. Puis audio/PWA/cache/parité finale. Monster Capture reste en pause pendant ce cycle RPG UX.
