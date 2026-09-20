# GenSrpG — Phase 4 — Audit stockage suivant 3

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-3-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-3-2026-09-20`

Base exacte :
`bbe99430666bdd16d2807652f782ba3c6b293cb5`
(`checkpoint/gensrpg-phase4-storage-primary-selection-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Audit seulement.
Choisir le prochain micro-lot stockage JSON après Primary Selection.
Aucun runtime, gameplay, asset ou stockage n'est modifié dans cet audit.

## Inventaire courant

`docs/GENSRPG_PHASE2_STORAGE_OWNERS.json` :
- total direct : `203` ;
- résolu : `138` ;
- non résolu : `65` ;
- clés directes résolues : `27`.

Par domaine :
- Dungeon : `171 / 121 / 50` ;
- Tactical : `2 / 1 / 1` ;
- Core : `4 / 3 / 1` ;
- Shell : `3 / 3 / 0` ;
- Capture : `23 / 10 / 13`.

## index.html source

Checkpoint :
`bbe99430666bdd16d2807652f782ba3c6b293cb5`

Entrée Git :
- taille : `8 174 618` octets ;
- blob : `5d2b0a6da51fd70bd36f087cb9ab82a1af308226`.

Le blob est identique à celui obtenu après le raccord Capture progress.
Les lots Survie et Primary Selection n'ont pas modifié `index.html`.

## Exclusions immédiates

### Dungeon runtime principal

`gensrpg_dungeon_runtime_v2`

Très partagé entre inline et nombreux fichiers Dungeon externes.
Audit dédié obligatoire.
Ne pas migrer par helper générique dans ce lot.

### Stats / état héros

La persistance dynamique de `gens-rpg-stats-clean-167874.js` appartient au prochain service Phase 4 Stats.
Ne pas l'absorber dans un lot stockage générique.

### Tactical

Le Tactical adapter mélange runtime Dungeon et état héros dynamique.
Hors micro-lot Storage.

### Runtime Repair

Mélange :
- JSON profils ;
- profil actif scalaire ;
- famille scalaire.

Core Storage V1 est actuellement JSON-only.
Ne pas élargir son contrat ici.

### Scalaires manifestes

À ne pas raccorder à `readJson/writeJson` sans service adapté :
- `gensrpg_forced_mode_reload_155` ;
- `gensrpg_game_profile_active_v1` ;
- `gensrpg_last_html_build`.

## Candidats inline prioritaires

À inspecter dans l'ordre :

1. `gensrpg_dungeon_deck_v1`
   - Dungeon ;
   - un seul bloc inline connu ;
   - read + write ;
   - candidat potentiellement isolé.

2. `gensrpg_dungeon_economy_rules_160`
   - Dungeon économie ;
   - un seul bloc inline ;
   - read + write ;
   - vérifier normalisation/defaults.

3. `gensrpg_manual_mj_effects_v1`
   - Dungeon MJ ;
   - un seul bloc inline ;
   - read + write ;
   - vérifier si état session ou configuration durable.

4. `gensrpg_rpg_gameplay_by_profile_v1`
   - Capture ;
   - un seul bloc inline ;
   - read + write ;
   - vérifier schéma et dépendances de profil.

5. `gensrpg_challenge_library_v1`
   - Dungeon ;
   - plusieurs propriétaires inline ;
   - read + write ;
   - moins prioritaire car partagé entre trois générations de Core Dungeon.

## Critère de sélection

Le prochain lot ne sera ouvert que si une famille :
- est JSON ;
- a un fallback parfaitement caractérisé ;
- conserve le même propriétaire métier ;
- n'entraîne pas de migration de schéma ;
- ne touche pas `gensrpg_dungeon_runtime_v2` ;
- n'introduit pas de wrapper métier concurrent ;
- peut être validée par parité + vrai raccord.

## Besoin d'inspection exacte

Les candidats sont tous inline dans le gros `index.html`.
La règle 26 impose donc d'utiliser le fichier exact du checkpoint, fourni par Sylvain, plutôt qu'une récupération répétée/partielle du gros fichier.

Le fichier à vérifier doit correspondre au blob :
`5d2b0a6da51fd70bd36f087cb9ab82a1af308226`.


## Validation finale — GREEN

HEAD validé avant clôture documentaire :
`8de495ee94040cbc12913d9328f67c0689396e9d`

Runs :
- Architecture + navigateur complet `35509834853` — SUCCESS ;
- Firefox `35509834854` — SUCCESS ;
- Tactical Dock `35509834852` — SUCCESS.

Aucun runtime, gameplay, asset ou stockage n'a été modifié dans cet audit.

Décision :
la prochaine migration ne doit pas être choisie à partir du manifeste seul.
Il faut d'abord inspecter le `index.html` exact correspondant au blob
`5d2b0a6da51fd70bd36f087cb9ab82a1af308226`
et caractériser read/write/fallback/propriétaire du meilleur candidat.
