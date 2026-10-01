# GenSrpG — Phase 8 — Audit lifecycle session Tactical — 2026-10-01

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-composition-handoff-green-2026-10-01`
- SHA : `ba46d8dd3d969af0244e25c512d5144b8a903f45`
- branche : `work/gensrpg-phase8-tactical-session-lifecycle-audit-2026-10-01`

## Critère Phase 8 visé

Le roadmap exige à terme :

> Tactical n'existe que pendant une session de combat et se démonte proprement.

Cet audit ne tente pas de rendre toute la pile lazy en un seul lot. Il sépare :
- code chargé ;
- autorité active hors session ;
- session de combat ;
- teardown de session.

## État réel

### Chargement

- Core RuntimeBootstrap charge encore l'entrée publique Tactical au démarrage de l'application.
- L'entrée publique charge immédiatement les six fichiers de base.
- Le Bridge est le sixième et dernier fichier de cette composition de base.
- Après le chargement séquentiel, `finalize()` appelle immédiatement `Bridge.install(R)`.
- `finalize()` programme encore trois réinstallations Bridge à 250 / 1200 / 3000 ms.

### Compatibilité V108 -> V114.11

Les couches V108, V109, V110, V111, V112, V113 et V114.11 s'auto-installent encore au chargement et planifient leurs propres retries.

En revanche, les anciens observers body V108/V109/V111/V112/V113 restent seulement inspectables :
leurs `install()` actifs ne les appellent plus. Cette dette a déjà été neutralisée par les sentinelles V114.11.

### Session UI

`GensRpgTacticalCombatV2Ui.close()` :
- retire l'overlay ;
- met `rootEl=null` ;
- met `battle=null` ;
- nettoie l'état de sélection local.

Il ne démonte pas encore les listeners/hooks globaux installés par les couches de compatibilité.

## Premier seam lifecycle retenu

**Retirer uniquement les réinstallations différées du Bridge appartenant à l'entrée publique Tactical.**

État cible du prochain micro-lot :
- garder une installation immédiate du Bridge après le chargement séquentiel des six fichiers ;
- supprimer uniquement les timers 250 / 1200 / 3000 ms de l'entrée publique ;
- ne toucher à aucun retry interne V108-V114.11 dans ce lot ;
- ne toucher ni au Bridge métier, ni à la détection, ni au gameplay.

## Pourquoi ce seam est borné

1. Le Bridge est chargé en dernier dans la composition de base.
2. Son `install()` vérifie engine + adapter + UI avant de s'installer.
3. L'installation immédiate intervient donc après disponibilité des dépendances de base.
4. Le wrapper de démarrage Bridge porte `__gensRpg113Start=true` et `__gensRpg112Start=true`.
5. V113 court-circuite explicitement son propre hook de démarrage lorsque ce marqueur existe.
6. Les trois réinstallations différées de l'entrée publique ne sont donc pas l'autorité nécessaire à V113.

## Hors périmètre du prochain lot

- rendre Tactical entièrement lazy ;
- désinstaller les listeners V108-V114.11 ;
- retirer les retries internes des couches de compatibilité ;
- déplacer la détection V113 ;
- supprimer V108-V113 ;
- modifier UI, hit, dégâts, armure, AI ou bridge Dungeon.

## Suite

Après triple CI GREEN de cet audit :
1. checkpoint GREEN ;
2. nouveau checkpoint de départ ;
3. branche dédiée `Bridge retry retirement` ;
4. caractérisation actuelle immediate + 3 retries ;
5. RED exigeant immediate only ;
6. micro-diff de l'entrée publique Tactical uniquement.
