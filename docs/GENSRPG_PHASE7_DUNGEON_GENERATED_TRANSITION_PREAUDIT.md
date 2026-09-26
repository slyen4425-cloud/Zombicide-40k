# GenSrpG — Phase 7 / Dungeon exploration — transition generated — pré-audit — 2026-09-26

## Base vérifiée

- micro-lot précédent GREEN :
  `checkpoint/gensrpg-phase7-dungeon-generated-advance-plan-green-2026-09-26`
- SHA de base exact :
  `497b34cc2b0b5e82f665a0b85b6251f34b34fca4`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase7-dungeon-generated-transition-2026-09-26`
- branche :
  `work/gensrpg-phase7-dungeon-generated-transition-2026-09-26`
- `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

Empreinte du runtime de base :
- `index.html` : `8170350` octets ;
- blob Git : `e513d23c7a8c7aef9a187202bbcc34ab540e856f`.

Le micro-lot précédent a déjà extrait :
`GensDungeonV1.exploration.planGeneratedAdvance(currentRoom, roomLimit, roomStates)`.

## Autorité observée après planGeneratedAdvance

Dans le propriétaire generated Core 2.00, la chaîne suivante reste inline :

1. récupérer `targetRoom` depuis le plan ;
2. conserver le mouvement restant du héros actif ;
3. persister l’état spatial courant ;
4. si la salle cible existe déjà :
   - déplacer uniquement le héros actif vers la salle cible ;
   - activer sa nouvelle salle ;
   - le placer sur la case d’entrée ;
   - conserver son mouvement restant ;
   - enregistrer `dc313LastTransition.created=false` ;
   - sauvegarder / rendre / afficher le message de transition ;
5. sinon :
   - créer la nouvelle salle ;
   - réinitialiser les champs de salle générée concernés ;
   - déplacer le héros actif ;
   - choisir le type de salle et créer son contenu ;
   - placer le héros sur l’entrée ;
   - conserver le mouvement restant ;
   - enregistrer `dc313LastTransition.created=true` ;
   - poursuivre ensuite seulement vers scène, repos, branche spéciale, ennemis, verrou, défi de porte et narration.

Le chemin authored reste séparé et appartient à `DungeonAuthoredRuntime167839`.

## Risque principal

La transition de salle mélange actuellement :
- décision de transition ;
- état spatial ;
- position d’entrée ;
- conservation du mouvement ;
- création de salle ;
- contenu post-création.

Extraire ce bloc en une seule fois serait trop large.

## Périmètre de ce micro-lot

Avant toute extraction runtime :

- caractériser statiquement le chemin `existing` ;
- caractériser statiquement le chemin `create` ;
- caractériser en navigateur le rejoin d’une salle déjà créée ;
- prouver que le héros qui rejoint conserve son mouvement restant ;
- prouver que les autres héros conservent leur salle et leur position ;
- prouver qu’un rejoin `existing` ne recrée pas la salle ;
- prouver qu’aucun combat Tactical n’est déclenché par cette transition seule.

## Hors périmètre

Ne pas modifier dans ce lot de caractérisation :
- mouvement case par case ;
- calcul de portée ;
- `DungeonSpatial313` ;
- génération détaillée de salle ;
- `chooseKind()` ;
- `createRoom()` ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- branches ;
- combat / Tactical ;
- authored world ;
- Builder ;
- progression ;
- stockage générique ;
- assets ;
- Survie / Capture / PvP.

## Invariants

- `planGeneratedAdvance` reste pur et inchangé ;
- generated et authored restent séparés ;
- une salle existante n’est jamais recréée ;
- seul le héros actif change de salle lors d’un rejoin ;
- son mouvement restant est conservé ;
- les autres héros gardent leur position ;
- la case d’entrée reste l’autorité de placement ;
- `dc313LastTransition.created` reste exact ;
- Save & Quit / reprise ne régresse pas ;
- Tactical reste absent tant qu’aucun combat n’est demandé.

## TDD obligatoire

1. caractérisation statique GREEN de la transition actuelle ;
2. raccord à la CI ;
3. caractérisation navigateur GREEN du rejoin d’une salle existante ;
4. seulement ensuite choisir UNE frontière pure ou adapter explicite ;
5. écrire la sentinelle RED correspondante ;
6. appliquer Rule 26 avant toute modification du propriétaire inline Core 2.00 ;
7. micro-diff ;
8. triple CI ;
9. preview + validation utilisateur uniquement si comportement visible ;
10. checkpoint GREEN.

Aucune extraction runtime n’est autorisée par ce pré-audit tant que les caractérisations statique + navigateur ne sont pas GREEN.
