# GenSrpG — Phase 6 / bibliothèque de compétences Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-wave-reserve-normalization-green-2026-09-25`
- SHA exact :
  `e5eca6948fbe2b38cc026fb4cc803a44a88e7e29`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-skill-library-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-skill-library-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Signalement utilisateur

En contexte Survie, depuis le hub `ÉDITEURS / BIBLIOTHÈQUE`, la carte `📚 COMPÉTENCES` ouvre le répertoire générique sur l'onglet RPG. Les compétences spécifiques Survie/Zombicide ne sont pas proposées.

## Diagnostic prouvé

Le défaut est indépendant du micro-lot 5 des vagues.

Le runtime actuel possède deux systèmes de données distincts :

### Bibliothèque générique / RPG-Capture
- entrée du hub :
  `#abilityLibraryHubCard -> openAbilityLibrary(null)` ;
- onglets :
  `GENSRPG_ABILITY_LIBRARIES = RPG / Créatures / Dresseur / Compagnons` ;
- routage :
  `gensAbilityLibraryForTarget(null)` retourne actuellement toujours `"rpg"` ;
- source :
  `loadAbilityLibrary()`.

### Bibliothèque Survie historique
- compétences natives :
  `Z40K_NATIVE_SKILLS` ;
- compétences personnalisées :
  `loadSkillLibrary()` ;
- source canonique de sélection :
  `allSelectableSkills()` ;
- exemples natifs présents :
  `Tourelle`, `Chien Robot`, `Miracle`, `Extermination`,
  `Soins intensifs`, `Grappin`, `Diversion`, `Économe`,
  bonus de dés / précision / Force / sauvegarde / déplacement / PV.

Le défaut vient donc du **routage et de la présentation du hub**, pas d'une disparition des données Survie.

## Propriétaires à conserver

- compétences Survie natives : `Z40K_NATIVE_SKILLS` ;
- compétences Survie personnalisées : `loadSkillLibrary()` ;
- agrégation Survie : `allSelectableSkills()` ;
- bibliothèque générique RPG/Capture : `loadAbilityLibrary()`.

Il est interdit de recopier les compétences Survie dans `loadAbilityLibrary()` ou de créer une deuxième source de vérité.

## Cible architecturale du lot

Faire de la bibliothèque générique un **façade d'affichage contextuelle** pour le hub :

1. ajouter un onglet `Survie` dans `GENSRPG_ABILITY_LIBRARIES` ;
2. lorsque `openAbilityLibrary(null)` est appelé depuis le hub en contexte Survie,
   sélectionner par défaut l'onglet `survival` ;
3. l'onglet `survival` doit lire directement `allSelectableSkills()` ;
4. les compétences natives et personnalisées Survie doivent être visibles dans la recherche ;
5. les onglets RPG / Créatures / Dresseur / Compagnons restent inchangés ;
6. aucune compétence Survie ne doit être copiée dans le stockage générique ;
7. la création/édition détaillée Survie reste possédée par le système Survie existant dans ce lot.

Ce lot corrige donc la **visibilité/routage** de la bibliothèque, pas les mécaniques de compétence.

## Périmètre autorisé

- `index.html` : routage et rendu de la bibliothèque uniquement ;
- un test navigateur réel dédié ;
- sentinelle statique si nécessaire ;
- documentation / CURRENT_WORK ;
- empreintes exactes uniquement si le runtime change.

## Hors périmètre

- aucun changement de logique de compétence Survie ;
- aucun changement des héros ou de leurs slots de progression ;
- aucune migration de `Z40K_NATIVE_SKILLS` vers la bibliothèque RPG ;
- aucun changement Dungeon/Tactical/Capture ;
- aucune modification des cooldowns/coûts/effets ;
- aucun changement du stockage `z40k_skill_library_v2` ;
- aucune refonte de l'éditeur de compétences.

## TDD obligatoire

Le test navigateur doit traverser le vrai Shell :

1. accueil -> Mode Survie ;
2. sélectionner un univers Survie réel ;
3. ouvrir `ÉDITEURS / BIBLIOTHÈQUE` ;
4. cliquer réellement `📚 COMPÉTENCES` ;
5. prouver RED actuel : onglet par défaut RPG, absence de `Tourelle` / `Extermination` / `Soins intensifs` ;
6. après correction :
   - onglet `Survie` actif par défaut ;
   - ces compétences sont visibles ;
   - une compétence personnalisée injectée dans `z40k_skill_library_v2` est également visible ;
   - l'onglet RPG reste accessible et affiche encore ses compétences ;
   - aucune erreur navigateur.

## Rule 26

Le runtime courant `index.html` doit rester contrôlé par blob exact avant modification.
Le contenu exact ne doit pas être reconstruit depuis des fragments GitHub.
