# GenSrpG — Coordination des fils et agents

Ce document complète `GENSRPG_CHARTE.md`, `GENSRPG_RESTRUCTURATION_ROADMAP.md` et `GENSRPG_CURRENT_WORK.md`.

Objectif : permettre de reprendre GenSrpG dans un autre fil sans perdre la hiérarchie entre le fil directeur et les agents parallèles.

## 1. Rôle unique du fil directeur

Un seul fil à la fois porte le rôle **COORDINATEUR / FIL DIRECTEUR**.

Il est seul responsable de :
- choisir le checkpoint vert de référence ;
- ouvrir les lots suivants ;
- attribuer les missions aux agents ;
- empêcher deux agents de modifier le même propriétaire critique ;
- contrôler branche, SHA, diff et tests des agents ;
- décider de l'ordre d'intégration ;
- créer les checkpoints verts ;
- maintenir les documents de reprise ;
- décider quand une version peut être proposée au test utilisateur ;
- ne jamais modifier `main` pendant la restructuration tant que la charte l'interdit.

Les autres fils sont des **AGENTS EXÉCUTANTS**. Ils ne deviennent jamais coordinateurs par défaut et ne fusionnent pas leurs travaux entre eux.

## 2. Procédure de reprise dans un nouveau fil directeur

Lire dans cet ordre :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `docs/GENSRPG_CURRENT_WORK.md`
4. `docs/GENSRPG_COORDINATION.md`

Puis vérifier :
- le SHA exact de `main` ;
- le dernier checkpoint vert ;
- les branches agents encore actives ;
- les propriétaires critiques déjà réservés ;
- les résultats agents non encore intégrés.

## 3. Règle agent

Chaque agent doit avoir :
- une branche dédiée ;
- une mission unique ;
- un périmètre déclaré ;
- un propriétaire principal ;
- une liste explicite de systèmes interdits ;
- des tests avant correction ;
- un SHA final et un compte rendu.

Règle absolue : **1 agent = 1 branche = 1 périmètre = 1 checkpoint éventuel**.

Deux agents ne doivent jamais modifier le même propriétaire critique en parallèle.

## 4. Verrous de coordination

Tant qu'un lot est actif, son propriétaire critique est verrouillé pour les autres agents.

Avant de lancer un nouvel agent, le coordinateur vérifie qu'il n'entre pas en conflit avec :
- navigation / fiche héros ;
- stats / XP / progression ;
- combat Tactical ;
- déclenchement combat Dungeon ;
- déplacement Dungeon ;
- sauvegarde / reprise ;
- inventaire / équipement / sets ;
- shell / `index.html` si le même bloc est concerné.

## 5. État de coordination — 2026-09-17

### Fil directeur
- Rôle : **COORDINATEUR actif**.
- Chantier courant : fermeture Combat **4M — `cell` Runtime 2.00 uniquement**.
- Branche : `work/gensrpg-combat-callsite-migration-4m-cell-2026-09-17`.
- Base exacte : checkpoint Combat 4L vert.
- Checkpoint de base : `checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17`.
- SHA de base : `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.
- Propriétaires verrouillés pendant 4M : préparation `cell` Runtime 2.00 et contrat Bridge de limitation de la sélection ennemie.
- Candidat technique vert : `10a64990d6eeac101cab8c6484ca0465cb4b2d67`.
- Checkpoint cible : `checkpoint/gensrpg-combat-callsite-migration-4m-green-2026-09-17` après revalidation du SHA documentaire final.

### Production sûre
- `main` : V16.78.114.11.
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

### Chaîne directrice verte
- Combat 4K : `c672726b69aa5895d252e2f31084c20740bcc699`.
- Talent post-4K : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Preview/PWA post-Talent : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Dock Tactical post-PWA : `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Combat 4L `ambush` : `45bbca1c1f146732f4ae366c2ab74b9ec9263b2b`.

### Dock Tactical — protégé
Le jalon Dock reste obligatoire dans les validations de composition. L'UI Tactical canonique expose `onAfterRender()` et V111 s'y abonne ; aucun wrapper `render()`, `MutationObserver` global ou retry de réparation n'est autorisé.

### Combat 4M — caractérisation
Ancien callsite Runtime 2.00 :

`startCombat([String(target.id)],'cell')`

La caractérisation a confirmé que Dungeon possède :
- la cible exacte ;
- le filtre `liveEnemies()` ;
- le tirage de renforts `nearbyInterveners()` ;
- 65 % de renfort à distance Manhattan 1, 30 % à distance 2, 0 % au-delà ;
- la déduplication ;
- la popup `⚔️ RENFORTS ENNEMIS` ;
- le seed final d'ennemis.

Il n'existe pas de `reinforcementRange` configurable dans ce chemin Runtime 2.00 ; aucune nouvelle règle n'a été inventée.

Test : `tests/gens_core200_cell_entry_characterization_lot4m.test.cjs`.
Run de caractérisation : `35260234398` — success.

### Combat 4M — contrat cible
Le risque était qu'un passage mécanique au Bridge laisse `V113.selectCombatants()` élargir les `enemyIds` au-delà de la cible + des renforts réellement sélectionnés par Dungeon.

Contrat retenu :
- Dungeon prépare la cible et les renforts ;
- le Bridge appelle toujours V113 pour scope/héros ;
- `limitEnemyIdsToRequest:true` autorise seulement une intersection finale avec la liste d'ennemis explicitement demandée ;
- aucun ennemi supplémentaire ne peut être ajouté par ce contrat `cell`.

Le test cible a été posé rouge avant correction : run `35260392523`.
Test permanent : `tests/gens_core200_cell_bridge_contract_lot4m.test.cjs`.

### Combat 4M — correction
Runtime 2.00 appelle maintenant un helper local `startCellCombat(target,x)` qui conserve la préparation Dungeon puis entre par :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:chosen.map(e=>String(e.id)),reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true})`

Le traitement `cell` a été retiré de l'ancien `startCombat()` pour éviter une double autorité de préparation.

Le Bridge conserve `V113.selectCombatants()` comme autorité de scope/participants et ne fait que borner sa sélection ennemie à la demande Dungeon lorsque le flag explicite est présent.

Aucun observer global, timer de réparation, wrapper de rendu ou nouveau système de combat n'a été ajouté.

### Inventaire après 4M
- `dc200StartCombat` = 1 ;
- `openDungeonCombatSetup` = 1 ;
- `launchCombat200` = 2 ;
- `startCombat` = 2 — fonction historique + alias de compatibilité ; aucun callsite Dungeon actif restant.

Les fallbacks historiques ne doivent pas être supprimés pour réduire artificiellement les compteurs. Leur éventuelle extraction devra préserver les modes non-Dungeon et constituer un lot séparé.

### Validation technique 4M
Candidat technique : `10a64990d6eeac101cab8c6484ca0465cb4b2d67`.

CI :
- 4M dédié — success, run `35264148227` ;
- architecture + Chromium/preview — success, run `35264148205` ;
- Firefox général — success, run `35264148110` ;
- Dock contrat + Chromium + Firefox — success, run `35264148122`.

Deux anciennes assertions source ont été alignées sur le contrat réel `preparedOptions -> V113.selectCombatants()` ; ces commits de test n'ont modifié aucun runtime.

### Fermeture en cours
Les documents créent un SHA final documentaire distinct. Ce SHA doit repasser les quatre validations avant création du checkpoint 4M.

## 6. Ordre d'intégration décidé

Ordre actuel :
1. Combat 4K — fermé vert ;
2. Talent post-4K — fermé vert ;
3. Preview/PWA post-Talent — fermé vert ;
4. Dock Tactical post-PWA — fermé vert ;
5. Combat 4L `ambush` — fermé vert ;
6. Combat 4M `cell` — candidat technique vert, clôture documentaire en cours.

Le lot suivant ne doit être ouvert qu'après le checkpoint 4M final. Il doit être choisi depuis la roadmap et l'inventaire, sans supprimer mécaniquement les fallbacks historiques restants.

Ne pas fusionner les anciennes branches agents ou lignes parallèles en bloc. Reporter uniquement les changements caractérisés et compatibles sur la dernière base verte directrice.

## 7. Compte rendu obligatoire d'un agent

À la fin de son lot, un agent doit fournir :
- cause exacte ;
- branche ;
- SHA final ;
- fichiers modifiés ;
- tests ajoutés/modifiés ;
- résultats CI ;
- risques ou limites ;
- confirmation qu'il n'a pas touché aux systèmes hors périmètre ;
- checkpoint éventuel.

Le coordinateur ne considère jamais un travail intégré simplement parce qu'un agent dit qu'il est terminé : il vérifie le dépôt et les tests.

## 8. Règle de succession

Quand un nouveau fil devient directeur, l'ancien fil ne doit plus lancer de nouveau chantier concurrent.

Le nouveau fil devient l'unique autorité de coordination après avoir vérifié les quatre documents de reprise et l'état GitHub réel.
