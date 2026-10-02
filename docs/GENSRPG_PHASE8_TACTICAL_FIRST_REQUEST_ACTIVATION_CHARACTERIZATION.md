# GenSrpG — Phase 8 — Caractérisation activation Tactical à la première requête — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-session-ownership-preaudit-green-2026-10-02`
- SHA : `4385a6ce1de8165b3ea0ad2623f4900a4136f7bd`
- branche : `work/gensrpg-phase8-tactical-session-activation-2026-10-02`

## Pourquoi ce lot est nécessaire

Le blocage A1 du pré-audit de sortie est confirmé : la pile privée Tactical s'active au bootstrap application, donc avant toute session de combat.

## État caractérisé avant migration

- l'entrée publique charge immédiatement engine, adapter, rules, integration, UI puis Bridge ;
- le Bridge est installé immédiatement après cette composition ;
- une requête Bridge avec pile privée absente retourne `modules-missing` ;
- le Bridge ne demande pas encore à `GensTacticalV1` d'activer la pile ;
- une requête avec engine + adapter + UI déjà présents reste synchrone et ouvre immédiatement le combat.

## Cible du RED

Exiger simultanément :

1. bootstrap : entrée publique + façade Bridge uniquement ;
2. engine/adapter/rules/integration/UI absents avant la première requête ;
3. première requête froide : `ok:true`, `pending:true`, activation privée demandée une seule fois ;
4. requête froide rejouée une seule fois quand l'entrée signale la pile prête ;
5. requête chaude : contrat synchrone existant inchangé ;
6. Bridge installé une seule fois après disponibilité de la pile ;
7. fin de chaîne V108-V114.11 signalée de façon déterministe à l'entrée publique, sans polling/retry supplémentaire.

## Hors périmètre

- teardown / dispose après fermeture ;
- modification des retries internes V108-V114.11 ;
- suppression de couches legacy ;
- gameplay, IA, hit, dégâts, armure ;
- `index.html`.

Aucun runtime n'est modifié par cette caractérisation.


## RED confirmé

- HEAD RED : `df4dc6e26cd333be365b1dc867444fd71256a643`
- Architecture `36990370116` — FAILURE attendue
- caractérisation #256 — SUCCESS
- garde cible #257 — FAILURE attendue : `bootstrap must load only the inert Bridge facade`
- Firefox `36990370135` — SUCCESS
- Tactical Dock `36990370092` — SUCCESS
- aucun runtime modifié au point RED.

## Micro-diff appliqué

- l'entrée publique charge au bootstrap uniquement la façade Bridge ;
- engine / adapter / rules / integration / UI sont activés une seule fois à la première `Bridge.requestCombat` ;
- une requête froide devient `pending` puis est rejouée une fois la pile privée prête ;
- les requêtes chaudes conservent le contrat synchrone existant ;
- l'intégration signale de façon déterministe la fin de chaîne V108-V114.11 ;
- le Bridge est installé avant la chaîne de compatibilité afin de préserver l'autorité canonique de démarrage ;
- aucun observer, polling, heartbeat ou retry supplémentaire ;
- aucun changement `index.html`, callsite Dungeon ou gameplay.

## Réalignement des sentinelles

Seules les gardes qui décrivaient explicitement l'ancien eager-loading ont été réalignées.

La sentinelle Browser Dungeon Builder attendait encore V111 Tactical hors combat puis appelait `hideRuntimeTabs()`. Elle exige maintenant l'inverse : V111 doit rester non chargé pendant l'édition structurelle Dungeon hors combat et le Builder doit rester visible sans autorité Tactical.

Commit de réalignement final :
`b496aab046788318e913f593ba7725df9a3dd536`

## Validation technique GREEN

- Architecture + Browser `37002153836` — SUCCESS
- Firefox `37002153833` — SUCCESS
- Tactical Dock `37002153835` — SUCCESS
- Architecture Phase 8 #254 à #257 — SUCCESS
- Dungeon map -> Tactical V2 — SUCCESS
- Dungeon Builder réel hors combat avec pile Tactical privée non chargée — SUCCESS
- scénarios inter-modules et non-interférence — SUCCESS

Décision : **MICRO-LOT 5 TECHNIQUEMENT GREEN.**

Le blocage A1 — activation eager de la pile privée Tactical avant combat — est retiré.

Checkpoint final prévu après triple CI documentaire :
`checkpoint/gensrpg-phase8-tactical-session-activation-green-2026-10-02`
