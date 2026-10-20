# GenSrpG — Phase 12 / Dungeon → Tactical : chargement du propriétaire Core Stats — GREEN ciblé

**20 octobre 2026 — parcours UI jusqu'à l'ouverture d'un vrai combat : GREEN sur Chromium et Firefox. Combat complet, IA et résultat non validés.**

## §25 / autorité

- Départ certifié `checkpoint/gensrpg-phase12-dungeon-core200-room-spawn-green-2026-10-20`, SHA `739d947ec601ee54e2fecb2f73078eaf4c6e4894`.
- START créé **avant mutation** `checkpoint/gensrpg-start-phase12-dungeon-tactical-handoff-2026-10-20` sur le même SHA, branche dédiée `work/gensrpg-phase12-dungeon-tactical-handoff-2026-10-20`.
- `index.html` inchangé au blob R15 `9f35eb833a6ede4b91399854f19bb9bef59f45ab` de **1 729 855 octets**, [permalien exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html). Le moteur Core200 / spawn reste au blob GREEN `9523187d72913c284bfd8afab85858c1834e31d2`.
- **Seul fichier de production modifié** : `assets/gensrpg/tactical/entry-v1.js`, le propriétaire du **chargement lazy** de Tactical (original `60d4494d453956ad1454ef6dddef641f8e3b18a1` → `9def3ebbc5e642f0258aa3ef040664faced18acf`). Aucun changement de formule, combat, IA, stats, Shell, SW, index, données de profils.

## Reproduction réelle (avant) et cause

- Vrai parcours UI Aventure RPG → Dungeon → rechargement prévu changement famille → nouvelle partie Aldren/Lyra/Brom → salle 1 → squelette `dng_skeleton` 5 PV `dungeonRoom=1` → vrai clic **ENGAGER LE COMBAT**.
- [Run RED 39467688699](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39467688699) : routeur `GensRpgTacticalCombatV2Bridge` chargé, `eligible()` ok avec **1 héros + 1 ennemi**, sélection V113 correcte, mais `GensRpgTacticalCombatV2Ui.openCurrentEncounter` échoue pendant le snapshot canonique avec l'erreur console **Core Stats snapshot adapter unavailable**. Le `pageerror` seul ne signalait pas l'erreur parce que le bridge la capturait et renvoyait `open-failed`.
- Source du manque : le module `gens-rpg-tactical-combat-v2-stats-1678110.js` exige `GensCleanRpgStats167874.coreSnapshot()`, une fonction fournie par `assets/gensrpg/gens-rpg-stats-clean-167874.js`, qui exige à son tour les cinq services Core Stats S3–S7 et Normalization. Le chargeur Tactical initial ne garantissait pas leur présence avant le snapshot.

## Modification mono-propriétaire

- `GensTacticalV1.activate` charge, uniquement **à la demande de Tactical**, les fichiers propriétaires Core existants dans leur ordre documenté : Normalization, Value Engine, Hero Values, Modifier Provider, Derived Values, Snapshot, puis `GensCleanRpgStats167874`.
- Chaque ressource déjà installée est réutilisée, aucune formule n'est dupliquée dans Tactical. Chargement par `script` séquentiel. Si la ressource ou son API manque, l'activation notifie l'échec plutôt que de démarrer un combat sur un snapshot incomplet. Aucun heartbeat, `location.reload` ou nouveau patch global.
- Le périmètre Core / Tactical reste intact : **Core = stats**, Tactical = compilation des combattants et combat, Dungeon = déplacement et entrée en salle.

## Preuves et statut

- [CI finale **39468714263**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39468714263), commit **`d35a0a5fd8228863c87a2da130fb1cc46a84679d`**, contexte `gensrpg/phase12/dungeon-tactical-handoff` **SUCCESS**, tests historiques R10–R15 et architecture en amont **SUCCESS**.
- Chromium et Firefox parcourent le vrai démarrage Dungeon, créent un squelette vivant, cliquent sur le vrai bouton après fermeture de la modale d'effet via son bouton. Le routeur accepte `dungeon_aldren` et l'instance ennemie. L'UI Tactical devient **visible**, `getBattle()` renvoie une bataille, `__gensTacticalV2LastRoute.entry='dc200ManualAction'`, zéro `pageerror`, zéro requête script échouée. Les deux témoins historiques de refus n'apparaissent plus.
- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-dungeon-tactical-handoff-green-2026-10-20` au SHA exact **`d35a0a5fd8228863c87a2da130fb1cc46a84679d`** créé après CI SUCCESS. Les commits de documentation restent hors de ce checkpoint.

## Limites / suite à ne pas confondre avec GREEN

Cette certification couvre **l'entrée en combat et la création réelle de la bataille**, non la sélection d'attaque, un déplacement, une action d'IA, des dégâts, l'écran de résultat, les récompenses, le retour exploration, la reprise de sauvegarde ou la validation manuelle sur Pixel/téléphone. Une nouvelle sentinelle de premier tour puis de sortie combat doit les caractériser sans injection de jets ni ennemis. Phase 12 globale toujours ouverte ; `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`, laboratoires et autres modes intouchés. Pas de merge/Pages.
