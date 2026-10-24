# GenSrpG — Phase 8 — Audit de sortie officiel — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-session-teardown-ownership-green-2026-10-02`
- SHA de base : `9a2035be05a68877d73b08bf947abba53d8d5659`
- branche : `work/gensrpg-phase8-exit-audit-2026-10-02`
- runtime : `index.html` 8169555 octets, blob `02a052bc231728eb383e17c83e61a958be0ac58c`

## Critère officiel

Roadmap Phase 8 :

> Tactical n'existe que pendant une session de combat et se démonte proprement.

Cet audit vérifie le critère de sortie, pas la disparition physique de tout code historique Tactical.

Une façade publique ou des scripts déjà chargés peuvent rester en mémoire s'ils sont inertes. La condition de sortie porte sur l'autorité active : aucun listener, wrapper, retry, polish global ou état Tactical privé ne doit rester propriétaire hors session.

## Frontière retenue

Dungeon reste propriétaire du déclenchement de combat.

Le contrat public est :
- Dungeon -> `Bridge.requestCombat(...)`;
- Bridge -> activation `GensTacticalV1.activate()` si nécessaire ;
- Tactical -> session de combat ;
- `UI.close()` -> `GensTacticalV1.deactivate()`;
- teardown inverse des ressources privées ;
- retour à un état froid réactivable.

## Preuves structurelles

- RuntimeBootstrap ne charge que `assets/gensrpg/tactical/entry-v1.js`.
- L'entrée publique charge au bootstrap uniquement la façade Bridge.
- La pile engine/adapter/rules/integration/UI ne s'active qu'à la première requête.
- `GensTacticalV1` possède `activate()`, `deactivate()` et `dispose`.
- `UI.close()` signale la fin de session à ce propriétaire unique.
- La chaîne de compatibilité se démonte en ordre inverse V114.11 -> V108.
- Chaque couche expose `dispose()`, annule ses retries pendants et restaure uniquement ses wrappers encore possédés.
- V113 retire ses listeners board `click` / `pointerup`.
- V114.11 retire son listener menu en capture.
- Bridge et base UI exposent eux aussi un teardown réversible.
- Après teardown, l'état lifecycle et le guard loader reviennent à froid.
- Une deuxième activation réutilise les API chargées et réinstalle une seule pile fonctionnelle.
- Le contrat Dungeon conserve `combat trigger` et interdit `Tactical combat resolution`.

## Dette non bloquante

Restent hors critère :
- scripts/API Tactical déjà chargés en mémoire ;
- fichiers legacy inactifs ;
- noms/version labels historiques ;
- dette documentaire ancienne ne reprenant aucune autorité runtime.

Ces éléments restent dans `GENSRPG_PHASE8_BACKLOG.md` et ne justifient aucun lot supplémentaire Phase 8.

## Sentinelles

La CI doit conserver au minimum :
- activation première requête ;
- teardown ownership ;
- pré-audit sortie Phase 8 ;
- audit EXIT officiel ;
- sentinelles Architecture + Browser ;
- Firefox ;
- Tactical Dock ;
- non-interférence inter-modules déjà couverte par la suite globale.

## Validation finale

HEAD audit :
`c7aed1124dda138ebf9c8415c48e9516470ec64d`

- sentinelle EXIT dédiée, étape Architecture #261 — SUCCESS ;
- Architecture + Browser `37043579764` — SUCCESS ;
- Firefox `37043579675` — SUCCESS ;
- Tactical Dock `37043579704` — SUCCESS ;
- aucun changement runtime dans l'audit.

## Décision GREEN

**PHASE 8 FERMÉE / EXIT GREEN**.

Le critère officiel est satisfait :
- Tactical privé reste froid hors combat ;
- l'activation appartient à la requête de session ;
- la fermeture déclenche le teardown au propriétaire unique ;
- listeners, wrappers et retries privés sont démontables ;
- l'état revient à froid ;
- une deuxième session se réactive proprement ;
- Dungeon reste propriétaire du déclenchement via la frontière Bridge.

La dette historique non active reste backlog et ne justifie aucun lot Phase 8 supplémentaire.

Checkpoint final prévu :
`checkpoint/gensrpg-phase8-exit-green-2026-10-02`.

La Phase 9 ne doit pas modifier Capture avant un audit de reprise des travaux récents réalisés hors de ce chantier principal, notamment la refonte et le laboratoire combat dynamique.
