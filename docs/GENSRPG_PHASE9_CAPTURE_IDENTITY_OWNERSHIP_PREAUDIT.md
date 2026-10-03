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

Le contenu exact de `index.html` est requis.

Attendu :
- commit `c2d80eea97d1b9111f2a1ec506dafde9c2eb772e`
- blob `f523410e175ee4946059da8e8ee8519295fb63c5`
- taille `8169430`

L'ancienne copie `work43.zip/index43.txt` correspond au blob précédent et n'est plus suffisante pour ce chantier.

## Sortie attendue

Le pré-audit sera GREEN seulement après :
- inventaire exact des dépendances d'identité ;
- sélection d'un seam minimal ;
- tests de caractérisation ajoutés ;
- triple CI GREEN ;
- checkpoint final dédié.

Aucun runtime n'est modifié ici.
