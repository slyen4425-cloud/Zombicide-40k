# GenSrpG — Phase 4 — U1 pré-audit premier consommateur UI

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-common-text-utils-first-consumer-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-common-text-utils-first-consumer-preaudit-2026-09-22`
- Base : `1d5df325384d9748adfbce241445db294dd2466c`
- GREEN de départ : `checkpoint/gensrpg-phase4-common-text-utils-contract-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Objectif

Sélectionner un seul consommateur UI futur de
`GensTextUtilsV1.escapeHtml`.

Aucun runtime ne doit être modifié dans ce lot.

## Candidats

- World Builder
- Room Creator
- Stats UI
- Tactical Stats / autre propriétaire UI actif possédant la même transformation

## Critères de sélection

Le futur premier raccord doit :
- supprimer une vraie duplication ;
- conserver exactement la sémantique historique ;
- ne toucher aucune règle gameplay ;
- ne pas créer de nouvelle autorité ;
- permettre un test navigateur localisé ;
- éviter les modules particulièrement sensibles si un candidat Builder plus isolé suffit.

## Point d'attention

Le service Core est encore inert. Le pré-audit doit donc aussi définir l'ordre
de chargement minimal du futur lot de raccord, sans l'appliquer ici.

## Hors périmètre

Pas d'injection, pas de raccord, pas de suppression de helper, pas d'Event Bus,
pas de modification de `index.html`, preview, Pages ou Service Worker.


## Résultat du pré-audit

Consommateur futur sélectionné :
`assets/dungeon/dungeon-room-creator-100.js`.

Raisons :
- helper local strictement équivalent ;
- 10 callsites UI seulement ;
- aucun usage dans stockage/normalisation/gameplay ;
- navigateur Builder existant ;
- moins de surface que World Builder ;
- moins sensible que Stats ou Tactical.

Comparaison :
- World Builder : 22 callsites ;
- Room Creator : 10 ;
- Stats UI : 15 ;
- Tactical Stats : 3, mais runtime combat critique.

Le futur raccord devra charger le service Core avant Room Creator dans **Pages et preview**,
sans modifier `index.html`, puis supprimer uniquement le helper local Room Creator.

Sentinelle :
`tests/gens_phase4_common_text_utils_first_consumer_preaudit_v1.test.cjs`.

Aucun runtime n'est modifié dans ce pré-audit.
