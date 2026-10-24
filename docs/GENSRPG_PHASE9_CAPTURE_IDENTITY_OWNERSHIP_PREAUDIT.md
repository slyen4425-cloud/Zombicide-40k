# GenSrpG — Phase 9 — Pré-audit Capture identity ownership — 2026-10-03

## Base

- GREEN précédent : `checkpoint/gensrpg-phase9-capture-public-entry-raccord-green-2026-10-03`
- SHA : `c2d80eea97d1b9111f2a1ec506dafde9c2eb772e`
- checkpoint start : `checkpoint/gensrpg-start-phase9-capture-identity-ownership-preaudit-2026-10-03`
- branche : `work/gensrpg-phase9-capture-identity-ownership-preaudit-2026-10-03`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Contexte

Le raccord public-entry Capture est GREEN :
`Shell -> GensCaptureV1 -> legacy Capture139`.

Le prochain obstacle architectural Phase 9 est l'identité fonctionnelle historique :
- Capture est encore représentée par `gameStyle="dungeon"` ;
- plusieurs helpers utilisent encore `isDungeonMode()` ;
- certaines UI/initialisations distinguent Capture par exclusions autour du profil Dungeon.

Le but de ce pré-audit n'est pas de supprimer ces conditions immédiatement mais de déterminer leur ownership réel et l'ordre sûr de retrait.

## Questions à trancher par preuve

1. Quelle fonction doit être l'autorité canonique "Capture actif" ?
2. Quels consommateurs peuvent recevoir directement cette identité sans dépendance Dungeon ?
3. Quels appels `isDungeonMode()` sont vrais Dungeon uniquement, et lesquels transportent Capture par héritage ?
4. Le Shell peut-il classer Capture sans `gameStyle="dungeon"` tout en restant routing-only ?
5. Le pré-game et les participants peuvent-ils utiliser une identité Capture explicite sans modifier le gameplay ?
6. Quelles compatibilités V137/V138/V151 doivent rester jusqu'à un seam ultérieur ?

## Invariants

- aucune seconde autorité d'identité ;
- Shell reste routing-only ;
- vrai Dungeon inchangé ;
- Capture139 session init inchangé dans ce pré-audit ;
- aucun lab raccordé ;
- aucun fallback global ;
- aucun timer/observer/retry ajouté.

## Rule 26 gate

Gate franchie avec `work50.zip/index50.txt`.

Vérification :
- commit de référence `c2d80eea97d1b9111f2a1ec506dafde9c2eb772e` ;
- taille `8169430` octets ;
- blob Git recalculé `f523410e175ee4946059da8e8ee8519295fb63c5` ;
- HTML valide.

## Cartographie exacte

### 1. Identité Dungeon trop large

`isDungeonMode()` lit le profil actif puis renvoie `p?.gameStyle==="dungeon"`. Le built-in Monster Capture ayant encore ce style, Capture est donc automatiquement considérée Dungeon par tous les consommateurs historiques de ce helper.

Le fichier exact contient 126 appels `isDungeonMode()`. Ils ne peuvent pas être inversés globalement dans un seul lot : plusieurs contrôlent encore équipement RPG, économie, UI, événements, combat et autres services historiques partagés.

### 2. Frontières Capture encore dépendantes du style Dungeon

Les fonctions suivantes exigent actuellement `gameStyle="dungeon"` pour reconnaître Capture :
- `gensCapturePregameMode()` ;
- `gensPureCaptureSheetMode()` ;
- `gensShellActiveModuleV1()` ;
- `gensMode151()` ;
- `gensIsCaptureGameplay()` ;
- `gensContentFamilyForProfile()` ;
- `gensGameplayModules()`.

### 3. Helper Capture existant non canonique

`gensIsCaptureGameplay(profile)` est le meilleur noyau historique mais ne peut pas devenir l'autorité tel quel :
- il rejette tout profil qui n'est pas `gameStyle="dungeon"` ;
- il appelle `ensureRpgProfileData(profile)` et peut donc normaliser/muter des données ;
- une identité de module doit rester pure et déterministe.

Il devra déléguer vers l'autorité publique, pas coexister comme second détecteur.

### 4. Identité Capture explicite déjà présente dans les données

Le seed Monster Capture porte déjà :
- `rpgUniverse.gameplay.profile="creature"` ;
- `rpgUniverse.gameplay.modules.capture=true` ;
- `rpgUniverse.gameplay.modules.controllableCreatures=true`.

Ces marqueurs permettent d'identifier Capture sans utiliser Dungeon.

Pour préserver la parité des profils existants, la future autorité pure peut reprendre la sémantique historique explicite de `gensIsCaptureGameplay()` sans son test Dungeon ni sa mutation : profil gameplay `creature` **ou** couple `capture + controllableCreatures`.

### 5. Participants encore couplés à Dungeon

`normalizeGameParticipants()` utilise encore `isDungeonMode()` pour choisir sa branche de filtrage.

`availableParticipantHeroIds()` appelle encore `ensureDungeonContent()` lorsque `isDungeonMode()` est vrai. Ce chemin est donc réellement emprunté par Capture aujourd'hui.

Ces deux responsabilités sont volontairement différées : modifier `isDungeonMode()` dès le premier seam changerait trop de services simultanément.

### 6. Resume Dungeon déjà capable d'exclure Capture

Le propriétaire de reprise Dungeon contient déjà :
`const capture=...isCaptureContext138();` puis `const dungeon=...isDungeonMode()&&!capture;`.

C'est une preuve importante : la sécurité Dungeon peut rester stricte tout en distinguant une identité Capture indépendante.

## Autorité canonique sélectionnée

Cible du prochain raccord :
`GensCaptureV1.isProfile(profile)`.

Contraintes :
- fonction pure ;
- aucune lecture DOM/storage ;
- aucune mutation de profil ;
- aucune dépendance `gameStyle="dungeon"` ou `isDungeonMode()` ;
- pas de fallback global ;
- un seul propriétaire de la décision Capture/non-Capture.

Les helpers historiques Capture devront déléguer à cette fonction, puis être retirés progressivement lorsqu'ils ne servent plus.

## Premier seam runtime proposé

Le premier seam ne touche pas les comportements RPG profonds. Il raccorde uniquement les frontières d'identité :
1. ajouter `GensCaptureV1.isProfile(profile)` ;
2. faire déléguer `gensIsCaptureGameplay()` ;
3. faire déléguer `gensCapturePregameMode()` et `gensPureCaptureSheetMode()` ;
4. faire classer Capture par le Shell via cette autorité avant la branche Dungeon ;
5. faire déléguer `gensMode151()` et `isCaptureContext138()` ;
6. permettre à `gensContentFamilyForProfile()` et à la lecture des modules de reconnaître Capture avant leur garde Dungeon.

`isDungeonMode()` reste inchangé dans ce seam. Son découplage sera un chantier ultérieur, sous TDD séparé.

## TDD RED à préparer

Le prochain TDD RED devra exiger :
- API publique `GensCaptureV1.isProfile(profile)` ;
- parité vraie pour le built-in Monster Capture ;
- faux pour Dungeon built-in et Survival ;
- aucune dépendance `gameStyle`/`isDungeonMode` dans cette API ;
- délégation des frontières d'identité listées ;
- `isDungeonMode()` inchangé ;
- lancement Capture/provider/victoire-reprise/non-interférence toujours GREEN.


## Sortie attendue

Le pré-audit sera GREEN seulement après :
- inventaire exact des dépendances d'identité ;
- sélection d'un seam minimal ;
- tests de caractérisation ajoutés ;
- triple CI GREEN ;
- checkpoint final dédié.

Aucun runtime n'est modifié ici.
