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

La passe UX reste prioritaire, mais un point gameplay indispensable a été rétabli avant de poursuivre le polish : le déplacement tactique en combat, nécessaire pour donner du sens aux attaques de mêlée/distance, à la portée et au placement.

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

## Déplacement tactique en combat — raccordement actuel

Retour utilisateur : le tir à distance n'a pas de sens si le héros ne peut pas se repositionner pendant son tour.

Audit effectué : `v2/src/modes/rpg/tactical-combat.js` possédait déjà le vrai moteur de déplacement combat :
- `createCombatMovementState()` ;
- `moveCombatActor()` ;
- `resetActorCombatMovement()` ;
- portée/LOS/couverture via `evaluateAttackPosition()`.

Le raccordement Donjon ne crée donc PAS un second moteur :

- `v2/src/modes/rpg/dungeon-combat-movement.js` adapte le moteur tactique existant à la session Donjon ;
- budget de mouvement persistant pour le `turnSequence` courant ;
- nouveau tour = nouveau budget ;
- seuls les héros actifs peuvent cliquer la grille pendant leur tour ;
- les autres combattants sont traités comme cases occupées ;
- murs, portes et layout authored passent par le moteur tactique existant ;
- déplacer ne termine pas automatiquement le tour : le héros peut ensuite utiliser sa compétence depuis sa nouvelle position ;
- le spatial mis à jour est conservé dans le roomRuntime et renvoyé au combat ;
- feedback mobile `👣 Déplacement tactique — X / Y cases restantes` ;
- l'ancien déplacement exploration reste bloqué pendant un combat.

Régression : `v2/tests/rpg-dungeon-combat-movement.test.mjs`.
Le test protège notamment une attaque distance invalide à 4 cases qui devient valide après un déplacement de 2 cases sans changer de combat/tour.

Batterie complète : `34708055765` completed + success.

Commits :
- wrapper initial : `8313da2309ff77a38d42cb8f4d0cc85098391370` ;
- UI grille combat : `755e0ba7216831da55684d3311f877e1a30414b8` ;
- raccordement page RPG : `ca1be4366f8440fbf077d165c8525bef0603e624` ;
- feedback visuel : `465e89042cf8ded6a72a6bb1ce31bab8912771e1` ;
- chargement CSS : `37fdaadb288f80e38cbd7604e49af548ff328a6a` ;
- correction pour réutiliser `moveCombatActor()` existant : `56b46e43134439593f290a48b4e762359f0c8e74` ;
- régression : `4fccd57a743b3de4c9c02127ad7494cc3535df1a`.

## UX combat Donjon — commandes de jeu

Nouvelle passe présentation-only, sans modifier le moteur de résolution :

- `v2/src/ui/dungeon-combat-command-ui.js` conserve les `<select>` compétence/cible existants comme source de vérité mais les masque visuellement ;
- les options sont présentées sous forme de cartes/boutons `1 · Compétence` et `2 · Cible` ;
- cliquer une carte met à jour le select natif puis émet son événement `change`, donc le ciblage dynamique existant continue de décider les cibles valides ;
- le bouton principal devient `⚔️ Lancer l’action` ;
- cartes héros/ennemis visuellement différenciées ;
- cartes actives davantage mises en évidence ;
- jauges visuelles ajoutées aux ressources qui possèdent un `current / max` ;
- timeline numérotée et tour actif renforcé ;
- bouton d'action principal sticky sur mobile ;
- aucun calcul de portée, LOS, dégâts, effet, tour ou cible n'est implémenté dans cette couche UX.

Styles : `v2/src/ui/dungeon-combat-command-ui.css`.
Chargement V2 : `v2/index.html`.
Régression : `v2/tests/rpg-dungeon-combat-command-ui.test.mjs`.

Batterie complète : `34708334737` completed + success.

Commits :
- commandes combat : `430e4ad1feef68dbbfbc31d3bd56d9708820e0fa` ;
- styles : `139ad407a72f799f94ba8fc691fb84b476f5e512` ;
- chargement V2 : `ba2b121e03ed4cf06d9781dd91d1115fa16054ff` ;
- régression : `444029c3522ee7cc204c722a1f47a99c271b107b`.

## Ciblage visuel tactique — synchronisation spatial/layout

Le panneau de combat utilise maintenant le même contexte spatial que le déplacement tactique :

- `combat-target-ui.js` utilise la compétence sélectionnée comme profil tactique lorsqu'aucune source explicite n'est fournie ;
- les entrées de cible exposent aussi la distance courante ;
- le select interne conserve la cible courante si elle reste valide ;
- `patchCombatTargetUiContext()` permet de mettre à jour le spatial/layout sans écraser l'univers/combat déjà posés par la présentation ;
- `dungeon-combat-movement-ui.js` injecte le `roomLayout` matérialisé, le `roomRuntime`, le `roomId` et le spatial courant dans le ciblage ;
- le recalcul a lieu au montage du tour puis immédiatement après chaque déplacement tactique ;
- les cartes de cible sont reconstruites automatiquement car elles restent dérivées du select moteur ;
- une cible hors portée ou derrière un bloqueur de vision authored n'est plus proposée ;
- après repositionnement dans une position valide, elle réapparaît automatiquement.

Régression : `v2/tests/rpg-combat-target-spatial-ui.test.mjs`.
Le test protège : cible absente à 4 cases pour une portée max 3, cible présente après déplacement à 2 cases, cible absente derrière un mur `blocksVision:true` même si le mur ne bloque pas le mouvement.

Batterie complète : `34709303945` completed + success.

Commits :
- ciblage sur compétence sélectionnée + contexte patchable : `771c862b0b722218be13ffce3ef6b3258596ab3f` ;
- resynchronisation après mouvement et propagation layout/spatial : `9d00aa47d2d01166ab52ebcaf5120ff5bed3779b` ;
- régression : `0847f08647fc97f101d06b8d1d22ac044eed7620`.

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
- RPG : déplacement tactique en combat raccordé : `34708055765` success
- RPG UX : commandes combat cartes/cibles : `34708334737` success
- RPG UX : cibles synchronisées portée/LOS/layout : `34709303945` success

## Preview téléphone

La preview précédente reste utile comme référence du prototype archaïque :
`https://raw.githack.com/slyen4425-cloud/Zombicide-40k/32e3703889f9d3d0f881b13dafc59a342ecd9e72/v2/index.html`

Pour tester les prochaines passes UX, générer/communiquer une nouvelle URL raw.githack figée sur le commit validé concerné ; ne jamais écraser la V1 publique pour une preview.

## Priorités ouvertes

1. Revoir maintenant la fiche héros/inventaire/équipement comme interface de jeu.
2. Revoir Monde/Salles et Configuration avec la même hiérarchie de sous-menus.
3. Après cette structure, faire la passe assets réels : héros, ennemis, boss, tuiles, murs, portes, obstacles, icônes et cadrages.
4. Puis audio/PWA/cache/parité finale. Monster Capture reste en pause pendant ce cycle RPG UX.
