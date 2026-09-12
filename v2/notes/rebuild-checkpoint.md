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

## Dernière étape terminée — première passe présentation Donjon

Première étape du nouveau chantier `RPG UX / présentation` : restructuration visuelle de l'écran Donjon, sans modification du moteur.

- nouveau stylesheet dédié `v2/src/ui/dungeon-gameplay-ui.css` ;
- `v2/index.html` charge ce thème après les styles génériques existants ;
- nouvelle identité visuelle Dungeon sombre/fantasy inspirée des points forts de la V1 ;
- ordre visuel explicite des blocs :
  1. héros actif / HUD compact ;
  2. plateau ;
  3. choix/événement ;
  4. combat ;
  5. passages ;
  6. PNJ/loot ;
  7. informations secondaires ;
  8. état technique relégué tout en bas et masqué sur mobile ;
- héros actif transformé en bandeau compact/sticky au lieu d'une grande carte d'éditeur ;
- plateau transformé en scène principale : cases plus grandes, palette brun/pierre, héros vert, ennemi rouge, héros focalisé avec halo or ;
- interactions de case visuellement intégrées au plateau ;
- combat transformé en second point focal rouge/brun avec timeline et action principale plus visibles ;
- événements en traitement narratif or/brun ;
- passages/PNJ/loot volontairement plus discrets ;
- copie du plateau corrigée : suppression de l'ancien texte `lecture seule`, remplacé par une consigne de déplacement tactile ;
- breakpoints téléphone dédiés conservant la grille et les commandes lisibles ;
- aucune règle de combat, déplacement, interaction ou sauvegarde n'a été changée.

Régression :
- nouveau `v2/tests/rpg-dungeon-gameplay-presentation.test.mjs` ;
- protège le chargement du thème, la hiérarchie héros → plateau → combat → technique, la séparation visuelle héros/ennemi, le breakpoint mobile, l'absence de logique gameplay dans le CSS et la disparition du texte obsolète `lecture seule` ;
- batterie complète : `34704516033` completed + success.

Commits de l'étape :
- thème Donjon gameplay : `26e24c3e496e5f95832b762796104300f318ab9c`
- chargement du thème : `8c13273420b0babaf84fb375a9bf7c3cf455234d`
- texte plateau orienté gameplay : `408e3c8cfffd46bf5595b081a57f09113472dc13`
- régression présentation : `787c9946b53b6dcfb22ab060a98411db2dedceda`

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

## Preview téléphone

La preview précédente reste utile comme référence du prototype archaïque :
`https://raw.githack.com/slyen4425-cloud/Zombicide-40k/32e3703889f9d3d0f881b13dafc59a342ecd9e72/v2/index.html`

Pour tester les prochaines passes UX, générer/communiquer une nouvelle URL raw.githack figée sur le commit validé concerné ; ne jamais écraser la V1 publique pour une preview.

## Priorités ouvertes

1. Restructurer la navigation RPG et ses sous-menus : séparer clairement `Jouer`, `Héros`, `Monde/World Builder` et `Configuration`, au lieu de la barre technique actuelle où tout paraît mélangé.
2. Refaire ensuite l'UX de combat Donjon : portraits/cartes, PV et ressources visibles, timeline lisible, compétences sous forme de commandes/cartes et ciblage visuel ; réduire au maximum les `select` bruts.
3. Ranger quêtes, inventaire, loot, commandes MJ et informations secondaires dans panneaux/drawers/contextes adaptés plutôt que dans un long flux vertical.
4. Après cette structure, faire la passe assets réels : héros, ennemis, boss, tuiles, murs, portes, obstacles, icônes et cadrages.
5. Puis audio/PWA/cache/parité finale. Monster Capture reste en pause pendant ce cycle RPG UX.
