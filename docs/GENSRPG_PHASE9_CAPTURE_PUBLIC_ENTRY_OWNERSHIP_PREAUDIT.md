# GenSrpG — Phase 9 — Pré-audit Capture public-entry ownership — 2026-10-03

## Base

- GREEN précédent : `checkpoint/gensrpg-phase9-capture-recovery-preaudit-green-2026-10-03`
- SHA : `08f727f7fa5dab01515c03ae57937aa5ca8b7810`
- checkpoint start : `checkpoint/gensrpg-start-phase9-capture-public-entry-ownership-preaudit-2026-10-03`
- branche : `work/gensrpg-phase9-capture-public-entry-ownership-preaudit-2026-10-03`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Faits déjà GREEN avant inspection du gros HTML

Les preuves Phase 5 déjà versionnées établissent :
- le Shell final est routing-only ;
- `GensShellModuleLaunchV1` possède un provider public `capture` ;
- ce provider délègue à une référence stable capturée depuis Capture139 ;
- il ne possède pas le gameplay/session Capture ;
- les protections Dungeon excluent explicitement Capture de leurs chemins de lancement/reprise ;
- `assets/gensrpg/capture/entry-v1.js` reste actuellement inerte et non chargé.

Ces preuves suffisent pour sélectionner le seam, mais pas pour modifier le propriétaire inline.

## Seam candidat

```text
Shell
  -> GensShellModuleLaunchV1.startModuleSession("capture")
  -> assets/gensrpg/capture/entry-v1.js
  -> délégation temporaire vers propriétaire historique Capture139
```

Objectif du futur micro-lot :
mettre la frontière publique Capture à sa place cible sans déplacer encore le gameplay interne et sans créer une seconde autorité.

## Gate Rule 26

L'inspection exacte de `captureFix139` doit être faite sur le fichier fourni par l'utilisateur.

Référence attendue :
- commit `08f727f7fa5dab01515c03ae57937aa5ca8b7810`
- blob `02a052bc231728eb383e17c83e61a958be0ac58c`
- taille `8169555` octets.

Tant que ce fichier n'est pas reçu et vérifié :
- aucune conclusion nouvelle sur le corps exact Capture139 ;
- aucun RED runtime ;
- aucune modification `entry-v1.js` ;
- aucun retrait Dungeon/Capture historique.

## Critère de sortie

Le pré-audit sera GREEN uniquement si le fichier exact permet de documenter :
1. le propriétaire Capture139 réel et sa capture de référence ;
2. les fonctions privées nécessaires à son lancement ;
3. les dépendances Dungeon encore actives au moment du démarrage ;
4. le raccord minimal vers `capture/entry-v1.js` ;
5. les invariants de parité et teardown nécessaires ;
6. le RED isolé qui prouvera l'absence de vraie entrée Capture avant modification.

Aucun runtime n'est modifié dans ce pré-audit.
