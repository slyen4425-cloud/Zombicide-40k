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
