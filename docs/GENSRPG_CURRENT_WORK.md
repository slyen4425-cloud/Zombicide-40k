# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Dernier jalon vert — migration des points d'entrée combat, lot UI manuel 1

- Branche de travail : `work/gensrpg-combat-callsite-migration-1-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-2026-09-16`
- Base exacte : `695be0e029fb49ee70966729474b35aa0a2d9c63`
- SHA validé avant fermeture documentaire : `23947dddc32e80d165ad0ec5670a1e8a23a061b3`
- Checkpoint vert précédent : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` n'a pas été modifié.

## Résultat du lot UI manuel 1

Deux points d'entrée UI natifs ont été migrés vers l'unique contrat de combat :

1. `#dungeonCombatMenuBtn` — « ENGAGER LE COMBAT » ;
2. `#dungeonCombatSheetBtn` — « Combat RPG » de la fiche.

Ils appellent maintenant directement :

`GensRpgTacticalCombatV2Bridge.requestCombat(window, options)`

avec :

- `reason: "manual-setup"` ;
- une `entry` propre à chaque bouton.

Ils ne dépendent plus de l'adaptateur historique global `openDungeonCombatSetup()`.

## Périmètre réellement modifié

Comparaison depuis le checkpoint vert précédent :

- `index.html` : exactement 2 lignes remplacées, correspondant aux deux `onclick` ci-dessus ;
- inventaire des points d'entrée mis à jour ;
- nouveau test de régression ciblé ;
- documentation mise à jour ;
- sentinelle architecture raccordée au nouveau test.

Aucun fichier de moteur gameplay, Tactical, stats, XP, déplacement, sauvegarde, inventaire, équipement, cache/PWA, Survie, Capture, PvP ou World Builder n'a été modifié dans ce lot.

## Dette réduite

Inventaire après ce lot :

- `dc200StartCombat` : 13 occurrences — inchangé ;
- `openDungeonCombatSetup` : 15 occurrences — 17 auparavant ;
- `launchCombat200` : 2 occurrences — inchangé ;
- `startCombat` : 6 occurrences — inchangé.

## Validation

Le lot a été validé avec :

- test réel des deux boutons vers `requestCombat(window, ...)` ;
- contrat Bridge unique ;
- inventaire exact des anciens points d'entrée ;
- sentinelles V112/V113/Bridge ;
- garde des autorités globales ;
- progression/XP/récompenses inchangés ;
- architecture complète verte ;
- preview Chromium verte ;
- Firefox wall sentinel verte.

Les workflows temporaires d'écriture utilisés uniquement pour modifier le gros `index.html` ont été retirés. Le workflow progression est revenu à son état lecture/test uniquement.

## Prochaine étape du plan — pas encore modifiée

Continuer la réduction progressive des anciens points d'entrée combat vers :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Toujours par petits groupes homogènes, avec caractérisation avant correction.

Avant de choisir le lot 2, séparer explicitement :

- les fallbacks manuels de `dc030EngageCombat` ;
- le fallback d'embuscade ;
- les anciennes définitions/wrappers de `openDungeonCombatSetup` ;
- les couches historiques désactivées.

Ne pas mélanger ces catégories dans un même lot sans test prouvant que leurs raisons, ennemis, participants, mode MJ et retour exploration sont identiques.

## Chantier précédent — XP manuel + portrait fiche héros (vert et validé utilisateur)

Checkpoint : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` sur `695be0e029fb49ee70966729474b35aa0a2d9c63`.

Validation utilisateur Firefox le 16/09/2026 : arts/portrait et XP corrigés.

Résultat :

- `changeXP()` natif reste propriétaire du XP manuel et passe par le moteur canonique de progression ;
- aucun runtime progression parallèle n'est chargé ;
- le portrait de fiche possède une seule autorité active ;
- anciennes couches de réparation de fiche neutralisées sans retirer les arts du plateau ;
- architecture, Chromium, Firefox et progression verts.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
