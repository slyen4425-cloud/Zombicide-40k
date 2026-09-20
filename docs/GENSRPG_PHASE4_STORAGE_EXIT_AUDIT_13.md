# GenSrpG — Phase 4 Storage — Audit de sortie 13

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-storage-exit-audit-13-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-exit-audit-13-2026-09-20`.
- Base exacte / dernier GREEN : `db364007fcc452cfbb7a06b06c3c49007a8b4ddc`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-storage-mj-rules-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## But

Décider si le sous-chantier **service commun Storage** doit continuer à migrer des
accès un par un ou s'il est suffisamment extrait pour passer au service Core
suivant de la roadmap : **Stats**.

Cet audit ne modifie aucun runtime.

## État exact de départ

`index.html` :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Cartographie directe :
- accès : `182` ;
- résolus : `117` ;
- non résolus : `65` ;
- familles résolues : `19`.

Core Storage :
`assets/gensrpg/core/storage-v1.js`.

API volontairement limitée :
- `readJson(storage,key,fallback)` ;
- `writeJson(storage,key,value)`.

Aucun remove/scalar/migration API n'est ajouté dans cet audit.

## Principe de décision

La Phase 4 demande de sortir les **services communs**, pas de déplacer chaque
`localStorage` uniquement pour faire baisser un compteur.

Une famille restante n'est pas un nouveau micro-lot Storage commun si sa vraie
responsabilité est inséparable :
- de l'exploration Dungeon ;
- du Shell/session/navigation ;
- du Tactical ;
- de Capture ;
- d'une compatibilité/repair legacy ;
- d'un marqueur diagnostique scalaire.

Dans ces cas, elle doit être traitée avec son futur propriétaire lors de
l'extraction du module concerné.

## Classification exhaustive des 19 familles restantes

### Phase 7 — Dungeon exploration/runtime — 9 familles

1. `gensrpg_dc048_pending_trap_v1`
   - owner : `dungeonCore048ExplorationTests` ;
   - get/set/remove ;
   - état transitoire de piège Dungeon.

2. `gensrpg_dc052_special_branch_v1`
   - owner : `dungeonCore052SpecialExploration` ;
   - get/set/remove ;
   - navigation/branche Dungeon.

3. `gensrpg_dc064_door_challenge_`
   - owner : `dungeonCore051ExplorationPolish` ;
   - get/set ;
   - challenge de porte Dungeon.

4. `gensrpg_dc064_door_challenge_*`
   - owners Dungeon 051/103/200 ;
   - set/remove ;
   - même famille de challenges de porte.

5. `gensrpg_dungeon_core01_device_hero_v1`
   - owners Dungeon 053/200/Core01 ;
   - get/set/remove ;
   - état device/héros du runtime Dungeon.

6. `gensrpg_dungeon_core02_v1`
   - 11 owners actifs Dungeon ;
   - get/set ;
   - état historique partagé entre plusieurs couches d'exploration ;
   - doit être consolidé avec le runtime Dungeon, pas isolé comme simple transport.

7. `gensrpg_dungeon_runtime_v2`
   - très grand graphe multi-propriétaires externes + inline ;
   - get/set ;
   - cœur de l'état runtime Dungeon ;
   - explicitement réservé à Phase 7.

8. `gensrpg_session_profile_100_v1`
   - owner : `dungeonCore100ResumeAndInteractionFix` ;
   - get/set/remove ;
   - session/reprise Dungeon.

9. `z40k_session_active_v1`
   - owners : final exit authored + `dungeonCore310PersistenceAndTokens` ;
   - get/set ;
   - frontière de session Dungeon historique.

### Phase 5 — Shell / session / navigation — 2 familles

10. `gensrpg_forced_mode_reload_155`
    - owner : `forceReload155` ;
    - domaine Shell ;
    - get/set/remove ;
    - changement de famille/contexte + reload sûr.

11. `gensrpg_game_profile_active_v1`
    - lecture depuis le runtime Dungeon 098 ;
    - sémantique = profil/session actif ;
    - à consolider avec l'autorité Shell/session en Phase 5 plutôt qu'en simple
      micro-lot Storage.

### Phase 8 — Tactical / compatibilité — 2 familles

12. `gensrpg_dungeon_tactical098_v1`
    - owners Dungeon 098/100/103/104/105 ;
    - get/set ;
    - état tactique historique à traiter lors de la consolidation Tactical.

13. `gensrpg_game_profiles_v1`
    - writer dans `gens-rpg-runtime-repair-1678106.js` ;
    - propriétaire cartographié :
      `Tactical / Dungeon Compatibility Bridge` ;
    - dette de réparation de profils, pas un nouveau service commun autonome.

### Phase 9 — Capture — 5 familles

14. `gensrpg_rpg_gameplay_by_profile_v1`
15. `gensrpg_shared_entities_scoped_v1__*`
16. `gensrpg_shared_entities_scoped_v1__family__creature`
17. `gensrpg_shared_entities_v1__`
18. `gensrpg_shared_entities_v1__family__creature`

Les cinq sont actuellement sous `builtinMonsterCapture162`, owner Capture.
Le gameplay-by-profile possède en plus une dette historique miroir/seed.
Ils doivent être traités pendant l'autonomisation Capture, où leur schéma et leur
propriété pourront être fixés ensemble.

### Core diagnostic — 1 famille

19. `gensrpg_last_html_build`
    - owner : `gensBuildMarker163` ;
    - setItem scalaire uniquement ;
    - marqueur de build/cache/diagnostic ;
    - aucune raison d'étendre le service JSON Core avec une API scalaire juste
      pour supprimer cet accès direct.

## Conclusion architecturale

Aucun des 19 restants n'est prouvé comme un **nouveau micro-lot JSON commun,
autonome et homogène**.

Continuer à les raccorder un par un à `GensStorageV1` créerait au moins un des
problèmes suivants :
- déplacer un transport avant son vrai propriétaire ;
- masquer une dette runtime Dungeon/Tactical ;
- forcer remove/scalar dans une API Core volontairement simple ;
- travailler Capture avant sa phase d'isolation ;
- faire baisser un compteur sans simplifier l'architecture.

La bonne frontière est donc :

**clôturer le sous-chantier service commun Storage après MJ Rules**,

tout en conservant les 19 familles comme dettes explicitement attribuées aux
phases 5/7/8/9 ou au diagnostic Core.

Cela ne signifie pas « plus aucun localStorage direct ».
Cela signifie que le **service commun Storage** a été extrait et que les accès
restants doivent désormais migrer avec leur responsabilité métier/module.

## Sentinelle

`tests/gens_phase4_storage_exit_audit_13_v1.test.cjs`

Elle verrouille :
- blob/taille source ;
- compteurs Storage actuels ;
- couverture exacte des 19 familles ;
- classification 9 Dungeon / 2 Shell-session / 2 Tactical-compat / 5 Capture /
  1 diagnostic Core ;
- domaines des propriétaires cartographiés ;
- absence d'extension opportuniste de `GensStorageV1` ;
- absence de candidat `core-json-autonomous`.

## Décision

Si la batterie finale est GREEN :
1. créer `checkpoint/gensrpg-phase4-storage-exit-audit-13-green-2026-09-20` ;
2. considérer **Phase 4 / Storage commun** clôturé ;
3. reprendre **Phase 4 / Core Stats** depuis ce checkpoint ;
4. utiliser le pré-audit Stats Agent 1 comme apport documentaire, sans repartir
   de sa branche ancienne et sans court-circuiter le nouveau GREEN Storage.

Aucun runtime n'est modifié par Audit 13.


## Validation finale — GREEN fonctionnel

HEAD validé avant clôture documentaire :
`a5ebf2b46d131c2adac16407ecf486e4d4073ed6`.

Runs :
- Architecture + navigateur complet : `35536186331` — SUCCESS ;
- Firefox : `35536186350` — SUCCESS ;
- Tactical Dock : `35536186332` — SUCCESS.

La sentinelle Audit 13 confirme :
- les 19 familles restantes sont toutes classifiées exactement une fois ;
- 9 relèvent de Phase 7 Dungeon ;
- 2 de Phase 5 Shell/session ;
- 2 de Phase 8 Tactical/compatibilité ;
- 5 de Phase 9 Capture ;
- 1 est un marqueur diagnostique Core scalaire ;
- aucun candidat Storage commun JSON autonome ne reste ;
- `GensStorageV1` n'a reçu aucune extension opportuniste.

Aucun runtime n'a été modifié dans Audit 13.

La clôture documentaire doit repasser les trois workflows sur son SHA exact
avant création du checkpoint
`checkpoint/gensrpg-phase4-storage-exit-audit-13-green-2026-09-20`.

Après ce checkpoint, le prochain chantier Phase 4 est **Core Stats**, en
commençant par S1 contrats/sentinelles puis S2 normalisation pure.
