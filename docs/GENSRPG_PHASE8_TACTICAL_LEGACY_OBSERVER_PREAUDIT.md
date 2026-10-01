# GenSrpG — Phase 8 — Pré-audit seams observers legacy Tactical — 2026-10-01

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-composition-handoff-green-2026-10-01`
- SHA : `ba46d8dd3d969af0244e25c512d5144b8a903f45`
- branche : `work/gensrpg-phase8-tactical-legacy-chain-next-preaudit-2026-10-01`

## Constat

Les couches V108, V109, V111, V112 et V113 restent chargées parce qu'elles possèdent encore des comportements actifs.

Aucune de ces couches ne peut donc être supprimée entière à ce stade.

En revanche, les cinq fichiers conservent encore une fonction historique `observe(rt=R)` fondée sur `MutationObserver`, alors que leurs `install(rt)` n'appellent plus cette fonction.

La sentinelle V114.11 existante verrouille déjà ce fait : les observers historiques restent inspectables, mais ne sont plus activés.

V110 Stats et V114.11 sont déjà exempts de `MutationObserver`.

## Responsabilités actives à protéger

- V108 : style, contrôles, hook UI, actions équipement/consommables ;
- V109 : plages, timeline, option mains nues, attaque rapide ;
- V111 : adapter/multi-dice, dock, masquage tabs, hook UI ;
- V112 : cohérence résultat, fiche détaillée, explication dégâts ;
- V113 : scope/détection, hooks mouvement/événements, board clicks.

Le prochain lot ne doit toucher aucune de ces responsabilités.

## Candidat retenu

**Retrait des seams observers historiques inactifs V108/V109/V111/V112/V113.**

Périmètre attendu :
- supprimer uniquement les états/fonctions dédiés aux observers devenus inactifs ;
- supprimer les queues de maintenance devenues exclusivement liées à ces observers lorsqu'elles n'ont plus d'autre appel ;
- conserver les fonctions `maintain` encore appelées par install/hooks actifs ;
- conserver tous les hooks UI/adapter/detection actifs ;
- conserver les retries actuels : leur réduction fera l'objet d'un audit distinct ;
- aucun changement `index.html`.

## Pourquoi ce lot

Il répond directement à la Phase 8 : suppression progressive des `observers body`.

Il est homogène et ne change pas le gameplay : on retire du code dont l'inactivité est déjà caractérisée par la CI.

## Étapes après GREEN du pré-audit

1. checkpoint GREEN du pré-audit ;
2. checkpoint de départ dédié au retrait des observer seams ;
3. caractérisation précise des références/queues par fichier ;
4. RED exigeant l'absence de ces seams tout en gardant les responsabilités actives ;
5. micro-diff ;
6. triple CI.
